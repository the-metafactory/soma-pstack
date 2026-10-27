import { expect, test } from "bun:test";
import { YAML } from "bun";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/how");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("how is model-invocable and shaped for Soma", () => {
  expect(frontmatter.name).toBe("how");
  expect(frontmatter.description.length).toBeGreaterThan(0);
  expect(frontmatter.triggers.length).toBeGreaterThan(0);
  expect(frontmatter).not.toHaveProperty("disable-model-invocation");
});

test("how binds TraceMechanics and pins the upstream commit", () => {
  expect(manifest.algorithmCapability.satisfies).toEqual(["TraceMechanics"]);
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/how/",
    commit: "99743e9c151c8537cbbf1f98bb38f34ef3368453",
  });
});

test("how's soma-skill.json carries the same binding, since Soma reads satisfies only from it", () => {
  const somaSkill = JSON.parse(readFileSync(join(member, "soma-skill.json"), "utf8"));
  expect(somaSkill.schema).toBe("soma.skill.v1");
  expect(somaSkill.name).toBe("how");
  expect(somaSkill.algorithmCapability.satisfies).toEqual(manifest.algorithmCapability.satisfies);
});

test("how spawns explorers on haiku and the explainer on opus", () => {
  expect(skill).toContain("each explorer with model `haiku`");
  expect(skill).toContain("every explainer with model `opus`");
});

test("how keeps upstream's output sections verbatim", () => {
  const explorer = readFileSync(join(member, "references/explorer-prompt.md"), "utf8");
  const explainer = readFileSync(join(member, "references/explainer-prompt.md"), "utf8");
  for (const heading of ["Components Found", "Flow", "Files Read", "Boundaries", "Non-Obvious Things", "Open Questions"]) {
    expect(explorer).toContain(`### ${heading}\n`);
  }
  for (const heading of ["Overview", "Key Concepts", "How It Works", "Where Things Live", "Gotchas"]) {
    expect(explainer).toContain(`### ${heading}\n`);
  }
});

test("how carries no pstack-host vocabulary outside the upstream pin", () => {
  const banned = /cursor|Task\(|subagent_type|generalPurpose|readonly|pstack-models\.mdc|poteto-mode|unslop|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
});

test("how ends with a one-line source note naming the file and commit", () => {
  const last = skill.trimEnd().split("\n").pop()!;
  expect(last).toStartWith("Source: ported from pstack `pstack/skills/how/SKILL.md` at commit 99743e9c151c8537cbbf1f98bb38f34ef3368453");
});
