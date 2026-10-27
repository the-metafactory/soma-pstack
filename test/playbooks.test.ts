import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/playbooks");
const index = readFileSync(resolve(member, "SKILL.md"), "utf8");
const cards = readdirSync(resolve(member, "references")).filter(name => name.endsWith(".md")).sort();

test("the index lists every card exactly once and nothing else", () => {
  const rows = [...index.matchAll(/^\| `references\/([a-z-]+\.md)` \|/gm)].map(match => match[1]!).sort();
  expect(rows).toEqual(cards);
});

// Moved from Soma's bundled-skill-references test (soma#922): cards are short by
// contract, cheap enough to load per run.
test("every card keeps its shape", () => {
  const misshapen: string[] = [];
  for (const card of cards) {
    const body = readFileSync(resolve(member, "references", card), "utf8").trimEnd().split("\n");
    const has = (prefix: string) => body.some(line => line.startsWith(prefix));
    const steps = body.filter(line => /^\d+\. /.test(line)).length;
    if (body.length > 39) misshapen.push(`${card}: ${body.length} lines`);
    if (steps < 6 || steps > 10) misshapen.push(`${card}: ${steps} numbered steps`);
    for (const prefix of ["**Task shape:**", "**You own:**", "## Steps", "## Criteria", "## Principles"]) {
      if (!has(prefix)) misshapen.push(`${card}: no ${prefix}`);
    }
    if (!body.at(-1)?.startsWith("**Reply:**")) misshapen.push(`${card}: does not end with a Reply line`);
  }
  expect(misshapen).toEqual([]);
});

test("an index row that names a card's task shape repeats it exactly", () => {
  for (const card of ["prototype.md", "planning.md"]) {
    const shape = /^\*\*Task shape:\*\* (.+)\.$/m.exec(readFileSync(resolve(member, "references", card), "utf8"))?.[1];
    expect(index, card).toContain(`| \`references/${card}\` | ${shape} |`);
  }
});

test("the investigation card routes how and why questions through Soma's trace capabilities", () => {
  const steps = readFileSync(resolve(member, "references", "investigation.md"), "utf8").split("\n").filter(line => /^\d+\. /.test(line));
  expect(steps[2]).toContain("For a how question, trace it through the registry's `TraceMechanics`; for a why question, through `TraceIntent`.");
});

test("a card names principles by their path under the Soma skills directory", () => {
  for (const card of cards) {
    const text = readFileSync(resolve(member, "references", card), "utf8");
    expect(text, card).not.toMatch(/`references\/principles\//);
  }
});
