export const title = "Algorithm run phases";

export const state = (v) =>
  ({ observe: "Observing", think: "Thinking", plan: "Planning", build: "Building", execute: "Executing",
     verify: "Verifying", learn: "Learning", complete: "Complete", abandoned: "Abandoned" })[v.phase];

export const group = (v) => (v.phase === "complete" ? "teal" : v.phase === "abandoned" ? "orange" : "blue");
export const colors = { teal: "teal", orange: "orange", blue: "blue" };

export const step = (action, from, to) =>
  ({ Advance: "the run moves to the next phase", Complete: "completeAlgorithmRun is called", Abandon: "abandonAlgorithmRun is called" })[action];
