#!/usr/bin/env bun
// Renders a ketchup-video deck to a silent landscape mp4 and checks the result.
// Each slide is an SVG (or a PNG/JPEG screenshot) drawn at 1920x920; the
// script adds a 160 px subtitle strip below it, so every frame is the slide
// above its subtitle, and crossfades between slides with ffmpeg's xfade.
//
// Usage: bun ketchup-video.ts render <deck.json> [out-dir]
//        bun ketchup-video.ts check <deck.json> <out-dir>
//   out-dir defaults to $TMPDIR/ketchup-video-<timestamp> and must not sit
//   inside a git work tree. The deck is
//   { "slides": [{ "src": "01.svg", "subtitle": "...", "hold": 4 }] },
//   with src relative to the deck file. hold (seconds) is optional; without it
//   the slide holds one second per three words it adds, plus half a second.
//   check measures each hold by matching the video's frames to the slide's
//   own frame, writes chat-size stills and check.json to out-dir, and exits 1
//   when a slide is held too short for the words it adds.
//   Needs ffmpeg and ffprobe, and rsvg-convert or ImageMagick's magick.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const WIDTH = 1920;
const HEIGHT = 1080;
const STRIP = 160;
const SUBTITLE_PX = 52;
const FPS = 30;
const FADE = 0.5;
const CHAT_WIDTH = 640;
const ANALYSIS = { width: 480, height: 270 };

type Slide = { src: string; subtitle: string; hold?: number };
type Deck = { slides: Slide[] };
type Row = { slide: number; words: number; required: number; measured: number; pass: boolean; still: string };

function fail(message: string): never {
  console.error(`ketchup-video: ${message}`);
  process.exit(2);
}

function run(cmd: string[], stdin?: Uint8Array): Buffer {
  const result = Bun.spawnSync(cmd, { stdin: stdin ?? "ignore", stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) fail(`${cmd[0]} failed: ${result.stderr.toString().trim().split("\n").at(-1)}`);
  return result.stdout;
}

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
}

// Words a slide adds: its whole subtitle, plus each word on the slide that the
// slide before it did not show (a changed label counts as new words).
export function wordsAdded(slideText: string, previousText: string, subtitle: string): number {
  const before = new Map<string, number>();
  for (const word of tokens(previousText)) before.set(word, (before.get(word) ?? 0) + 1);
  let added = 0;
  for (const word of tokens(slideText)) {
    const left = before.get(word) ?? 0;
    if (left > 0) before.set(word, left - 1);
    else added++;
  }
  return added + tokens(subtitle).length;
}

// Text drawn by the slide itself; words inside an embedded screenshot are pixels
// and do not count.
function slideText(path: string): string {
  if (!path.endsWith(".svg")) return "";
  const svg = readFileSync(path, "utf8");
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => match[1]!.replace(/<[^>]+>/g, " ")).join(" ");
}

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function rasterize(svg: string, png: string, width: number, height: number) {
  if (Bun.which("rsvg-convert")) run(["rsvg-convert", "-w", String(width), "-h", String(height), "-o", png, svg]);
  else if (Bun.which("magick")) run(["magick", "-background", "white", "-density", "144", svg, "-resize", `${width}x${height}!`, png]);
  else fail("needs rsvg-convert or ImageMagick's magick to draw SVG slides");
}

function loadDeck(path: string): { deck: Deck; base: string } {
  const deck = JSON.parse(readFileSync(path, "utf8")) as Deck;
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) fail("the deck has no slides");
  if (deck.slides.length > 10) fail("a deck has at most 10 slides");
  return { deck, base: dirname(resolve(path)) };
}

function plan(deck: Deck, base: string): { words: number[]; holds: number[] } {
  const texts = deck.slides.map(slide => slideText(resolve(base, slide.src)));
  const words = deck.slides.map((slide, i) => wordsAdded(texts[i]!, i === 0 ? "" : texts[i - 1]!, slide.subtitle));
  const holds = deck.slides.map((slide, i) => slide.hold ?? Math.max(2, words[i]! / 3 + 0.5));
  return { words, holds };
}

function insideGitWorkTree(path: string): boolean {
  for (let dir = path; ; dir = dirname(dir)) {
    if (existsSync(join(dir, ".git"))) return true;
    if (dirname(dir) === dir) return false;
  }
}

function frameName(i: number): string {
  return `frame-${String(i + 1).padStart(2, "0")}.png`;
}

function render(deckPath: string, outArg?: string) {
  const { deck, base } = loadDeck(deckPath);
  const out = resolve(outArg ?? join(tmpdir(), `ketchup-video-${new Date().toISOString().replace(/[:.]/g, "-")}`));
  if (insideGitWorkTree(out)) fail(`${out} is inside a git work tree; write the video outside the repository`);
  mkdirSync(out, { recursive: true });
  const { holds } = plan(deck, base);

  deck.slides.forEach((slide, i) => {
    const src = resolve(base, slide.src);
    let png = src;
    if (src.endsWith(".svg")) {
      png = join(out, `slide-${String(i + 1).padStart(2, "0")}.png`);
      rasterize(src, png, WIDTH, HEIGHT - STRIP);
    }
    const data = readFileSync(png).toString("base64");
    const mime = /\.jpe?g$/.test(png) ? "image/jpeg" : "image/png";
    const frame = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WIDTH}" height="${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
<image x="0" y="0" width="${WIDTH}" height="${HEIGHT - STRIP}" preserveAspectRatio="xMidYMid meet" xlink:href="data:${mime};base64,${data}"/>
<rect x="0" y="${HEIGHT - STRIP}" width="${WIDTH}" height="${STRIP}" fill="#111827"/>
<text x="${WIDTH / 2}" y="${HEIGHT - STRIP / 2}" dominant-baseline="central" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${SUBTITLE_PX}" fill="#f9fafb">${escape(slide.subtitle)}</text>
</svg>`;
    const framePath = join(out, frameName(i).replace(".png", ".svg"));
    writeFileSync(framePath, frame);
    rasterize(framePath, join(out, frameName(i)), WIDTH, HEIGHT);
  });

  const last = deck.slides.length - 1;
  const durations = holds.map((hold, i) => hold + FADE * ((i > 0 ? 1 : 0) + (i < last ? 1 : 0)));
  const inputs = durations.flatMap((duration, i) => ["-loop", "1", "-framerate", String(FPS), "-t", duration.toFixed(3), "-i", join(out, frameName(i))]);
  const filters: string[] = [];
  let label = "[0:v]";
  let offset = 0;
  for (let i = 1; i <= last; i++) {
    offset += durations[i - 1]! - FADE;
    filters.push(`${label}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}[x${i}]`);
    label = `[x${i}]`;
  }
  const video = join(out, "ketchup.mp4");
  const graph = filters.length ? ["-filter_complex", `${filters.join(";")};${label}format=yuv420p[v]`, "-map", "[v]"] : ["-vf", "format=yuv420p"];
  run(["ffmpeg", "-y", "-loglevel", "error", ...inputs, ...graph, "-r", String(FPS), "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", video]);
  writeFileSync(join(out, "plan.json"), JSON.stringify({ holds, fade: FADE, fps: FPS }, null, 2) + "\n");
  console.log(video);
}

function gray(path: string): Uint8Array {
  return run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", `scale=${ANALYSIS.width}:${ANALYSIS.height},format=gray`, "-f", "rawvideo", "-"]);
}

// A frame belongs to slide i's hold when, over the pixels where slide i differs
// from its neighbours, it sits within a few percent of slide i. A fade frame at
// alpha a sits a*100 percent of the way to the neighbour, so even the faint
// first and last frames of a fade fall outside the hold.
function check(deckPath: string, outArg: string) {
  const { deck, base } = loadDeck(deckPath);
  const out = resolve(outArg);
  const video = join(out, "ketchup.mp4");
  if (!existsSync(video)) fail(`no ketchup.mp4 in ${out}; run render first`);
  const { words } = plan(deck, base);
  const size = ANALYSIS.width * ANALYSIS.height;
  const refs = deck.slides.map((_, i) => gray(join(out, frameName(i))));
  const raw = gray(video);
  const frames = raw.length / size;

  const masks = refs.map((ref, i) => {
    const mask: number[] = [];
    for (let p = 0; p < size; p++) {
      const prev = i > 0 ? Math.abs(ref[p]! - refs[i - 1]![p]!) : 0;
      const next = i < refs.length - 1 ? Math.abs(ref[p]! - refs[i + 1]![p]!) : 0;
      if (Math.max(prev, next) > 24) mask.push(p);
    }
    return mask;
  });
  const spreads = masks.map((mask, i) => mask.reduce((total, p) => {
    const prev = i > 0 ? Math.abs(refs[i]![p]! - refs[i - 1]![p]!) : 0;
    const next = i < refs.length - 1 ? Math.abs(refs[i]![p]! - refs[i + 1]![p]!) : 0;
    return total + Math.max(prev, next);
  }, 0));
  const distance = (frame: number, i: number) => {
    const mask = masks[i]!;
    if (mask.length === 0) return 0;
    let sum = 0;
    for (const p of mask) sum += Math.abs(raw[frame * size + p]! - refs[i]![p]!);
    return sum / spreads[i]!;
  };

  mkdirSync(join(out, "stills"), { recursive: true });
  const rows: Row[] = deck.slides.map((_, i) => {
    let best = { start: 0, length: 0 };
    let start = -1;
    for (let f = 0; f <= frames; f++) {
      const match = f < frames && distance(f, i) < 0.04;
      if (match && start < 0) start = f;
      if (!match && start >= 0) {
        if (f - start > best.length) best = { start, length: f - start };
        start = -1;
      }
    }
    const measured = best.length / FPS;
    const required = words[i]! / 3;
    const still = `stills/slide-${String(i + 1).padStart(2, "0")}-chat.png`;
    const middle = (best.start + best.length / 2) / FPS;
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", middle.toFixed(3), "-i", video, "-frames:v", "1", "-vf", `scale=${CHAT_WIDTH}:-2`, join(out, still)]);
    return { slide: i + 1, words: words[i]!, required: Number(required.toFixed(2)), measured: Number(measured.toFixed(2)), pass: measured >= required, still };
  });

  const subtitlePx = Number((SUBTITLE_PX * CHAT_WIDTH / WIDTH).toFixed(1));
  writeFileSync(join(out, "check.json"), JSON.stringify({ fps: FPS, chatWidth: CHAT_WIDTH, subtitlePxAtChatWidth: subtitlePx, slides: rows }, null, 2) + "\n");
  console.log("slide\twords\trequired_s\tmeasured_s\tpass\tstill");
  for (const row of rows) console.log(`${row.slide}\t${row.words}\t${row.required}\t${row.measured}\t${row.pass ? "yes" : "NO"}\t${row.still}`);
  console.log(`subtitle at ${CHAT_WIDTH} px wide: ${subtitlePx} px; look at each still before you give the path`);
  if (rows.some(row => !row.pass)) process.exit(1);
}

if (import.meta.main) {
  const [command, deck, out] = process.argv.slice(2);
  if (command === "render" && deck) render(deck, out);
  else if (command === "check" && deck && out) check(deck, out);
  else fail("usage: ketchup-video.ts render <deck.json> [out-dir] | check <deck.json> <out-dir>");
}
