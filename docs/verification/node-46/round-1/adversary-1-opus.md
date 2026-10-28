Final report of adversary 1, an Agent-tool `general-purpose` sub-agent on `opus`, as it handed back.

I found one finding: the change breaks the intent, because the pack checker now accepts commit values that are not a 40-character hex SHA.

**F1: `HEX40` has no anchors, so any string that contains 40 hex characters passes.**

The new file has `scripts/patterns.ts:1`: `export const HEX40 = /[a-f0-9]{40}/i;`. The original regex was `/^[a-f0-9]{40}$/i`, and the `^` and `$` were dropped in the move. `HEX40` now matches any string that contains 40 hex characters anywhere, so longer strings and strings with junk before or after the hex pass. The `i` flag is the same as the original, so case handling did not change.

Repro 1: I put a bad value into `skills/why/arc-manifest.yaml`, ran the working-tree checker and the base checker (`git show 48eb39e:scripts/check-pack.ts`), then restored the manifest. Each value was written into the manifest with `sed` before running `bun scripts/check-pack.ts`.

- **41 hex characters** (`99743e9c151c8537cbbf1f98bb38f34ef3368453a`):
  - The working tree printed `Pack checks passed (22 members).` and exited 0.
  - The base checker printed `skills/why: upstream.commit must be a 40-hex commit` and exited 1.
  - The intent requires the base output: an error and exit 1.
- **Junk before and after the hex** (`x99743e9c151c8537cbbf1f98bb38f34ef3368453-not-a-sha`):
  - The working tree printed `Pack checks passed (22 members).` and exited 0.
  - The base checker printed `skills/why: upstream.commit must be a 40-hex commit` and exited 1.
  - The intent requires the error and exit 1.

Repro 2: in `/tmp/interrogate-hex40/adversary-1`, `bun test` ends with `1 fail`. The failing test is:
```
(fail) invalid upstream.commit (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) names the member and field
error: expect(received).not.toBe(expected)
```
That test feeds 41 `a` characters, and the checker now accepts them. With the `scripts/check-pack.ts` change stashed, `bun test` reports `0 fail`. The intent requires `0 fail`, so the existing suite already catches this regression.

My worktree is back to its starting state: the manifest is restored, and the temporary base-checker copy is removed.
