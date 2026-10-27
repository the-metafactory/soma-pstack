# Playbook: Opening a PR

**Task shape:** a change is ready for review; the last step of the Bug fix, Feature, Refactor and Perf issue cards.
**You own:** the reviewer's first minute. The diff shows what changed; the PR says why, what it leaves out and how you proved it.

## Steps

1. Work on a branch off trunk, in a worktree when other work shares the checkout. Never commit to trunk, and never sweep unrelated changes into the branch.
2. Run the suites the change can reach and the `no-comments` pass. Keep each command and its outcome for the Verification section.
3. Shape the commits: small, ordered, each one landable. Amend when a fix belongs in the commit just made. A commit body states the change, not the subject again, and ends with the attribution lines.
4. Title it as a Conventional Commit, `type(scope): subject`, imperative and without a period. Name a real symbol when one carries the change.
5. Write the body under `technical-writing`, then `humanizer`, in these sections, dropping any with nothing to say: `## Why`, `## What changed`, `## Scope` (always), `## Tradeoffs` (only a real rejected alternative), `## Blast Radius` (from `blast-radius` when effects reach past the diff), `## Verification` (each a real command and its outcome). Keep it under 40 lines; logs, SHAs and tables go in a linked artifact.
6. Prefer several narrow PRs to one large one. A stack is a base chain: the root targets trunk and each child targets its parent's branch.
7. Push only under the principal's approval or a grant that covers this work. Open the PR ready, not as a draft, then read it back with `gh pr view` before you state its status.
8. Opening a PR does not start a review loop. Post the URL and keep building. Drive review per `pilot-review-loop` when asked or when the brief says so, and land per the Shipping card.

## Criteria

- C1: The suites the change reaches pass on the pushed head (probe: the commands in Verification, rerun).
- C2: The PR exists, is not a draft and targets the intended base (probe: `gh pr view --json isDraft,baseRefName`).
- C3: Every Verification bullet names a command run in this session (probe: the bullets against the run log).
- Anti: Nothing was pushed without approval or a covering grant (probe: the approval in the conversation or the brief).

## Principles

`the-algorithm/references/principles/verify-before-claiming.md`, `the-algorithm/references/principles/sequence-verifiable-units.md`, `the-algorithm/references/principles/ask-before-irreversible.md`.

**Reply:** the PR link, its base, what the Verification section proves, and what is left out of scope.
