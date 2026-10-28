# Rationale

A sticky-regex scanner walks the string one `<number><unit>` part at a time, so every error can name the offending text and its offset.

Alternatives considered:

- **One regex for the whole grammar.** Rejected: a single match gives no position for the error message, and optional groups for five units are harder to read than a loop.
- **`split(/\s+/)` then parse each token.** Rejected: `1h30m` has no separator.
- **`parseFloat` times the unit.** Rejected: `0.7 * 3_600_000` depends on floating-point luck. Instead the digits are read as an integer and divided by a power of ten, which is exact.
- **Rounding sub-millisecond results.** Rejected: `0.5ms` is a mistake, not a request; it throws.
- **Case-insensitive units.** Rejected: `M` reads as months to many people.
- **Accepting repeated or unordered units** (`30m1h`). Rejected: both are almost always typos.
