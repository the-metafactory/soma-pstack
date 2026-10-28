const TOKEN = /^(\d+)(?:\s*-\s*(\d+)?)?$/;

export function parseRange(input: string, max: number): number[] {
  if (!Number.isInteger(max) || max < 0) {
    throw new Error(`max must be a non-negative integer, got ${String(max)}`);
  }
  if (input.trim() === "") return [];

  const pages = new Set<number>();
  for (const raw of input.split(",")) {
    const token = raw.trim();
    const match = TOKEN.exec(token);
    if (!match) throw new Error(`Invalid page range token "${token}"`);

    const start = Number(match[1]);
    const open = token.includes("-");
    const end = open ? (match[2] === undefined ? max : Number(match[2])) : start;

    if (start < 1) throw new Error(`Invalid page range token "${token}": pages start at 1`);
    if (end < start) throw new Error(`Invalid page range token "${token}": end is before start`);
    if (start > max) {
      throw new Error(`Invalid page range token "${token}": page ${start} is beyond the last page (${max})`);
    }

    const last = Math.min(end, max);
    for (let p = start; p <= last; p++) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}
