import { afterEach, expect, test } from "bun:test";
import { YAML } from "bun";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(import.meta.dir, "../scripts/check-pack.ts");
const fixtures: string[] = [];
const memberPath = "skills/benchmark-checklist";
const commit = "0123456789abcdef0123456789abcdef01234567";

function library(artifacts: unknown[] = []) {
  const root = mkdtempSync(join(tmpdir(), "soma-pstack-test-"));
  fixtures.push(root);
  writeFileSync(join(root, "arc-manifest.yaml"), YAML.stringify({
    schema: "arc/v1", name: "soma-pstack", type: "library", license: "MIT", artifacts,
  }));
  return root;
}

function memberManifest() {
  return {
    schema: "arc/v1", name: "benchmark-checklist", version: "0.1.0", type: "skill", tier: "custom",
    description: "A fixture skill.", license: "MIT",
    author: { name: "The MetaFactory", github: "the-metafactory" },
    provides: { skill: [{ name: "benchmark-checklist", path: "." }] },
    capabilities: { filesystem: { read: [], write: [] }, network: [], bash: { allowed: false }, secrets: [] },
    upstream: { repo: "cursor/plugins", path: "pstack/skills/benchmark-checklist/SKILL.md", commit },
  };
}

function skillText(metadata: unknown = { name: "benchmark-checklist", description: "A fixture skill." }) {
  return `---\n${YAML.stringify(metadata)}\n---\n\n# Fixture\n`;
}

function member(root: string, manifest: unknown = memberManifest(), skill: string | null = skillText()) {
  const directory = join(root, memberPath);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "arc-manifest.yaml"), YAML.stringify(manifest));
  if (skill !== null) writeFileSync(join(directory, "SKILL.md"), skill);
}

function run(root: string, env = process.env) {
  const result = Bun.spawnSync([process.execPath, script], { cwd: root, env, stdout: "pipe", stderr: "pipe" });
  return { code: result.exitCode, output: Buffer.concat([result.stdout, result.stderr]).toString() };
}

function expectMemberFailure(root: string, field: string) {
  const result = run(root);
  expect(result.code).not.toBe(0);
  expect(result.output).toContain(memberPath);
  expect(result.output).toContain(field);
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

test("empty library passes without Arc available", () => {
  const root = library();
  const result = run(root, { ...process.env, PATH: root });
  expect(result.code).toBe(0);
  expect(result.output).toContain("0 members");
});

test("valid standalone member passes the real Arc validator", () => {
  const root = library([{ path: memberPath }]);
  member(root);
  const result = run(root);
  expect(result.output).toContain("1 members");
  expect(result.code).toBe(0);
});

test("missing artifact path fails and names the path", () => {
  const root = library([{ path: memberPath }]);
  expectMemberFailure(root, "path");
});

for (const invalid of [undefined, "", "abc", "g".repeat(40), "a".repeat(39), "a".repeat(41), 123]) {
  test(`invalid upstream.commit (${String(invalid)}) names the member and field`, () => {
    const root = library([{ path: memberPath }]);
    const manifest = memberManifest();
    const upstream: Record<string, unknown> = manifest.upstream;
    if (invalid === undefined) delete upstream.commit;
    else upstream.commit = invalid;
    member(root, manifest);
    expectMemberFailure(root, "upstream.commit");
  });
}

for (const field of ["repo", "path"] as const) {
  test(`missing upstream.${field} fails`, () => {
    const root = library([{ path: memberPath }]);
    const manifest = memberManifest();
    delete (manifest.upstream as Partial<typeof manifest.upstream>)[field];
    member(root, manifest);
    expectMemberFailure(root, `upstream.${field}`);
  });
}

for (const path of [
  "/pstack/skills/benchmark-checklist/",
  "pstack//skills/benchmark-checklist/",
  "pstack/skills/../benchmark-checklist/SKILL.md",
  "pstack/skills/./benchmark-checklist/",
]) {
  test(`upstream.path ${path} that is not a relative path fails`, () => {
    const root = library([{ path: memberPath }]);
    member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path } });
    expectMemberFailure(root, "upstream.path");
  });
}

for (const path of ["pstack/skills/benchmark-checklist/", "pstack/LICENSE", "pstack/skills/benchmark-checklist/Makefile"]) {
  test(`upstream.path ${path} passes offline`, () => {
    const root = library([{ path: memberPath }]);
    member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path } });
    expect(run(root).code).toBe(0);
  });
}

function fakeGh(root: string, body: string) {
  const bin = join(root, "fake-bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), `#!/bin/sh\necho "$@" >> "${bin}/calls"\n${body}\n`);
  chmodSync(join(bin, "gh"), 0o755);
  const env: Record<string, string | undefined> = { ...process.env, PATH: `${bin}:${process.env.PATH}`, CHECK_PACK_UPSTREAM: "1" };
  delete env.CHECK_PACK_UPSTREAM_REPO;
  return env;
}

for (const [label, path, response] of [
  ["a file pin that is a directory upstream", "pstack/skills/typescript-best-practices", "[]"],
  ["a directory pin that is a file upstream", "pstack/skills/benchmark-checklist/", `{"type":"file"}`],
] as const) {
  test(`CHECK_PACK_UPSTREAM=1 fails ${label}`, () => {
    const root = library([{ path: memberPath }]);
    member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path } });
    expect(run(root).code).toBe(0);
    const result = run(root, fakeGh(root, `echo '${response}'`));
    expect(result.code).not.toBe(0);
    expect(result.output).toContain("upstream.path");
    expect(result.output).toContain("cursor/plugins");
    expect(result.output).toContain("on GitHub");
  });
}

test("CHECK_PACK_UPSTREAM=1 asks GitHub for the pin at its commit and passes a matching file", () => {
  const root = library([{ path: memberPath }]);
  member(root);
  const result = run(root, fakeGh(root, `echo '{"type":"file"}'`));
  expect(result.code).toBe(0);
  expect(readFileSync(join(root, "fake-bin", "calls"), "utf8"))
    .toContain(`repos/cursor/plugins/contents/pstack/skills/benchmark-checklist/SKILL.md?ref=${commit}`);
});

test("CHECK_PACK_UPSTREAM=1 encodes each path segment in the API call", () => {
  const root = library([{ path: memberPath }]);
  member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path: "pstack/a b/c#d.md" } });
  expect(run(root, fakeGh(root, `echo '{"type":"file"}'`)).code).toBe(0);
  expect(readFileSync(join(root, "fake-bin", "calls"), "utf8")).toContain(`contents/pstack/a%20b/c%23d.md?ref=${commit}`);
});

test("CHECK_PACK_UPSTREAM=1 fails a pin that does not resolve", () => {
  const root = library([{ path: memberPath }]);
  member(root);
  const result = run(root, fakeGh(root, `echo '{"message":"Not Found"}'; echo 'gh: Not Found (HTTP 404)' >&2; exit 1`));
  expect(result.code).not.toBe(0);
  expect(result.output).toContain("does not resolve on GitHub");
  expect(result.output).not.toContain("could not be checked");
});

for (const [label, body, reason] of [
  ["a rate limit", "echo 'gh: You have exceeded a secondary rate limit (HTTP 429)' >&2; exit 1", "HTTP 429"],
  ["a missing login", "echo 'To get started with GitHub CLI, please run:  gh auth login' >&2; exit 4", "gh auth login"],
  ["a silent failure", "exit 1", "gh api exited with 1"],
  ["a reply that is not JSON", "echo '<html>proxy error</html>'", "gh api returned no JSON"],
  ["a hung gh", "sleep 30", "gh api timed out"],
] as const) {
  test(`CHECK_PACK_UPSTREAM=1 reports ${label} as could not be checked, not as a bad pin`, () => {
    const root = library([{ path: memberPath }]);
    member(root);
    const result = run(root, { ...fakeGh(root, body), CHECK_PACK_GH_TIMEOUT_MS: body.startsWith("sleep") ? "1000" : "" });
    expect(result.code).not.toBe(0);
    expect(result.output).toContain("could not be checked on GitHub");
    expect(result.output).toContain(reason);
    expect(result.output).not.toContain("does not resolve");
    expect(result.output).not.toContain("arc-manifest.yaml");
  });
}

test("missing upstream block fails", () => {
  const root = library([{ path: memberPath }]);
  const manifest: Record<string, unknown> = memberManifest();
  delete manifest.upstream;
  member(root, manifest);
  expectMemberFailure(root, "upstream");
});

test("member manifest must have type skill", () => {
  const root = library([{ path: memberPath }]);
  member(root, { ...memberManifest(), type: "library" });
  expectMemberFailure(root, "type");
});

for (const [label, skill, field] of [
  ["missing file", null, "SKILL.md"],
  ["missing frontmatter", "# Fixture\n", "frontmatter"],
  ["invalid YAML", "---\nname: [\n---\n", "SKILL.md"],
  ["wrong name", skillText({ name: "other", description: "A fixture." }), "name"],
  ["missing description", skillText({ name: "benchmark-checklist" }), "description"],
  ["blank description", skillText({ name: "benchmark-checklist", description: "  " }), "description"],
  ["non-string description", skillText({ name: "benchmark-checklist", description: 123 }), "description"],
] as const) {
  test(`SKILL.md ${label} fails`, () => {
    const root = library([{ path: memberPath }]);
    member(root, memberManifest(), skill);
    expectMemberFailure(root, field);
  });
}

test("Arc failure is propagated even when pack-specific member checks pass", () => {
  const root = library([{ path: memberPath }]);
  member(root, { ...memberManifest(), schema: "arc/invalid" });
  expectMemberFailure(root, "arc validate failed");
  expect(run(root).output).toContain("schema");
});

test("missing Arc fails for a populated library", () => {
  const root = library([{ path: memberPath }]);
  member(root);
  const result = run(root, { ...process.env, PATH: root });
  expect(result.code).not.toBe(0);
  expect(result.output).toContain(memberPath);
  expect(result.output).toContain("arc validate could not run");
});

test("all listed members are checked", () => {
  const missingPath = "skills/recall";
  const root = library([{ path: memberPath }, { path: missingPath }]);
  member(root);
  const result = run(root);
  expect(result.code).not.toBe(0);
  expect(result.output).toContain(missingPath);
});

test("malformed root manifest fails with its filename", () => {
  const root = library();
  writeFileSync(join(root, "arc-manifest.yaml"), "artifacts: [");
  const result = run(root);
  expect(result.code).not.toBe(0);
  expect(result.output).toContain("arc-manifest.yaml");
});

test("artifacts must be a list", () => {
  const root = library();
  writeFileSync(join(root, "arc-manifest.yaml"), "schema: arc/v1\nname: soma-pstack\ntype: library\nlicense: MIT\nartifacts: {}\n");
  const result = run(root);
  expect(result.code).not.toBe(0);
  expect(result.output).toContain("artifacts");
});

for (const entry of [null, {}, { path: "../outside" }, { path: "/tmp/other" }]) {
  test(`invalid artifact entry ${JSON.stringify(entry)} fails`, () => {
    const root = library([entry]);
    const result = run(root);
    expect(result.code).not.toBe(0);
    expect(result.output).toContain("path");
  });
}

test("wrong root metadata fails with the field", () => {
  const root = library();
  const path = join(root, "arc-manifest.yaml");
  writeFileSync(path, readFileSync(path, "utf8").replace("type: library", "type: skill"));
  const result = run(root);
  expect(result.code).not.toBe(0);
  expect(result.output).toContain("type");
});

function git(cwd: string, ...args: string[]) {
  const result = Bun.spawnSync(["git", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", ...args], {
    cwd, stdout: "pipe", stderr: "pipe",
  });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
  return result.stdout.toString().trim();
}

function upstreamClone(origin = "https://github.com/cursor/plugins.git") {
  const upstream = mkdtempSync(join(tmpdir(), "soma-pstack-upstream-"));
  fixtures.push(upstream);
  git(upstream, "init", "-q");
  mkdirSync(join(upstream, "pstack/skills/how"), { recursive: true });
  writeFileSync(join(upstream, "pstack/skills/how/SKILL.md"), "# How\n");
  git(upstream, "add", ".");
  git(upstream, "commit", "-qm", "fixture");
  const clone = join(upstream, "clone");
  git(upstream, "clone", "-q", "--no-checkout", upstream, clone);
  git(clone, "remote", "set-url", "origin", origin);
  return { clone, head: git(clone, "rev-parse", "HEAD") };
}

type Pin = string | ((clone: string, head: string) => string);

function runAgainstClone(path: string, pin?: Pin, origin?: string) {
  const { clone, head } = upstreamClone(origin);
  const pinCommit = typeof pin === "function" ? pin(clone, head) : pin ?? head;
  const root = library([{ path: memberPath }]);
  member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path, commit: pinCommit } });
  const noGh = join(root, "no-gh");
  mkdirSync(noGh);
  writeFileSync(join(noGh, "gh"), "#!/bin/sh\necho gh was called >&2\nexit 1\n");
  chmodSync(join(noGh, "gh"), 0o755);
  return run(root, {
    ...process.env, PATH: `${noGh}:${process.env.PATH}`, CHECK_PACK_UPSTREAM: "1", CHECK_PACK_UPSTREAM_REPO: clone,
  });
}

for (const path of ["pstack/skills/how/", "pstack/skills/how/SKILL.md"]) {
  test(`CHECK_PACK_UPSTREAM_REPO passes ${path} from the clone without calling gh`, () => {
    const result = runAgainstClone(path);
    expect(result.output).not.toContain("gh was called");
    expect(result.code).toBe(0);
  });
}

const danglingCommit: Pin = (clone, head) => git(clone, "commit-tree", `${head}^{tree}`, "-p", head, "-m", "dangling");
const localOnlyCommit: Pin = (clone, head) => {
  git(clone, "branch", "local-only", danglingCommit(clone, head));
  return git(clone, "rev-parse", "local-only");
};

for (const [label, path, pin, origin, reason] of [
  ["a directory pinned without its /", "pstack/skills/how", undefined, undefined, "is a directory in the upstream clone"],
  ["a file pinned with a /", "pstack/skills/how/SKILL.md/", undefined, undefined, "is a file in the upstream clone"],
  ["a commit the clone lacks", "pstack/skills/how/", commit, undefined, "does not resolve in the upstream clone"],
  ["a commit in the clone that no origin branch contains", "pstack/skills/how/", danglingCommit, undefined,
    "does not resolve in the upstream clone"],
  ["a commit only on a local branch of the clone", "pstack/skills/how/", localOnlyCommit, undefined,
    "does not resolve in the upstream clone"],
  ["a path missing at the commit", "pstack/skills/what/", undefined, undefined, "does not resolve in the upstream clone"],
  ["a clone of another repository", "pstack/skills/how/", undefined, "https://github.com/someone/else.git",
    "could not be checked in the upstream clone"],
] as const) {
  test(`CHECK_PACK_UPSTREAM_REPO fails ${label}`, () => {
    const result = runAgainstClone(path, pin, origin);
    expect(result.code).not.toBe(0);
    expect(result.output).toContain("upstream.path");
    expect(result.output).toContain(reason);
    expect(result.output).not.toContain("gh was called");
  });
}
