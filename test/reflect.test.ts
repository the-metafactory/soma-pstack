import { expect, test } from "bun:test";
import { YAML } from "bun";
import { readFileSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";

const member = realpathSync(resolve(import.meta.dir, "../skills/reflect"));

test("reflect preserves upstream explicit-only invocation on Codex", () => {
  const config = YAML.parse(readFileSync(resolve(member, "agents/openai.yaml"), "utf8"));
  expect(config.policy.allow_implicit_invocation).toBe(false);
});

function localTargets(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map(match => match[1]!)
    .filter(target => !/^[a-z]+:/i.test(target));
}

test("reflect's reachable bundled references resolve within the member", () => {
  const pending = [resolve(member, "SKILL.md")];
  const visited = new Set<string>();
  while (pending.length) {
    const file = pending.pop()!;
    if (visited.has(file)) continue;
    visited.add(file);
    for (const target of localTargets(file)) {
      const resolved = realpathSync(resolve(file, "..", target));
      expect(resolved.startsWith(member + sep)).toBe(true);
      if (resolved.endsWith(".md")) pending.push(resolved);
    }
  }
  expect(visited.size).toBe(6);
});
