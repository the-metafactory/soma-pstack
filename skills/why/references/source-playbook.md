# Source playbooks

The why skill spawns one investigator per roster category that has a source, each reading a single playbook below. The roster is fixed; the playbooks name the commands to run for each.

| # | Category | Playbook | Tools |
|---|---|---|---|
| 1 | Source control | [`code-archaeology.md`](./sources/code-archaeology.md), plus [`review-threads.md`](./sources/review-threads.md) | git, `gh` |
| 2 | Issue tracker | [`issue-tracker.md`](./sources/issue-tracker.md) | `gh issue`, `soma graph node`, `soma graph decisions` |
| 3 | Long-form docs | [`long-form-docs.md`](./sources/long-form-docs.md) | repo `docs/`, ADRs, GLOSSARY, the `confluence` skill |
| 4 | Chat | [`chat.md`](./sources/chat.md) | the `Discord` skill |
| 5 | Own record | [`own-record.md`](./sources/own-record.md) | `soma memory search`, `soma algorithm list` / `show`, session transcripts |
| 6 | Observability, error tracking, analytics | [`observability.md`](./sources/observability.md) | none; recorded as a gap |

Cross-cutting:

- [`incident-postmortem.md`](./sources/incident-postmortem.md). Add this if the target code looks defensive (null checks, retry, timeout, rate limit, feature flag, egress guard, OOM handler).
