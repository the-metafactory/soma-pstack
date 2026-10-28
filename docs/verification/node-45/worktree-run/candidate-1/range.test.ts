import { describe, expect, test } from "bun:test";
import { parseRange } from "./range";

describe("parseRange", () => {
  test("parses singles, closed and open ranges", () => {
    expect(parseRange("1-3,5,8-", 10)).toEqual([1, 2, 3, 5, 8, 9, 10]);
  });

  test("sorts and de-duplicates", () => {
    expect(parseRange("5,1-3,2,3-4", 10)).toEqual([1, 2, 3, 4, 5]);
  });

  test("allows whitespace around tokens", () => {
    expect(parseRange(" 1 ,\t3- , 2 ", 4)).toEqual([1, 2, 3, 4]);
  });

  test("drops pages above max", () => {
    expect(parseRange("3-100,7,50", 5)).toEqual([3, 4, 5]);
    expect(parseRange("8-", 5)).toEqual([]);
  });

  test("clamps huge ranges without enumerating them", () => {
    expect(parseRange("1-9000000000000", 3)).toEqual([1, 2, 3]);
  });

  test("open end with max 0 yields nothing", () => {
    expect(parseRange("1-", 0)).toEqual([]);
  });

  test.each([
    ["1,x", "x"],
    ["0", "0"],
    ["0-3", "0-3"],
    ["5-2", "5-2"],
    ["-3", "-3"],
    ["1,,2", ""],
    ["", ""],
    ["1-2-3", "1-2-3"],
    ["1.5", "1.5"],
    ["1 - 3", "1 - 3"],
    ["99999999999999999999", "99999999999999999999"],
  ])("rejects %p naming the bad token", (input, token) => {
    expect(() => parseRange(input, 10)).toThrow(`"${token}"`);
  });

  test("rejects an invalid max", () => {
    expect(() => parseRange("1", -1)).toThrow("max");
    expect(() => parseRange("1", 2.5)).toThrow("max");
  });
});
