import { describe, expect, test } from "bun:test";
import { parseDuration } from "./duration";

describe("parseDuration: valid input", () => {
  const cases: [string, number][] = [
    ["500ms", 500],
    ["45s", 45_000],
    ["2m", 120_000],
    ["1h30m", 5_400_000],
    ["4.35m", 261_000],
    ["1.005s", 1_005],
    ["1." + "0".repeat(400) + "1s", 1_000],
    ["1.5h", 5_400_000],
    ["2d", 172_800_000],
    ["1d 2h", 93_600_000],
    ["0s", 0],
    [".5s", 500],
    ["1h 30m 15s 250ms", 5_415_250],
    ["  10 m  ", 600_000],
    ["1m500ms", 60_500],
  ];
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} -> ${expected}`, () => {
      expect(parseDuration(input)).toBe(expected);
    });
  }
});

describe("parseDuration: invalid input throws RangeError", () => {
  const cases: [string, RegExp][] = [
    ["", /empty/],
    ["   ", /empty/],
    ["10", /expected a number followed by/],
    ["h", /unexpected "h"/],
    ["5x", /unexpected "5x"/],
    ["5 mins", /unexpected/],
    ["-5s", /unexpected "-5s"/],
    ["1.s", /unexpected/],
    ["1H", /unexpected/],
    ["1h1h", /repeated or out of order/],
    ["30m1h", /repeated or out of order/],
    ["1h,30m", /unexpected ",30m"/],
    ["1e3s", /unexpected/],
    [`${"9".repeat(400)}d`, /too large/],
  ];
  for (const [input, message] of cases) {
    test(JSON.stringify(input.length > 20 ? input.slice(0, 20) + "…" : input), () => {
      expect(() => parseDuration(input)).toThrow(RangeError);
      expect(() => parseDuration(input)).toThrow(message);
    });
  }

  test("non-string input", () => {
    expect(() => parseDuration(42 as unknown as string)).toThrow(RangeError);
  });
});
