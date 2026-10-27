# AlgorithmPhase

TLC reached 11 states and 29 steps. The chart draws 9 states and 22 arrows.
The chart does not draw 4 steps that stay in one chart state.

## AbandonedStaysAbandoned breaks
The shortest path has 2 steps:
0. Observing
1. abandonAlgorithmRun is called: Abandoned
2. completeAlgorithmRun is called: Complete

## CompleteIsNeverAbandoned breaks
The shortest path has 2 steps:
0. Observing
1. completeAlgorithmRun is called: Complete
2. abandonAlgorithmRun is called: Abandoned

## Rules that hold
NoDeadlock
