import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const probe = join(root, "docs/verification/node-17");
const commit = "c742dd61706fbacc1b95f1a20b7b988cf096ce6c";
const names = ["statechart", "create-formal-verification-skill", "maintain-formal-verification-skill"] as const;

const read = (name: string, file: string) => readFileSync(join(root, "skills", name, file), "utf8");
const frontmatter = (name: string) => YAML.parse(/^---\n([\s\S]*?)\n---/.exec(read(name, "SKILL.md"))![1]!);
const manifest = (name: string) => YAML.parse(read(name, "arc-manifest.yaml"));

test("the three formal-verification skills are model-invocable and have a /command trigger", () => {
  for (const name of names) {
    const meta = frontmatter(name);
    expect(meta.name).toBe(name);
    expect(meta).not.toHaveProperty("disable-model-invocation");
    expect(meta.triggers).toContainEqual({ pattern: `/${name}`, type: "command", priority: 100 });
  }
});

test("each skill pins the upstream commit it was ported from", () => {
  for (const name of names) {
    const upstream = manifest(name).upstream;
    expect(upstream.repo).toBe("cursor/plugins");
    expect(upstream.path).toStartWith(`pstack/skills/${name}/`);
    expect(upstream.commit).toBe(commit);
    expect(read(name, "SKILL.md")).toContain(`at commit ${commit}`);
  }
});

test("the root manifest lists all three members", () => {
  const paths = YAML.parse(readFileSync(join(root, "arc-manifest.yaml"), "utf8")).artifacts.map((a: { path: string }) => a.path);
  for (const name of names) expect(paths).toContain(`skills/${name}`);
});

test("statechart turns agreed rules into invariants, draws Mermaid and replays each bug on the real code", () => {
  const skill = read("statechart", "SKILL.md");
  expect(skill).toContain("Write each rule that the reader agrees to as an INVARIANT.");
  expect(skill).toContain("draw it as a Mermaid statechart");
  expect(skill).toContain("replay each bug path against the real code");
});

test("statechart ships the command and the TLC runner it calls", () => {
  for (const file of ["scripts/statechart", "scripts/statechart.ts", "scripts/run.ts", "references/render.md"]) {
    expect(existsSync(join(root, "skills/statechart", file))).toBe(true);
  }
  const run = read("statechart", "scripts/run.ts");
  expect(run).toContain("TLA2TOOLS");
  expect(run).toContain("sha256:936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88");
});

test("create points at statechart by name and copies none of its commands", () => {
  const skill = read("create-formal-verification-skill", "SKILL.md");
  expect(skill).toContain("[`/statechart`](../statechart/SKILL.md)");
  expect(skill).toContain("/maintain-formal-verification-skill");
});

test("maintain never edits product code and reports drift apart from bugs", () => {
  const skill = read("maintain-formal-verification-skill", "SKILL.md");
  expect(skill).toContain("Never edit product code during a run");
  expect(skill).toContain("Say outright which failures were drift in the verification and which were bugs in the code.");
});

test("the stored probe report names both rules that break and their two-step paths", () => {
  const report = readFileSync(join(probe, "report.md"), "utf8");
  expect(report).toContain("## AbandonedStaysAbandoned breaks");
  expect(report).toContain("## CompleteIsNeverAbandoned breaks");
  expect(report.match(/The shortest path has 2 steps:/g)).toHaveLength(2);
  const replay = readFileSync(join(probe, "replay.txt"), "utf8");
  expect(replay).toContain("abandon -> abandoned -> complete -> complete");
  expect(replay).toContain("complete -> complete -> abandon -> abandoned");
});

const { TLA2TOOLS, JAVA } = process.env;
test.skipIf(!TLA2TOOLS || !JAVA)("TLC runs statechart on the probe spec and reports both invariants", () => {
  const out = join(mkdtempSync(join(tmpdir(), "statechart-")), "out");
  const run = Bun.spawnSync(
    [join(root, "skills/statechart/scripts/statechart"), "AlgorithmPhase.tla", "--config", "AlgorithmPhase.cfg", "--view", "view.mjs", "--out", out],
    { cwd: probe, env: process.env, stdout: "pipe", stderr: "pipe" },
  );
  expect(run.exitCode).toBe(1); // 1 = a rule breaks; the report is still written
  const report = readFileSync(join(out, "report.md"), "utf8");
  expect(report).toContain("## AbandonedStaysAbandoned breaks");
  expect(report).toContain("## CompleteIsNeverAbandoned breaks");
  expect(readFileSync(join(out, "chart.mmd"), "utf8")).toContain("stateDiagram-v2");
}, 60_000);
