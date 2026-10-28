# parseRange rationale

## Shape

One regex per token (`n`, `a-b`, `a-`), a `Set` to de-duplicate, a numeric sort at the end. Twenty-odd lines; no parser class, no token enum.

## Decisions

- **Pages beyond `max`.** A range end past `max` is clamped (`8-20` with `max=10` gives `8..10`), the same way an open end runs to `max`. A token that asks only for pages that do not exist (`11`, `12-15`, `11-` with `max=10`) throws. Rejected: throwing on any page past `max`, because a user who types `1-999` means "everything" and should not be punished for not knowing the page count. Also rejected: silently dropping tokens that lie entirely past `max`, because the result would hide a typo.
- **Open start (`-3`).** Rejected. The task names only the open end; accepting `-3` as `1-3` would add a second notation for something `1-3` already says, and `-` alone would then need its own rule.
- **Empty tokens (`1,,2`, trailing comma).** Throw. Rejected: ignoring them, because a stray comma usually means a missing number. Whitespace-only input is the one exception and returns `[]`, so an empty form field does not need a special case at the call site.
- **Whitespace around the hyphen (`1 - 3`).** Accepted. The task allows whitespace around tokens, and a hyphen with spaces is what people type. Rejected: stripping all whitespace before parsing, since that would turn `1 2` into `12`.
- **`end < start` (`5-3`).** Throw rather than swap. A reversed range is more often a typo than an intent.
- **Page `0`.** Throw. Pages are 1-based by the spec; `0-3` would otherwise quietly become `1-3`.
- **`max` validation.** Throw on a non-integer or negative `max`. This is a programmer error, not user input, so it fails loudly instead of clamping to `0`.
- **Error messages.** Every message quotes the offending token in double quotes, so callers can show it back to the user or match on it in tests.

## Rejected implementations

- A hand-written character scanner: more code for the same grammar, no better messages.
- Returning a `Result` type instead of throwing: the task asks for an `Error`, and a thrown error with the token in the message is enough for a form validator.
- Collecting every bad token before throwing: nicer UX, but it doubles the surface and the task asks for one message naming the bad token.
