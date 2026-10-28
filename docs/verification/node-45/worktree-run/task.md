# Task

Write a TypeScript module `range.ts` for Bun exporting `parseRange(input: string, max: number): number[]`.

It parses a page-range spec like `"1-3,5,8-"` into a sorted, de-duplicated list of 1-based page numbers no greater than `max`. An open end (`"8-"`) runs to `max`. Whitespace around tokens is allowed. Invalid input throws an `Error` with a message naming the bad token.

Also write `range.test.ts` (bun:test) and a short `RATIONALE.md` naming the alternatives you considered and what you rejected.
