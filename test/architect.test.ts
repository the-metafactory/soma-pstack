import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/architect");
const skills = resolve(import.meta.dir, "../skills");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const root = YAML.parse(readFileSync(resolve(import.meta.dir, "../arc-manifest.yaml"), "utf8"));
const arena = readFileSync(join(skills, "arena", "SKILL.md"), "utf8");

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

function phase(letter: string): string {
  return skill.split(`## Phase ${letter}:`)[1]!.split("\n## ")[0]!;
}

test("architect runs only when asked, and the members that need it link its SKILL.md", () => {
  expect(frontmatter.name).toBe("architect");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter).not.toHaveProperty("route");
  expect(frontmatter.triggers).toContainEqual({ pattern: "/architect", type: "command", priority: 100 });
  const noComments = readFileSync(join(skills, "no-comments", "SKILL.md"), "utf8");
  expect(noComments).toContain("use `/architect` when available");
  for (const caller of ["no-comments", "figure-it-out"]) {
    const text = readFileSync(join(skills, caller, "SKILL.md"), "utf8");
    expect(text, caller).toContain("[`architect`](../architect/SKILL.md) and follow it");
  }
});

test("architect pins the upstream directory and is listed in the root manifest", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/architect/",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
  expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain("skills/architect");
});

test("architect keeps upstream's phase letters and names", () => {
  const headings = [...skill.matchAll(/^## Phase ([A-Z]): (.+)$/gm)].map(match => `${match[1]} ${match[2]}`);
  expect(headings).toEqual([
    "A Ground the problem",
    "B Sketch",
    "C Agree (opt-in)",
    "D Implement against the sketch",
    "E Scrap when the architecture is wrong",
  ]);
});

test("every skill architect routes to is a pack member", () => {
  const routed = [...skill.matchAll(/the \*\*([a-z-]+)\*\* skill/g)].map(match => match[1]!);
  expect(new Set(routed)).toEqual(new Set(["how", "why", "arena", "interrogate"]));
  for (const name of routed) expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain(`skills/${name}`);
});

test("Phase B takes arena's roster and hands the confined codex runner a readable copy", () => {
  const sketch = phase("B");
  expect(sketch).toMatch(/arena Phase A step 3/);
  expect(arena).toMatch(/^3\. Pick the runners\. A roster the principal names/m);
  expect(sketch).toMatch(/raise each runner's reasoning effort, as that step says/);
  expect(arena).toMatch(/^3\. .*raise it for judgment-heavy design work/m);
  expect(sketch).toMatch(/arena's shared grounding directory/);
  expect(arena).toContain("/tmp/arena-<slug>/grounding/");
  expect(sketch).toMatch(/at least two structurally distinct candidates/);
  expect(sketch).toMatch(/arena's Phase A rubric/);
  for (const cited of sketch.match(/arena's Phase [A-F]/g)!) {
    expect(arena).toContain(`## Phase ${cited.slice(-1)}:`);
  }
});

test("every relative link in the member resolves", () => {
  for (const file of files(member)) {
    for (const [, target] of readFileSync(file, "utf8").matchAll(/\]\(([^)#:]+)(?:#[^)]*)?\)/g)) {
      expect(existsSync(resolve(file, "..", target!)), `${file} -> ${target}`).toBe(true);
    }
  }
});

// Both phrasings: "the **a** principle" and "the **a** and **b** principles".
const principles = [...new Set(files(member).flatMap(file =>
  [...readFileSync(file, "utf8").matchAll(/((?:\*\*[a-z-]+\*\* and )*\*\*[a-z-]+\*\*) principles?\b/g)]
    .flatMap(match => [...match[1]!.matchAll(/\*\*([a-z-]+)\*\*/g)].map(name => name[1]!))))];
const citations = [...new Set(files(member).flatMap(file =>
  [...readFileSync(file, "utf8").matchAll(/`(the-algorithm\/references\/principles\/[^`]+)`/g)].map(match => match[1]!)))];

test("architect carries no pstack-host vocabulary or unported principle names outside the source note", () => {
  const banned = /cursor|Task tool|subagent_type|generalPurpose|pstack-models|poteto|grok-|claude-opus|principle skill|fix-root-causes|prove-it-works/i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "").split("\nSource: ")[0]!;
    expect(banned.test(text), file).toBe(false);
  }
  expect(principles).toContain("laziness-protocol");
  expect(principles).toContain("minimize-reader-load");
});

// The principles live in Soma, so this runs only where a Soma home is installed,
// and skips otherwise, as test/arena.test.ts does.
const somaSkills = process.env.SOMA_SKILLS_DIR ?? join(homedir(), ".soma", "skills");
const somaPrinciples = join(somaSkills, "the-algorithm", "references", "principles");
test.skipIf(process.env.SOMA_SKILLS_DIR === undefined && !existsSync(somaPrinciples))(
  "every principle architect names exists in the installed Soma",
  () => {
    expect(citations.filter(path => !existsSync(join(somaSkills, path)))).toEqual([]);
    expect(principles.filter(name => !existsSync(join(somaPrinciples, `${name}.md`)))).toEqual([]);
  },
);
