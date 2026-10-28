# Task: parseDuration

Write a TypeScript module for Bun that exports one function:

    parseDuration(input: string): number

It returns the duration in milliseconds for human-written durations such as
`500ms`, `45s`, `2m`, `1h30m`, `1.5h`, `2d`, `1d 2h`. Units: ms, s, m, h, d.
Invalid input throws a `RangeError` whose message says what was wrong.

Produce, in your output directory:
- `duration.ts`: the module, no dependencies.
- `duration.test.ts`: tests with `bun:test`; they must pass with `bun test`.
- `RATIONALE.md`: under 150 words. Name the alternatives you considered and what you rejected, and why.
