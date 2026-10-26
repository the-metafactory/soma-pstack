import { readFileSync } from "node:fs";

/** Data rows only; preserve empty cells, including the last cell. */
export function rows(path: string): string[][] {
  return readFileSync(path, "utf8").replace(/\n$/, "").split("\n").slice(1).map(line => line.split("\t"));
}

export function keepsPrefix(path: string, before: Buffer): boolean {
  return readFileSync(path).subarray(0, before.length).equals(before);
}
