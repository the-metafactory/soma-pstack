import { expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const skills = resolve(import.meta.dir, "../skills");
const member = join(skills, "recall");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const sweep = skill.slice(skill.indexOf("4. **Sweep the shared record**"), skill.indexOf("5. **Verify against live state.**"));

test("recall's shared-record sweep covers git, the graph, chat, docs and error tracking", () => {
  for (const source of ["gh issue list", "git log", "soma graph frontier", "chat.md", "long-form-docs.md", "observability.md"]) {
    expect(sweep, source).toContain(source);
  }
});

test("recall points at the why playbooks that exist and does not copy them", () => {
  for (const playbook of ["chat.md", "long-form-docs.md", "observability.md"]) {
    expect(existsSync(join(skills, "why/references/sources", playbook)), playbook).toBe(true);
  }
  expect(existsSync(join(member, "references"))).toBe(false);
  for (const command of ["discord read", "discord threads", "confluence search", "confluence get"]) {
    expect(skill, command).not.toContain(command);
  }
});

test("recall reports each source swept and each not reached, with the reason", () => {
  const sources = skill.slice(skill.indexOf("- **Sources.**"));
  expect(sources).toContain("one line per source");
  for (const source of ["own record", "git and `gh`", "work graph", "chat", "long-form docs", "error tracking"]) {
    expect(sources, source).toContain(source);
  }
  expect(sources).toContain("`swept`");
  expect(sources).toContain("`not reached`");
  expect(sources).toContain("no source in this pack");
});

test("recall says what happens when the why skill is not installed", () => {
  expect(sweep).toContain("If the `why` skill is not installed");
});

test("recall's manifest declares the hosts the chat and docs sweeps reach", () => {
  const hosts = manifest.capabilities.network.map((entry: { host: string }) => entry.host);
  expect(hosts).toContain("discord.com");
  expect(hosts).toContain("confluence.switch.ch");
});

test("recall still pins the upstream commit and ends with its source note", () => {
  expect(manifest.upstream.commit).toBe("c742dd61706fbacc1b95f1a20b7b988cf096ce6c");
  expect(skill.trimEnd().split("\n").pop()).toStartWith("Source: ported from pstack");
});
