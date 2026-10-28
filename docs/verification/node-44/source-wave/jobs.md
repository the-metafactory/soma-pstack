## Feature summary
Jobs are skills ranger runs headless, declared under `jobs` in `ranger.yaml` with a lane of `visual`, `headless` or `none`. `ranger job enqueue <name>` queues one run; a second enqueue while it is queued returns the same `runId` with `queued:false`. The next tick reserves the lane and spawns `ranger job run <id>`. `ranger job list` prints every run as a JSON array, oldest first. On the dashboard a running `visual` or `headless` job shows only as that lane's holder in "Next in queue"; a `none`-lane job does not appear.

## Source entry points
- src/cli.ts:1009 the `job` group; :1035 `job enqueue`; :1046 `job run`; :1066 `job list`
- src/jobs.ts:40 `findJob`; :52 `enqueueJob`; :70 `jobRunArgv`
- src/journal.ts:529 `enqueueJobRun`; :541 `listJobRuns`; :501-520 `laneHolder`; :251 `jobHolder` (`nodeId: "job:<name>"`, `repo: "ranger:job"`)
- src/store/schema.ts:385-418 the `job_runs` table
- src/serve.ts:2067 `laneHolders`; :1170-1175 `renderNext`; :532 and :1154-1156 `#current` built from workers only

## Likely drift
- jobs.md:11 says "`#current` the running job", and jobs.md:17 points to the dashboard's "Current job". `current` is built only from in-flight workers (src/serve.ts:532), and `renderCurrent` prints "No worker is running." otherwise (src/serve.ts:1154-1156). A running job appears only as a lane holder in `#next` (src/journal.ts:517-518, :251; src/serve.ts:1175).
- jobs.md:11 and :24 say only "or its holder". A job holder renders as `held by #job:<name> (ranger:job#<runId>)` (src/serve.ts:1175), which a reader expecting a node id will not recognise. Minor.
- Checked and consistent: the `job list` fields and order, the enqueue output shape and exit codes, `"lane":"none"`, `journalPath` pinned to the snapshot, `RANGER_JOURNAL_PATH` in `env.sh`, the drive.ts evidence names, and the `#next`/`#current` handles.

## Recipe
1. `RUN=$(scripts/launch.sh | tail -1); scripts/doctor.sh "$RUN"`, then `cd "$(cat "$RUN/state/checkout")"`.
2. `source "$RUN/state/env.sh" && bun src/cli.ts job list --config "$RUN/state/ranger.yaml" > "$RUN/evidence/jobs.json"; echo $?`: exit 0, ascending `id`.
3. `bun scripts/drive.ts "$RUN"`; compare `gates.laneHolders` in the state dump with `#next`. Do not expect a job under `#current`.
4. On the snapshot only, enqueue a `none`-lane job twice: same `runId`, `queued` true then false, exit 0 both times. Confirm with `job list` and `journal` that the write went to `$RUN/state/state.sqlite`.
