const UNIT_MS = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1_000, ms: 1 } as const;
type Unit = keyof typeof UNIT_MS;
const ORDER: readonly Unit[] = ["d", "h", "m", "s", "ms"];

// One segment: a non-negative decimal number, optional spaces, a unit.
// "ms" is listed before "m" so the alternation prefers the longer unit.
const SEGMENT = /(\d+(?:\.\d+)?|\.\d+)\s*(ms|s|m|h|d)(?![a-z])/y;

export function parseDuration(input: string): number {
  if (typeof input !== "string") {
    throw new RangeError(`parseDuration: expected a string, got ${typeof input}`);
  }
  const text = input.trim();
  if (text === "") throw new RangeError("parseDuration: input is empty");

  let pos = 0;
  let total = 0;
  let lastRank = -1;
  while (pos < text.length) {
    while (text[pos] === " " || text[pos] === "\t") pos++;
    SEGMENT.lastIndex = pos;
    const match = SEGMENT.exec(text);
    if (!match) {
      throw new RangeError(
        `parseDuration: unexpected "${text.slice(pos)}" at position ${pos} in "${input}"; ` +
          `expected a number followed by one of ms, s, m, h, d`,
      );
    }
    const unit = match[2] as Unit;
    const rank = ORDER.indexOf(unit);
    if (rank <= lastRank) {
      throw new RangeError(
        `parseDuration: unit "${unit}" in "${input}" is repeated or out of order; ` +
          `use each unit once, largest first (d h m s ms)`,
      );
    }
    lastRank = rank;
    total += Number(match[1]) * UNIT_MS[unit];
    pos = SEGMENT.lastIndex;
  }
  if (!Number.isFinite(total)) {
    throw new RangeError(`parseDuration: "${input}" is too large to represent`);
  }
  return total;
}
