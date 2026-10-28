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
  "pstack/skills/typescript-best-practices",
  "pstack/skills/benchmark-checklist/SKILL",
  "/pstack/skills/benchmark-checklist/",
  "pstack//skills/benchmark-checklist/",
  "pstack/skills/../benchmark-checklist/SKILL.md",
  "pstack/skills/./benchmark-checklist/",
]) {
  test(`upstream.path ${path} without a file or directory shape fails`, () => {
    const root = library([{ path: memberPath }]);
    member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path } });
    expectMemberFailure(root, "upstream.path");
  });
}

test("a directory pin ending in / passes", () => {
  const root = library([{ path: memberPath }]);
  member(root, { ...memberManifest(), upstream: { ...memberManifest().upstream, path: "pstack/skills/benchmark-checklist/" } });
  expect(run(root).code).toBe(0);
});

function fakeGh(root: string, body: string) {
  const bin = join(root, "fake-bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), `#!/bin/sh\necho "$@" >> "${bin}/calls"\n${body}\n`);
  chmodSync(join(bin, "gh"), 0o755);
  return { ...process.env, PATH: `${bin}:${process.env.PATH}`, CHECK_PACK_UPSTREAM: "1" };
}

for (const [label, path, response] of [
  ["a file pin that is a directory upstream", "pstack/skills/benchmark-checklist/SKILL.md", "[]"],
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

test("CHECK_PACK_UPSTREAM=1 fails a pin that does not resolve", () => {
  const root = library([{ path: memberPath }]);
  member(root);
  const result = run(root, fakeGh(root, "echo Not Found >&2; exit 1"));
  expect(result.code).not.toBe(0);
  expect(result.output).toContain("does not resolve");
});

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
