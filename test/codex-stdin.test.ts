import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const skills = resolve(import.meta.dir, "../skills");

const invocations = (markdown: string) => {
  const blocks = [...markdown.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].flatMap(([, body]) =>
    body!.replace(/\\\n\s*/g, " ").split("\n"),
  );
  const prose = markdown.replace(/```[\s\S]*?```/g, "");
  const spans = [...prose.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span!);
  return [...blocks, ...spans].filter(line => /\bcodex exec\b/.test(line));
};
const closesStdin = (command: string) => /(?:^|\s)<\s+\S/.test(command);

test("the stdin check tells a hanging codex command from a closed one", () => {
  const doc = "```sh\ncodex exec --sandbox read-only \\\n  -o out.md \"review this\"\ncodex exec -o out.md - < prompt.md\n```\nRun `codex exec -m <model> \"go\"`.";
  expect(invocations(doc).map(closesStdin)).toEqual([false, true, false]);
});

test("every skill that runs codex exec gives it stdin from a redirect", () => {
  const files = [...new Bun.Glob("**/*.md").scanSync(skills)];
  const found = files.flatMap(file =>
    invocations(readFileSync(join(skills, file), "utf8")).map(command => ({ file, command })),
  );
  expect(found.length).toBeGreaterThan(0);
  expect(found.filter(({ command }) => !closesStdin(command))).toEqual([]);
});
