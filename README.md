# soma-pstack

An Arc library of skills ported from [pstack](https://github.com/cursor/plugins/tree/main/pstack)
to run on top of [Soma](https://github.com/the-metafactory/soma).
Each skill will live under `skills/<name>/` as its own Arc `type: skill` member,
with an `upstream:` block pinning its source repository, path and full commit.

Install the pack with:

```sh
arc install https://github.com/the-metafactory/soma-pstack
```

A member's `route:` frontmatter line is the condition under which an agent
should read it, as in pstack's poteto-mode trigger list. Soma's working method
lists each installed member that declares one in its Triggers section, with the
absolute SKILL.md path. That is how a member with `disable-model-invocation:
true` is reached while staying out of the skill catalog.

The root manifest lists the installable members. [POLICY.md](POLICY.md) routes
unattended decision trails to [show-me-your-work](skills/show-me-your-work/SKILL.md).

Its logger tests and scripted scratch probe run on the host:

```sh
bun test test/show-me-your-work.test.ts
bun test/probes/show-me-your-work.ts /tmp/fresh-decision-trail
```

The output directory must be fresh. The probe captures actual sort commands,
a superseding decision, and an end-of-run audit that adds an omitted fork.
The captured acceptance run and its separate cross-model review live under
[`docs/verification/node-5/`](docs/verification/node-5/). A run of the codex
reviewer command, which gives codex its prompt on stdin so it cannot hang and
denies it reads under `$HOME` except the work directory, is under
[`docs/verification/node-5/codex-stdin/`](docs/verification/node-5/codex-stdin/).

The [ketchup](skills/ketchup/SKILL.md) skill is what the `cup` alias in a Soma home's
`profile/communication.md` should expand to. The proposed alias text and the caps
probe are in [`docs/verification/node-9/`](docs/verification/node-9/).

[Reflect](skills/reflect/SKILL.md) reviews a session through three independent
lenses and a synthesizer. It instructs agents to wait for principal approval of
skill edits; this is a procedural contract, not runtime enforcement. Enforceable
findings become structural backlog proposals. Its finished-session probe and
isolated projection evidence live under [`docs/verification/node-10/`](docs/verification/node-10/).

[typescript-best-practices](skills/typescript-best-practices/SKILL.md) is the rules table
Soma's type-system-discipline principle should point at. Its projection evidence and the
proposed principle line live under [`docs/verification/node-12/`](docs/verification/node-12/).

[why](skills/why/SKILL.md) reconstructs the motivation behind code from a fixed roster of Soma evidence sources and binds the `TraceIntent` capability. Its binding probe, grep gate and acceptance run are under [`docs/verification/node-13/`](docs/verification/node-13/).

[recall](skills/recall/SKILL.md) sweeps chat, long-form docs and error tracking as well as `gh`, the work graph and git. It reads
the `why` skill's source playbooks instead of copying them, and its brief ends with a Sources part that names each source swept and
each not reached, with the reason. The probe is under [`docs/verification/node-7/`](docs/verification/node-7/).

[how](skills/how/SKILL.md) explains how a subsystem works from a cited trace: read-only
`haiku` explorers per angle, one `opus` explainer. Its manifest binds the `TraceMechanics`
capability; Soma reads that binding from the member's `soma-skill.json`. The acceptance runs
live under [`docs/verification/node-11/`](docs/verification/node-11/).

[technical-writing](skills/technical-writing/SKILL.md) splits docs into tutorial, how-to, reference and
explanation, takes its words from the codebase, and runs `humanizer` as its prose pass. Soma's `writer`
skill should route docs to it; the proposed routing line and the scratch-README probe are under
[`docs/verification/node-14/`](docs/verification/node-14/).

[sharpen](skills/sharpen/SKILL.md) makes a task deeper, not bigger. It names what a top professional would add, the
rawest source material, their methods and an outside check, then rewrites the prompt and leaves the principal's choices
open. The scratch-brief probe is under [`docs/verification/node-15/`](docs/verification/node-15/).

[statechart](skills/statechart/SKILL.md) checks a TLA+ model with TLC and draws it as a Mermaid chart. Each rule the reader
agrees to is an invariant, and the report gives the shortest path to each state that breaks one. The skill ships upstream's
`scripts/` without its test corpus. [create-formal-verification-skill](skills/create-formal-verification-skill/SKILL.md) and
[maintain-formal-verification-skill](skills/maintain-formal-verification-skill/SKILL.md) generate and keep in step the
project-local verify skill that runs it. The live probe, a model of Soma's Algorithm run phases with both bugs it found
replayed against the real code, is under [`docs/verification/node-17/`](docs/verification/node-17/).

[explain](skills/explain/SKILL.md) is pstack's `teach` under a new name, so it does not collide with Soma's `teach`
(the multi-session learning workspace). It runs `how` and `why` and weaves what they find into one plain account,
with `humanizer` as the prose pass and mermaid or the `art` skill for pictures. It is command-only (`/explain`). The
acceptance run and grep gate are under [`docs/verification/node-16/`](docs/verification/node-16/).

[playbooks](skills/playbooks/SKILL.md) holds the playbook cards, one numbered step list per task shape. They
used to ship in Soma's the-algorithm skill; a Soma home without this pack has no cards. Soma reads the index from the
installed member's SKILL.md and projects it into the working method's Playbooks section, and its mode hook points a card
hint at `skills/playbooks/references/<card>.md`. The index table's header and row shape are therefore a contract with
Soma; `test/playbooks.test.ts` holds them, along with a copy of the card slugs Soma's classifier hints at. A card names the principles it leans on by their path under the Soma
skills directory, since the principles stay in the-algorithm. Which upstream cards are ported, and why the rest are not,
is recorded in [`docs/upstream-playbooks-review.md`](docs/upstream-playbooks-review.md). The Cleanup card's audit is the
separate [worktree-audit](skills/worktree-audit/SKILL.md) member, so the playbooks member itself stays text with no shell
or network access.

[ketchup-video](skills/ketchup-video/SKILL.md) is [ketchup](skills/ketchup/SKILL.md) with the summary shown as a short subtitled slide
video. It is command-only (`/ketchup-video`). Its script draws SVG slides with rsvg-convert, crossfades them with ffmpeg
and measures each slide's hold by matching frames, so it needs ffmpeg on the host; the render goes to a fresh temp
directory, never into the repository, and the reply gives the file path. The probe on this repo's own recent work is
under [`docs/verification/node-48/`](docs/verification/node-48/).

[maintain-verification-skill](skills/maintain-verification-skill/SKILL.md) is the upkeep pass for the `verify-<app>` skill that
[create-verification-skill](skills/create-verification-skill/SKILL.md) generates. One read-only subagent per feature file reads the
source, the coordinator then drives every feature live that the target skill's own rules allow, and proven corrections to the map or harness ship as one PR, pushed only under
the principal's approval or a covering grant. The read-only probe of its first four steps against ranger's `verify-ranger` is under
[`docs/verification/node-44/`](docs/verification/node-44/).

[automate-me](skills/automate-me/SKILL.md) captures how the principal works. Soma keeps that in the Soma home, not in a
`<handle>-mode` skill, so the skill mines only the active workspace's transcripts, asks a few questions, and writes a proposal
that routes each signal seen in two or more slices to the communication contract, the behavior policy, a local principle or a
memory note. It applies a row only after the principal approves it. It is command-only (`/automate-me`). The mining probe
over this repository's own history is under [`docs/verification/node-49/`](docs/verification/node-49/).

[arena](skills/arena/SKILL.md) runs several candidates at one task in their own worktrees, has a judge from another model family score them
against a rubric, picks a base and grafts the best of the rest into it by hand. It runs only when the principal asks (`/arena`, "arena this"). By default the
runners are an `opus` and a `fable` sub-agent plus a confined `codex exec` runner, three seats in two model families, and a
Claude parent's judge is `codex exec`, which then shares a family with one candidate and sees it only by label; a roster
named in the request replaces the default. Its phase letters A to F are a contract other skills cite. The scratch arena is under
[`docs/verification/node-45/`](docs/verification/node-45/).

[interrogate](skills/interrogate/SKILL.md) sends adversaries at a change or design, each in its own worktree with the
scope's uncommitted changes copied in, and reports only the findings a rerun reproduces. It never applies a fix. It reuses
arena's Phase A steps 3 and 4, Phase B and Phase F, cited by letter and name, so `test/interrogate.test.ts` fails when those
headings change. By default the adversaries are an `opus` sub-agent and a `codex exec` process, two model families; a roster
named in the request replaces them. It runs only when the principal asks (`/interrogate`). The seeded-bug probe is under
[`docs/verification/node-46/`](docs/verification/node-46/).

[figure-it-out](skills/figure-it-out/SKILL.md) is a command, `/figure-it-out`, for a multi-phase task that no playbook
card matches; it declares no `route:`, so nothing reaches it unless the principal asks. It designs the playbook first: a
falsifiable predicate, a rigor level, a verification harness with a baseline, then a hypothesis loop with one
`show-me-your-work` row per unit. Inside an Algorithm run the predicate becomes the run's criteria and the designed
phases its plan steps. One-way-door decisions go to `architect`, which runs `arena`. The scratch-task probe is
under [`docs/verification/node-47/`](docs/verification/node-47/).

[architect](skills/architect/SKILL.md) is a command, `/architect`, that sketches types, signatures and module boundaries
before code. It grounds the design with `how` and `why`, runs `arena` for at least two structurally distinct sketches on
arena's runner roster, screens them against its design red flags, and implements against the synthesis. When the
implementation keeps fighting the sketch, it scraps it and returns to the arena. It declares no `route:`, so `no-comments` step 3 (for fixes that
need a new shape) and `figure-it-out` Phase B (for one-way-door decisions) link to its SKILL.md, which the agent reads and follows. It has no live probe yet.

## Member gate

Use Bun 1.3 or newer (for its built-in YAML parser) and Arc 0.46.1 or newer
(for lowercase skill names). Run on the host:

```sh
bun test
bun scripts/check-pack.ts
```

An `upstream.path` that ends in `/` names a directory, and any other path names
a file. Offline, the gate checks only that the path is relative with no empty,
`.` or `..` segments; it cannot tell a directory pinned without its `/` from a
file. `CHECK_PACK_UPSTREAM=1 bun scripts/check-pack.ts` asks GitHub (through
`gh`) that each pin resolves at its commit and is the kind its `/` says. A pin
GitHub answers 404 for "does not resolve"; any other `gh` failure (a rate
limit, no login, no network, a 30 s timeout, a reply that is not JSON) fails
the run as "could not be checked", so rerun it once the cause is gone. With
`CHECK_PACK_UPSTREAM_REPO=<dir>` naming a local clone of `cursor/plugins`, the
same checks read the pins from that clone with `git` and never call `gh`; a
commit or path missing from the clone fails, as does a commit that no
remote-tracking branch of `origin` contains, and so does a clone whose `origin`
is another repository. The branches are the ones the clone last fetched, so use
a fresh clone: a stale or hand-made `refs/remotes/origin/*` ref still counts.
The clone's `origin` must be `https://github.com/cursor/plugins`; an SSH
`origin` is refused. The gate sets `GIT_NO_LAZY_FETCH`, which git honours from
2.44 on; an older git may fetch missing objects of a partial clone from the
network.

Ranger runs `bun scripts/check-pack.ts` on the host and refuses to push a member
change when it fails. The principal controls the merge. The CI workflow
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the same gate on each
push to `main` and each pull request against it: it puts Arc v0.46.1 on `PATH`,
installs ripgrep, then runs `bun test test/` and `bun scripts/check-pack.ts`
with `CHECK_PACK_UPSTREAM=1`. The `cursor` organization's IP allow list refuses
the GitHub API from Actions runners, so CI first clones `cursor/plugins`
anonymously (a blob-less partial clone) and confirms every pin against it
through `CHECK_PACK_UPSTREAM_REPO`.
`main` has no branch protection, so the check is not required for a merge.

The script checks the library metadata and each
listed member's directory, `SKILL.md` name and description, manifest type,
upstream repository/path/40-hex commit, and `arc validate <member-directory>`.
An empty library passes without invoking Arc on the root.

## Attribution

[NOTICE.md](NOTICE.md) carries pstack's MIT notice for this pack. Soma's own
`pstack-NOTICE.md` covers the principles in Soma, not this repository. The
principles remain in Soma; the playbook cards live in this pack.
