import { YAML } from "bun";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const worktree = resolve(import.meta.dir, "..");
const fixture = resolve(import.meta.dir, "fixture");
const original = resolve(import.meta.dir, "original.ts");
const source = Bun.spawnSync(["git", "show", "48eb39e:scripts/check-pack.ts"], { cwd: worktree });
if (source.exitCode !== 0) throw new Error(source.stderr.toString());
writeFileSync(original, source.stdout);
rmSync(fixture, { recursive: true, force: true });
mkdirSync(resolve(fixture, "skills"), { recursive: true });
cpSync(resolve(worktree, "skills/benchmark-checklist"), resolve(fixture, "skills/benchmark-checklist"), { recursive: true });
writeFileSync(resolve(fixture, "arc-manifest.yaml"), YAML.stringify({ schema: "arc/v1", name: "soma-pstack", type: "library", license: "MIT", artifacts: [{ path: "skills/benchmark-checklist" }] }));
const manifestPath = resolve(fixture, "skills/benchmark-checklist/arc-manifest.yaml");
const manifest = YAML.parse(readFileSync(manifestPath, "utf8"));
for (const [label, commit] of [
  ["valid", "a".repeat(40)],
  ["41 hex characters", "a".repeat(41)],
  ["non-hex prefix", "g" + "a".repeat(40)],
  ["non-hex suffix", "a".repeat(40) + "g"],
  ["39 hex characters", "a".repeat(39)],
]) {
  manifest.upstream.commit = commit;
  writeFileSync(manifestPath, YAML.stringify(manifest));
  console.log(`${label}: ${JSON.stringify(commit)}`);
  for (const [version, script] of [["original", original], ["current", resolve(worktree, "scripts/check-pack.ts")]]) {
    const result = Bun.spawnSync([process.execPath, script], { cwd: fixture, stdout: "pipe", stderr: "pipe" });
    console.log(`  ${version}: exit=${result.exitCode}; ${Buffer.concat([result.stdout, result.stderr]).toString().trim()}`);
  }
}
rmSync(fixture, { recursive: true, force: true });
rmSync(original);
