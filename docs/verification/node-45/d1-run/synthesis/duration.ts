const UNIT_MS = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1_000, ms: 1 } as const;
type Unit = keyof typeof UNIT_MS;
const UNIT_ORDER: readonly Unit[] = ["d", "h", "m", "s", "ms"];

const COMPONENT = /(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)(?![a-z])/y;
const SPACE = /\s*/y;

export function parseDuration(input: string): number {
  if (typeof input !== "string") {
    throw new RangeError(`duration must be a string, got ${typeof input}`);
  }
  const text = input.trim();
  if (text === "") throw new RangeError("duration is empty");

  let pos = 0;
  let total = 0;
  let lastRank = -1;
  while (pos < text.length) {
    COMPONENT.lastIndex = pos;
    const match = COMPONENT.exec(text);
    if (!match) {
      throw new RangeError(
        `invalid duration "${input}": expected <number><unit> at position ${pos} ("${text.slice(pos)}"); units are ms, s, m, h, d`,
      );
    }
    const [, amount, rawUnit] = match;
    const unit = rawUnit as Unit;
    const rank = UNIT_ORDER.indexOf(unit);
    if (rank <= lastRank) {
      throw new RangeError(
        `invalid duration "${input}": unit "${unit}" is repeated or out of order; write units largest first (d h m s ms), each once`,
      );
    }
    lastRank = rank;
    // Scale the digits as an integer, then divide, so "1.001s" is 1001 rather than 1000.9999999999999.
    // Past 15 digits the integer is no longer exact, so multiply directly.
    const [whole, fraction = ""] = amount.split(".");
    const digits = whole + fraction;
    total += digits.length <= 15
      ? (Number(digits) * UNIT_MS[unit]) / 10 ** fraction.length
      : Number(amount) * UNIT_MS[unit];
    pos = COMPONENT.lastIndex;
    SPACE.lastIndex = pos;
    SPACE.exec(text);
    pos = SPACE.lastIndex;
  }

  if (!Number.isSafeInteger(total)) {
    throw new RangeError(
      Number.isInteger(total) || !Number.isFinite(total)
        ? `invalid duration "${input}": exceeds the largest safe millisecond value`
        : `invalid duration "${input}": resolves to ${total}ms, which is not a whole number of milliseconds`,
    );
  }
  return total;
}
