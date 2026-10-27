# Playbook: Forensics

**Task shape:** a diagnosis from a runtime signal: a spinning process, a leak, a stall or a visual glitch, live or already captured as a profile, heap snapshot, trace or spindump.
**You own:** the diagnosis. It comes from the artifact, not from theorizing over the source, and it ships no fix unless asked.

## Steps

1. If nothing is captured yet, capture the live signal on the real surface: a CPU profile, a heap snapshot or a trace. If a capture exists, treat it as fixed data and do not rerun it.
2. Identify the format and load it with the right tool. Parse a large artifact in a subagent and keep only the reduced finding in the main thread.
3. Turn the raw artifact into something you can query, such as SQLite with one row per sample, frame or node.
4. Narrow to the cause: for time, the hottest frames and their call path; for a leak, the retainer chain from the leaked object to a GC root; for a stall, the blocked thread and what it waits on.
5. Prove the mechanism: instrument the live process, or diff a paired before-and-after capture. Without either, label the finding as the strongest hypothesis the artifact supports.
6. Map the finding to source: file, symbol and line. A frame with no source mapping is not yet a diagnosis.
7. Hand back the diagnosis and route the fix to the Bug fix or Perf issue card.

## Criteria

- C1: The finding cites the artifact path and the frame, node or thread it rests on (probe: the query that produced it, rerun).
- C2: The finding maps to a source location (probe: the file and line exist at the captured version).
- Anti: No file changed (probe: `git status`).

## Principles

`the-algorithm/references/principles/analysis-is-read-only.md`, `the-algorithm/references/principles/ground-claims-in-this-session.md`, `the-algorithm/references/principles/guard-the-context-window.md`.

**Reply:** the artifact and its format, the reduced finding, how the mechanism was proved or that it was not, the source location, and the artifact paths.
