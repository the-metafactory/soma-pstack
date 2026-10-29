import { expect, test } from "bun:test";
import { YAML } from "bun";
import { spawnSync } from "bun";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { rows } from "./helpers/decision-trail";

const member = resolve(import.meta.dir, "../skills/figure-it-out");
const probe = resolve(import.meta.dir, "../docs/verification/node-47");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const section = (heading: string) => skill.split(`## ${heading}`)[1]!.split("\n## ")[0]!;
const trail = rows(join(probe, "decisions.tsv"));
const line = (row: number) => trail[row - 2]!;

function resolves(evidence: string): boolean {
  const pointer = evidence.split(/[ :#]/)[0]!;
  if (existsSync(join(probe, pointer))) return true;
  return /^[0-9a-f]{7,40}$/.test(pointer)
    && spawnSync(["git", "cat-file", "-e", `${pointer}^{commit}`], { cwd: member }).exitCode === 0;
}

/** File line numbers that a later row supersedes as "supersedes row N (<ts of line N>)". */
function superseded(): Map<number, string[]> {
  const corrections = new Map<number, string[]>();
  for (const row of trail) {
    for (const [, n, ts] of row[2]!.matchAll(/supersedes row (\d+) \(([^)]+)\)/g)) {
      if (line(Number(n))?.[0] === ts) corrections.set(Number(n), row);
    }
  }
  return corrections;
}

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("figure-it-out is command-only, as upstream has it", () => {
  expect(frontmatter.name).toBe("figure-it-out");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toEqual([{ pattern: "/figure-it-out", type: "command", priority: 100 }]);
  expect(frontmatter).not.toHaveProperty("route");
});

test("the description does not claim task shapes that playbook cards own", () => {
  expect(frontmatter.description).toMatch(/no playbook card fits/i);
  expect(frontmatter.description).not.toMatch(/migration|stepping away|steps away/i);
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

test("an explicit invocation wins, and a matching card is named to the principal rather than taken silently", () => {
  const start = section("Start");
  expect(start).toMatch(/explicit `\/figure-it-out`[^\n]*wins/i);
  expect(start).toMatch(/card clearly matches[^\n]*name that card to the principal and ask/i);
  expect(start).toMatch(/never switch to it silently/i);
  expect(start).not.toMatch(/use that card and stop/i);
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
  expect(composition).not.toMatch(/nothing is kept twice/i);
});

test("a tier mismatch is recorded and left to the principal, never escalated in place", () => {
  const composition = section("Inside an Algorithm run");
  expect(composition).not.toMatch(/escalate the tier/i);
  expect(composition).toMatch(/record the mismatch with `algorithm decision`/);
  expect(composition).toContain("the-algorithm/references/mode-detection.md");
  expect(composition).toMatch(/Only when the classifier chose the tier[^\n]*leave that call to the principal/);
});

test("VERIFIED maps to a passed verify with a probed or tested evidence kind", () => {
  const composition = section("Inside an Algorithm run");
  expect(composition).toContain("VERIFIED is `--status passed --evidence-kind probed` (or `tested`");
  expect(composition).toContain("NOT VERIFIED is `--status failed`");
});

test("the architect reference names a member that exists in this pack", () => {
  expect(skill.trimEnd().split("\n").pop()).toMatch(/`architect` is read from its SKILL\.md and followed, because it is command-only/);
  expect(existsSync(resolve(import.meta.dir, "../skills/architect/SKILL.md"))).toBe(true);
  expect(existsSync(resolve(import.meta.dir, "../skills/arena/SKILL.md"))).toBe(true);
});

test("figure-it-out names Soma principles, not pstack's", () => {
  const named = [...skill.matchAll(/the-algorithm\/references\/principles\/([a-z-]+)\.md/g)].map(match => match[1]);
  for (const principle of ["verify-before-claiming", "build-over-ask-when-reversible", "foundational-thinking", "laziness-protocol",
    "separate-before-serializing-shared-state", "sequence-verifiable-units", "encode-lessons-in-structure", "own-delegated-work"]) {
    expect(named, principle).toContain(principle);
  }
  expect(skill).not.toMatch(/prove-it-works|never-block-on-the-human/);
});

test("one-way doors go to architect, which runs arena, and the trail goes to show-me-your-work", () => {
  expect(section("Phase B: Design the workflow")).toMatch(/one-way-door[^\n]*\[`architect`\]\(\.\.\/architect\/SKILL\.md\)[^\n]*`arena`/);
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
  const firstUnit = trail.findIndex(row => row[1] === "loop");
  const frame = trail.findIndex(row => row[1] === "frame" && /predicate/i.test(row[2]!));
  expect(frame).toBeGreaterThanOrEqual(0);
  expect(frame).toBeLessThan(firstUnit);
  expect(trail[frame]![0]! <= trail[firstUnit]![0]!).toBe(true);
});

test("every probe trail pointer resolves here, or a later row supersedes it with one that does", () => {
  const corrections = superseded();
  trail.forEach(([, , decision, , evidence], index) => {
    expect(evidence, decision).toBeTruthy();
    const correction = corrections.get(index + 2);
    expect(resolves(evidence!) || (correction !== undefined && resolves(correction[4]!)), `${decision}: ${evidence}`).toBe(true);
  });
});

test("every probe trail run opens with a start row, the first saying new log unless superseded", () => {
  expect(trail[0]![1]).toBe("start");
  expect(/new log/.test(trail[0]![2]!) || superseded().has(2)).toBe(true);
});

test("every supersede row in the probe trail names its row's timestamp, unless itself superseded", () => {
  const corrections = superseded();
  trail.forEach(([, , decision], index) => {
    for (const [, n, ts] of decision!.matchAll(/supersedes row (\d+)( \(([^)]+)\))?/g)) {
      const named = ts !== undefined && line(Number(n))?.[0] === ts.slice(2, -1);
      expect(named || corrections.has(index + 2), decision).toBe(true);
    }
  });
});

test("the committed evidence carries no host path or email address", () => {
  for (const file of files(probe)) {
    const text = readFileSync(file, "utf8");
    expect(text, file).not.toMatch(/\/Users\/|\/home\/[a-z]|-Users-/);
    expect(text, file).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  }
});

test("the probe's harness fails on the baseline and passes after the run", () => {
  const baseline = JSON.parse(readFileSync(join(probe, "harness-baseline.json"), "utf8"));
  const after = JSON.parse(readFileSync(join(probe, "harness-after.json"), "utf8"));
  expect(baseline.failures.length).toBeGreaterThan(0);
  expect(after.failures).toEqual([]);
  expect(after.checked).toBe(baseline.checked);
});
