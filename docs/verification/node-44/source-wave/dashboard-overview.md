## Feature summary
The dashboard at `ranger serve` (127.0.0.1:7311 live, or 7399 for verify runs) loads one page whose only data source is `GET /api/state`. It re-polls that endpoint every 15 s. A header shows status in `#meta` (spawns today, refresh state), and a Refresh button sits next to it. Below come six sections: Needs you, Needs your decision, Autonomous, Next in queue, Current job, and Substrates. Refresh sends `POST /api/refresh`, which returns 202. It re-reads only serve-only maps and shows "Refreshing the frontier…" in `#msg`.

## Source entry points
- src/serve.ts:1011 `renderPage(token)`; the static handles are at :1080-1091 (`#meta`, `#refresh`, `#msg`, `#out`, `#needsyou`, `#grill`, `#auto`, `#next`, `#current`, `#substrates`)
- src/serve.ts:878 `GET /api/state`; :886 "token refused"; :889-891 `/api/refresh` → `ctx.refresh()`, 202
- src/serve.ts:1633 and :1659 the reader's `refresh()` only covers `servedOnly` maps; registered maps come from `cachedFrontier` (:2042)
- src/serve.ts:1130 `renderMeta`, :1154 `renderCurrent`, :1170 `renderNext`, :1266 `renderAuto`, :1281 `renderGrill`, :1404 `renderNeeds`, :1433 `renderSubstrates`
- src/serve.ts:1458-1461 `render` / `load` / the refresh click handler / `setInterval(load, 15000)`
- .claude/skills/verify-ranger/scripts/drive.ts:34-40 (POST guard), :60-68 (section, needs-count and grill checks), :70-77 (`--refresh`)

## Likely drift
- `overview-needs` (dashboard-overview.md:11) says `#needsyou` holds "one card per `needsYou` row, or the empty line". When `needsYouUnchecked` is non-empty, `renderNeeds` first adds an "awaiting-merge row(s) not yet checked" div (src/serve.ts:1407-1411), and the empty line is then left out even when `needsYou` is empty (src/serve.ts:1413). drive.ts already counts this child (drive.ts:62-63); only the feature-file wording is out of date.
- The gotcha at dashboard-overview.md:38 says titles show "(title not read yet)" without naming the section. That placeholder appears only on Needs-you cards (src/serve.ts:1398); current-job and queued-resume rows show "(title not in the frontier read)" (src/serve.ts:1163, :1236).
- The gotcha at dashboard-overview.md:40 lists the Needs-you buttons as "Resume, Merge, Open session". Cards also carry "Queue resume" (src/serve.ts:1390), which SKILL.md:28 lists. Minor, since the guard blocks every non-refresh POST (drive.ts:37).
- Checked and consistent: every id in SKILL.md:94-97, the six h2 titles, the empty-state strings, the "free" lane label, the refresh message and 202, the 15 s poll, "token refused", and the script paths and flags in SKILL.md:140-147.

## Recipe
```bash
RUN=$(scripts/launch.sh | tail -1); scripts/doctor.sh "$RUN" || { scripts/cleanup.sh "$RUN"; exit 1; }
bun scripts/drive.ts "$RUN" && bun scripts/drive.ts "$RUN" --refresh
bun scripts/state-summary.ts "$RUN"/evidence/*-state.json   # compare needsYou/needsYouUnchecked counts with dom.json
scripts/cleanup.sh "$RUN"
```
Expect the `ok` lines for the POST guard, the six sections, the Needs-you count, the grillings and `Refresh posted /api/refresh -> 202`, and `POST /api/merge BLOCKED` in `network.log`. Cite the HEAD doctor printed.
