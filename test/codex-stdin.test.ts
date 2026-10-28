import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const skills = resolve(import.meta.dir, "../skills");

const fence = /(```|~~~)[^\n]*\n([\s\S]*?)\1/g;
const joinContinuations = (body: string) => body.replace(/\s*\\\n\s*/g, " ").split("\n");

const invocations = (markdown: string) => {
  const fenced = [...markdown.matchAll(fence)].flatMap(([, , body]) => joinContinuations(body!));
  const unfenced = markdown.replace(fence, "");
  // An indented code block opens after a blank line and runs while lines keep a 4-space or tab indent.
  const indented = [...unfenced.matchAll(/(?:^|\n\n)((?:(?: {4}|\t).*(?:\n|$))+)/g)].flatMap(([, body]) =>
    joinContinuations(body!.replace(/^(?: {4}|\t)/gm, "")),
  );
  const prose = unfenced.replace(/(^|\n\n)((?:(?: {4}|\t).*(?:\n|$))+)/g, "$1");
  const spans = [...prose.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span!);
  // A span that is only the name, `codex exec`, mentions the tool; it does not run it.
  return [...fenced, ...indented, ...spans].filter(line => /\bcodex exec\b/.test(line) && line.trim() !== "codex exec");
};

// Blank out quoted text, so a `<` or `;` inside an argument is not read as shell syntax.
const unquoted = (command: string) =>
  command.replace(/\\.|'[^']*'?|"(?:\\.|[^"\\])*"?/g, quoted => "_".repeat(quoted.length));

const operator = /\|\||&&|;|\||\n/g;

const closesStdin = (command: string) => {
  // Doc placeholders such as `<model>` or `<work-dir>` stand for a word, not a redirect.
  const shell = unquoted(command).replace(/<[A-Za-z][\w-]*>/g, "P");
  const start = shell.search(/\bcodex exec\b/);
  if (start < 0) return false;
  const feeder = [...shell.slice(0, start).matchAll(operator)].at(-1)?.[0];
  if (feeder === "|") return true;
  const rest = shell.slice(start);
  const end = rest.search(operator);
  const own = end < 0 ? rest : rest.slice(0, end);
  return /<(?!\()/.test(own);
};

test.each([
  ["codex exec -o out.md - < prompt.md", true],
  ["codex exec - <prompt.md", true],
  ["codex exec - <<EOF", true],
  ["codex exec - <<<\"$prompt\"", true],
  ["cat p.md | codex exec -", true],
  ["codex exec -m <model> - < <prompt-file>", true],
  ["codex exec -C \"$run/a-<n>\" -o out.md - < \"$run/brief-<n>.md\" > s.txt 2>&1", true],
  ["codex exec \"review this\"", false],
  ["codex exec \"is a < b true\"", false],
  ["codex exec 'a <<b'", false],
  ["codex exec \"go\"; wc -l < x", false],
  ["codex exec \"go\" && wc -l < x", false],
  ["codex exec \"go\" | tee out < x", false],
  ["cat p.md || codex exec \"go\"", false],
  ["codex exec -m <model> \"go\"", false],
  ["codex exec --input <(cat p.md)", false],
])("closesStdin(%p) is %p", (command, closed) => {
  expect(closesStdin(command)).toBe(closed);
});

test("invocations reads ``` and ~~~ fences, indented code blocks and inline spans", () => {
  const doc = [
    "```sh",
    "codex exec --sandbox read-only \\",
    "  -o out.md \"review this\"",
    "```",
    "~~~",
    "codex exec -o out.md - < prompt.md",
    "~~~",
    "",
    "    codex exec \\",
    "      \"indented\"",
    "",
    "Run `codex exec -m <model> \"go\"` with `codex exec`.",
  ].join("\n");
  expect(invocations(doc)).toEqual([
    "codex exec --sandbox read-only -o out.md \"review this\"",
    "codex exec -o out.md - < prompt.md",
    "codex exec \"indented\"",
    "codex exec -m <model> \"go\"",
  ]);
  expect(invocations(doc).map(closesStdin)).toEqual([false, true, false, false]);
});

test("every skill that runs codex exec gives it stdin from a redirect or a pipe", () => {
  const files = [...new Bun.Glob("**/*.md").scanSync(skills)];
  const found = files.flatMap(file =>
    invocations(readFileSync(join(skills, file), "utf8")).map(command => ({ file, command })),
  );
  expect(found.length).toBeGreaterThan(0);
  expect(found.filter(({ command }) => !closesStdin(command))).toEqual([]);
});
