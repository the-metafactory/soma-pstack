# Rationale

**Chosen:** a sticky-regex scanner that reads one `number unit` segment at a time, with each unit used at most once, largest first. Each failure points at the exact remaining text, so the RangeError message names the problem.

**Rejected:**

- **One whole-string regex** (`^(\d+d)?(\d+h)?…$`). It is compact, but on a mismatch it can only say "invalid", never where.
- **Splitting on unit letters** (`split(/(ms|s|m|h|d)/)`). It accepts junk such as `1h,30m` unless more checks are added afterwards, and the `m`/`ms` ambiguity is easy to get wrong.
- **Accepting a bare number as ms** (as the `ms` npm package does). `"10"` is ambiguous between seconds and milliseconds, so it throws.
- **Case-insensitive units.** `M` reads as months, so units stay lowercase.
- **Any order or repeated units** (`30m1h`, `1h1h`). These are more likely typos than intent.
