// Probe harness for node #47: does each member's upstream.path resolve at its
// pinned commit, and does its form say whether it names a file or a directory?
// Usage: bun harness.ts <pack-root> > result.json
import { YAML } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2]!;
const library = YAML.parse(readFileSync(join(root, "arc-manifest.yaml"), "utf8")) as { artifacts: { path: string }[] };
const failures: { member: string; path: string; reason: string }[] = [];
const pins: Record<string, { repo: string; path: string; commit: string; kind: string }> = {};

for (const { path: member } of library.artifacts) {
  const { upstream } = YAML.parse(readFileSync(join(root, member, "arc-manifest.yaml"), "utf8"));
  const lookup = Bun.spawnSync(["gh", "api", `repos/${upstream.repo}/contents/${upstream.path.replace(/\/$/, "")}?ref=${upstream.commit}`]);
  let kind = "missing";
  if (lookup.exitCode === 0) kind = Array.isArray(JSON.parse(lookup.stdout.toString())) ? "dir" : "file";
  pins[member] = { ...upstream, kind };
  if (kind === "missing") failures.push({ member, path: upstream.path, reason: "does not resolve at the pinned commit" });
  else if (kind === "dir" && !upstream.path.endsWith("/")) failures.push({ member, path: upstream.path, reason: "directory without a trailing slash" });
  else if (kind === "file" && upstream.path.endsWith("/")) failures.push({ member, path: upstream.path, reason: "file with a trailing slash" });
}

console.log(JSON.stringify({ checked: library.artifacts.length, failures, pins }, null, 2));
