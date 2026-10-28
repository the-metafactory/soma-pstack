import { describe, expect, test } from "bun:test";
import { parseDuration } from "./duration";

describe("parseDuration", () => {
  test.each([
    ["500ms", 500],
    ["45s", 45_000],
    ["2m", 120_000],
    ["1h30m", 5_400_000],
    ["1.5h", 5_400_000],
    ["2d", 172_800_000],
    ["1d 2h", 93_600_000],
    ["1d2h3m4s5ms", 93_784_005],
    ["  1 h\t30 m\n", 5_400_000],
    [".5s", 500],
    ["0.5ms", 0.5],
    ["0ms", 0],
    ["0002m", 120_000],
    ["1m2m", 180_000],
    ["30m1h", 5_400_000],
  ])("%s returns %d milliseconds", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  test.each([
    "", " \t\n", "1", "ms", "-1s", "+1s", "1.s", "1..5h",
    "1e3s", "NaNs", "Infinitys", "1w", "1MS", "1second", "1mss",
    "1h,30m", "1h+30m", "1h-30m", "1s garbage", "garbage 1s",
    "1s2", "1s!", "1_000ms", "1/2h", "0x10s",
  ])("rejects malformed input %j with an explanation", (input) => {
    expect(() => parseDuration(input)).toThrow(RangeError);
    try {
      parseDuration(input);
    } catch (error) {
      expect((error as Error).message.length).toBeGreaterThan(15);
    }
  });

  test("identifies unsupported units and the location of malformed terms", () => {
    expect(() => parseDuration("2weeks")).toThrow('Unknown duration unit "weeks"');
    expect(() => parseDuration("1h ?")).toThrow("position 3");
  });

  test("rejects numeric, multiplication, and accumulation overflow", () => {
    expect(() => parseDuration(`${"9".repeat(400)}ms`)).toThrow("finite numeric range");
    expect(() => parseDuration(`${"9".repeat(305)}d`)).toThrow("finite numeric range");
    const largeTerm = `${"9".repeat(308)}ms`;
    expect(Number.isFinite(parseDuration(largeTerm))).toBe(true);
    expect(() => parseDuration(`${largeTerm} ${largeTerm}`)).toThrow("finite numeric range");
  });
});
