import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const skills = resolve(import.meta.dir, "../skills");
const member = join(skills, "maintain-verification-skill");
const probe = resolve(import.meta.dir, "../docs/verification/node-44");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const pass = skill.split("## Pass")[1]!;

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("maintain-verification-skill is command-invoked and routed", () => {
  expect(frontmatter.name).toBe("maintain-verification-skill");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.route).toMatch(/verify-<app>/);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/maintain-verification-skill", type: "command", priority: 100 });
});

test("maintain-verification-skill pins the upstream commit", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/maintain-verification-skill/SKILL.md",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
});

test("its edits stay inside the verify skill directories", () => {
  expect(manifest.capabilities.filesystem.write).toEqual(["./.claude/skills/**", "./.agents/skills/**", "/tmp/**"]);
  expect(skill).toContain("Edit only the verification skill's own directory");
  expect(skill).toContain("Never edit product code during a run.");
});

test("a run ends in exactly one of clean, changed or blocked", () => {
  const outcomes = [...skill.split("## Outcomes")[1]!.split("## ")[0]!.matchAll(/^- \*\*(\w+)\*\*:/gm)].map(m => m[1]);
  expect(outcomes).toEqual(["clean", "changed", "blocked"]);
});

test("the pass runs steps 0 to 6 in upstream order", () => {
  const steps = [...pass.matchAll(/^(\d)\. \*\*(.+?)\.\*\*/gm)].map(m => `${m[1]} ${m[2]}`);
  expect(steps).toEqual([
    "0 Locate the target", "1 Index hygiene", "2 Source wave", "3 Reconcile",
    "4 Live pass", "5 Triage", "6 Ship or stop",
  ]);
});

test("the target is where create-verification-skill writes it", () => {
  const generator = readFileSync(join(skills, "create-verification-skill/SKILL.md"), "utf8");
  for (const location of ["<repo>/.claude/skills/verify-<app>/", "<repo>/.agents/skills/verify-<app>/", "features/README.md"]) {
    expect(generator, location).toContain(location);
    expect(pass, location).toContain(location);
  }
  for (const section of ["Launch", "Doctor", "Drive", "Evidence", "Cleanup"]) {
    expect(generator).toContain(`**${section}:**`);
  }
  expect(pass).toContain("Launch, Doctor, Drive, Evidence and Cleanup");
});

test("source readers are read-only and the live pass holds its three invariants", () => {
  expect(pass).toContain("Subagents never drive the app and never edit files.");
  expect(pass).toContain("Required even when the source looks clean.");
  const invariants = pass.split("hold three invariants")[1]!.split("A Doctor failure")[0]!;
  expect([...invariants.matchAll(/^ {3}\d\. /gm)].length).toBe(3);
});

test("a push waits on approval and follows the opening-a-pr card", () => {
  const ship = pass.split("6. **Ship or stop.**")[1]!;
  expect(ship).toContain("only under the principal's approval or a grant that covers this work");
  expect(ship).toContain("Without approval, stop at the local branch");
  const card = /`(playbooks\/references\/[a-z-]+\.md)`/.exec(ship)![1]!;
  expect(existsSync(join(skills, card))).toBe(true);
});

test("the probe has a four-part source-wave return for every indexed feature", () => {
  const hygiene = readFileSync(join(probe, "index-hygiene.txt"), "utf8");
  const indexed = hygiene.split("\n\n")[0]!.split("\n").filter(line => line.endsWith(".md"));
  expect(indexed.length).toBe(5);
  expect(hygiene).toContain('diff <(listed) <(on disk); echo "exit $?"   # missing/extra\nexit 0');
  expect(readdirSync(join(probe, "source-wave")).sort()).toEqual(indexed);
  for (const feature of indexed) {
    const report = readFileSync(join(probe, "source-wave", feature), "utf8");
    const headings = [...report.matchAll(/^## (.+)$/gm)].map(m => m[1]);
    expect(headings, feature).toEqual(["Feature summary", "Source entry points", "Likely drift", "Recipe"]);
    expect(report.split("## Likely drift")[1]!, feature).toMatch(/[\w/-]+\.(?:ts|md):\d+/);
  }
});

test("maintain-verification-skill carries no pstack-host vocabulary outside the upstream pin", () => {
  const banned = /cursor|AskQuestion|Task\(|subagent_type|generalPurpose|pstack-models\.mdc|poteto-mode|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
});
