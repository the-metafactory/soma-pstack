import { describe, expect, test } from "bun:test";
import { parseDuration } from "./duration";

describe("single units", () => {
  test.each([
    ["500ms", 500],
    ["45s", 45_000],
    ["2m", 120_000],
    ["1h", 3_600_000],
    ["2d", 172_800_000],
    ["0s", 0],
  ])("%s -> %d", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
});

describe("compound durations", () => {
  test.each([
    ["1h30m", 5_400_000],
    ["1d 2h", 93_600_000],
    ["1d 2h 3m 4s 5ms", 93_784_005],
    ["  2h  ", 7_200_000],
    ["1 h", 3_600_000],
    ["1h\t30m", 5_400_000],
  ])("%s -> %d", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
});

describe("fractions", () => {
  test.each([
    ["1.5h", 5_400_000],
    ["0.7h", 2_520_000],
    ["0.1s", 100],
    ["2.5d", 216_000_000],
    ["1.001s", 1001],
  ])("%s -> %d", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  test("fraction below one millisecond is rejected", () => {
    expect(() => parseDuration("0.5ms")).toThrow(RangeError);
    expect(() => parseDuration("1.0005s")).toThrow(/whole number of milliseconds/);
  });
});

describe("invalid input", () => {
  test.each([
    ["", /empty/],
    ["   ", /empty/],
    ["10", /expected <number><unit>/],
    ["h", /expected <number><unit>/],
    ["1x", /expected <number><unit>/],
    ["1min", /expected <number><unit>/],
    ["1mss", /expected <number><unit>/],
    ["-5s", /expected <number><unit>/],
    ["1H", /expected <number><unit>/],
    [".5h", /expected <number><unit>/],
    ["5.h", /expected <number><unit>/],
    ["1h,30m", /expected <number><unit>/],
    ["1h30m extra", /expected <number><unit>/],
    ["1h1h", /given twice/],
    ["30m1h", /out of order/],
    ["99999999999999999d", /too large/],
  ])("%j throws RangeError", (input, message) => {
    expect(() => parseDuration(input)).toThrow(RangeError);
    expect(() => parseDuration(input)).toThrow(message);
  });

  test("the message names the offending text", () => {
    expect(() => parseDuration("1h 2x")).toThrow(/"2x" at offset 3/);
  });

  test("non-string input throws RangeError", () => {
    expect(() => parseDuration(42 as unknown as string)).toThrow(RangeError);
  });
});
