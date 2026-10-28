━━━ 📃 SUMMARY ━━━ 7/7

**[P1] Missing anchors allow invalid upstream commits** — [scripts/patterns.ts:1](/tmp/interrogate-hex40/adversary-2/scripts/patterns.ts:1)

`HEX40` matches a substring rather than the entire value. The checker now accepts 41 hex characters, or 40 hex characters with a non-hex prefix or suffix.

Exact command, run from the worktree:

```sh
rtk proxy bun .review-repro/hex40.ts
```

Output for the 41-character case:

```text
41 hex characters: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  original: exit=1; skills/benchmark-checklist: upstream.commit must be a 40-hex commit
  current: exit=0; Pack checks passed (1 members).
```

Required current output:

```text
exit=1; skills/benchmark-checklist: upstream.commit must be a 40-hex commit
```

The repro runs both checker versions with the real Arc validator. Prefix and suffix cases produced the same regression. Restore `/^[a-f0-9]{40}$/i`.

Also ran:

- `rtk proxy bun test`: **104 pass, 1 skip, 1 fail**. The existing 41-character commit test fails because the checker returns `0`.
- `rtk proxy bun scripts/check-pack.ts`: `Pack checks passed (22 members).`

Repro retained at [.review-repro/hex40.ts](/tmp/interrogate-hex40/adversary-2/.review-repro/hex40.ts). Reviewed files unchanged.