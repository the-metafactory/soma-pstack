# Rubric (picker only; candidates do not see it)

- R1 Correct on the spec cases: `"1-3,5,8-"` with max 10, overlaps, whitespace.
- R2 Rejects bad input with the token named: `"3-1"`, `"0"`, `"a"`, `""`, `"1,,2"`.
- R3 Pages above `max` are dropped or rejected consistently, and the choice is documented.
- R4 Tests check behavior, including at least one error case per error kind.
- R5 Small, readable API: one exported function, no hidden global state.
