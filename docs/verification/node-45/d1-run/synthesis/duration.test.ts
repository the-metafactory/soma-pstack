import { describe, expect, test } from "bun:test";
import { parseDuration } from "./duration";

describe("parseDuration: valid input", () => {
  const cases: [string, number][] = [
    ["500ms", 500],
    ["45s", 45_000],
    ["2m", 120_000],
    ["1h30m", 5_400_000],
    ["1.5h", 5_400_000],
    ["2d", 172_800_000],
    ["1d 2h", 93_600_000],
    ["0s", 0],
    ["  10s  ", 10_000],
    ["5 m", 300_000],
    ["1d2h3m4s5ms", 93_784_005],
    ["1.5s", 1_500],
    ["0.25m", 15_000],
    ["1.001s", 1_001],
    ["0.7h", 2_520_000],
    ["4.35m", 261_000],
    ["1.0000000000000000s", 1_000],
  ];
  for (const [input, expected] of cases) {
    test(JSON.stringify(input), () => expect(parseDuration(input)).toBe(expected));
  }
});

describe("parseDuration: invalid input throws RangeError", () => {
  const cases: [string, RegExp][] = [
    ["", /empty/],
    ["   ", /empty/],
    ["10", /expected <number><unit>/],
    ["h", /expected <number><unit>/],
    ["10x", /expected <number><unit>/],
    ["10sec", /expected <number><unit>/],
    ["-5s", /expected <number><unit>/],
    ["1.s", /expected <number><unit>/],
    [".5s", /expected <number><unit>/],
    ["1H", /expected <number><unit>/],
    ["1h 30", /position 3/],
    ["30m1h", /out of order/],
    ["1h1h", /repeated/],
    ["1.5ms", /whole number/],
    ["1e3s", /expected <number><unit>/],
    ["999999999999999d", /largest safe/],
    ["9".repeat(400) + "ms", /largest safe/],
  ];
  for (const [input, message] of cases) {
    test(JSON.stringify(input), () => {
      expect(() => parseDuration(input)).toThrow(RangeError);
      expect(() => parseDuration(input)).toThrow(message);
    });
  }

  test("non-string input", () => {
    expect(() => parseDuration(42 as unknown as string)).toThrow(RangeError);
  });
});
