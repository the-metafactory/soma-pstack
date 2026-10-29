import { YAML } from "bun";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { basename, resolve, sep } from "node:path";

type Mapping = Record<string, unknown>;

const describe = (error: unknown): string => error instanceof Error ? error.message : String(error);

function isMapping(value: unknown): value is Mapping {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseMapping(text: string, label: string): Mapping {
  const parsed: unknown = YAML.parse(text);
  if (!isMapping(parsed)) throw new Error(`${label} must be a YAML mapping`);
  return parsed;
}

function readManifest(directory: string): Mapping {
  return parseMapping(readFileSync(resolve(directory, "arc-manifest.yaml"), "utf8"), "arc-manifest.yaml");
}

function upstreamPathShapeError(path: string): string | null {
  const segments = (path.endsWith("/") ? path.slice(0, -1) : path).split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return "upstream.path must be relative with no empty, . or .. segments";
  }
  return null;
}

const githubTimeoutMs = Number(process.env.CHECK_PACK_GH_TIMEOUT_MS) || 30_000;

function lookUpOnGitHub(api: string): { found: unknown } | { notFound: string } | { error: string } {
  let lookup;
  try {
    lookup = Bun.spawnSync(["gh", "api", api], { stdout: "pipe", stderr: "pipe", timeout: githubTimeoutMs });
  } catch (error) {
    return { error: `gh could not run: ${describe(error)}` };
  }
  if (lookup.exitedDueToTimeout) return { error: `gh api timed out after ${githubTimeoutMs} ms` };
  const stderr = lookup.stderr.toString().trim();
  if (lookup.exitCode !== 0) {
    if (stderr.includes("(HTTP 404)")) return { notFound: stderr };
    return { error: stderr || `gh api exited with ${lookup.exitCode ?? lookup.signalCode}` };
  }
  try {
    return { found: JSON.parse(lookup.stdout.toString()) };
  } catch (error) {
    return { error: `gh api returned no JSON: ${describe(error)}` };
  }
}

type Lookup = { isDirectory: boolean } | { notFound: string } | { error: string };

function lookUpPinOnGitHub(upstream: Mapping & { path: string }): Lookup {
  const target = upstream.path.replace(/\/$/, "").split("/").map(encodeURIComponent).join("/");
  const result = lookUpOnGitHub(`repos/${upstream.repo}/contents/${target}?ref=${upstream.commit}`);
  return "found" in result ? { isDirectory: Array.isArray(result.found) } : result;
}

function runGit(clone: string, args: string[]): { stdout: string } | { error: string } {
  let git;
  try {
    git = Bun.spawnSync(["git", "-C", clone, ...args], {
      stdout: "pipe", stderr: "pipe", timeout: githubTimeoutMs, env: { ...process.env, GIT_NO_LAZY_FETCH: "1" },
    });
  } catch (error) {
    return { error: `git could not run: ${describe(error)}` };
  }
  if (git.exitedDueToTimeout) return { error: `git timed out after ${githubTimeoutMs} ms` };
  if (git.exitCode !== 0) {
    return { error: git.stderr.toString().trim() || `git exited with ${git.exitCode ?? git.signalCode}` };
  }
  return { stdout: git.stdout.toString() };
}

function lookUpPinInClone(clone: string, upstream: Mapping & { path: string }): Lookup {
  const origin = runGit(clone, ["remote", "get-url", "origin"]);
  if ("error" in origin) return { error: `${clone} has no origin: ${origin.error}` };
  const originRepo = origin.stdout.trim().replace(/\/$/, "").replace(/\.git$/, "");
  if (originRepo !== `https://github.com/${upstream.repo}`) {
    return { error: `${clone} is a clone of ${originRepo}, not of ${upstream.repo}` };
  }
  if ("error" in runGit(clone, ["cat-file", "-e", `${upstream.commit}^{commit}`])) {
    return { notFound: `commit ${upstream.commit} is not in ${clone}` };
  }
  const branch = runGit(clone, ["for-each-ref", "--count=1", "--contains", upstream.commit as string, "refs/remotes/origin/"]);
  if ("error" in branch) return branch;
  if (branch.stdout.trim() === "") {
    return { notFound: `commit ${upstream.commit} is on no branch of origin in ${clone}` };
  }
  const entry = runGit(clone, ["--literal-pathspecs", "ls-tree", "-z", upstream.commit as string, "--", upstream.path.replace(/\/$/, "")]);
  if ("error" in entry) return entry;
  const type = /^\d+ (\w+) /.exec(entry.stdout)?.[1];
  if (type === undefined) return { notFound: `no such path at commit ${upstream.commit} in ${clone}` };
  if (type !== "tree" && type !== "blob") return { error: `git lists the path as a ${type}` };
  return { isDirectory: type === "tree" };
}

function checkUpstream(upstream: Mapping & { path: string }, path: string, errors: string[]): void {
  const pin = `${upstream.repo}:${upstream.path}@${upstream.commit}`;
  const clone = process.env.CHECK_PACK_UPSTREAM_REPO;
  const where = clone ? "in the upstream clone" : "on GitHub";
  const result = clone ? lookUpPinInClone(clone, upstream) : lookUpPinOnGitHub(upstream);
  if ("error" in result) {
    errors.push(`${path}: upstream.path ${pin} could not be checked ${where}: ${result.error}`);
    return;
  }
  if ("notFound" in result) {
    errors.push(`${path}: upstream.path ${pin} does not resolve ${where}: ${result.notFound}`);
    return;
  }
  if (result.isDirectory !== upstream.path.endsWith("/")) {
    errors.push(`${path}: upstream.path ${pin} is a ${result.isDirectory ? "directory" : "file"} ${where}`);
  }
}

function checkMemberManifest(member: string, path: string, errors: string[]): void {
  try {
    const memberManifest = readManifest(member);
    if (memberManifest.type !== "skill") errors.push(`${path}: manifest type must be skill`);
    const upstream = memberManifest.upstream;
    if (!isMapping(upstream)) {
      errors.push(`${path}: upstream must be a mapping with repo, path and commit`);
    } else {
      if (upstream.repo !== "cursor/plugins") errors.push(`${path}: upstream.repo must be cursor/plugins`);
      const commitValid = typeof upstream.commit === "string" && /^[a-f0-9]{40}$/i.test(upstream.commit);
      if (!commitValid) errors.push(`${path}: upstream.commit must be a 40-hex commit`);
      if (!nonEmpty(upstream.path)) {
        errors.push(`${path}: upstream.path must be a non-empty string`);
      } else {
        const shapeError = upstreamPathShapeError(upstream.path);
        if (shapeError) errors.push(`${path}: ${shapeError}`);
        else if (commitValid && process.env.CHECK_PACK_UPSTREAM === "1") {
          checkUpstream({ ...upstream, path: upstream.path }, path, errors);
        }
      }
    }
  } catch (error) {
    errors.push(`${path}: arc-manifest.yaml: ${describe(error)}`);
  }
}

function checkSkillFile(member: string, path: string, errors: string[]): void {
  try {
    const skill = readFileSync(resolve(member, "SKILL.md"), "utf8");
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skill);
    if (!frontmatter) throw new Error("YAML frontmatter is required");
    const metadata = parseMapping(frontmatter[1]!, "SKILL.md frontmatter");
    if (metadata.name !== basename(member)) errors.push(`${path}: SKILL.md name must equal ${basename(member)}`);
    if (!nonEmpty(metadata.description)) errors.push(`${path}: SKILL.md description must be non-empty`);
  } catch (error) {
    errors.push(`${path}: SKILL.md: ${describe(error)}`);
  }
}

function runArcValidate(root: string, member: string, path: string, errors: string[]): void {
  try {
    const validation = Bun.spawnSync(["arc", "validate", member], { cwd: root, stdout: "pipe", stderr: "pipe" });
    if (validation.exitCode !== 0) {
      const output = Buffer.concat([validation.stdout, validation.stderr]).toString().trim();
      errors.push(`${path}: arc validate failed (exit ${validation.exitCode})${output ? `\n${output}` : ""}`);
    }
  } catch (error) {
    errors.push(`${path}: arc validate could not run: ${describe(error)}`);
  }
}

function checkMember(root: string, path: string, errors: string[]): void {
  const member = resolve(root, path);
  try {
    if (!statSync(member).isDirectory()) throw new Error("not a directory");
    if (!realpathSync(member).startsWith(root + sep)) throw new Error("directory resolves outside the library");
  } catch (error) {
    errors.push(`${path}: member path is unavailable: ${describe(error)}`);
    return;
  }

  checkMemberManifest(member, path, errors);
  checkSkillFile(member, path, errors);
  runArcValidate(root, member, path, errors);
}

export function checkPack(directory: string): number {
  const errors: string[] = [];
  let root: string;
  let manifest: Mapping;
  try {
    root = realpathSync(directory);
    manifest = readManifest(root);
  } catch (error) {
    console.error(`arc-manifest.yaml: ${describe(error)}`);
    return 1;
  }

  for (const [field, expected] of Object.entries({
    schema: "arc/v1", name: "soma-pstack", type: "library", license: "MIT",
  })) {
    if (manifest[field] !== expected) errors.push(`arc-manifest.yaml: ${field} must be ${expected}`);
  }

  if (!Array.isArray(manifest.artifacts)) {
    errors.push("arc-manifest.yaml: artifacts must be a list (an empty list is allowed)");
  } else {
    for (const [index, entry] of manifest.artifacts.entries()) {
      if (!isMapping(entry) || !nonEmpty(entry.path)) {
        errors.push(`artifacts[${index}].path must be a non-empty string`);
        continue;
      }
      const path = entry.path;
      if (!/^skills\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) {
        errors.push(`${path}: artifacts.path must be skills/<name> with a lowercase-hyphenated name`);
        continue;
      }
      checkMember(root, path, errors);
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(error);
    return 1;
  }
  console.log(`Pack checks passed (${(manifest.artifacts as unknown[]).length} members).`);
  return 0;
}

if (import.meta.main) process.exitCode = checkPack(process.cwd());
