---
name: no-comments
description: Strip comments from code and lower the eslint-suppressions.json baseline, one slice per PR. Use when burning down a comment baseline, when a `ranger/no-comments` (or similar no-comments lint) error fires, or when asked to remove comments from files.
---

# No comments

Code says what it does; a comment that repeats it, narrates history, or explains a workaround is **meat**. This skill deletes meat, turns the comments that carry a real constraint into code, and lowers the lint baseline so the deletion sticks.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml.

## Scope

The caller's files. With no files named, ask for a slice; never sweep a whole repo in one PR. One slice is one file, or a few files totalling roughly 100–150 comments.

## Steps

1. **List the slice's comments, baseline ignored.** ESLint hides suppressed violations, so point it at an empty suppressions file:

   ```bash
   echo '{}' > "${TMPDIR:-/tmp}/empty-suppressions.json"
   bun --bun eslint <files> --suppressions-location "${TMPDIR:-/tmp}/empty-suppressions.json"
   ```

   Done when you hold every `no-comments` hit for the slice, with line numbers.

2. **Sort each hit into one class.** Read the code around it first; a comment's claim is scent, not proof. Every hit gets exactly one class:

   - **meat**: narration of what the next line does, history ("we used to…", "X said…"), node or issue numbers with no lasting constraint behind them, banners, commented-out code, `TODO` with no owner. Delete.
   - **reshape**: the comment says what the code should say itself. Rename the symbol, extract a named function or constant, or tighten a type so the comment becomes redundant, then delete it. "No await between these writes" becomes a synchronous function; a condition explained in prose becomes a named boolean. A comment that is the only thing inside a block (an empty `catch`) always reshapes: alone it would trip `no-empty`.
   - **encode**: a constraint ("must run before X", "do not remove", "order matters", "keep in sync with Y"). First search the tests for one that fails when the constraint breaks; most constraints in a tested repo already have one, and citing it is the encoding. Only when none exists, write the cheapest check (a type, a runtime assertion, a test). Then delete the comment.
   - **keep**: behaviour forced by something outside the repo (a git, GitHub, Bun or OS quirk) that no name or test can make obvious. When an issue or vendor doc explains it, rewrite the comment around its full URL; the lint keeps URL comments. Without a URL, leave the comment as it is and let its suppression stand.

   When unsure between keep and meat, it is meat. Done when every hit has a class.

3. **Apply.** Edits stay behaviour-preserving: deletions, renames, extractions, types and new tests only. A reshape that would change behaviour becomes a keep and goes in the report as open work. Do the reshapes first and commit them, then delete the meat and encoded comments from ESLint's reported ranges (`-f json` gives line, column, endLine, endColumn), last hit first so earlier positions stay valid, dropping lines left blank.

4. **Lower the baseline, then prove it green:**

   ```bash
   bun run lint --prune-suppressions
   bun run lint
   bun run test
   bunx tsc --noEmit
   ```

   Done when all four pass and `git diff eslint-suppressions.json` shows only lower counts or removed entries.

5. **Report**, in the PR body: hits per class, each encoding with the test or type that now enforces it, each keep with its reason, and open work. The commit and PR carry any issue or node references the deleted comments held, so `git blame` still leads to them.

## Conflicts

Parallel slices collide in `eslint-suppressions.json`. On a rebase conflict there, take the base branch's version of the file, finish the rebase, and rerun `bun run lint --prune-suppressions`. Never resolve it with `--suppress-all`; the suppressions guard fails any rule total that grows past `origin/main`.
