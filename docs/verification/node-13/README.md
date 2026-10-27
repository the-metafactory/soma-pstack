# Node #13 verification

Verified on the host on 2026-10-27. The port is `skills/why`, from `pstack/skills/why/` at cursor/plugins `99743e9c151c8537cbbf1f98bb38f34ef3368453`.

## Ported verbatim

`references/epistemics.md`, `investigator-prompt.md`, `synthesizer-prompt.md`, `sources/code-archaeology.md` and `sources/incident-postmortem.md` are byte-identical to the upstream files at the pinned commit (`diff` against `gh api` raw content). The Linear, Notion, Slack, Datadog, Sentry and Databricks playbooks are not shipped.

## Rewritten or new

- `SKILL.md`: upstream's five steps and failure mode kept. Discovery and the seven MCP categories are replaced by the fixed six-category roster; the model lines by `haiku` investigators and an `opus` synthesizer; `disable-model-invocation` is dropped; the tool-mode and Cursor-specific sentences are gone. Step 2 gains repository-qualified numbers and a rule for many-file targets, from the acceptance run below.
- `references/source-playbook.md`: the index, rewritten for the roster.
- New playbooks: `issue-tracker.md`, `long-form-docs.md`, `chat.md`, `own-record.md`, `observability.md` (the category-6 gap), and `review-threads.md`, an addendum to `code-archaeology.md` for PR conversation comments, inline comments and sage reviews.
- The verbatim `synthesizer-prompt.md` and `investigator-prompt.md` still list seven categories. `SKILL.md` Step 4 states the override (six lines in Sources Consulted, "unavailable" or "no source in this pack" for "no matching MCP"). `incident-postmortem.md` still says Linear and Slack; `SKILL.md` says to read them as the issue tracker and chat.

## Grep gate

`grep -rilE 'cursor|Task\(|subagent_type|generalPurpose|readonly|pstack-models.mdc|poteto-mode|unslop|mcps/' skills/why` returns only `arc-manifest.yaml`, because the required `upstream.repo` is `cursor/plugins`. Upstream's text had five hits that are gone from the other files, including the word "precursor", which was reworded.

## Binding

Soma's resolver reads `soma-skill.json` (schema `soma.skill.v1`) in the skill directory, not `arc-manifest.yaml`, and `arc` does not generate that file. So the member carries `algorithmCapability.satisfies: [TraceIntent]` in both. In a scratch home after `soma project-skill skills/why --apply --substrate claude-code`, `soma algorithm capabilities --list --substrate claude-code` prints `TraceIntent [skill] observe → why`.

Known limits of `soma-skill.json`:

- The resolver skips a skill whose manifest does not list the running substrate. The list omits `cursor`, because the grep gate forbids that word in any skill file. On the cursor substrate `TraceIntent` stays unbound.
- The two manifests repeat the `satisfies` line; they can drift.

`soma doctor` in a scratch home reports starter-profile and missing-projection findings unrelated to this skill; the live install into the principal's home is the principal's step.

## Acceptance run

An `opus` sub-agent followed the file as written for "why do substrates install files live in src/substrates/" in the soma repo. It spawned five `haiku` investigators and an `opus` synthesizer. The answer cited c309db9 (PR #980, node #812), the #812 and #610 issue text, listed all six categories in Sources Consulted, and marked category 6 as a gap. `gh` was authenticated and no source failed, so the failed-source rule was not exercised.

It did not cite the sage review on PR #980. The run reported eleven defects in the skill; those that bear on behavior were fixed (scratch files, Discord limits, repository-qualified numbers, pasted playbooks, review-threads addendum, algorithm run files, override scope). A second run of only the source-control investigator on `haiku`, with the fixed playbooks, reported the sage review: PR #980 conversation comment https://github.com/the-metafactory/soma/pull/980#issuecomment-6234534720, with no formal reviews and no inline comments. The full end-to-end run was not repeated after the fixes.

## Gate

`bun scripts/check-pack.ts`: see [pack-check.txt](pack-check.txt).
