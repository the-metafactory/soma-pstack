# Node #14 verification

Verified on the host on 2026-10-27. The port is `skills/technical-writing`, from `pstack/skills/technical-writing/SKILL.md` at `cursor/plugins` `b6375f1` (full SHA in the member manifest).

## What changed from upstream

The skill is one file. `diff` against the upstream file at the pinned commit shows three edits:

- Frontmatter: `disable-model-invocation: true` is dropped and `triggers` are added, so Soma's router and the Skill tool can select it. The trigger list is the `/technical-writing` command plus `write a readme`, `write the docs`, `review the docs` and `Diátaxis`.
- The `unslop` pointer in the jargon paragraph and the Voice section now names Soma's `humanizer` skill. The Voice section says the skill carries no second slop list and runs `humanizer` with its "technical docs/README" profile after the layers, then rechecks the layer rules.
- A source line at the end names the file and commit.

## Acceptance criteria

| Criterion | Where it is met |
| --- | --- |
| Docs are split into tutorial, how-to, reference and explanation | "Pick the mode first (Diátaxis)" in `SKILL.md`, with the compass and one paragraph per mode |
| The codebase is the word list; no invented jargon | The paragraph that opens with "The codebase is the word list." |
| Humanizer is the prose pass; no second slop list | "Voice and repo specifics", first bullet. `test/technical-writing.test.ts` asserts the text and that `unslop` appears nowhere outside the source line |

## Live probe

[scratch-readme.md](scratch-readme.md) is a README for a scratch package, `slugline` (a `slugify` function and a CLI, built in `/tmp/slugline-scratch` for this probe and not committed). It was written by following `SKILL.md` as written: it has one top-level section per mode, each labelled with an HTML comment `<!-- mode: ... -->` (tutorial, how-to, reference, explanation), and no section mixes modes.

Every behavior the README states was run against the scratch package:

- `slugify("Crème Brûlée: A Tutorial!")` returns `creme-brulee-a-tutorial`.
- `slugify("Hello   World")` returns `hello-world`.
- The `--separator _` flag and the `separator` option both give `hello_world`.
- A `maxLength` of 9 on `aaa bbb ccc ddd` returns `aaa-bbb` (partial word dropped).
- Greek and Japanese titles return an empty string.
- No arguments prints the usage line to standard error and exits with status 2.

The first draft of the how-to told the reader to escape a regular-expression separator. Running `slugify("Hello World", { separator: "." })` returned an empty string, and the function does not escape, so no reader-side escape could help. The README now says to use `-` or `_` and states the failure. That is a defect in the scratch package, not in the skill; the draft was wrong because the claim had not been run, which is the skill's own rule ("make every count or tree claim true").

The `humanizer` pass was applied by reading the README against its technical docs/README profile (no em dashes, no AI vocabulary, no excessive bold). It found nothing to change, so the committed file is the post-pass text. This was a manual read, not a run of the `humanizer` skill by a sub-agent.

## Open: the routing line lives in the principal's home

`writer` is `~/.soma/skills/writer/SKILL.md` in the principal's Soma home, not in this repository, and the pack cannot edit it. The node says "a routing line in writer", so this is the proposed text for that file. Add it under "Anti-Patterns (All Contexts)", or next to the context table:

```
- Documentation (READMEs, how-to guides, reference, RFCs, PR descriptions, commit messages) is not a voice context. Load the `technical-writing` skill (soma-pstack) and let it pick the Diátaxis mode. Use a context here only for the voice of blog, social, report and email writing.
```

Until the principal applies it, the half of the live probe that greps `writer` for `technical-writing` does not pass. The skill's own `triggers` route "write a readme" and "write the docs" to it without that line.

## Gate

`bun scripts/check-pack.ts` output: see [pack-check.txt](pack-check.txt).
