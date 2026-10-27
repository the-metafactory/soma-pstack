---
name: why
description: "Reconstruct the motivation behind code from a fixed roster of evidence sources (git and PR review threads, issues and graph nodes, docs, chat, Soma's own record) and return a cited read that separates found from inferred. USE WHEN why does X work this way, why did we pick Y, design rationale, regression history, postmortem, where does this threshold come from, why does this live here. NOT FOR what the code does at runtime (use how)."
triggers:
  - pattern: "why does .* work this way"
    type: keyword
    priority: 70
  - pattern: "why did we pick"
    type: keyword
    priority: 70
  - pattern: "design rationale"
    type: keyword
    priority: 60
  - pattern: "why is it this way"
    type: keyword
    priority: 60
  - pattern: "regression history"
    type: keyword
    priority: 60
  - pattern: "postmortem"
    type: keyword
    priority: 50
---

# Why

Investigate the motivation and intent behind code. The companion `how` skill answers what the code does and how it works. `why` answers what forces led to its shape.

## Models

Spawn each investigator with model `haiku` and the synthesizer with model `opus`. State that choice in the spawn. If the substrate's sub-agent tool rejects a slug, use the closest valid slug of the same family from its error message and say so in the final answer.

Spawn every investigator and the synthesizer as a general-purpose sub-agent with the tools it needs: shell, file reads, and the `confluence` and `Discord` skills' CLIs. Investigators are read-only: they write no file (not even scratch output: filter large tool output with `grep` or `head` instead of saving it), post no message, and change no issue, node, page or record. A tool-less or read-only-mode sub-agent cannot run the CLIs the playbooks name, so don't use one.

## Operating Posture

Operate as a **careful, cautious, and precise investigator**. Be honest about what you know vs what you're inferring. Read `references/epistemics.md` for the full confidence framework and phrasing guide. The synthesizer must follow it.

## Step 1. Understand the Target and the Question

The **target** is usually a chunk of code, a pattern, a feature, or a named design decision. The **question** is usually a design rationale, a tradeoff, a motivating edge case, an external constraint, dead code, or a broad history sweep.

If the target is vague ("why do we do it this way?" with no clear referent), make your best guess from conversation context (open files, recent edits, what was just discussed). State your interpretation briefly so the user can redirect if you're off, then proceed.

## Step 2. Establish the Code Anchor

Before spawning investigators, build the seed context inline: file paths and line ranges, key symbols (functions, classes, constants), the last few commits touching the target, PR numbers from merge commits (pattern `(#1234)` in the subject line), and any linked ticket IDs. Run `git blame -L <start>,<end> <file>` for last-touch commits, `git log --follow -p -- <file>` for full history with patches through renames, `git log --oneline -20 -- <file>` for recent commits with PR numbers visible, and `git log -1 --format=%B <commit>` to extract PR numbers. Then pull the PR bodies and discussion for any substantive commit: `gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews`. This anchor goes to every investigator and to the synthesizer. Qualify every issue, PR and node number with its repository (`owner/repo#800`), because the same number exists in several repositories. When the target spans many files, use `git log --follow --oneline` and `--stat` instead of full patches, and read the patches of the substantive commits only. When the target is a directory or a set of files, anchor on the commits that created or moved it and say which files you took it to mean.

## Step 3. Spawn Parallel Investigators

**Default to the full parallel investigation.** The goal is a complete coverage map, not a minimal one. Document the null, don't skip the search.

### The roster

The roster is fixed. Do not discover other tools or add categories. Spawn one read-only investigator per category 1 to 5, all in a single message so they run concurrently, each owning exactly one category. Don't ask one agent to cover several. Category 6 has no source and gets no investigator.

Each category below is uniquely positioned to surface one shape of "why", shown after "Best at". Use it to know what to expect back and to name a gap when a category returns empty.

1. **Source control**: git and `gh` pull requests with their review threads, sage reviews included. Always on, the only guaranteed source. Playbooks: `references/sources/code-archaeology.md` and `references/sources/review-threads.md`. Best at *implementation-time rationale captured during review*.
2. **Issue tracker**: GitHub issues, plus `soma graph node` and `soma graph decisions` for work-graph nodes and the decisions they cite. Playbook: `references/sources/issue-tracker.md`. Best at *the product or business forcing function*. Strongest when the why is external to engineering.
3. **Long-form docs**: the repository's `docs/`, ADRs and GLOSSARY, plus Confluence through the `confluence` skill for SWITCH work. Playbook: `references/sources/long-form-docs.md`. Best at *long-form design rationale*, written out before it becomes code.
4. **Chat**: Discord through the `Discord` skill. Playbook: `references/sources/chat.md`. Best at *real-time deliberation that never reached a doc*. Especially important when the source control, tracker and doc paper trail is thin.
5. **Own record**: `soma memory search`, `soma algorithm list` and `show`, and session transcripts. Playbook: `references/sources/own-record.md`. Best at *what was said to an agent while the code was written*.
6. **Observability, error tracking, analytics**: no source. Record it as a gap, every time. Playbook: `references/sources/observability.md`. It would be best at *infrastructure and runtime reality*, the exceptions that motivated defensive code, and where a number came from, so name which claims the gap leaves open.

Each investigator's prompt is `references/investigator-prompt.md` filled in, plus:
- the category's playbook text from the roster above, pasted into the prompt, not referenced by path; `references/source-playbook.md` is the index
- `references/sources/incident-postmortem.md` **if the target code looks defensive** (null checks, retry logic, timeout handling, rate limiting, feature flags, egress guards, OOM handlers). It names Linear and Slack; in this roster read Linear as the issue tracker and Slack as chat, and search only the roster's tools
- the code anchor and the user's original question

### When a source fails

A tool that is missing, unauthenticated or unreachable (`gh` without a login, Discord unreachable, `soma` not installed, no Confluence token) is not a reason to stop. The investigator tries once, reports the command and the error verbatim under Gaps, and returns whatever its other commands found. The synthesis proceeds, and that category's line in Sources Consulted says it was unavailable and why.

### When to skip an investigator

Only with an **explicit, written justification** that goes in the final Sources Consulted. Two valid reasons:

- **The source is unavailable**, as above. Flag it as a gap, not a choice: "Chat: unavailable. `discord read` failed with <error>, so the conversational record was not searchable."
- **The source is provably irrelevant**, not just "probably irrelevant." A high bar: "Long-form docs, Confluence part skipped. The repository is not SWITCH work."

If your scope assessment suggests a single-commit trivial target where the PR description already contains the complete answer, you may answer inline **only after** confirming all five category searches would be redundant. Say so explicitly. This should be rare.

## Step 4. Synthesize

Spawn one synthesizer. It gets:
1. The investigator findings, including any null results and any categories that were unavailable or skipped with justification
2. The code anchor
3. The user's original question
4. The epistemics framework from `references/epistemics.md`
5. The synthesizer prompt template from `references/synthesizer-prompt.md`, with this roster overriding the template's seven-category wording

Fill the template's "Sources That Weren't Searched" with the category 6 gap and every category that was unavailable or skipped, each with its reason. State the override to the synthesizer, and to each investigator for its "Source" field: the evidence categories are this roster's six (source control; issue tracker; long-form docs; chat; own record; observability, error tracking, analytics) wherever the template lists seven or names "code comments" as one. Its Sources Consulted section has **six lines, one per roster category**, each opening with the bold category name as in the template, where the template lists seven. "No matching MCP available" in the template reads as "unavailable" or "no source in this pack" for this roster. Its sections are the template's; contradictions go under What We Found or Competing Hypotheses, with both citations.

## Step 5. Present

Present the synthesizer's output to the user. You may lightly edit for clarity or add context from the conversation, but **do not rewrite the confidence language**.

## Output Format

The structure is the one in `references/synthesizer-prompt.md`: The Question, The Code in Question, What We Found, What We Can Reasonably Infer, Competing Hypotheses, What We Don't Know, Sources Consulted, Confidence Summary. Adapt as needed, but keep the confidence separation intact, and keep Sources Consulted as one line per roster category, including the ones that returned nothing, were unavailable or skipped (with the reason), and category 6, which is always a gap.

After Sources Consulted, if the user's `why` question comes before a change to this code, convert the lineage findings into a Preserve / Change / Avoid / Risk constraint set for planning the change.

## Common Failure Modes to Avoid

- **Recency bias**. Assuming the most recent commit is authoritative. The current shape is often the accretion of many earlier decisions. Trace back.

Source: ported from pstack `pstack/skills/why/SKILL.md` at commit `99743e9c151c8537cbbf1f98bb38f34ef3368453` (MIT, © 2026 Lauren Tan); upstream pin in [arc-manifest.yaml](arc-manifest.yaml), notice in [../../NOTICE.md](../../NOTICE.md).
