import { describe, expect, test } from "bun:test";
import { parseRange } from "./range";

describe("parseRange", () => {
  test("parses the example from the task", () => {
    expect(parseRange("1-3,5,8-", 10)).toEqual([1, 2, 3, 5, 8, 9, 10]);
  });

  test("single page", () => {
    expect(parseRange("4", 10)).toEqual([4]);
  });

  test("closed range", () => {
    expect(parseRange("2-4", 10)).toEqual([2, 3, 4]);
  });

  test("single-page range", () => {
    expect(parseRange("3-3", 10)).toEqual([3]);
  });

  test("open end runs to max", () => {
    expect(parseRange("8-", 10)).toEqual([8, 9, 10]);
  });

  test("sorts and de-duplicates overlapping tokens", () => {
    expect(parseRange("5,1-3,2-6,5", 10)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test("allows whitespace around tokens and the hyphen", () => {
    expect(parseRange(" 1 - 2 , 4 ,  6- ", 7)).toEqual([1, 2, 4, 6, 7]);
  });

  test("clamps a range end that exceeds max", () => {
    expect(parseRange("8-20", 10)).toEqual([8, 9, 10]);
  });

  test("empty or whitespace-only input yields no pages", () => {
    expect(parseRange("", 10)).toEqual([]);
    expect(parseRange("   ", 10)).toEqual([]);
  });

  test("accepts leading zeros", () => {
    expect(parseRange("007", 10)).toEqual([7]);
  });

  describe("rejects", () => {
    test.each([
      ["abc", 10],
      ["1-2-3", 10],
      ["-3", 10],
      ["-", 10],
      ["1,,2", 10],
      ["1,", 10],
      ["1.5", 10],
      ["3-x", 10],
    ])("malformed token in %j", (input, max) => {
      expect(() => parseRange(input, max)).toThrow(/Invalid page range token/);
    });

    test("names the bad token in the message", () => {
      expect(() => parseRange("1-3,oops,5", 10)).toThrow('"oops"');
      expect(() => parseRange("1,,2", 10)).toThrow('""');
    });

    test("page zero", () => {
      expect(() => parseRange("0", 10)).toThrow('"0"');
      expect(() => parseRange("0-3", 10)).toThrow('"0-3"');
    });

    test("end before start", () => {
      expect(() => parseRange("5-3", 10)).toThrow('"5-3"');
    });

    test("single page beyond max", () => {
      expect(() => parseRange("11", 10)).toThrow('"11"');
    });

    test("range that starts beyond max", () => {
      expect(() => parseRange("12-15", 10)).toThrow('"12-15"');
      expect(() => parseRange("11-", 10)).toThrow('"11-"');
    });

    test("invalid max", () => {
      expect(() => parseRange("1", -1)).toThrow(/max/);
      expect(() => parseRange("1", 1.5)).toThrow(/max/);
      expect(() => parseRange("1", Number.NaN)).toThrow(/max/);
    });
  });
});
