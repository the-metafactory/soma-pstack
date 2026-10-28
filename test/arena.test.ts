import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/arena");
const probe = resolve(import.meta.dir, "../docs/verification/node-45");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const root = YAML.parse(readFileSync(resolve(import.meta.dir, "../arc-manifest.yaml"), "utf8"));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

function phase(letter: string): string {
  return skill.split(`## Phase ${letter}:`)[1]!.split("\n## ")[0]!;
}

test("arena runs only when asked, with a /arena trigger", () => {
  expect(frontmatter.name).toBe("arena");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/arena", type: "command", priority: 100 });
});

test("arena pins the upstream file and is listed in the root manifest", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/arena/SKILL.md",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
  expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain("skills/arena");
});

test("arena keeps upstream's phase letters and names, which other skills cite", () => {
  const headings = [...skill.matchAll(/^## Phase ([A-Z]): (.+)$/gm)].map(match => `${match[1]} ${match[2]}`);
  expect(headings).toEqual(["A Frame", "B Fan out", "C Cross-judge", "D Pick a base", "E Graft", "F Verify"]);
  for (const step of [1, 2, 3, 4]) expect(phase("A")).toContain(`\n${step}. `);
});

test("arena's default roster is two Claude sub-agents and the principal can replace it", () => {
  const runners = phase("A").split("\n3. ")[1]!.split("\n4. ")[0]!;
  expect(runners).toMatch(/roster the principal names/i);
  expect(runners.match(/`(opus|fable)`/g)?.slice(0, 2)).toEqual(["`opus`", "`fable`"]);
  expect(runners).toMatch(/fewer than two/);
  expect(runners).toMatch(/never write a candidate yourself/i);
});

test("worktree candidates hand back a commit and the judge reads one labeled tree", () => {
  expect(phase("A")).toContain('isolation: "worktree"');
  const fanOut = phase("B");
  expect(fanOut).toMatch(/worktree path, branch and commit/);
  expect(fanOut).toMatch(/git archive <sha>/);
  expect(fanOut).toContain("/tmp/arena-<slug>/candidate-<n>/");
  expect(phase("C")).toMatch(/codex exec --sandbox read-only\b[^`]*-C \/tmp\/arena-<slug>/);
});

test("arena's judge is never the parent's family and is skipped rather than faked", () => {
  const judge = phase("C");
  expect(judge).toMatch(/judge is never from the parent's family/);
  expect(judge).toMatch(/Claude parent gets `codex exec --sandbox read-only/);
  expect(judge).toMatch(/skip the judge/);
  expect(judge).toMatch(/never label a judge from the parent's family as cross-family/i);
  for (const host of judge.match(/`api\.[a-z.]+`/g)!) expect(manifest.capabilities.network.map((entry: { host: string }) => `\`${entry.host}\``)).toContain(host);
  const hosts = manifest.capabilities.network.map((entry: { host: string }) => entry.host).sort();
  expect(hosts).toEqual(["api.anthropic.com", "api.openai.com"]);
});

const citations = [...skill.matchAll(/`(the-algorithm\/references\/principles\/[^`]+)`/g)].map(match => match[1]!);

test("arena anchors every principle citation to Soma's the-algorithm skill", () => {
  expect(citations.length).toBe(4);
  expect(skill).not.toMatch(/`references\/principles\//);
  expect(skill).not.toMatch(/\*\*prove-it-works\*\*/);
});

// The principles live in Soma, so this runs only where a Soma home is installed,
// and skips otherwise, as test/playbooks.test.ts does.
const somaSkills = process.env.SOMA_SKILLS_DIR ?? join(homedir(), ".soma", "skills");
const somaPrinciples = join(somaSkills, "the-algorithm", "references", "principles");
test.skipIf(process.env.SOMA_SKILLS_DIR === undefined && !existsSync(somaPrinciples))(
  "every principle arena cites exists in the installed Soma",
  () => {
    expect(citations.filter(path => !existsSync(join(somaSkills, path)))).toEqual([]);
  },
);

test("the probe synthesis note names the base, the judge, each graft, rejections and verification", () => {
  const note = readFileSync(join(probe, "synthesis.md"), "utf8");
  for (const section of ["Base", "Cross-judge", "Grafts", "Rejected", "Convergence and dropouts", "Verification"]) {
    expect(note, section).toContain(`## ${section}\n`);
  }
  const judge = note.split("## Cross-judge\n")[1]!.split("\n## ")[0]!;
  expect(judge).toMatch(/judged by \S+/);
  expect(judge).not.toMatch(/judged by (?:claude|opus|sonnet|fable|haiku)/i);
  const candidates = readdirSync(probe).filter(name => /^candidate-\d+$/.test(name));
  expect(candidates.length).toBeGreaterThanOrEqual(2);
});

test("arena carries no pstack-host vocabulary outside the upstream pin and source note", () => {
  const banned = /cursor|Task tool|subagent_type|generalPurpose|pstack-models\.mdc|poteto-mode|grok-|composer-|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
});
