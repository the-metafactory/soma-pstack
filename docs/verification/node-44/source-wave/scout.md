## Feature summary
`ranger scout [--json] [--config <path>]` reads every map in `ranger.yaml` from its forge with the read-only PAT that `auth.readOnlyTokens` names for that repo. It refuses any token with write scopes and never falls back to the gh keyring. Per map it prints the frontier grouped by route class, the HITL nodes waiting on the principal, and an audit ending in `clean ✓` or `issues ✗`, after a time line and an identity line. `--json` prints the same report as JSON. It writes nothing, and exits 0 when every map was read, 2 when any failed, and 1 on a command error.

## Source entry points
- src/cli.ts:940-966: the `scout` command, `-c/--config`, `-j/--json`, exit 2/0 (:956) and 1 (:962)
- src/cli.ts:176-206 `runScout`; :102-174 `scoutOneMap`; :94 `READONLY_SURFACE`
- src/report.ts:48-147 `renderMapText`, `renderAudit`, `renderText`, `renderJson`
- src/token-gate.ts:64-83 `resolveReadOnlyToken`; 141-170 `introspectToken`; 177-199 `assertReadOnlyToken`
- src/route.ts:118-126 `ROUTE_LABELS`; 452-472 `byRoute`

## Likely drift
- scout.md:4 says the frontier is grouped "by routing (escalate, provisioning, walk)". There is no "walk" group; the groups come from `ROUTE_LABELS` (src/route.ts:118-126, rendered at src/report.ts:60-67). The only walk text is `walk: <mode>` in the map header (src/report.ts:50).
- scout.md:3 says scout reads every map "from GitHub". GitLab maps have their own gate (src/token-gate.ts:184).
- scout.md:6 and :12 list only exit 0 and 2. A command error such as a bad config exits 1 (src/cli.ts:958-963).
- scout.md:10 fixes the identity line as `identity: <login> (fine-grained)`. A read-only classic PAT prints `(classic)` (src/token-gate.ts:57, 163), and with no passing GitHub map it reads `identity: unknown (fine-grained)` (src/report.ts:136).
- scout.md:27 says an identity line naming the machine account or a classic token means the write token leaked into the env. Scout reads only the per-repo read-only variables (src/token-gate.ts:69-82), and refuses a classic token with write scopes (src/token-gate.ts:190-195), so a leak shows as `unknown (fine-grained)` and a `✗ FAILED` per map. The gotcha holds only for a fine-grained write PAT stored under a read-only variable name.
- Note: src/digest.ts is the Discord daily digest, not scout; the feature file's "digest" wording (scout.md:20) can send a reader to the wrong file.
- Checked and consistent: the flags, `maps[].ok`, the header strings, one `map:` block per config map, the `env.sh` token variables, and the SKILL.md command form.

## Recipe
```
RUN=$(scripts/launch.sh | tail -1); scripts/doctor.sh "$RUN"
cd "$(cat "$RUN/state/checkout")"
source "$RUN/state/env.sh" && bun src/cli.ts scout --config "$RUN/state/ranger.yaml" > "$RUN/evidence/scout.txt" 2>&1; echo "exit=$?"
source "$RUN/state/env.sh" && bun src/cli.ts scout --json --config "$RUN/state/ranger.yaml" > "$RUN/evidence/scout.json"; echo "exit=$?"
scripts/cleanup.sh "$RUN"
```
Expect exit 0, one `map:` block per config map, no `✗ FAILED`, and every `maps[].ok` true. Run it only when the change touches scout; it takes about 4.5 minutes of GraphQL budget.
