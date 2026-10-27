// Replays the two bug paths in report.md against the real Soma code.
// Run: SOMA_REPO=~/work/mf/soma bun docs/verification/node-17/replay.ts
import { resolve } from "node:path";

const soma = process.env.SOMA_REPO;
if (!soma) throw new Error("Set SOMA_REPO to a checkout of the-metafactory/soma.");
const { createAlgorithmRun } = await import(resolve(soma, "src/algorithm/algorithm.ts"));
const { abandonAlgorithmRun, completeAlgorithmRun, getRunPhase } = await import(resolve(soma, "src/algorithm/algorithm-lifecycle.ts"));

const fresh = () =>
  createAlgorithmRun({
    id: "replay", timestamp: "2026-10-27T10:00:00.000Z", prompt: "replay", intent: "replay",
    currentState: "fresh run", goal: "replay the model's bug paths",
    criteria: [{ id: "C1", text: "replay" }],
  });

const abandoned = abandonAlgorithmRun(fresh(), "replay step 1");
console.log("AbandonedStaysAbandoned: abandon ->", getRunPhase(abandoned), "-> complete ->", getRunPhase(completeAlgorithmRun(abandoned)));

const complete = completeAlgorithmRun(fresh());
console.log("CompleteIsNeverAbandoned: complete ->", getRunPhase(complete), "-> abandon ->", getRunPhase(abandonAlgorithmRun(complete, "replay step 2")));
