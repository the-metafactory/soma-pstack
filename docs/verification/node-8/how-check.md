# Independent how check

Investigator: `/root/how_check`, separate Codex subagent. Run before either
comment was removed. The `how`/`why` commands are not installed here, so this
uses the skill's independent read-only investigator fallback.

Target: scratch `messages.js`, symbol `flushMessages`.

The comment at original line 2 claims that `send` may synchronously append
messages, so the batch must be snapshotted before invoking it. The function
copies the array with `messages.slice()` (line 3), passes the separate array to
`send` (line 4), then returns the original array's current length (line 6).
Synchronous appends update the original messages and returned count without
extending the batch. The copy is shallow.

The callback appends `"later"` before inspecting its batch
(`before-messages.test.js:8–10`). Assertions require the batch to contain only
`"first"`, the original messages to contain both entries, and the returned
count to equal 2 (lines 12–14). The second test requires the retained batch to
remain separate after the callback returns (lines 17–22).

The investigator ran the tests: 2 pass, 0 fail. In a separate temporary copy,
replacing `messages.slice()` with `messages` caused both tests to fail at the
batch assertions. The worker independently repeated that mutation; the actual
output is in `probe-transcript.jsonl`.

This fixture proves array separation for synchronous appends. It does not
establish that a production callback appends, or protect nested objects from
mutation. The investigator made no removal decision and modified neither
repository.

Worker decision after reading the report and source: classify line 2 as
**encode**, cite the existing tests, and remove the comment. Classify original
line 5 (`Return the pending count`) as **meat**. No reshape or keep is needed.
