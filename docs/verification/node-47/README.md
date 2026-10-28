# Node #47 verification

Verified on the host on 2026-10-28. The port is `skills/figure-it-out`, from `pstack/skills/figure-it-out/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest).

## What changed from upstream

- pstack's principle skills become Soma's principle files under `the-algorithm/references/principles/`: prove-it-works is `verify-before-claiming` plus `one-probe-per-criterion`, never-block-on-the-human is `build-over-ask-when-reversible`, and the subagent rules from poteto-mode are `own-delegated-work` plus a plain rule on model and effort. The rest keep their names.
- `architect` is not ported. A one-way-door decision goes to the `arena` skill.
- `## Start` first checks the playbooks index and uses a matching card instead. The todo list's first item reads Soma's principles index rather than poteto-mode.
- `## Inside an Algorithm run` maps the phases onto a run: the predicate becomes `--criterion` lines, the designed phases become `algorithm plan` steps, verdicts go in through `algorithm verify`, and the no-card call, rigor and trail path go in as `algorithm decision` lines. The per-unit trail stays in `show-me-your-work`'s `decisions.tsv`.
- Frontmatter keeps `disable-model-invocation: true`, adds a `route:` line so Soma's working method lists it under Triggers, and adds a `/figure-it-out` command trigger.

## Live probe

The scratch task: make every member's `upstream.path` in this pack resolve at its pinned commit, with a form that says whether it names a file or a directory. No card matches it; [playbook.md](playbook.md) records why, the predicate, the scope, the rigor level and the designed phases.

- [harness.ts](harness.ts) is the verification harness, written before any edit. [harness-baseline.json](harness-baseline.json) shows one failure out of 21 (`typescript-best-practices` pins a directory without a trailing slash). [harness-negative-control.json](harness-negative-control.json) shows the harness reporting a pin pointed at a missing path, so its zero is not vacuous.
- The one unit is [unit-typescript-best-practices.patch](unit-typescript-best-practices.patch). [harness-after.json](harness-after.json) shows zero failures and unchanged repos and commits. [gate-after.txt](gate-after.txt) has the same 3 failures as [gate-baseline.txt](gate-baseline.txt), all from tests that read the `docs/` evidence the scratch copy leaves out.
- [decisions.tsv](decisions.tsv) is the trail, written through `show-me-your-work`'s helper as each step landed. [audit.md](audit.md) is the end-of-run audit against the transcript; it added two forks the log had missed.
- [review.md](review.md) records that the cross-model review is incomplete: the Codex reviewer gave no output in about 77 minutes and was stopped. No self-review stands in for it.

`test/figure-it-out.test.ts` checks that the frame rows come before the first unit, that every evidence pointer resolves, and that the harness fails on the baseline and passes after the run.

## What the probe does not show

The Algorithm-run mapping was not exercised. `soma algorithm new` with a scratch `--soma-home` stops with "Soma CLI runtime is missing-state", and the brief forbids writing under `~/.soma`. The verbs and flags named in `SKILL.md` were checked against `soma algorithm <verb> --help` on the host, not against a live run.

The scratch copy was edited and the pack itself was not; the patch is evidence, not a proposed change. This probe was run by hand: I followed `SKILL.md` myself in this session, without invoking the skill through a substrate.
