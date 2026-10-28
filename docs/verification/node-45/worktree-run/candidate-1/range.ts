const TOKEN = /^(\d+)(?:(-)(\d*))?$/;

function fail(token: string, reason: string): never {
  throw new Error(`invalid range token "${token}": ${reason}`);
}

export function parseRange(input: string, max: number): number[] {
  if (!Number.isSafeInteger(max) || max < 0) {
    throw new Error(`invalid max ${max}: must be a non-negative integer`);
  }
  const pages = new Set<number>();
  for (const raw of input.split(",")) {
    const token = raw.trim();
    const match = TOKEN.exec(token);
    if (!match) fail(token, "expected N, N-M or N-");
    const [, startText, dash, endText] = match;
    const openEnd = dash !== undefined && endText === "";
    const start = Number(startText);
    const end = dash === undefined ? start : openEnd ? max : Number(endText);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) fail(token, "number too large");
    if (start < 1) fail(token, "pages start at 1");
    if (!openEnd && end < start) fail(token, "range end is before its start");
    for (let page = start, last = Math.min(end, max); page <= last; page++) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}
