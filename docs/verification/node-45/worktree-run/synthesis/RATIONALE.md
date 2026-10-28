# Rationale

`parseRange` splits on commas, trims each token, and matches it against one anchored regex (`N`, `N-M`, `N-`). Pages collect in a `Set`, then sort numerically.

## Decisions and rejected alternatives

- **Pages above `max` are dropped, not rejected.** The spec says the result holds pages "no greater than `max`", so `3-100` with `max = 5` gives `3,4,5`. Throwing on an out-of-range page was rejected: it would make `8-` and `1-100` behave differently for no reason a caller would want.
- **The loop runs to `min(end, max)`.** Enumerating the full range and filtering afterwards was rejected, because `1-9000000000000` would exhaust memory.
- **A reversed range (`5-2`) throws.** Swapping the ends silently was rejected, because a reversed range is more likely a typo than an intent.
- **Page 0 and leading-dash tokens (`-3`) throw.** Pages are 1-based. Reading `-3` as "1 to 3" was rejected as an unrequested extension.
- **Empty tokens throw**, including an empty input and `1,,2`. Returning `[]` for empty input was considered and rejected: an empty spec is more often a missing value than a request for no pages, and a caller can check for it first.
- **Whitespace is allowed only around tokens**, not inside them (`1 - 3` throws). The spec says "around tokens". Allowing it inside as well was rejected to keep one rule.
- **A regex per token** was chosen over a hand-written character scanner. The grammar has three shapes, and the regex states them in one line. A parser library was rejected as a dependency for a three-shape grammar.
- **`max` is validated** as a non-negative safe integer. Numbers too large to be safe integers throw rather than lose precision.
- **The error message names the trimmed token in quotes** plus a reason, for example `invalid range token "5-2": range end is before its start`.
