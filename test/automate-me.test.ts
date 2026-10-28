import { expect, test } from "bun:test";
import { YAML } from "bun";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/automate-me");
const probe = resolve(import.meta.dir, "../docs/verification/node-49");
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

test("automate-me is command-only with a /automate-me trigger", () => {
  expect(frontmatter.name).toBe("automate-me");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/automate-me", type: "command", priority: 100 });
  expect(frontmatter).not.toHaveProperty("route");
});

test("automate-me pins the upstream file and is listed in the root manifest", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/automate-me/SKILL.md",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
  expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain("skills/automate-me");
});

test("automate-me routes to the four Soma home surfaces and applies only approved rows", () => {
  for (const surface of ["`profile/communication.md`", "`policy/behavior.md`", "`skills/the-algorithm/references/principles.local.md`", "`soma memory write`"]) {
    expect(skill).toContain(surface);
  }
  expect(skill).toContain("It applies a proposal only after the principal approves that row. Invoking `/automate-me` is not approval.");
  expect(skill).toContain("Do not run it.");
  expect(skill).toContain("never inside the Soma home");
  expect(skill).toContain("never against a projection");
});

test("automate-me mines one workspace and names each substrate's store", () => {
  expect(skill).toContain("Never glob across projects");
  for (const store of ["~/.claude/projects/<slug>/*.jsonl", "~/.codex/sessions/", "~/.pi/agent/sessions/", "agent-transcripts/"]) {
    expect(skill).toContain(store);
  }
  expect(skill).toContain("say that transcript mining is unsupported there");
});

test("automate-me keeps the two-slice bar, the short interview and the covered-rule check", () => {
  expect(skill).toContain("seen in two or more slices");
  expect(skill).toContain("`AskUserQuestion` on Claude Code");
  expect(skill).toContain("Ask a few questions, not twenty.");
  expect(skill).toContain("drop it as covered, and name the rule");
  expect(skill).toContain("execution miss, not a new rule");
});

test("automate-me carries none of the upstream tooling names", () => {
  const banned = /poteto-mode|unslop|create-skill|AskQuestion|\.cursor\/skills|allow_multiple/;
  for (const path of files(member)) expect(banned.test(readFileSync(path, "utf8")), path).toBe(false);
});

test("member and evidence files name no private Soma home path", () => {
  const privateMarker = /~\/\.soma\/(memory|profile|imports)\b/;
  for (const path of [...files(member), ...files(probe)]) {
    expect(privateMarker.test(readFileSync(path, "utf8")), path).toBe(false);
  }
});

test("the extractor keeps only principal-authored turns", () => {
  const store = mkdtempSync(join(tmpdir(), "automate-me-store-"));
  const out = mkdtempSync(join(tmpdir(), "automate-me-out-"));
  const rows = [
    { type: "user", uuid: "keep", timestamp: "2026-10-01T00:00:00Z", message: { content: "push and open the PR" } },
    { type: "user", uuid: "tool", timestamp: "2026-10-01T00:01:00Z", message: { content: [{ type: "tool_result", content: "ok" }] } },
    { type: "user", uuid: "mate", timestamp: "2026-10-01T00:02:00Z", message: { content: "<teammate-message>do x</teammate-message>" } },
    { type: "user", uuid: "meta", timestamp: "2026-10-01T00:03:00Z", isMeta: true, message: { content: "caveat" } },
    { type: "user", uuid: "shell", timestamp: "2026-10-01T00:04:00Z", message: { content: "<bash-input> ls</bash-input>" } },
    { type: "user", uuid: "summary", timestamp: "2026-10-01T00:05:00Z", message: { content: "This session is being continued from a previous conversation" } },
    { type: "assistant", uuid: "agent", timestamp: "2026-10-01T00:06:00Z", message: { content: "done" } },
  ];
  writeFileSync(join(store, "session.jsonl"), rows.map(row => JSON.stringify(row)).join("\n"));
  const run = Bun.spawnSync(["bun", join(probe, "extract.ts"), store, out], { stdout: "pipe", stderr: "pipe" });
  expect(run.exitCode).toBe(0);
  const kept = ["slice-1", "slice-2", "slice-3"]
    .flatMap(name => readFileSync(join(out, `${name}.jsonl`), "utf8").split("\n").filter(Boolean))
    .map(line => JSON.parse(line).uuid);
  expect(kept).toEqual(["keep"]);
});

test("the probe proposal routes only multi-slice signals and applies nothing", () => {
  const proposal = readFileSync(join(probe, "proposal.md"), "utf8");
  expect(proposal).toContain("Status: proposed, nothing applied.");
  const rows = proposal.split("\n").filter(line => /^\| A\d+ \|/.test(line)).map(line => line.split("|").map(cell => cell.trim()));
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    const [, code, , slices, , , surface] = row;
    if (surface !== "none") expect(slices!.split(",").length, code).toBeGreaterThanOrEqual(2);
  }
  const slices = JSON.parse(readFileSync(join(probe, "slices.json"), "utf8"));
  expect(slices).toHaveLength(3);
  for (const slice of slices) expect(Object.keys(slice).sort()).toEqual(["from", "pointers", "slice", "to", "turns"]);
});
