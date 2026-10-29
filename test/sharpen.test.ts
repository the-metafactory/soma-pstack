import { expect, test } from "bun:test";
import { YAML } from "bun";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/sharpen");
const probe = resolve(import.meta.dir, "../docs/verification/node-15");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("sharpen is model-invocable and has triggers", () => {
  expect(frontmatter.name).toBe("sharpen");
  expect(frontmatter.triggers.length).toBeGreaterThan(0);
  expect(frontmatter).not.toHaveProperty("disable-model-invocation");
});

test("sharpen pins the upstream commit", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/sharpen/",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
});

test("sharpen asks for the professional's additions, raw material, methods and an outside check", () => {
  expect(skill).toContain("1. Say what a top professional in this field would do here that I'm not asking for.");
  expect(skill).toContain("2. Name the rawest material they would start from instead of what has already been digested for me.");
  expect(skill).toContain("3. Name the specific methods and tools they would use.");
  expect(skill).toContain("4. Say what, other than you or me, would show the result is right.");
});

test("sharpen leaves the principal's choices open", () => {
  expect(skill).toContain("Leave choices that are mine to make open instead of deciding them.");
  expect(skill).toContain("stays unmade");
});

test("the probe output has the four parts and the rewrite", () => {
  const output = readFileSync(join(probe, "sharpened.md"), "utf8");
  const headings = [...output.matchAll(/^## (.+)$/gm)].map(match => match[1]!);
  expect(headings.length).toBe(5);
  expect(headings.slice(0, 4).map(heading => heading[0])).toEqual(["1", "2", "3", "4"]);
  expect(headings[4]).toBe("Rewritten prompt");
});

test("the probe rewrite keeps every choice the brief stated and answers none it left open", () => {
  const brief = readFileSync(join(probe, "scratch-brief.md"), "utf8");
  const rewrite = readFileSync(join(probe, "sharpened.md"), "utf8").split("## Rewritten prompt")[1]!;
  expect(rewrite).toContain(brief.trim());
  const stated = ["Bun script", "dedupe.ts", "~/Pictures", "SHA-256", "as JSON", "Don't delete or move anything", "under 100 lines"];
  for (const choice of stated) expect(rewrite, choice).toContain(choice);
  const overrides = [/group by size/i, /avoid hashing/i, /only (?:the )?files that share a size/i];
  const [instructions = "", questions = ""] = rewrite.split("Open questions for me");
  for (const override of overrides) expect(instructions, String(override)).not.toMatch(override);
  expect(questions).toMatch(/hash every file[^\n]*\?/i);
  expect(rewrite).toContain("Open questions for me");
  expect(rewrite).toMatch(/near-duplicates[^\n]*\?/);
});

test("sharpen carries no pstack-host vocabulary outside the upstream pin and source note", () => {
  const banned = /cursor|Task\(|subagent_type|generalPurpose|pstack-models\.mdc|poteto-mode|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
});
