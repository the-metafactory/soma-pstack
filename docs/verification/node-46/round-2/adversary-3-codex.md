━━━ 📃 SUMMARY ━━━ 7/7

**[P1] Nonadjacent duplicate artifact paths pass validation**

At [scripts/check-pack.ts:118](/tmp/interrogate-dup-artifacts/adversary-3/scripts/check-pack.ts:118), each path is compared only with the previous path. A duplicate separated by other valid members escapes detection.

The saved [repro script](/tmp/interrogate-dup-artifacts/adversary-3/repro-duplicates.mjs) appends `skills/benchmark-checklist` to the existing root manifest, runs the real checker, and restores the manifest.

Exact command, run from the worktree:

```sh
rtk proxy bun repro-duplicates.mjs separated
```

Actual output:

```text
Pack checks passed (23 members).
exit code: 0
```

Required output and status:

```text
skills/benchmark-checklist: listed more than once in artifacts
exit code: 1
```

The adjacent-duplicate control correctly reports the path and exits 1.

Baseline verification: `bun test` reported 105 passed, 1 skipped, 0 failed. `bun scripts/check-pack.ts` passed with 22 members. Tracked files remain unchanged.