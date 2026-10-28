Final report of adversary 1, an Agent-tool `general-purpose` sub-agent on `opus`, as it handed back.

I found one confirmed finding: the checker catches a duplicate only when the second copy comes right after the first. I made each repro by editing `arc-manifest.yaml` in my worktree and restored it afterwards. `git status` shows only `node_modules` as untracked, and the unmodified tree passes (`Pack checks passed (22 members).`).

## F1: A duplicate that is not on the next line passes the check

The new code compares each path only with the entry just before it (`path === previous`, `/tmp/interrogate-dup-artifacts/adversary-1/scripts/check-pack.ts:118`). It keeps no set of paths seen so far, so any copy with another entry between them goes undetected.

**Control (copy on the next line), caught:**
```
awk '{print} /^  - path: skills\/recall$/{print; getline; print}' .orig > arc-manifest.yaml
bun scripts/check-pack.ts
```
```
skills/recall: listed more than once in artifacts
exit=1
```

**Repro A (second `skills/recall` appended at the end of `artifacts`), missed:**
```
printf '  - path: skills/recall\n    description: dup\n' >> arc-manifest.yaml
grep -n 'path: skills/recall' arc-manifest.yaml   # 15, 57
bun scripts/check-pack.ts; echo "exit=$?"
```
```
Pack checks passed (23 members).
exit=0
```

**Repro B (order recall, correct, recall, correct, each listed twice), missed:**
```
grep -n 'path: skills/\(recall\|correct\)$' arc-manifest.yaml   # 15, 17, 19, 21
bun scripts/check-pack.ts; echo "exit=$?"
```
```
Pack checks passed (24 members).
exit=0
```

**What the intent requires:** in both repros the run should exit 1 and print `skills/recall: listed more than once in artifacts`. Repro B should also print the same line for `skills/correct`. The "passed" message also counts duplicate entries as members (23 and 24 instead of 22).

Nothing else turned up. The rest of `checkPack` is unchanged by the diff, and a duplicate with an invalid entry between the two copies is still caught, because an invalid entry does not overwrite `previous`.
