---
name: sharpen
description: "Make a task deeper, not bigger, then rewrite the prompt. Use for /sharpen, or when the principal asks to sharpen a task brief or prompt."
triggers:
  - pattern: "/sharpen"
    type: command
    priority: 100
  - pattern: "sharpen this task"
    type: keyword
    priority: 60
  - pattern: "sharpen this prompt"
    type: keyword
    priority: 60
  - pattern: "deeper, not bigger"
    type: keyword
    priority: 60
---

I want a deeper version of this task, not a bigger one. Before rewriting it, do four things:

1. Say what a top professional in this field would do here that I'm not asking for.
2. Name the rawest material they would start from instead of what has already been digested for me.
3. Name the specific methods and tools they would use.
4. Say what, other than you or me, would show the result is right.

Then rewrite my prompt to ask for exactly that.

Leave choices that are mine to make open instead of deciding them.

## Output

- Answer the four points under four headings, in that order. Do not start the task itself.
- Follow them with the rewritten prompt.
- A choice the principal stated (a tool, a scope, a format, a deadline, a name) stays in the rewrite as stated. A choice the original left unmade stays unmade: the rewrite lists it as an open question for the principal instead of picking an answer.

Source: ported from pstack `pstack/skills/sharpen/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c. Changed: triggers added, `disable-model-invocation` dropped, and the Output section added. The upstream text above it is verbatim.
