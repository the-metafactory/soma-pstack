import { afterEach, expect, test } from "bun:test";
import { YAML } from "bun";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
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

const tools = ["ffmpeg", "ffprobe", "rsvg-convert"].every(tool => Bun.which(tool));

test.skipIf(!tools)("check fails a slide whose measured hold is too short for its words", () => {
  const dir = mkdtempSync(join(tmpdir(), "ketchup-video-test-"));
  roots.push(dir);
  const slide = (fill: string, label: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="920"><rect width="1920" height="920" fill="${fill}"/><text x="200" y="460" font-size="96" font-family="Helvetica">${label}</text></svg>`;
  writeFileSync(join(dir, "a.svg"), slide("#dbeafe", "Two PRs wait"));
  writeFileSync(join(dir, "b.svg"), slide("#fde68a", "One of them merged today after review"));
  writeFileSync(join(dir, "c.svg"), slide("#bbf7d0", "Nothing else"));
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
  expect(report.slides[1].measured).toBeGreaterThan(0.8);
  expect(report.slides[1].measured).toBeLessThan(1.2);
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
