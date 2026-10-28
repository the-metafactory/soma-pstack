## Feature summary
`ranger journal` prints the journal as one pretty-printed JSON object with `journalPath`, `paused`, `deadmanCount`, `spawnsToday`, `workers`, `escalations` and `events` (the newest 50). `--repo` keeps one map repo's rows, by full `owner/name` or short name. `--node <id>` keeps one node's rows and adds a `workerLog` path to each of its worker rows. A non-numeric `--node` is refused before the config or journal is opened, with an error on stderr and exit 1.

## Source entry points
- src/cli.ts:1264-1281: the `journal` command (`--repo`, `--node`, `-c/--config`), the numeric check at :1272, the stderr prefix and exit 1 at :1276-1279
- src/cli.ts:592-618: `runJournal` (key order :603-614, `workerLog` only with `nodeId` :608-611, 50 events :613)
- src/cli.ts:620-625: `normalizeRepo`
- src/worker-log.ts:7-9: `workerLogFile` joins `dirname(journalPath)/logs/workers/<stem>-g<gen>.log`
- src/journal.ts:602 `listWorkers`, :696 `listEvents`, :1082 `listEscalations`
- src/config.ts:573-574: `RANGER_JOURNAL_PATH` overrides `state.journalPath`

## Likely drift
- journal.md:29 says "Worker `log` paths point at `~/.config/ranger/logs/`, the live logs". The field is `workerLog` (src/cli.ts:611), and the path is built from the journal's own directory (src/worker-log.ts:8). On the snapshot it resolves to `$RUN/state/logs/workers/...`, which does not exist, because launch.sh copies only `state.sqlite` and `ranger.yaml` (scripts/launch.sh:27-28).
- journal.md:3 says the whole journal lists "every worker with its status and log file". `workerLog` is added only with `--node` (src/cli.ts:608-611).
- journal.md:3 says it prints "escalations and events"; it prints only the newest 50 events (src/cli.ts:613). Minor.
- Checked and consistent: the refusal text and exit code, `journalPath` as the first key, the listed keys, the flags, `nodeId` on worker rows, and the CLI lines in SKILL.md:104-106.

## Recipe
1. `RUN=$(scripts/launch.sh | tail -1)`, `scripts/doctor.sh "$RUN"`, `bun scripts/drive.ts "$RUN"`; take `needsYou[0].nodeId` from the state dump.
2. `cd "$(cat "$RUN/state/checkout")"`.
3. Whole journal into `$RUN/evidence/journal.json`: expect exit 0, `journalPath` equal to the snapshot, no `workerLog` keys, at most 50 events.
4. `--node <id>` into `$RUN/evidence/journal-<id>.json`: every worker has that `nodeId` and a `workerLog` under `$RUN/state/logs/workers/`, which does not exist on the snapshot.
5. `--repo <short-name>`: rows for that map only.
6. `--node abc`: `ranger journal: --node must be a numeric id, got abc` on stderr, exit 1.
7. `scripts/cleanup.sh "$RUN"`.
