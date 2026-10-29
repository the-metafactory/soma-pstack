import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/playbooks");
const index = readFileSync(resolve(member, "SKILL.md"), "utf8");
const cards = readdirSync(resolve(member, "references")).filter(name => name.endsWith(".md")).sort();
const readCard = (card: string) => readFileSync(resolve(member, "references", card), "utf8");
const stepsOf = (text: string) => text.split("\n").filter(line => /^\d+\. /.test(line));

// Soma's working method projects this table verbatim and rewrites each
// `references/` pointer to an absolute path, so its header and row shape are a
// contract with Soma (src/home/working-method.ts).
test("the index table keeps the shape Soma projects", () => {
  const table = index.split("\n").filter(line => line.startsWith("|"));
  expect(table.slice(0, 2)).toEqual(["| Card | Task shape |", "| --- | --- |"]);
  for (const row of table.slice(2)) expect(row).toMatch(/^\| `references\/[a-z-]+\.md` \| [^|]+ \|$/);
});

test("the index lists every card exactly once and nothing else", () => {
  const rows = [...index.matchAll(/^\| `references\/([a-z-]+\.md)` \|/gm)].map(match => match[1]!).sort();
  expect(rows).toEqual(cards);
});

// A copy of the slugs Soma's PLAYBOOK_CARD_RULES hints at (src/algorithm/
// algorithm-classifier.ts). Its mode hook prints a card's path only when the file
// exists, so a rename here silently drops the hint; a new slug there needs a line here.
test("the cards Soma's classifier hints at exist", () => {
  for (const slug of ["bug-fix", "investigation"]) expect(cards).toContain(`${slug}.md`);
});

// Moved from Soma's bundled-skill-references test (soma#922): cards are short by
// contract, cheap enough to load per run.
test("every card keeps its shape", () => {
  const misshapen: string[] = [];
  for (const card of cards) {
    const body = readCard(card).trimEnd().split("\n");
    const has = (prefix: string) => body.some(line => line.startsWith(prefix));
    const steps = stepsOf(body.join("\n")).length;
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
    const shape = /^\*\*Task shape:\*\* (.+)\.$/m.exec(readCard(card))?.[1];
    expect(index, card).toContain(`| \`references/${card}\` | ${shape} |`);
  }
});

test("the investigation card routes how and why questions through Soma's trace capabilities", () => {
  expect(stepsOf(readCard("investigation.md"))[2]).toContain(
    "For a how question, trace it through the registry's `TraceMechanics`; for a why question, through `TraceIntent`.",
  );
});

test("a card names principles by their path under the Soma skills directory", () => {
  for (const card of cards) expect(readCard(card), card).not.toMatch(/`references\/principles\//);
});

// The principles live in Soma, so this runs only where a Soma home is installed,
// and skips otherwise. SOMA_SKILLS_DIR points it at another skills directory, such
// as a Soma checkout's src/skills; a SOMA_SKILLS_DIR that does not exist fails.
const somaSkills = process.env.SOMA_SKILLS_DIR ?? join(homedir(), ".soma", "skills");
const somaPrinciples = join(somaSkills, "the-algorithm", "references", "principles");
test.skipIf(process.env.SOMA_SKILLS_DIR === undefined && !existsSync(somaPrinciples))(
  "every principle a card names exists in the installed Soma",
  () => {
    expect(existsSync(somaPrinciples), somaPrinciples).toBe(true);
    const pointers = cards.flatMap(card =>
      [...readCard(card).matchAll(/`(the-algorithm\/references\/principles\/[^`]+)`/g)].map(match => ({ card, path: match[1]! })),
    );
    expect(pointers.length).toBeGreaterThan(cards.length);
    expect(pointers.filter(({ path }) => !existsSync(join(somaSkills, path))).map(({ card, path }) => `${card}: ${path}`)).toEqual([]);
  },
);

// A command-only member (`disable-model-invocation: true`) is reached by its
// command, so a card names it as `/name`, and that name must be a member whose
// frontmatter declares the command.
const pack = resolve(import.meta.dir, "../skills");
test("every command a card or the index names is a pack member that declares it", () => {
  const sources = [["SKILL.md", index], ...cards.map(card => [card, readCard(card)])];
  const commands = sources.flatMap(([name, text]) => [...text!.matchAll(/`\/([a-z-]+)`/g)].map(match => ({ name, command: match[1]! })));
  expect(commands.length).toBeGreaterThan(0);
  const missing = commands.filter(({ command }) => {
    const skill = join(pack, command, "SKILL.md");
    return !existsSync(skill) || !readFileSync(skill, "utf8").includes(`pattern: "/${command}"`);
  });
  expect(missing.map(({ name, command }) => `${name}: /${command}`)).toEqual([]);
});

test("the feature card routes several valid shapes to arena and a contested design to interrogate", () => {
  const steps = stepsOf(readCard("feature.md"));
  expect(steps.some(step => /several valid shapes[^\n]*`\/arena`/.test(step))).toBe(true);
  expect(steps.some(step => /design is contested[^\n]*`\/interrogate`/.test(step))).toBe(true);
});

test("the eval card picks candidate and judge models by arena's phases", () => {
  const steps = stepsOf(readCard("eval.md")).join("\n");
  expect(steps).toMatch(/`arena` Phase A \(Frame\) step 3/);
  expect(steps).toMatch(/`arena` Phase C \(Cross-judge\)/);
});

test("large refactors and work no card fits are offered to the principal as figure-it-out", () => {
  expect(readCard("refactor.md")).toMatch(/Large or cross-cutting[^\n]*offer the principal `\/figure-it-out`/);
  const noCard = index.split("\n").find(line => line.startsWith("3. No card matches"));
  expect(noCard).toContain("No card matches: run without one and record that in the run's decisions.");
  expect(noCard).toMatch(/offer the principal `\/figure-it-out`/);
});

test("an autonomous run takes side work only for the goal, in its own PR, and keeps a heartbeat", () => {
  const steps = stepsOf(readCard("autonomous-run.md")).join("\n");
  expect(steps).toMatch(/only when it serves the goal/);
  expect(steps).toMatch(/side fix in its own PR/);
  expect(steps).toMatch(/return to the predicate check after each side fix/);
  expect(steps).toMatch(/event to watch[^\n]*heartbeat as fallback/);
});

test("the playbooks member pins the upstream commit its cards were synced to", () => {
  expect(readFileSync(resolve(member, "arc-manifest.yaml"), "utf8")).toContain("commit: c742dd61706fbacc1b95f1a20b7b988cf096ce6c");
});

test("the eval card carries upstream's blinding rules", () => {
  const steps = stepsOf(readCard("eval.md")).join("\n");
  expect(steps).toMatch(/never for a list of the skills, principles or files it applied/);
  expect(steps).toMatch(/does not say other candidates exist/);
  for (const word of ["eval", "test", "judge", "experiment", "rubric", "score", "compare", "benchmark", "candidate", "arena"]) {
    expect(steps).toContain(`\`${word}\``);
  }
  expect(steps).toMatch(/from the files it opened and the shape of its code/);
});
