const UNIT_MS: Readonly<Record<string, number>> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

const UNIT_LIST = Object.keys(UNIT_MS).join(", ");

const SEGMENT = /(\d+)(?:\.(\d+))?\s*([a-zA-Z]*)\s*/y;

export function parseDuration(input: string): number {
  if (typeof input !== "string") {
    throw new RangeError(`duration must be a string, got ${typeof input}`);
  }
  const text = input.trim();
  if (text === "") {
    throw new RangeError("duration is empty");
  }

  let total = 0;
  let pos = 0;
  while (pos < text.length) {
    SEGMENT.lastIndex = pos;
    const match = SEGMENT.exec(text);
    if (match === null) {
      const rest = text.slice(pos);
      if (/^[a-zA-Z]/.test(rest)) {
        throw new RangeError(`missing number before "${rest}" in "${input}"`);
      }
      if (rest.startsWith(".")) {
        throw new RangeError(`number must start with a digit at "${rest}" in "${input}"`);
      }
      throw new RangeError(`unexpected character "${rest[0]}" in "${input}"`);
    }

    const [, whole, fraction = "", unit] = match;
    const number = whole + (fraction ? `.${fraction}` : "");
    if (unit === "") {
      const rest = text.slice(pos + number.length).trimStart();
      if (rest === "" || /^\d/.test(rest)) {
        throw new RangeError(`missing unit after "${number}" in "${input}"; expected one of ${UNIT_LIST}`);
      }
      throw new RangeError(`unexpected character "${rest[0]}" after "${number}" in "${input}"`);
    }
    const factor = UNIT_MS[unit.toLowerCase()];
    if (factor === undefined) {
      throw new RangeError(`unknown unit "${unit}" in "${input}"; expected one of ${UNIT_LIST}`);
    }

    total += (Number(whole + fraction) * factor) / 10 ** fraction.length;
    pos = SEGMENT.lastIndex;
  }

  if (!Number.isFinite(total)) {
    throw new RangeError(`duration "${input}" is too large`);
  }
  return total;
}

export default parseDuration;
