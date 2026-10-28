// Extract principal-authored turns from one Claude Code workspace store.
// Usage: bun extract.ts <store-dir> <out-dir>
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [store, out] = process.argv.slice(2);
if (!store || !out) throw new Error("usage: bun extract.ts <store-dir> <out-dir>");
mkdirSync(out, { recursive: true });

const machine = /^\s*<(task-notification|teammate-message|system-reminder|local-command|command-stdout|user-prompt-submit-hook|bash-input|bash-stdout|bash-stderr)/;
const generated = /^This session is being continued from a previous conversation/;

type Turn = { file: string; line: number; uuid: string; timestamp: string; text: string };
const turns: Turn[] = [];

for (const file of readdirSync(store).filter(name => name.endsWith(".jsonl"))) {
  readFileSync(join(store, file), "utf8").split("\n").forEach((raw, index) => {
    if (!raw.trim()) return;
    let row: any;
    try { row = JSON.parse(raw); } catch { return; }
    if (row.type !== "user" || row.isMeta || row.isSidechain) return;
    const content = row.message?.content;
    let text = "";
    if (typeof content === "string") text = content;
    else if (Array.isArray(content) && !content.some((part: any) => part.type === "tool_result")) {
      text = content.filter((part: any) => part.type === "text").map((part: any) => part.text).join("\n");
    }
    if (!text.trim() || machine.test(text) || generated.test(text)) return;
    turns.push({ file, line: index + 1, uuid: row.uuid, timestamp: row.timestamp, text: text.slice(0, 1500) });
  });
}

turns.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
const size = Math.ceil(turns.length / 3);
const slices = [0, 1, 2].map(n => turns.slice(n * size, (n + 1) * size));
slices.forEach((slice, n) => writeFileSync(join(out, `slice-${n + 1}.jsonl`), slice.map(t => JSON.stringify(t)).join("\n") + "\n"));
console.log(JSON.stringify({
  turns: turns.length,
  files: new Set(turns.map(t => t.file)).size,
  slices: slices.map(s => ({ n: s.length, from: s[0]?.timestamp, to: s.at(-1)?.timestamp })),
}, null, 2));
