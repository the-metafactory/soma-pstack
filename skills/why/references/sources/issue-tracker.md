# Issue tracker (GitHub issues and the Soma work graph)

## What this source contains

- GitHub issues and their comments: the report, the discussion, the closing note
- Work-graph nodes, which are GitHub issues with a typed block: the deliverable, the "Settled by" decision they cite, acceptance criteria, assumptions, out-of-scope, the parent map and the blocking edges
- Decision nodes, where the principal's ruling and the options considered are recorded
- Issue and node numbers mentioned in commit messages, PR bodies and code comments

Strongest when the why is external to the code: a product ask, a ruling, a constraint that came from outside engineering.

## How to search it

Read-only. Never edit, comment on, claim or close an issue or node.

```bash
# An issue or node by number, with its comments
gh issue view <number> --json title,body,author,createdAt,closedAt,labels,comments

# Search by the words in the code or the question
gh issue list --state all --search '<keywords>' --json number,title,state,closedAt --limit 30

# The same node as the work graph sees it: status, parent, blockers, settled-by
soma graph node <number> --repo <owner>/<repo>

# A map's decisions, in order, with what each settled
soma graph decisions <root-node> --repo <owner>/<repo>
```

Follow a node's `Settled by` links and its parent map within the tracker, and read the decision they cite. Record the numbers you open and the keywords you searched, including the searches that found nothing.

Take the repository from `git remote get-url origin` when the question does not name one. If `gh` is unauthenticated, or `soma` is not installed or has no graph for the repository, report which and why, and carry on with the other command.
