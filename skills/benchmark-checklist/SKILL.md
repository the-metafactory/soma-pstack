---
name: benchmark-checklist
description: "Vet a measured performance number before reporting or acting on it: limiter, tuning, limits, errors, repeat runs, end-to-end relevance, and whether the work ran. Use when you run a benchmark or claim a speedup or regression."
route: "Running a benchmark, measuring performance yourself, or reporting a speedup or regression you measured, before you report or act on the number."
disable-model-invocation: true
triggers:
  - pattern: "/benchmark-checklist"
    type: command
    priority: 100
---

# Benchmark checklist

Use this whenever you produce a performance number: a PR's before and after, a regression claim, an optimize-loop harness, or a choice between libraries or configs. Answer each question with evidence from a run, not a guess about the code.

For a quick ballpark the principal asked for, one run is enough. Still check questions 4 and 7, and say it is one run. Skip the rest unless that run looks wrong. A choice between options is never a ballpark.

## Before you run anything

- Write down the claim you expect to make, in the words you would ship ("export is 30% faster at p50 on the 60k-row dataset"). The questions test that sentence.
- Read the measurement script. Note what it times, counts and ignores.
- Check the load average (`uptime`) and core count (`sysctl -n hw.ncpu` on macOS, `nproc` on Linux). If the machine is busy, find out what is running. If you cannot stop it, interleave the sides so both see the same noise, and say so in the report.

## The questions

1. **Why not double?** Name the limiter. Profile in a run you do not report, because profilers slow the work down. Use CPU per process (`top`, `pidstat`), a runtime profiler (`bun --cpu-prof`, `node --cpu-prof`, `perf`), I/O wait and syscall counts (`strace -c` on Linux), then map the hot spot to source. Watch the load generator too: if it saturates first, you measured the load generator. If a change did not move the number, the limiter explains why, so find it before you call the change useless.
2. **Was it tuned?** Run every side the way production runs it: release builds, production flags and env, batching and transaction settings, connection pools, caches as warm or cold as production sees them, the same versions and data. If one side runs on defaults, you compared configurations, not implementations. A limiter that is a setting (a commit per row, a debug build, a missing index) means that side is untuned. Tune it and measure again before picking a winner. If you cannot tune it, do not pick a winner from that run. When the principal is choosing what to adopt, narrowing the claim to "the code as it ships today" does not fix this: they adopt the option, not today's settings.
3. **Did it break limits?** Do the arithmetic. Compare bytes per second with disk and network bandwidth, operations per second times cost per operation with your cores, and the time saved with the time the changed piece took. Removing a piece that takes 10% of the run can make it at most about 11% faster. A result past a limit measured something other than the work: a cache, a no-op, a bug.
4. **Did it error?** Count failures and non-success responses, and check outputs are correct, not just present. Rejections are often fast; timeouts and retries are slow. If the script does not count errors, add the count.
5. **Does it reproduce?** Run each side at least 5 times, alternating (A, B, A, B …) so warmup, lazy init, caches and drift favor neither. Report median and range. A gap smaller than run-to-run variation is no measurable difference. When the call is close, use a rank-sum test or the harness's own statistics.
6. **Does it matter?** Next to any micro result, measure the end-to-end path a user waits on, with realistic data sizes and concurrency, and report the micro result as a share of the whole. A helper that takes 1% of a request can make the request at most 1% faster, however fast the helper gets.
7. **Did it even happen?** Confirm the work ran inside the timed region: the request reached the server, the rows were written, the bytes were read, the code used the result. Lazy code (generators nobody iterates, promises nobody awaits, results the JIT can discard) and timeouts produce numbers for work that never happened.

## Report

- Lead with the verdict: faster, slower, no measurable difference, or inconclusive.
- Give the number with its unit, run count, range and limiter. For example: "p50 41 ms → 33 ms, median of 7 runs per side, range 32 to 35 ms after, bound by JSON parsing on one core."
- Call it inconclusive when you claim a difference but cannot name the limiter, when a side ran untuned, or when you could not check questions 4 and 7. Name the gap.
- Keep a PR body to one primary number. Put the runs, range and limiter evidence in a linked notes file or the Algorithm run's verification entry.

## Where else this applies

- The `bug-fix` playbook card (`the-algorithm/references/playbooks/bug-fix.md`) when the bug is a regression: vet the baseline before planning from it, and every number after.
- The `optimize-loop` reference and the `auto-research` skill: vet the harness before it is frozen. A frozen harness that prints error and work counts checks questions 4 and 7 on every keep-or-revert for free.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml.
