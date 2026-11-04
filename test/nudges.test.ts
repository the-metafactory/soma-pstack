import { afterEach, expect, test } from "bun:test";
import { YAML } from "bun";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dir, "..");
const member = "skills/benchmark-checklist/SKILL.md";
const skill = readFileSync(join(root, member), "utf8");
const metadata = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const rule = metadata.nudge[0];
const homes: string[] = [];
afterEach(() => {
  for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
});

test("benchmark nudge matches complete executable names and points at its installed skill", () => {
  expect(new RegExp(rule.tool).test("Bash")).toBe(true);
  expect(new RegExp(rule.tool).test("Read")).toBe(false);
  expect(rule.text).toContain("{path}");
  for (const command of ["hyperfine x", "bench", "benchmark --json", "benchmarks x"]) {
    expect(new RegExp(rule.command).test(command), command).toBe(true);
  }
  for (const command of [
    "benchmark-checklist/SKILL.md", "bench.ts", "benchmarks/", "hyperfine.log", "hyperfine/README.md",
    "echo benchmark", "cat skills/benchmark-checklist/SKILL.md", '"benchmark"', "'hyperfine x'",
  ]) expect(new RegExp(rule.command).test(command), command).toBe(false);
});

test("route-only members do not invent nudges without a tool signal", () => {
  const manifest = YAML.parse(readFileSync(join(root, "arc-manifest.yaml"), "utf8"));
  for (const { path } of manifest.artifacts) {
    const text = readFileSync(join(root, path, "SKILL.md"), "utf8");
    const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(text)![1]!);
    if (frontmatter.route && frontmatter.name !== "benchmark-checklist") {
      expect(frontmatter.nudge, path).toBeUndefined();
    }
  }
});

// Point SOMA_REPO at a checkout with soma#1105 and its dependencies installed.
const somaRepo = process.env.SOMA_REPO;
for (const substrate of ["claude-code", "codex", "pi-dev"]) {
  test.skipIf(somaRepo === undefined)(`${substrate}: installed pack nudge rejects report cases and disappears on removal`, async () => {
    const soma = resolve(somaRepo!);
    const api = await import(pathToFileURL(join(soma, "src/flows/index.ts")).href);
    const install = {
      "claude-code": api.installSomaForClaudeCode,
      codex: api.installSomaForCodex,
      "pi-dev": api.installSomaForPiDev,
    }[substrate]!;
    const homeDir = mkdtempSync(join(tmpdir(), "pstack-nudges-"));
    homes.push(homeDir);
    const somaHome = join(homeDir, ".soma");
    const target = join(somaHome, member);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, skill);
    const options = {
      homeDir, runtimeSourceRoot: join(soma, "test/fixtures/stub-runtime"),
      modeClassifier: false, policyGuard: false, preCompact: false, statusLine: false, feedbackCapture: false,
    };
    await install(options);
    const rules = () => JSON.parse(readFileSync(join(somaHome, "runtime/tool-nudges.json"), "utf8"));
    expect(rules().filter((entry: { file: string }) => entry.file === member))
      .toEqual([{ ...rule, file: member }]);

    let run: (command: string) => Promise<string>;
    if (substrate === "pi-dev") {
      const extension = await import(pathToFileURL(join(homeDir, ".pi/agent/extensions/soma-routing.ts")).href);
      let handler: (event: unknown) => Promise<{ content: { text: string }[] } | undefined>;
      extension.default({ on(name: string, callback: typeof handler) {
        expect(name).toBe("tool_result");
        handler = callback;
      } });
      run = async (command) => {
        const result = await handler({ toolName: "bash", input: { command }, content: [{ type: "text", text: "original" }] });
        if (!result) return "";
        expect(result.content[0]?.text).toBe("original");
        return result.content.slice(1).map(({ text }) => text).join("\n");
      };
    } else {
      const claude = substrate === "claude-code";
      const substrateHome = join(homeDir, claude ? ".claude" : ".codex");
      const hook = join(substrateHome, claude ? "hooks/soma/soma-claude-code-hook.mjs" : "hooks/soma-lifecycle.mjs");
      const action = claude ? "principle-nudge" : "post-tool-use";
      const config = JSON.parse(readFileSync(join(substrateHome, claude ? "settings.json" : "hooks.json"), "utf8"));
      expect(config.hooks.PostToolUse.some((group: { hooks: { command: string }[] }) =>
        group.hooks.some(({ command }) => command.endsWith(` ${action}`)))).toBe(true);
      run = async (command) => {
        const result = spawnSync(process.execPath, [hook, action], {
          input: JSON.stringify({ tool_name: claude ? "Bash" : "functions.exec_command", tool_input: { [claude ? "command" : "cmd"]: command } }),
          encoding: "utf8",
        });
        expect(result.status).toBe(0);
        expect(result.stderr).toBe("");
        return result.stdout.trim() ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : "";
      };
    }
    for (const command of [
      "hyperfine 'bun a.ts'", "bench", "benchmark --json", "benchmarks x",
      "cd repo && hyperfine x", "RUNS=5 hyperfine x", "rtk proxy hyperfine x",
      "cat <<'EOF'\nbenchmark text\nEOF\nhyperfine x",
    ]) expect(await run(command), command).toContain(target);
    for (const command of [
      "ls benchmarks/", "cat skills/benchmark-checklist/SKILL.md", "git show HEAD -- skills/benchmark-checklist/SKILL.md",
      'rg "benchmark" .', 'printf "%s" "benchmark; hyperfine x"', "echo 'hyperfine x'",
      "cat <<'EOF'\nbenchmark\nhyperfine x\nEOF", "cat <<EOF\nbenchmark\nEOF",
      "cat <<-EOF\n\tbenchmark\n\tEOF", "# benchmark\nls", "bench.ts", "hyperfine/README.md",
    ]) expect(await run(command), command).toBe("");
    rmSync(dirname(target), { recursive: true });
    await install(options);
    expect(rules()).toHaveLength(3);
    expect(rules().every((entry: { file: string }) => entry.file.startsWith("skills/the-algorithm/references/principles/"))).toBe(true);
    expect(await run("hyperfine x")).toBe("");
    expect(await run("git commit -m x")).toContain("verify-before-claiming.md");
  }, 60000);
}
