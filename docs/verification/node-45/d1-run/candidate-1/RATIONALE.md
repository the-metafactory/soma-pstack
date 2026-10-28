# Rationale

**Chosen:** a sticky-regex scanner that reads `<number><unit>` components left to right, so an error names the position where parsing stopped.

**Rejected alternatives:**

- *One whole-string regex.* Shorter, but it can only say "invalid", not where or why.
- *Accepting bare numbers as ms.* `"10"` is ambiguous (seconds? ms?), so it throws.
- *Any unit order and repeats (`30m1h`, `1h1h`).* These are almost always typos; units must run largest first, each once.
- *Case-insensitive units.* `M` could mean months; only lowercase is accepted.
- *Rounding fractional results.* `1.5ms` throws instead of silently losing precision.
- *Negative values, exponents, `.5`.* Not human-written durations; rejected.
- *A TypeError for non-strings.* The task asks for RangeError on invalid input, so one error type covers all cases.

Results beyond `Number.MAX_SAFE_INTEGER` throw rather than return an imprecise number.
