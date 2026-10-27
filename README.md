# soma-pstack

An Arc library of skills ported from [pstack](https://github.com/cursor/plugins/tree/main/pstack)
to run on top of [Soma](https://github.com/the-metafactory/soma).
Each skill will live under `skills/<name>/` as its own Arc `type: skill` member,
with an `upstream:` block pinning its source repository, path and full commit.

Install the pack with:

```sh
arc install https://github.com/the-metafactory/soma-pstack
```

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
[`docs/verification/node-5/`](docs/verification/node-5/).

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

## Member gate

Use Bun 1.3 or newer (for its built-in YAML parser) and Arc 0.46.1 or newer
(for lowercase skill names). Run on the host:

```sh
bun test
bun scripts/check-pack.ts
```

Ranger runs `bun scripts/check-pack.ts` on the host and refuses to push a member
change when it fails. The principal controls the merge. This repository has no
CI workflow or required GitHub check for the gate.

The script checks the library metadata and each
listed member's directory, `SKILL.md` name and description, manifest type,
upstream repository/path/40-hex commit, and `arc validate <member-directory>`.
An empty library passes without invoking Arc on the root.

## Attribution

[NOTICE.md](NOTICE.md) carries pstack's MIT notice for this pack. Soma's own
`pstack-NOTICE.md` covers the principles and playbook cards in Soma, not this
repository. Those principles and cards remain in Soma.
