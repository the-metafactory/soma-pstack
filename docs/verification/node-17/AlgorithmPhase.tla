---- MODULE AlgorithmPhase ----
\* Phase lifecycle of a Soma Algorithm run, from the soma repo at 3bff58d:
\*   Advance  = advanceAlgorithmRun   (src/algorithm/algorithm.ts:694), one phase forward
\*   Complete = completeAlgorithmRun  (src/algorithm/algorithm-lifecycle.ts:30), setRunPhase "complete"
\*   Abandon  = abandonAlgorithmRun   (src/algorithm/algorithm-lifecycle.ts:38), setRunPhase "abandoned"
\* The gates assertGate checks before Advance are left out: every Advance is assumed to pass them.
EXTENDS Naturals

Order == <<"observe", "think", "plan", "build", "execute", "verify", "learn", "complete">>

VARIABLES phase, wasComplete, wasAbandoned
vars == <<phase, wasComplete, wasAbandoned>>

Init == phase = "observe" /\ wasComplete = FALSE /\ wasAbandoned = FALSE

Index(p) == CHOOSE i \in 1..8 : Order[i] = p

Advance ==
  /\ phase \notin {"complete", "abandoned"}
  /\ phase' = Order[Index(phase) + 1]
  /\ wasComplete' = (phase' = "complete")
  /\ UNCHANGED wasAbandoned

\* setRunPhase has no guard on the phase it is called from.
Complete ==
  /\ phase' = "complete"
  /\ wasComplete' = TRUE
  /\ UNCHANGED wasAbandoned

Abandon ==
  /\ phase' = "abandoned"
  /\ wasAbandoned' = TRUE
  /\ UNCHANGED wasComplete

Next == Advance \/ Complete \/ Abandon

Spec == Init /\ [][Next]_vars

\* The code says it: "abandoned is terminal" (algorithm.ts:689).
AbandonedStaysAbandoned == wasAbandoned => phase = "abandoned"
\* A finished run is not later reported as abandoned.
CompleteIsNeverAbandoned == wasComplete => phase # "abandoned"
====
