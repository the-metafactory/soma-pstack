import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const member = resolve(import.meta.dir, "../skills/interrogate");
const probe = resolve(import.meta.dir, "../docs/verification/node-46");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const arena = readFileSync(resolve(import.meta.dir, "../skills/arena/SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const root = YAML.parse(readFileSync(resolve(import.meta.dir, "../arc-manifest.yaml"), "utf8"));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

function section(text: string, heading: string): string {
  return text.split(`\n## ${heading}\n`)[1]!.split("\n## ")[0]!;
}

test("interrogate runs only when asked, with an /interrogate trigger", () => {
  expect(frontmatter.name).toBe("interrogate");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/interrogate", type: "command", priority: 100 });
  expect(frontmatter).not.toHaveProperty("route");
});

test("interrogate pins the upstream file and is listed in the root manifest", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/interrogate/SKILL.md",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
  expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain("skills/interrogate");
});

test("every arena phase interrogate cites exists in arena under that letter and name", () => {
  const cited = [...skill.matchAll(/arena Phase ([A-F]) \(([^)]+)\)/g)].map(match => `## Phase ${match[1]}: ${match[2]}`);
  expect(new Set(cited)).toEqual(new Set([
    "## Phase A: Frame", "## Phase B: Fan out", "## Phase C: Cross-judge",
    "## Phase D: Pick a base", "## Phase E: Graft", "## Phase F: Verify",
  ]));
  for (const heading of cited) expect(arena, heading).toContain(`\n${heading}\n`);
  const frame = arena.split("## Phase A: Frame")[1]!.split("\n## ")[0]!;
  expect(frame).toMatch(/\n3\. Pick the runners\./);
  expect(frame).toMatch(/\n4\. Give each candidate its own output location/);
});

test("interrogate reports and never fixes, and keeps only rerun findings", () => {
  expect(skill).toContain("Report the findings. Do not apply fixes.");
  const verify = section(skill, "Verify");
  expect(verify).toContain("rerunning its command");
  expect(verify).toContain("Drop the rest.");
  expect(manifest.capabilities.filesystem.write).not.toContain("./**");
});

test("intent is restated inline, not through an unported skill", () => {
  expect(skill).not.toContain("in-your-own-words");
  expect(section(skill, "Frame")).toContain("AskUserQuestion");
});

test("the default adversaries span two model families and a named roster wins", () => {
  const fan = section(skill, "Fan out");
  expect(fan).toContain("A roster the principal names");
  expect(fan).toContain("`opus`");
  expect(fan).toContain("codex exec --sandbox workspace-write");
  expect(fan).toContain("family");
  expect(fan).toContain("general-purpose");
  const hosts = manifest.capabilities.network.map((entry: { host: string }) => entry.host).sort();
  expect(hosts).toEqual(["api.anthropic.com", "api.openai.com"]);
});

test("uncommitted changes reach each worktree through concrete git commands", () => {
  const fan = section(skill, "Fan out");
  expect(fan).toContain("git worktree add --detach");
  expect(fan).toContain("git diff --binary HEAD");
  expect(fan).toMatch(/git -C \S+ apply /);
  expect(fan).toContain("git ls-files --others --exclude-standard");
});

test("interrogate says how it differs from Soma's code-review", () => {
  expect(skill).toMatch(/`code-review`/);
});

test("each probe round has a verified finding backed by a rerun, and a round dropped one", () => {
  const rounds = ["round-1", "round-2"];
  const dropped = rounds.map(round => {
    const output = readFileSync(join(probe, round, "interrogate-output.md"), "utf8");
    for (const heading of ["Intent", "Findings", "Dropped", "Worktrees"]) expect(output, `${round} ${heading}`).toContain(`## ${heading}\n`);
    expect(section(output, "Findings")).not.toContain("no verified findings");
    const rerun = readFileSync(join(probe, round, "rerun.txt"), "utf8");
    for (const [, block] of section(output, "Findings").matchAll(/```text\n([\s\S]*?)```/g)) {
      for (const line of block!.split("\n").filter(line => line && !line.startsWith("#") && !line.startsWith("$"))) {
        expect(rerun, `${round}: ${line}`).toContain(line);
      }
    }
    return [...section(output, "Dropped").matchAll(/: (\d+) dropped/g)].reduce((sum, match) => sum + Number(match[1]), 0);
  });
  expect(dropped.some(count => count > 0)).toBe(true);
});

test("interrogate carries no pstack-host vocabulary outside the upstream pin and source note", () => {
  const banned = /cursor|Task tool|subagent_type|generalPurpose|pstack-models\.mdc|poteto-mode|grok-|composer-|mcps\//i;
  for (const file of files(member)) {
    const text = readFileSync(file, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), file).toBe(false);
  }
});

test("the adversary hand-off follows arena Phase B: labels, a reported path, and a check before the rerun", () => {
  const fan = section(skill, "Fan out");
  expect(fan).toContain("`adversary-1` to `adversary-N` in spawn order");
  expect(fan).toContain("ends its report with its worktree path");
  expect(fan).toContain("in place of the harness-picked worktree");
  expect(fan).toContain("every seat must start from the same uncommitted tree");
  const verify = section(skill, "Verify");
  expect(verify).toContain("the path you assigned");
  expect(verify).toContain("git -C /tmp/interrogate-<slug>/adversary-<n> status --short");
});

test("the codex seat writes only inside its worktree, without network, and the probe proves it", () => {
  const fan = section(skill, "Fan out");
  const command = /```sh\n\s*(codex exec [\s\S]*?)```/.exec(fan)![1]!;
  for (const flag of [
    "--sandbox workspace-write",
    "--skip-git-repo-check",
    "-c 'sandbox_workspace_write.writable_roots=[]'",
    "-c 'sandbox_workspace_write.network_access=false'",
    "-c 'sandbox_workspace_write.exclude_slash_tmp=true'",
    "-c 'sandbox_workspace_write.exclude_tmpdir_env_var=true'",
    "-c 'approval_policy=\"never\"'",
    "-C /tmp/interrogate-<slug>/adversary-<n>",
  ]) expect(command, flag).toContain(flag);
  expect(command).not.toContain("--add-dir");
  expect(fan).toContain("sandbox: workspace-write [workdir]");
  const session = readFileSync(join(probe, "sandbox", "confined-session.txt"), "utf8");
  expect(session).toContain("sandbox: workspace-write [workdir]\n");
  expect(session).not.toContain("network access enabled");
  expect(session).toMatch(/operation not permitted: \S+\/work\/mf\/r1-probe-outside\.txt/);
  expect(session).toContain("operation not permitted: /tmp/r1-probe-control.txt");
  expect(session).toContain("Could not resolve host");
  expect(readFileSync(join(probe, "sandbox", "confined-bun-test-session.txt"), "utf8")).toContain(" 0 fail");
});

test("the parent checks the untracked files before rsync copies them", () => {
  const fan = section(skill, "Fan out");
  expect(fan).toMatch(/untracked file[^\n]*large or secret/);
  expect(fan.indexOf("git ls-files --others --exclude-standard\n")).toBeGreaterThan(-1);
  expect(fan.indexOf("git ls-files --others --exclude-standard\n")).toBeLessThan(fan.indexOf("rsync -a"));
});

const citations = [...skill.matchAll(/`(the-algorithm\/references\/principles\/[^`]+)`/g)].map(match => match[1]!);

test("interrogate anchors every principle citation to Soma's the-algorithm skill", () => {
  expect(citations).toEqual([
    "the-algorithm/references/principles/separate-before-serializing-shared-state.md",
    "the-algorithm/references/principles/verify-before-claiming.md",
  ]);
  expect(skill).not.toMatch(/`references\/principles\//);
});

// The principles live in Soma, so this runs only where a Soma home is installed, as test/arena.test.ts does.
const somaSkills = process.env.SOMA_SKILLS_DIR ?? join(homedir(), ".soma", "skills");
test.skipIf(process.env.SOMA_SKILLS_DIR === undefined && !existsSync(join(somaSkills, "the-algorithm", "references", "principles")))(
  "every principle interrogate cites exists in the installed Soma",
  () => {
    expect(citations.filter(path => !existsSync(join(somaSkills, path)))).toEqual([]);
  },
);
