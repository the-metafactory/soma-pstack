# Chat (Discord)

## What this source contains

- Messages in the team's Discord channels and threads: real-time deliberation that never reached a doc
- Threads opened around a PR, an incident or a decision

Best at what was said before the decision was written down. Especially important when the paper trail in source control, the tracker and the docs is thin.

## How to search it

Read-only, through the `Discord` skill's CLI. Use `channels`, `threads` and `read`. **Never run `post`, `role` or `config set`.**

```bash
discord channels
discord threads
discord read --channel <name> --limit 50
discord read --thread <name-or-id> --limit 50
```

There is no server-side search. Pick the channels and threads by name from `channels` and `threads` (the repository, the component, the PR or node number, an incident name), read recent history in each, and filter what you read for the symbols, PR and issue numbers and keywords from the code anchor. Record which channels and threads you read, how many messages, and the date range they cover. A channel that is too busy for the window to reach the date of the change is a gap, and the line says so.

Limits seen in use: `--limit` is capped (100 at most; a larger value is rejected), the CLI cannot page further back, and it may print the time of day without the date. Record what the output actually shows. If it does not reach the date of the change, the line says the window was not reached, and which channels were read.

Write nothing to disk: filter the output with `grep` or `head`.

Quote a message with its author, its timestamp and the channel or thread. If `discord` is not installed, has no token, or the server is unreachable, report the command and its error, and return no findings. Do not retry in a loop.
