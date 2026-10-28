import { afterEach, expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { wordsAdded } from "../skills/ketchup-video/scripts/ketchup-video.ts";

const member = resolve(import.meta.dir, "../skills/ketchup-video");
const probe = resolve(import.meta.dir, "../docs/verification/node-48");
const script = join(member, "scripts/ketchup-video.ts");
const skill = readFileSync(join(member, "SKILL.md"), "utf8");
const frontmatter = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(skill)![1]!);
const manifest = YAML.parse(readFileSync(join(member, "arc-manifest.yaml"), "utf8"));
const root = YAML.parse(readFileSync(resolve(import.meta.dir, "../arc-manifest.yaml"), "utf8"));
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("ketchup-video is command-only with a /ketchup-video trigger and no route", () => {
  expect(frontmatter.name).toBe("ketchup-video");
  expect(frontmatter["disable-model-invocation"]).toBe(true);
  expect(frontmatter.triggers).toContainEqual({ pattern: "/ketchup-video", type: "command", priority: 100 });
  expect(frontmatter).not.toHaveProperty("route");
  expect(manifest.policy.allow_implicit_invocation).toBe(false);
  expect(readFileSync(join(member, "agents/openai.yaml"), "utf8")).toContain("allow_implicit_invocation: false");
});

test("ketchup-video pins the upstream file and is listed in the root manifest", () => {
  expect(manifest.upstream).toEqual({
    repo: "cursor/plugins",
    path: "pstack/skills/ketchup-video/SKILL.md",
    commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
  });
  expect(root.artifacts.map((entry: { path: string }) => entry.path)).toContain("skills/ketchup-video");
});

test("the render writes only outside the repo", () => {
  expect(manifest.capabilities.filesystem.write).toEqual(["${TMPDIR}/ketchup-video-*/**"]);
  expect(manifest.capabilities.filesystem.read).toContain("${TMPDIR}/ketchup-video-*/**");
  expect(skill).toContain("pass that same directory as `out-dir` to both");
  expect(skill).toContain("the one exception to its read-only rule");
  expect(skill).toContain("never inside the repository");
});

test("ketchup-video follows ketchup and keeps its window", () => {
  expect(skill).toContain("Follow [`ketchup`](../ketchup/SKILL.md)");
  expect(skill).toContain("not before any earlier `/ketchup` or `cup`");
});

test("the reply gives the file path in place of an embedded video", () => {
  expect(skill).toContain("ketchup's opening sentence, the video's absolute path");
  expect(skill).toContain("one line naming any work left that you can do yourself, and the action items");
  expect(skill).toContain("call each option by the name the video gives it");
  expect(skill).toContain("If the render fails, say so in one line and give only the calls.");
});

test("ketchup-video keeps upstream's slide, subtitle and hold rules", () => {
  expect(skill).toContain("Use at most 10 slides");
  expect(skill).toContain("A slide is never a bullet list, a status list, a table, or boxes with nothing connecting them.");
  expect(skill).toContain("about ten words");
  expect(skill).toContain("the same height on every slide and empty except for the subtitle");
  expect(skill).toContain("never by recording a screen");
  expect(skill).toContain("at least one second for each three words");
  expect(skill).toContain("not with a still-frame detector");
  expect(skill).toContain("Look at one frame from each slide at chat size");
});

test("the helper script is executable and documented in SKILL.md", () => {
  expect(statSync(script).mode & 0o111).not.toBe(0);
  expect(readFileSync(script, "utf8").startsWith("#!/usr/bin/env bun\n")).toBe(true);
  expect(skill).toContain("scripts/ketchup-video.ts render <deck.json>");
  expect(skill).toContain("scripts/ketchup-video.ts check <deck.json>");
  expect(skill).toContain("rsvg-convert");
  expect(skill).toContain("magick");
});

test("a slide adds its subtitle and each word the slide before it lacked", () => {
  expect(wordsAdded("Two PRs wait", "", "Both wait on your review")).toBe(8);
  expect(wordsAdded("Two PRs wait merged", "Two PRs wait", "One merged since")).toBe(4);
  expect(wordsAdded("PR 40 open", "PR 40 open PR", "Still open")).toBe(2);
});

const slide = (fill: string, label: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="920"><rect width="1920" height="920" fill="${fill}"/><text x="200" y="460" font-size="96" font-family="Helvetica">${label}</text></svg>`;

function deckDir(slides: object[]): string {
  const dir = mkdtempSync(join(tmpdir(), "ketchup-video-test-"));
  roots.push(dir);
  writeFileSync(join(dir, "a.svg"), slide("#dbeafe", "Two PRs wait"));
  writeFileSync(join(dir, "deck.json"), JSON.stringify({ slides }));
  return dir;
}

function runScript(args: string[], env?: Record<string, string>) {
  const result = Bun.spawnSync([process.execPath, script, ...args], { stdout: "pipe", stderr: "pipe", env: env ?? process.env });
  return { code: result.exitCode, stderr: result.stderr.toString() };
}

test("SKILL.md documents the exit codes and the two-second floor", () => {
  expect(skill).toContain("exits 0 when every hold is long enough, 1 when a hold is too short, and 2");
  expect(skill).toContain("never shorter than two seconds");
  expect(skill).not.toContain("ffprobe");
});

test("render refuses an out-dir inside a git work tree, also through a symlink", () => {
  const dir = deckDir([{ src: "a.svg", subtitle: "Two pull requests wait" }]);
  mkdirSync(join(dir, "repo/.git"), { recursive: true });
  mkdirSync(join(dir, "repo/sub"));
  symlinkSync(join(dir, "repo/sub"), join(dir, "link"));
  for (const out of [join(dir, "repo/sub/out"), join(dir, "link/out"), join(dir, "link")]) {
    const { code, stderr } = runScript(["render", join(dir, "deck.json"), out]);
    expect(code, out).toBe(2);
    expect(stderr, out).toContain("inside a git work tree");
  }
  expect(existsSync(join(dir, "repo/sub/out"))).toBe(false);
});

test("a broken deck or a missing ffmpeg exits 2, not the short-hold 1", () => {
  const missing = deckDir([{ src: "gone.svg", subtitle: "Two pull requests wait" }]);
  const blank = deckDir([{ src: "a.svg", subtitle: " " }]);
  const good = deckDir([{ src: "a.svg", subtitle: "Two pull requests wait" }]);
  for (const [dir, text] of [[missing, "gone.svg"], [blank, "subtitle"]] as const) {
    for (const command of ["render", "check"]) {
      const { code, stderr } = runScript([command, join(dir, "deck.json"), join(dir, "out")]);
      expect(code, `${command} ${text}`).toBe(2);
      expect(stderr).toContain(text);
    }
  }
  writeFileSync(join(good, "bad.json"), "{ not json");
  expect(runScript(["render", join(good, "bad.json")]).code).toBe(2);
  const noTools = { ...process.env, PATH: join(good, "empty") } as Record<string, string>;
  for (const command of ["render", "check"]) {
    const { code, stderr } = runScript([command, join(good, "deck.json"), join(good, "out")], noTools);
    expect(code, command).toBe(2);
    expect(stderr, command).toContain("ffmpeg");
  }
});

const tools = ["ffmpeg", "rsvg-convert"].every(tool => Bun.which(tool));

test.skipIf(!tools)("render into the deck's own directory leaves the slide files alone", () => {
  const dir = deckDir([]);
  run(["rsvg-convert", "-o", join(dir, "slide-01.png"), join(dir, "a.svg")]);
  writeFileSync(join(dir, "frame-01.png"), readFileSync(join(dir, "slide-01.png")));
  writeFileSync(join(dir, "b.svg"), slide("#fde68a", "One merged"));
  writeFileSync(join(dir, "deck.json"), JSON.stringify({
    slides: [
      { src: "slide-01.png", subtitle: "Two pull requests were waiting" },
      { src: "b.svg", subtitle: "One of them merged" },
      { src: "frame-01.png", subtitle: "The same screen again" },
    ],
  }));
  const before = readFileSync(join(dir, "slide-01.png"));
  const render = runScript(["render", join(dir, "deck.json"), dir]);
  expect(render.code, render.stderr).toBe(0);
  expect(readFileSync(join(dir, "slide-01.png")).equals(before)).toBe(true);
  expect(readFileSync(join(dir, "frame-01.png")).equals(before)).toBe(true);
  expect(runScript(["check", join(dir, "deck.json"), dir]).code).toBe(0);
}, 60_000);

function run(cmd: string[]) {
  expect(Bun.spawnSync(cmd).exitCode).toBe(0);
}

test.skipIf(!tools)("check fails a slide whose measured hold is too short for its words", () => {
  const dir = mkdtempSync(join(tmpdir(), "ketchup-video-test-"));
  roots.push(dir);
  // a and b differ only in their words, b and c everywhere, so a match must hold
  // against each neighbour on its own, not averaged over both.
  writeFileSync(join(dir, "a.svg"), slide("#fde68a", "Two PRs wait"));
  writeFileSync(join(dir, "b.svg"), slide("#fde68a", "One of them merged today after review"));
  writeFileSync(join(dir, "c.svg"), slide("#1e3a8a", "Nothing else"));
  writeFileSync(join(dir, "deck.json"), JSON.stringify({
    slides: [
      { src: "a.svg", subtitle: "Two pull requests were waiting on you" },
      { src: "b.svg", subtitle: "One merged this morning after the review passed", hold: 1 },
      { src: "c.svg", subtitle: "That is all" },
    ],
  }));
  const out = join(dir, "out");
  const render = Bun.spawnSync([script, "render", join(dir, "deck.json"), out], { stderr: "pipe" });
  expect(render.exitCode, render.stderr.toString()).toBe(0);
  const check = Bun.spawnSync([script, "check", join(dir, "deck.json"), out], { stdout: "pipe", stderr: "pipe" });
  expect(check.exitCode).toBe(1);
  const report = JSON.parse(readFileSync(join(out, "check.json"), "utf8"));
  expect(report.slides.map((row: { pass: boolean }) => row.pass)).toEqual([true, false, true]);
  // The 1 s hold is 30 frames, plus xfade's progress-0 frame, which shows the
  // slide unchanged; no frame that blends in a neighbour counts.
  expect(report.slides[1].measured).toBe(1.03);
  for (const row of report.slides) expect(existsSync(join(out, row.still))).toBe(true);
}, 60_000);

test("the probe's every slide passes its frame-matched hold and has a chat-size still", () => {
  const report = JSON.parse(readFileSync(join(probe, "check.json"), "utf8"));
  expect(report.slides.length).toBeGreaterThan(1);
  expect(report.slides.length).toBeLessThanOrEqual(10);
  for (const row of report.slides) {
    expect(row.measured, row.still).toBeGreaterThanOrEqual(row.required);
    expect(existsSync(join(probe, row.still)), row.still).toBe(true);
  }
  for (const path of files(probe)) expect(path.endsWith(".mp4") && statSync(path).size > 1_000_000, path).toBe(false);
});

test("ketchup-video carries no pstack-host vocabulary outside the upstream pin and source note", () => {
  const banned = /cursor|Task\(|subagent_type|generalPurpose|pstack-models\.mdc|poteto-mode|mcps\//i;
  for (const path of files(member)) {
    const text = readFileSync(path, "utf8").replace("repo: cursor/plugins", "");
    expect(banned.test(text), path).toBe(false);
  }
});

test("ketchup-video ends with a one-line source note naming the pstack file and commit", () => {
  const last = skill.trimEnd().split("\n").at(-1)!;
  expect(last).toStartWith("Source: ported from pstack `pstack/skills/ketchup-video/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c");
});
