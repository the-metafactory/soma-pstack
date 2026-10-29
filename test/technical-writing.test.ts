import { expect, test } from "bun:test";
import { YAML } from "bun";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/technical-writing");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("technical-writing is model-invocable and has triggers", () => {
  expect(frontmatter.name).toBe("technical-writing");
  expect(frontmatter.triggers.length).toBeGreaterThan(0);
  expect(frontmatter).not.toHaveProperty("disable-model-invocation");
});

test("technical-writing pins the upstream commit", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/technical-writing/",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
});

test("technical-writing splits docs into the four Diátaxis modes", () => {
  for (const mode of ["tutorial", "how-to", "reference", "explanation"]) {
    expect(skill).toContain(`**${mode[0]!.toUpperCase()}${mode.slice(1)}`);
  }
});

test("technical-writing makes the codebase the word list", () => {
  expect(skill).toContain("The codebase is the word list.");
  expect(skill).toContain("Don't invent jargon.");
});

test("technical-writing runs humanizer and carries no slop list of its own", () => {
  expect(skill).toContain("Run the **humanizer** skill as the prose pass");
  expect(skill).toContain("carries no second slop list");
});

test("technical-writing carries no pstack-host vocabulary outside the upstream pin and source note", () => {
  const banned = /cursor|Task\(|subagent_type|generalPurpose|pstack-models\.mdc|poteto-mode|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
  expect(skill.replace(/^Source:.*$/m, "")).not.toMatch(/unslop/i);
});
