import { afterEach, expect, test } from "bun:test";
import { YAML } from "bun";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dir, "..");
const frontmatterOf = (text: string) => YAML.parse(/^---\n([\s\S]*?)\n---/.exec(text)![1]!);
const member = "skills/benchmark-checklist/SKILL.md";
const skill = readFileSync(join(root, member), "utf8");
const metadata = frontmatterOf(skill);
const rule = metadata.nudge[0];
const homes: string[] = [];
afterEach(() => {
  for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
});

test("benchmark nudge matches its documented bare executables and points at its installed skill", () => {
  expect(new RegExp(rule.tool).test("Bash")).toBe(true);
  expect(new RegExp(rule.tool).test("Read")).toBe(false);
  expect(rule.text).toContain("{path}");
  for (const command of ["hyperfine x", "bench", "benchmark --json", "benchmarks x"]) {
    expect(new RegExp(rule.command).test(command), command).toBe(true);
  }
  for (const command of [
    "benchmark-checklist/SKILL.md", "bench.ts", "benchmarks/", "hyperfine.log", "hyperfine/README.md",
    "echo benchmark", "cat skills/benchmark-checklist/SKILL.md", '"benchmark"', "'hyperfine x'",
    "cargo bench", "go test -bench .", "bun run bench", "npm run benchmark",
  ]) expect(new RegExp(rule.command).test(command), command).toBe(false);
});

// Each entry records why a member's activation condition cannot be identified
// from a tool call alone. New members require an explicit signal assessment.
const noToolSignal: Record<string, string> = {
  recall: "Picking up prior work is conversational intent.",
  correct: "A repeated mistake requires history and judgment.",
  "create-verification-skill": "A missing verification surface requires project assessment.",
  "no-comments": "Readiness for review or redundant comments requires context; an edit alone is insufficient.",
  "bug-fix-test": "Knowing a bug was fixed requires context; a test command alone is insufficient.",
  "show-me-your-work": "Unattended or multi-phase work is task context.",
  "blast-radius": "A change's effects beyond its diff require judgment.",
  ketchup: "A catch-up request is conversational intent.",
  reflect: "Reflection requires an explicit principal request.",
  "typescript-best-practices": "TypeScript paths can appear in many tools; no cross-substrate command signal is established.",
  why: "Unknown motivation cannot be inferred from reading a file.",
  how: "An unfamiliar subsystem cannot be inferred from reading a file.",
  "technical-writing": "A writing task is intent; a shell command cannot identify it reliably.",
  sharpen: "Sharpening a brief requires an explicit request.",
  statechart: "A state-machine question is task context.",
  "create-formal-verification-skill": "The need for formal verification requires project assessment.",
  "maintain-formal-verification-skill": "Whether a change touches verified behavior requires project knowledge.",
  explain: "An explanation requires an explicit request.",
  playbooks: "The card selection depends on the task shape.",
  "worktree-audit": "An audit request differs from ordinary worktree commands.",
  "maintain-verification-skill": "A verification maintenance task requires an explicit request.",
  arena: "A candidate competition requires an explicit request.",
  interrogate: "An adversarial review requires an explicit request.",
  "figure-it-out": "Designing a playbook requires an explicit request.",
  "ketchup-video": "A video catch-up requires an explicit request.",
  "automate-me": "Capturing working style requires an explicit request.",
  architect: "Architecture work requires task context or an explicit request.",
};

test("every member has a tool-signal assessment, including members without routes", () => {
  const manifest = YAML.parse(readFileSync(join(root, "arc-manifest.yaml"), "utf8"));
  expect(manifest.artifacts.map(({ path }: { path: string }) => path).sort())
    .toEqual(["skills/benchmark-checklist", ...Object.keys(noToolSignal).map((name) => `skills/${name}`)].sort());
  for (const { path } of manifest.artifacts) {
    const text = readFileSync(join(root, path, "SKILL.md"), "utf8");
    const frontmatter = frontmatterOf(text);
    const reason = noToolSignal[frontmatter.name];
    if (reason) {
      expect(frontmatter.nudge, `${path}: ${reason}`).toBeUndefined();
    } else {
      expect(frontmatter.nudge, path).toHaveLength(1);
      expect(new RegExp(frontmatter.nudge[0].tool).test("Bash"), path).toBe(true);
      expect(new RegExp(frontmatter.nudge[0].command).test("hyperfine x"), path).toBe(true);
    }
  }
});

type Substrate = "claude-code" | "codex" | "pi-dev";

async function makeRunner(substrate: Substrate, homeDir: string): Promise<(command: string) => Promise<string>> {
  if (substrate === "pi-dev") {
    const extension = await import(pathToFileURL(join(homeDir, ".pi/agent/extensions/soma-routing.ts")).href);
    let handler: (event: unknown) => Promise<{ content: { text: string }[] } | undefined>;
    extension.default({ on(name: string, callback: typeof handler) {
      expect(name).toBe("tool_result");
      handler = callback;
    } });
    return async (command) => {
      const result = await handler({ toolName: "bash", input: { command }, content: [{ type: "text", text: "original" }] });
      if (!result) return "";
      expect(result.content[0]?.text).toBe("original");
      return result.content.slice(1).map(({ text }) => text).join("\n");
    };
  }

  const config = {
    "claude-code": {
      home: ".claude", hook: "hooks/soma/soma-claude-code-hook.mjs", action: "principle-nudge",
      file: "settings.json", toolName: "Bash", inputKey: "command",
    },
    codex: {
      home: ".codex", hook: "hooks/soma-lifecycle.mjs", action: "post-tool-use",
      file: "hooks.json", toolName: "functions.exec_command", inputKey: "cmd",
    },
  }[substrate];
  const substrateHome = join(homeDir, config.home);
  const hooks = JSON.parse(readFileSync(join(substrateHome, config.file), "utf8"));
  expect(hooks.hooks.PostToolUse.some((group: { hooks: { command: string }[] }) =>
    group.hooks.some(({ command }) => command.endsWith(` ${config.action}`)))).toBe(true);
  return async (command) => {
    const result = spawnSync(process.execPath, [join(substrateHome, config.hook), config.action], {
      input: JSON.stringify({ tool_name: config.toolName, tool_input: { [config.inputKey]: command } }),
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    return result.stdout.trim() ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : "";
  };
}

// Point SOMA_REPO at a checkout with soma#1105 and its dependencies installed.
const somaRepo = process.env.SOMA_REPO;
for (const substrate of ["claude-code", "codex", "pi-dev"] satisfies Substrate[]) {
  test.skipIf(somaRepo === undefined)(`${substrate}: installed pack nudge rejects report cases and disappears on removal`, async () => {
    const soma = resolve(somaRepo!);
    const homeDir = mkdtempSync(join(tmpdir(), "pstack-nudges-"));
    homes.push(homeDir);
    const somaHome = join(homeDir, ".soma");
    const target = join(somaHome, member);
    const somaBin = join(homeDir, "soma-test.mjs");
    writeFileSync(somaBin, `#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, [${JSON.stringify(join(soma, "src/cli.ts"))}, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);
`, { mode: 0o755 });
    const env = {
      ...process.env, HOME: homeDir, SOMA_HOME: somaHome, ARC_CONFIG_ROOT: join(homeDir, "arc"),
      ARC_SOMA_BIN: somaBin, XDG_CONFIG_HOME: join(homeDir, ".config"),
      XDG_DATA_HOME: join(homeDir, ".local/share"), XDG_STATE_HOME: join(homeDir, ".local/state"),
      XDG_CACHE_HOME: join(homeDir, ".cache"), CODEX_HOME: join(homeDir, ".codex"),
    };
    const cli = (bin: string, args: string[]) => {
      const result = spawnSync(bin, args, { env, encoding: "utf8", timeout: 60000 });
      expect(result.status, `${bin} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`).toBe(0);
      return result;
    };
    const install = () => cli(somaBin, ["install", substrate, "--apply", "--home-dir", homeDir,
      ...(substrate === "claude-code" ? ["--no-mode-classifier", "--no-policy-guard", "--no-feedback-capture"] : []),
    ]);
    // Arc clones the committed pack. The equality check prevents a stale local
    // clone from silently testing different frontmatter during development.
    cli("arc", ["install", pathToFileURL(root).href, "--yes"]);
    expect(readFileSync(target, "utf8")).toBe(skill);
    install();
    const rules = () => JSON.parse(readFileSync(join(somaHome, "runtime/tool-nudges.json"), "utf8"));
    expect(rules().filter((entry: { file: string }) => entry.file === member))
      .toEqual([{ ...rule, file: member }]);
    const run = await makeRunner(substrate, homeDir);
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
      "cargo bench", "go test -bench .", "bun run bench", "npm run benchmark",
    ]) expect(await run(command), command).toBe("");
    cli("arc", ["remove", "soma-pstack", "--yes"]);
    expect(existsSync(target)).toBe(false);
    install();
    expect(rules().some((entry: { file: string }) => entry.file === member)).toBe(false);
    expect(await run("hyperfine x")).toBe("");
  }, 60000);
}
