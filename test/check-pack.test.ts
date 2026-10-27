import { afterEach, expect, test } from "bun:test";
import { YAML } from "bun";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    upstream: { repo: "cursor/plugins", path: "pstack/skills/benchmark-checklist", commit },
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
