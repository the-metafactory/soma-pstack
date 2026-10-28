# codex review on stdin

`show-me-your-work` gives a codex reviewer its prompt on stdin (`- < review-prompt.md`) and takes the final message with `-o`. This is one real run of that command on a scratch trail under `/tmp/smyw-codex-stdin`, on 2026-10-28.

The scratch trail is [decisions.tsv](decisions.tsv) (written with `scripts/log.sh`), [audit.md](audit.md), [transcript.txt](transcript.txt) and [util.ts](util.ts). The `build` row claims `tests green` with no test in the transcript, so the reviewer has something to find.

Each run held the caller's stdin open with a writer that never closes it, as an agent's shell does:

```sh
( sleep 900 ) | ( codex exec --sandbox read-only --skip-git-repo-check -C /tmp/smyw-codex-stdin \
  -o /tmp/smyw-codex-stdin/review.md - < /tmp/smyw-codex-stdin/review-prompt.md )
```

- Prompt on stdin: codex returned in 34 s with exit 0 ([elapsed.txt](elapsed.txt)). [session.txt](session.txt) is its session header (model `gpt-6.1-sol`, provider `openai`, `sandbox: read-only`, session `01a1833b-19f8-7630-a991-34f1ff46bc87`) and final message. The middle of the log is left out, because there codex reads the principal's own codex instructions. [review.md](review.md) is the `-o` file. It flags the unsupported `tests green` row.
- Prompt as an argument, the same open stdin: codex printed `Reading additional input from stdin...` and wrote nothing until a 120 s alarm killed it (exit 142, no `-o` file). [prompt-as-argument-session.txt](prompt-as-argument-session.txt) is its whole stderr. This is the hang behind the 77-minute review in the figure-it-out port.
