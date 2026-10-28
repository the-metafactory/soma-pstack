# Rationale

**Chosen:** a single sticky-regex scanner that consumes one `number unit` segment at a time and sums them. Each failure site knows its position, so the error names the exact problem: empty input, missing number, missing unit, unknown unit, unexpected character, and quotes the original input.

**Rejected:**

- *One anchored regex for the whole string* (`^(\d+ms)?(\d+s)?...$`). Compact, but a mismatch only says "invalid", and it forces unit order.
- *Split on whitespace, parse each token.* Breaks on `1h30m`, which has no whitespace.
- *`parseFloat(n) * factor`.* `1.1s` gives `1100.0000000000002`. Instead the digits are read as an integer and divided by `10^fractionDigits` after scaling, so decimal input stays exact.
- *Rounding the result.* Would silently turn `0.5ms` into `1` or `0`; left to the caller.
- *Rejecting repeated or unordered units* (`30m 1h`). Extra rules, no clear benefit.

Units are case-insensitive; whitespace between segments is optional.
