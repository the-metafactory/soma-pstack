const UNIT_MS: Record<string, number> = {
  d: 86_400_000,
  h: 3_600_000,
  m: 60_000,
  s: 1_000,
  ms: 1,
};

const UNIT_ORDER = ["d", "h", "m", "s", "ms"];

const PART = /(\d+)(?:\.(\d+))?\s*(ms|s|m|h|d)(?![a-z])/y;

export function parseDuration(input: string): number {
  if (typeof input !== "string") {
    throw new RangeError(`duration must be a string, got ${typeof input}`);
  }
  const text = input.trim();
  if (text === "") {
    throw new RangeError("duration is empty");
  }

  let total = 0;
  let position = 0;
  let lastUnitIndex = -1;

  while (position < text.length) {
    PART.lastIndex = position;
    const match = PART.exec(text);
    if (match === null) {
      throw new RangeError(
        `unexpected "${text.slice(position)}" at offset ${position} in "${input}"; expected <number><unit> with unit one of ms, s, m, h, d`,
      );
    }
    const [whole, intDigits, fracDigits = "", unit] = match;
    const unitIndex = UNIT_ORDER.indexOf(unit);
    if (unitIndex === lastUnitIndex) {
      throw new RangeError(`unit "${unit}" given twice in "${input}"`);
    }
    if (unitIndex < lastUnitIndex) {
      throw new RangeError(
        `units out of order in "${input}": "${unit}" must come before "${UNIT_ORDER[lastUnitIndex]}"`,
      );
    }
    lastUnitIndex = unitIndex;

    const scale = 10 ** fracDigits.length;
    const scaled = Number(intDigits + fracDigits) * UNIT_MS[unit];
    if (!Number.isSafeInteger(scaled)) {
      throw new RangeError(`"${whole.trim()}" is too large to represent in milliseconds`);
    }
    if (scaled % scale !== 0) {
      throw new RangeError(
        `"${whole.trim()}" is not a whole number of milliseconds`,
      );
    }
    total += scaled / scale;

    position += whole.length;
    while (position < text.length && /\s/.test(text[position])) position += 1;
  }

  if (!Number.isSafeInteger(total)) {
    throw new RangeError(`duration "${input}" is too large to represent in milliseconds`);
  }
  return total;
}
