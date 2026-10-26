import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";

const logger = resolve(import.meta.dir, "../../skills/show-me-your-work/scripts/log.sh");

export function runProbe(directory: string) {
  mkdirSync(directory, { recursive: true });
  const log = join(directory, "decisions.tsv");
  const transcript = join(directory, "transcript.jsonl");
  if ([log, transcript, join(directory, "audit.md")].some(path => Bun.file(path).size > 0)) {
    throw new Error("Use a fresh scratch directory; never overwrite a trail");
  }
  let line = 0;
  const record = (event: object) => {
    appendFileSync(transcript, JSON.stringify({ line: ++line, ...event }) + "\n");
    return `transcript.jsonl:${line}`;
  };
  const append = (phase: string, decision: string, why: string, evidence: string, result: string) => {
    const before = Bun.file(log).size > 0 ? readFileSync(log) : Buffer.alloc(0);
    const run = Bun.spawnSync(["bash", logger, log, phase, decision, why, evidence, result]);
    if (run.exitCode !== 0) throw new Error(run.stderr.toString());
    if (!readFileSync(log).subarray(0, before.length).equals(before)) throw new Error("History changed");
  };
  const execute = (args: string[]) => {
    const result = Bun.spawnSync(args, { stdin: Buffer.from("10\n2\n1\n"), env: { ...process.env, LC_ALL: "C" } });
    const output = result.stdout.toString();
    const evidence = record({ command: args, stdin: "10\n2\n1\n", env: { LC_ALL: "C" }, exitCode: result.exitCode, stdout: output, stderr: result.stderr.toString() });
    if (result.exitCode !== 0) throw new Error(result.stderr.toString());
    return { output, evidence };
  };

  const start = record({ run: "node-5-scratch-sort", task: "Sort 10, 2, 1 in ascending numeric order using show-me-your-work" });
  append("start", "new log: node-5-scratch-sort", "begin an unattended scratch task", start, "open");
  record({ decision: "Try default sort first" });
  const lexical = execute(["sort"]);
  append("sort", "tried default sort", "check whether the default meets the task", lexical.evidence, "1, 10, 2; numeric order failed");
  const oldTimestamp = readFileSync(log, "utf8").split("\n")[2]!.split("\t")[0];
  const missingFork = record({ decision: "Keep LC_ALL=C explicitly for reproducibility", deliberatelyUnloggedUntilAudit: true });
  record({ decision: "Use numeric sort instead because lexical ordering put 10 before 2" });
  const numeric = execute(["sort", "-n"]);
  if (numeric.output !== "1\n2\n10\n" || lexical.output !== "1\n10\n2\n") throw new Error("Unexpected sort result");
  append("sort", `supersedes row 3 (${oldTimestamp}): chose numeric sort`, "default ordering failed the numeric requirement", numeric.evidence, "1, 2, 10; verified");

  // Walk the recorded events against the trail, including the deliberately missed fork.
  const events = readFileSync(transcript, "utf8").trim().split("\n").map(value => JSON.parse(value));
  if (!events.some(event => event.deliberatelyUnloggedUntilAudit)) throw new Error("Missing audit fixture");
  append("audit-gap", "kept LC_ALL=C (added during transcript audit)", "record the previously missed reproducibility fork", missingFork, "gap filled");
  const rows = readFileSync(log, "utf8").trim().split("\n").slice(1);
  for (const row of rows) {
    const pointer = /^transcript\.jsonl:(\d+)$/.exec(row.split("\t")[4]!);
    if (!pointer || !events[Number(pointer[1]) - 1]) throw new Error("Evidence does not resolve");
  }
  record({ audit: "Checked rows 2-5 against this transcript; added missing locale fork as row 5; prior bytes unchanged" });
  writeFileSync(join(directory, "audit.md"), "# End-of-run transcript audit\n\nRun: node-5-scratch-sort. Transcript: transcript.jsonl. Row numbers include the TSV header.\n\nChecked rows 2-5: start identifies this run; default sort really produced 1,10,2; row 4 supersedes row 3 using its timestamp and the verified numeric output 1,2,10. Every evidence pointer resolves to a recorded event. The previously unlogged locale fork at transcript line 4 was appended as row 5. Earlier bytes were checked after every append and remained unchanged. Row 6 records this audit.\n\nThis is a small scripted probe, not evidence that arbitrary agent transcripts are audited automatically.\n");
  append("audit", "audited the trail against this run's transcript", "restore the missed fork and check every claim", "audit.md", "rows 2-5 checked; one missing fork added");
  return { log, transcript, audit: join(directory, "audit.md") };
}

if (import.meta.main) {
  if (!process.argv[2]) throw new Error("usage: bun test/probes/show-me-your-work.ts <fresh-output-directory>");
  console.log(runProbe(resolve(process.argv[2])));
}
