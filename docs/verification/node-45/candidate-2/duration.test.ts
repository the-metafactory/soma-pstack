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

describe("fractions", () => {
  test("1.5h is exact", () => {
    expect(parseDuration("1.5h")).toBe(5_400_000);
  });
  test("decimal scaling avoids float noise", () => {
    expect(parseDuration("1.1s")).toBe(1100);
    expect(parseDuration("0.3s")).toBe(300);
  });
  test("sub-millisecond values stay fractional", () => {
    expect(parseDuration("0.5ms")).toBe(0.5);
  });
});

describe("compound", () => {
  test.each([
    ["1h30m", 5_400_000],
    ["1d 2h", 93_600_000],
    ["1d2h3m4s5ms", 93_784_005],
    ["  2m  30s  ", 150_000],
    ["1 h", 3_600_000],
    ["30m 1h", 5_400_000],
  ])("%s -> %d", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
});

describe("case", () => {
  test("units are case-insensitive", () => {
    expect(parseDuration("2H")).toBe(7_200_000);
    expect(parseDuration("10MS")).toBe(10);
  });
});

describe("invalid input", () => {
  test.each([
    ["", /empty/],
    ["   ", /empty/],
    ["5", /missing unit after "5"/],
    ["1h 30", /missing unit after "30"/],
    ["5x", /unknown unit "x"/],
    ["5 minutes", /unknown unit "minutes"/],
    ["h", /missing number before "h"/],
    ["1h m", /missing number before "m"/],
    ["-5s", /unexpected character "-"/],
    ["1,5h", /unexpected character ","/],
    [".5h", /must start with a digit/],
    ["1.h", /unexpected character "\."/],
    ["1.5.5h", /unexpected character "\."/],
  ])("%j throws RangeError %s", (input, message) => {
    expect(() => parseDuration(input)).toThrow(RangeError);
    expect(() => parseDuration(input)).toThrow(message);
  });

  test("message quotes the original input", () => {
    expect(() => parseDuration("3 weeks")).toThrow(/in "3 weeks"/);
  });

  test("non-string input throws RangeError", () => {
    expect(() => parseDuration(5 as unknown as string)).toThrow(RangeError);
  });
});
