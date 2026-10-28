const milliseconds = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

/** Parses additive, non-negative decimal durations. Whitespace is optional. */
export function parseDuration(input: string): number {
  if (typeof input !== "string") {
    throw new RangeError("Duration must be a string");
  }
  if (input.trim() === "") {
    throw new RangeError("Duration must contain a number and unit");
  }

  const term = /(\d+(?:\.\d+)?|\.\d+)\s*([a-zA-Z]+)/y;
  let position = 0;
  let total = 0;

  while (position < input.length) {
    while (position < input.length && /\s/.test(input[position]!)) position++;
    if (position === input.length) break;

    term.lastIndex = position;
    const match = term.exec(input);
    if (!match) {
      throw new RangeError(
        `Expected a non-negative decimal followed by a unit at position ${position}; found ${JSON.stringify(input.slice(position))}`,
      );
    }

    const unit = match[2]!;
    if (!Object.hasOwn(milliseconds, unit)) {
      throw new RangeError(
        `Unknown duration unit ${JSON.stringify(unit)} at position ${position}; expected ms, s, m, h, or d`,
      );
    }

    total += Number(match[1]) * milliseconds[unit as keyof typeof milliseconds];
    if (!Number.isFinite(total)) {
      throw new RangeError("Duration exceeds the finite numeric range in milliseconds");
    }
    position = term.lastIndex;
  }

  return total;
}
