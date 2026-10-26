import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runProbe } from "./probes/show-me-your-work";
import { events, keepsPrefix, rows } from "./helpers/decision-trail";

const skill = resolve(import.meta.dir, "../skills/show-me-your-work");
const logger = join(skill, "scripts/log.sh");
const template = readFileSync(join(skill, "references/decision-log-template.tsv"), "utf8");
const fixtures: string[] = [];
const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), "decision-trail-"));
  fixtures.push(root);
  return root;
};
const run = (path: string, ...cells: string[]) => Bun.spawnSync(["bash", logger, path, ...cells]);
const cells = ["start", "new log", "begin run", "session-1", "open"];

afterEach(() => fixtures.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));

test("creates nested paths with spaces, emits the template header and a UTC timestamp", () => {
  const path = join(scratch(), "nested space", "decisions.tsv");
  expect(run(path, ...cells).exitCode).toBe(0);
  const text = readFileSync(path, "utf8");
  expect(text.startsWith(template)).toBe(true);
  const row = rows(path)[0]!;
  expect(row).toHaveLength(6);
  expect(row[0]).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  expect(row.slice(1)).toEqual(cells);
});

test("appends a superseding decision without modifying any earlier bytes or repeating header", () => {
  const path = join(scratch(), "decisions.tsv");
  writeFileSync(path, template);
  expect(run(path, ...cells).exitCode).toBe(0);
  const before = readFileSync(path);
  expect(run(path, "choose", "supersedes row 2: choose numeric sort", "lexical order failed", "transcript:6", "verified").exitCode).toBe(0);
  expect(keepsPrefix(path, before)).toBe(true);
  expect(rows(path)).toHaveLength(2);
});

for (const prefix of ["=", "+", "-", "@", "=+-@", " \t\r\n= + - @ "]) {
  test(`strips formula prefix ${JSON.stringify(prefix)} from every supplied cell`, () => {
    const path = join(scratch(), "decisions.tsv");
    expect(run(path, ...Array(5).fill(prefix + "payload=kept")).exitCode).toBe(0);
    expect(rows(path)[0]!.slice(1)).toEqual(Array(5).fill("payload=kept"));
  });
}

test("normalizes multiline cells, preserves internal punctuation, unicode and empty cells", () => {
  const path = join(scratch(), "decisions.tsv");
  const values = ["start", "a\tb\nc\rd", "Zürich 日本語", "path/@name-1+2=3", ""];
  expect(run(path, ...values).exitCode).toBe(0);
  expect(rows(path)[0]!.slice(1)).toEqual(["start", "a b c d", ...values.slice(2)]);
});

test("a pickup and a returning run append start boundaries naming the preceding range", () => {
  const path = join(scratch(), "decisions.tsv");
  expect(run(path, ...cells).exitCode).toBe(0);
  const firstRun = readFileSync(path);
  const timestamp = rows(path)[0]![0];
  expect(run(path, "start", `pickup; preceding other-run range ${timestamp} to ${timestamp}`, "new conversation", "session-2", "open").exitCode).toBe(0);
  expect(keepsPrefix(path, firstRun)).toBe(true);
  const secondRun = readFileSync(path);
  const lastTimestamp = rows(path).at(-1)![0];
  expect(run(path, "start", `return; preceding other-run range ${lastTimestamp} to ${lastTimestamp}`, "session-2 wrote since session-1", "session-1", "open").exitCode).toBe(0);
  expect(keepsPrefix(path, secondRun)).toBe(true);
  expect(rows(path).map(row => row[1])).toEqual(["start", "start", "start"]);
  expect(rows(path).map(row => row[4])).toEqual(["session-1", "session-2", "session-1"]);
});

test("wrong arity fails before creating or changing a log", () => {
  const path = join(scratch(), "decisions.tsv");
  expect(run(path, "start").exitCode).not.toBe(0);
  expect(Bun.file(path).size).toBe(0);
  writeFileSync(path, template);
  expect(run(path, ...cells, "extra").exitCode).not.toBe(0);
  expect(readFileSync(path, "utf8")).toBe(template);
});

test("scratch task records a real pivot, preserves history and adds an audited missing fork", () => {
  const root = scratch();
  const { log, transcript, audit } = runProbe(root);
  const trail = rows(log);
  expect(trail.map(row => row[1])).toEqual(["start", "sort", "sort", "audit-gap", "audit"]);
  const lexicalRow = trail.findIndex(row => row[1] === "sort");
  expect(trail[lexicalRow + 1]![2]).toContain(`supersedes row ${lexicalRow + 2} (${trail[lexicalRow]![0]})`);
  const transcriptEvents = events(transcript);
  expect(transcriptEvents.filter(event => event.command).map(event => event.stdout)).toEqual(["1\n10\n2\n", "1\n2\n10\n"]);
  const auditText = readFileSync(audit, "utf8");
  expect(auditText).toContain("previously unlogged locale fork");
  const auditRow = trail.length + 1;
  const summary = transcriptEvents.find(event => event.audit)!.audit;
  expect(auditText).toContain(summary);
  expect(summary).toContain(`Checked rows 2-${auditRow - 1}`);
  expect(summary).toContain(`Row ${auditRow} records this audit`);
  expect(trail.at(-1)![5]).toBe(summary);
  expect(() => runProbe(root)).toThrow("never overwrite");
});
