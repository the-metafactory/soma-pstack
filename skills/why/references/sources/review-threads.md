# Review threads (source control addendum)

Read this together with `code-archaeology.md`. The commits say what changed; the review threads on the PR that carried them say what the reviewers pushed back on and what the author answered. That is where implementation-time rationale usually lives.

## What this source contains

- PR title, body, labels and linked issues
- PR conversation comments
- Reviews (approve, request changes, comment) with their bodies
- Inline review comments, attached to a file and a diff line, with their reply chains
- Automated reviewers' output. In the metafactory repositories that includes **sage** reviews: treat a sage review as a reviewer's finding with an author and a date, not as the author's intent. A sage review is usually a PR conversation comment headed "Sage code review", posted under the account that ran it, so it appears in `comments`, not in `reviews` or in the inline comments. Read all three.

## How to search it

Get the PR number from the commit subject, `(#1234)`, or from the merge commit:

```bash
git log -1 --format=%B <commit>
gh pr list --state merged --search '<commit-sha>' --json number,title
```

Then read everything on the PR, not the first page:

```bash
# Title, body, conversation, reviews
gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews

# Inline review comments with their file, line and reply chain
gh api --paginate repos/{owner}/{repo}/pulls/<number>/comments \
  --jq '.[] | {id, in_reply_to_id, user: .user.login, path, line, created_at, body}'

# PR conversation comments, where sage reviews land (each comment has html_url)
gh api --paginate repos/{owner}/{repo}/issues/<number>/comments \
  --jq '.[] | {id, user: .user.login, created_at, html_url, body}'

# Review bodies
gh api --paginate repos/{owner}/{repo}/pulls/<number>/reviews \
  --jq '.[] | {id, user: .user.login, state, submitted_at, body}'
```

Report every sage review you find on the PRs that carried the anchor's commits, even when it only discusses the diff: it is evidence of what a reviewer asked for. Quote the comment that answers the question, with its author, its date and its permalink (`html_url`). A review comment that the author answered with a change is stronger evidence than one that went unanswered; record which it was.

If `gh` is unauthenticated or the PR is not reachable, say so once and report what git alone showed. Do not guess a PR's content from its title.
