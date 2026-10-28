I chose a sticky regular-expression scanner with explicit unit lookup. Every
non-whitespace character must belong to a complete term, so valid prefixes
cannot hide invalid suffixes. Errors identify malformed terms, unsupported
units, or overflow.

The grammar accepts non-negative decimals (including `.5`), optional whitespace
between numbers and units, adjacent terms, and repeated or unordered units.
Units are lowercase. Signs, exponents, separators, and unitless numbers are
rejected. Zero is valid. Results use JavaScript number precision, including
fractional milliseconds; non-finite totals are rejected.

I rejected an unanchored global regex because it can skip invalid text, splitting
on whitespace because it misses `1h30m`, and a parser dependency because this
small grammar needs none. A character-by-character lexer would offer more
custom diagnostics but adds unnecessary machinery here.
