import { expect, test } from "bun:test";
import { YAML } from "bun";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/explain");
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

test("explain is command-only with a /explain trigger", () => {
  expect(frontmatter.name).toBe("explain");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/explain", type: "command", priority: 100 });
  expect(frontmatter.description).toContain("teach");
});

test("explain pins the upstream teach file and is listed in the root manifest", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/teach/SKILL.md",
    commit: "99743e9c151c8537cbbf1f98bb38f34ef3368453",
  });
  expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain("skills/explain");
});

test("explain keeps upstream's five steps and the confidence rule", () => {
  for (const number of [1, 2, 3, 4, 5]) expect(skill).toContain(`\n${number}. `);
  expect(skill).toContain("Keep `why`'s confidence language intact");
  expect(skill).toContain("run `how` for how it works and `why` for why");
});

test("explain maps the prose pass to humanizer and the images to mermaid and art", () => {
  expect(skill).toContain("through the `humanizer` skill");
  expect(skill).toContain("mermaid for flows; the `art` skill when the idea is spatial");
  expect(skill).toContain("build the picture up diagram by diagram");
});

test("explain names the missing skill and marks a direct read", () => {
  expect(skill).toContain("If `how` or `why` is not installed, say which one is missing");
  expect(skill).toContain("mark that part of the answer as a direct read");
});

test("explain carries none of the upstream tooling names", () => {
  const banned = /cursor|Task\(|subagent_type|generalPurpose|readonly|pstack-models\.mdc|poteto-mode|unslop|mcps\//i;
  for (const path of files(member)) {
    const text = readFileSync(path, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), path).toBe(false);
  }
});

test("explain ends with a one-line source note naming the pstack file and commit", () => {
  const last = skill.trimEnd().split("\n").at(-1)!;
  expect(last).toStartWith("Source: ported from pstack `pstack/skills/teach/SKILL.md` at commit 99743e9c151c8537cbbf1f98bb38f34ef3368453");
});
