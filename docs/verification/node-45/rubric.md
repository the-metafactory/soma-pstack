# Rubric (picker only; candidates do not see it)

R1. Correct on the documented forms: 500ms, 45s, 2m, 1h30m, 1.5h, 2d, 1d 2h.
R2. Rejects malformed input with RangeError: empty or whitespace, no unit (`10`), unknown unit (`5w`), trailing junk (`1hx`), negative (`-1h`), a repeated unit (`1h2h`), out-of-order units (`30m1h`) and non-finite results.
R3. Error messages name the offending input or part.
R4. Small surface: one export, no dependencies, readable under 60 lines.
R5. Tests cover each documented form and at least four rejection classes.
