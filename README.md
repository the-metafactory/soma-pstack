# soma-pstack

An Arc library of skills ported from [pstack](https://github.com/cursor/plugins/tree/main/pstack)
to run on top of [Soma](https://github.com/the-metafactory/soma).
Each skill will live under `skills/<name>/` as its own Arc `type: skill` member,
with an `upstream:` block pinning its source repository, path and full commit.

Install the pack with:

```sh
arc install https://github.com/the-metafactory/soma-pstack
```

This scaffold has no members yet. Arc's install loader requires a non-empty
`artifacts:` list, so installation becomes available when the first member lands.

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
