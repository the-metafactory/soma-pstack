---
name: no-comments
description: Strip comments from code, investigate claimed constraints, require independent slice review, and lower the eslint-suppressions.json baseline, one slice per PR. Use when burning down a comment baseline, when a `ranger/no-comments` (or similar no-comments lint) error fires, or when asked to remove comments from files.
route: "Before review of a change, when a no-comments lint error fires, or when burning down a comment baseline."
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

2. **Investigate emphatic claims, then sort each hit into one class.** Read the code around it first; a comment's claim is scent, not proof. Before accepting either a keep or a removal for an `IMPORTANT`, `do not remove`, `do not change wording`, or `talk to X before changing` comment (or equivalent emphatic wording, regardless of case), invoke `TraceMechanics` (`/how`) on its symbol to trace the mechanism, or `TraceIntent` (`/why`) to trace the intent and history. Record the cited findings and what they prove; the comment itself is not evidence. If no binding for the chosen capability is available on this substrate, use an independent read-only investigator for the same check and name the fallback in the report. If neither route can run, report the slice blocked rather than accepting an unchecked decision. This check precedes the defaults below. Every hit gets exactly one class:

   - **meat**: narration of what the next line does, history ("we used to…", "X said…"), node or issue numbers with no lasting constraint behind them, banners, commented-out code, `TODO` with no owner. Delete.
   - **reshape**: the comment says what the code should say itself. Rename the symbol, extract a named function or constant, or tighten a type so the comment becomes redundant, then delete it. "No await between these writes" becomes a synchronous function; a condition explained in prose becomes a named boolean. A comment that is the only thing inside a block (an empty `catch`) always reshapes: alone it would trip `no-empty`.
   - **encode**: a constraint ("must run before X", "do not remove", "order matters", "keep in sync with Y"). First search the tests for one that fails when the constraint breaks; most constraints in a tested repo already have one, and citing it is the encoding. Only when none exists, write the cheapest check (a type, a runtime assertion, a test). Then delete the comment.
   - **keep**: behaviour forced by something outside the repo (a git, GitHub, Bun or OS quirk) that no name or test can make obvious. When an issue or vendor doc explains it, rewrite the comment around its full URL; the lint keeps URL comments. Without a URL, leave the comment as it is and let its suppression stand.

   When unsure between keep and meat, it is meat. Done when every hit has a class.

3. **Sketch shapes, then apply.** Work from the hits classified in step 2. Fix trivial hits directly when no new shape is needed: delete a dead path, drop an unused parameter, or use the real API. If any fix needs a new shape (including every reshape-class rename, extraction or type redesign), run the architect step once for the set of hits needing a new shape and its surrounding code, before implementing: use `/architect` when available, otherwise a separate design subagent. Ask for the smallest in-scope root-cause sketch, not application-code edits; stop at the sketch, then implement it here. Record the sketch and remove the workaround it replaces. Do not turn a shape problem into a keep or add an explanatory comment instead. If no architect route is available, or its sketch needs a behaviour change or work outside the slice, leave that fix open and report the boundary. Leave its code, comment and suppression unchanged as open work, not an external-constraint keep; this deferral takes precedence over the meat default.

   Edits stay behaviour-preserving: deletions, renames, extractions, types, new tests, and assertions of already-required invariants only. An assertion that could introduce a new failure for supported input stays open as a behaviour change. Do the in-scope reshapes first and commit them, then delete the meat and encoded comments from ESLint's reported ranges (`-f json` gives line, column, endLine, endColumn), last hit first so earlier positions stay valid, dropping lines left blank.

4. **Lower the baseline, then prove it green:**

   ```bash
   bun run lint --prune-suppressions
   bun run lint
   bun run test
   bunx tsc --noEmit
   ```

   Done when all four pass and `git diff eslint-suppressions.json` shows only lower counts or removed entries.

5. **Get an independent reviewer subagent's verdict for every slice, before the PR.** Give a reviewer that did not make the edits or supply the how/why findings the exact scope, original comments, final diff, classifications, how/why findings, architect sketch if any, and check output. Ask it to check each removal against the surrounding code and evidence, spot missed scoped lint or TypeScript suppressions, challenge unsupported keeps, and flag behaviour changes or scope escapes. The reviewer inspects and reports; it does not edit application code. Save its verdict and findings. Inspect the report yourself: fix accepted findings and explain dismissals with concrete evidence. After a changed removal or encoding, have the reviewer check the updated diff and rerun affected checks. An unavailable reviewer or unresolved correctness/scope finding means no PR; self-review is not a substitute.

6. **Report**, in the PR body: hits per class, each how/why-checked comment and its evidence, the architect sketch and resulting fixes, each encoding with the test or type that now enforces it, each keep with its reason, the independent reviewer's identity and verdict, and open work. The commit and PR carry any issue or node references the deleted comments held, so `git blame` still leads to them.

## Conflicts

Parallel slices collide in `eslint-suppressions.json`. On a rebase conflict there, take the base branch's version of the file, finish the rebase, and rerun `bun run lint --prune-suppressions`. Never resolve it with `--suppress-all`; the suppressions guard fails any rule total that grows past `origin/main`.
