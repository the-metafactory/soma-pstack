## Feature summary
In the dashboard's "Needs your decision" section, an approval-gated task or build node shows an `Approve` button. Clicking it confirms and sends `POST /api/approve`. The server checks that the node is still listed with the same 64-hex approval version, then runs `~/bin/ranger approve-node <id> --map <key> --approval-version <hash> -c <config>`. The verb checks that the `gh`/`glab` login is the principal's, re-reads the issue, and then either adds a `<!-- ranger:approved ... -->` marker (propose nodes) or rewrites the node block from `approve` to `propose` (approve nodes). With `--dry-run` it runs every check, including live reads under the principal's login, and stops before writing.

## Source entry points
- src/cli.ts:985-994: the `approve-node <id>` command (`--map`, `--approval-version` required; `--dry-run`, `-c, --config` optional)
- src/approve-node.ts:7-61: `approveNode` (allowlisted env at 21, login check 32-34, version check 49, dry-run return 50, write 51-60)
- src/launch.ts:10-31: the `childEnv` allowlist that drops `GH_TOKEN` and `GH_CONFIG_DIR`
- src/approval-spec.ts:4,20-34: `isApprovalVersion`, `approvalVersion`, `executableApproval`
- src/serve-approve.ts:4-22: `runApproveAction` (400, 404, two 409s, then the argv)
- src/serve.ts:894-903 the `/api/approve` route; :611-623 the `decisions[]` view; :1280-1303 `renderGrill` and `approveButton`

## Likely drift
- approve-node.md:11 says a stale version or a non-approvable node gets 409 "node changed; refresh before approving". Only a stale or invalid version gets that text (src/serve-approve.ts:17). A non-approvable node gets 409 "only approval-gated task/build nodes on implementation maps can be approved" (src/serve-approve.ts:16), and a node missing from the decisions gets 404 (src/serve-approve.ts:15).
- approve-node.md:16 names only nodes tagged `build · approve` or `task · approve`, though the feature is "Approve a propose node". The tag is `kind · autonomy` (src/serve.ts:1289), and `executableApproval` accepts `propose` too (src/approval-spec.ts:34).
- approve-node.md:6 says the verb "rewrites the node's approval block on GitHub". For propose nodes it adds a marker line and leaves the block alone (src/approve-node.ts:53-54). The verb also supports GitLab through `glab` (src/approve-node.ts:22-24).
- Checked and consistent: the flags, the dry-run output `{"approved":false,"dryRun":true}`, the server argv, the confirm and POST, `#grill`, the env allowlist, the drive.ts POST guard, and `approvable`/`approvalVersion` in the state dump.

## Recipe
1. `RUN=$(scripts/launch.sh | tail -1) && scripts/doctor.sh "$RUN"`, then `bun scripts/drive.ts "$RUN"`.
2. From the newest `$RUN/evidence/*-state.json`, take a `maps[].decisions[]` entry with `"approvable": true`: the map `key`, the `id` and the `approvalVersion`.
3. `cd "$(cat "$RUN/state/checkout")" && source "$RUN/state/env.sh" && bun src/cli.ts approve-node <id> --map '<key>' --approval-version <v> --dry-run --config "$RUN/state/ranger.yaml" | tee "$RUN/evidence/approve-dry-run.json"`. Expect `{"approved":false,"dryRun":true}` and exit 0. Never drop `--dry-run`.
4. `bun test test/serve.test.ts test/approve-node.test.ts` for the button's server side, then `scripts/cleanup.sh "$RUN"`.
