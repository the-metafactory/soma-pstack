// Phase F: rubric cases the candidates never saw, run against both candidates and the synthesis.
import { expect, test } from "bun:test";
import { parseDuration as c1 } from "./candidate-1/duration.ts";
import { parseDuration as c2 } from "./candidate-2/duration.ts";
import { parseDuration as synthesis } from "./synthesis/duration.ts";

const valid: [string, number][] = [
  ["500ms", 500], ["45s", 45_000], ["2m", 120_000], ["1h30m", 5_400_000],
  ["1.5h", 5_400_000], ["2d", 172_800_000], ["1d 2h", 93_600_000], ["4.35m", 261_000], ["1." + "0".repeat(400) + "1s", 1_000],
];
const invalid = ["", "   ", "10", "5w", "1hx", "-1h", "1h2h", "30m1h", "1".repeat(400) + "d"];

for (const [name, parse] of [["candidate-1", c1], ["candidate-2", c2], ["synthesis", synthesis]] as const) {
  for (const [input, ms] of valid) test(`${name} R1 ${input}`, () => expect(parse(input)).toBe(ms));
  for (const input of invalid) {
    test(`${name} R2/R3 ${JSON.stringify(input.slice(0, 12))}`, () => {
      expect(() => parse(input)).toThrow(RangeError);
      if (input.trim()) expect(() => parse(input)).toThrow(input.trim().slice(0, 12));
    });
  }
}
