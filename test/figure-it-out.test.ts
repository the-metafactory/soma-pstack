import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { rows } from "./helpers/decision-trail";

const member = resolve(import.meta.dir, "../skills/figure-it-out");
const probe = resolve(import.meta.dir, "../docs/verification/node-47");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const section = (heading: string) => skill.split(`## ${heading}`)[1]!.split("\n## ")[0]!;

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("figure-it-out is command-only and routed for the case no playbook card matches", () => {
  expect(frontmatter.name).toBe("figure-it-out");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/figure-it-out", type: "command", priority: 100 });
  expect(frontmatter.route).toMatch(/no playbook card matches/i);
});

test("figure-it-out pins the upstream commit", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/figure-it-out/SKILL.md",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
});

test("figure-it-out declares no network and no secrets of its own", () => {
  expect(manifest.capabilities.network).toEqual([]);
  expect(manifest.capabilities.secrets).toEqual([]);
});

test("figure-it-out defers to a matching playbook card before designing one", () => {
  expect(section("Start")).toMatch(/card matches[^\n]*use (?:that|the) card/i);
});

test("the phases run frame, design, loop, trail, hand back in order", () => {
  const phases = [...skill.matchAll(/^## Phase ([A-E]): (.+)$/gm)].map(match => `${match[1]} ${match[2]}`);
  expect(phases).toEqual(["A Frame", "B Design the workflow", "C Run the loop", "D Keep the audit trail", "E Verify and hand back"]);
});

test("an Algorithm run gets the predicate as criteria, the design as plan steps and the trail in show-me-your-work", () => {
  const composition = section("Inside an Algorithm run");
  expect(composition).toContain("algorithm new");
  expect(composition).toContain("--criterion");
  expect(composition).toContain("algorithm plan");
  expect(composition).toContain("algorithm decision");
  expect(composition).toContain("algorithm verify");
  expect(composition).toContain("decisions.tsv");
});

test("figure-it-out names Soma principles, not pstack's", () => {
  const named = [...skill.matchAll(/the-algorithm\/references\/principles\/([a-z-]+)\.md/g)].map(match => match[1]);
  for (const principle of ["verify-before-claiming", "build-over-ask-when-reversible", "foundational-thinking", "laziness-protocol",
    "separate-before-serializing-shared-state", "sequence-verifiable-units", "encode-lessons-in-structure", "own-delegated-work"]) {
    expect(named, principle).toContain(principle);
  }
  expect(skill).not.toMatch(/prove-it-works|never-block-on-the-human/);
});

test("one-way doors go to arena and the trail goes to show-me-your-work", () => {
  expect(section("Phase B: Design the workflow")).toMatch(/one-way-door[^\n]*`arena`/);
  expect(skill.split("\nSource: ")[0]).not.toMatch(/\barchitect\b/);
  expect(section("Phase D: Keep the audit trail")).toContain("`show-me-your-work`");
});

test("an inconclusive verdict never counts as a pass", () => {
  expect(skill).toContain("VERIFIED, NOT VERIFIED, or INCONCLUSIVE");
  expect(skill).toContain("Inconclusive is not a pass.");
});

test("figure-it-out carries no pstack-host vocabulary outside the upstream pin and source note", () => {
  const banned = /cursor|poteto-mode|Task\(|subagent_type|generalPurpose|pstack-models\.mdc|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
});

test("figure-it-out ends with a one-line source note naming the file and commit", () => {
  const last = skill.trimEnd().split("\n").pop()!;
  expect(last).toStartWith("Source: ported from pstack `pstack/skills/figure-it-out/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c");
});

test("the probe framed a falsifiable predicate and a rigor level before the first unit", () => {
  const playbook = readFileSync(join(probe, "playbook.md"), "utf8");
  expect(playbook).toMatch(/^## Predicate$/m);
  expect(playbook).toMatch(/^## Rigor$/m);
  expect(playbook).toMatch(/^## Designed phases$/m);
  const trail = rows(join(probe, "decisions.tsv"));
  const firstUnit = trail.findIndex(row => row[1] === "loop");
  const frame = trail.findIndex(row => row[1] === "frame" && /predicate/i.test(row[2]!));
  expect(frame).toBeGreaterThanOrEqual(0);
  expect(frame).toBeLessThan(firstUnit);
});

test("every probe trail row carries an evidence pointer that exists in the evidence directory or is a SHA", () => {
  for (const [, , decision, , evidence] of rows(join(probe, "decisions.tsv"))) {
    expect(evidence, decision).toBeTruthy();
    const pointer = evidence!.split(/[ :#]/)[0]!;
    expect(/^[0-9a-f]{7,40}$/.test(pointer) || existsSync(join(probe, pointer)), `${decision}: ${evidence}`).toBe(true);
  }
});

test("the probe's harness fails on the baseline and passes after the run", () => {
  const baseline = JSON.parse(readFileSync(join(probe, "harness-baseline.json"), "utf8"));
  const after = JSON.parse(readFileSync(join(probe, "harness-after.json"), "utf8"));
  expect(baseline.failures.length).toBeGreaterThan(0);
  expect(after.failures).toEqual([]);
  expect(after.checked).toBe(baseline.checked);
});
