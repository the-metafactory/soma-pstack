# Own record (Soma memory, Algorithm runs, session transcripts)

## What this source contains

- Soma memory: learnings, knowledge and work notes the assistant or the principal promoted
- Algorithm runs: the goal, criteria, decisions and verification of earlier work on the same code
- Session transcripts: what was asked and answered while the code was written

Best at what happened in the assistant's own sessions, where the reasoning was spoken to an agent and never written into the repository.

## How to search it

Read-only. Never promote, edit or delete a record.

```bash
# Memory
soma memory search --query '<keyword or symbol>' --limit 20

# Algorithm runs
soma algorithm list
soma algorithm show --id <run-id>
```

If `soma algorithm show` is unavailable, the run records are JSON files under `~/.soma/memory/WORK/algorithm-runs/`; read the matching one directly. `soma algorithm list` has no filter; scan it for runs whose goal names the target, then `show` the matches and read their decisions and criteria.

Session transcripts are JSONL files, one per session, under `~/.claude/projects/<project-slug>/`, `~/.codex/sessions/` and `~/.pi/agent/sessions/`. Narrow by project directory and by modification date around the change's commit date, then search the text:

```bash
rg -l '<symbol>|<pr-or-node-number>' ~/.claude/projects/<project-slug>/ --glob '*.jsonl'
rg -n -C1 '<keyword>' <transcript>.jsonl
```

Transcripts are large and contain tool output. Quote only the message that bears on the question, with the file name and the line number, and never copy a secret or a token you happen to see. Treat what a transcript says as what someone said at the time, not as a fact about the code.

If `soma` is missing or a directory does not exist, report which and carry on with the rest.
