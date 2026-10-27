---
name: create-verification-skill
description: "Generate a project-local verify-<app> skill that drives the real app surface (web, CLI, TUI, service) the way a user does, with a feature map and captured evidence. Use when a project has no scripted way to prove behavior."
route: "Proving a change on the real app surface when the project has no scripted way to drive it (no verify-<project> skill yet)."
disable-model-invocation: true
triggers:
  - pattern: "/create-verification-skill"
    type: command
    priority: 100
---

# Create a verification skill

Every serious project needs a scripted way to drive the real app and prove behavior: launch it, exercise a feature the way a user would, capture evidence. This skill generates that as a project-local skill, `verify-<app>`, tailored to the repo. Write it for the next agent, not a human: it will be read cold, mid-task, by an agent that has never seen the app.

**Where it goes.** The project's skill directory for the active substrate: `<repo>/.claude/skills/verify-<app>/` for Claude Code, `<repo>/.agents/skills/verify-<app>/` for substrates that read that path. If the repo already has a project skill directory, use it. The skill body stays substrate-neutral: shell commands and file paths, no tool-call syntax.

## 1. Interview the repo, not the principal

Answer from the codebase; ask only what you cannot observe:

- **Surface:** what does a user touch? Web UI, CLI/TUI, desktop app, API, mobile app, library? Pick the primary one, note the rest.
- **Run:** how does the app start locally? Prefer the repo's documented dev command (`package.json` scripts, Makefile, README). Note ports, env vars, seed data, auth.
- **Drive:** how can an agent interact programmatically? Existing harnesses first (Playwright specs, expect scripts, PTY helpers, curl-able endpoints, a debug port). Only then a generic recipe: the `browser` skill or Playwright for web and Electron, tmux/PTY for CLI/TUI, plain HTTP for services.
- **Observe:** what evidence can be captured? Screenshots, terminal transcripts, response bodies, logs, exit codes, DB state.
- **Isolate:** can two instances run side by side (ports, data dirs, profiles)? If not, say so in the generated skill: refusing to double-drive a shared instance beats corrupting the principal's session.

If the checkout does not build or start as-is, fix that first or report it precisely; a skill written against a broken base teaches wrong steps. When an irrelevant missing asset blocks startup (a static dir the API never serves, a sample config), the generated skill may create it, marked as verification scaffolding, and remove it in cleanup.

## 2. Generate the skill

Write `verify-<app>/SKILL.md` with frontmatter (`name: verify-<app>` and a `description` naming the app, the surface and when to reach for it; without frontmatter the skill never registers) and these sections, each grounded in what the interview found, no placeholders left:

- **Launch:** the exact command that starts the app for verification, and how to tell it is ready (a log line, a prompt). Launch reaches a usable state from an empty data dir, migrations and seed data included. Ready means usable, not just that a process answers: a DB health check can pass while init scripts still run. Include teardown. For a short-lived CLI or TUI there is no server: build once, then start each drive in its own isolated PTY or tmux session.
- **Doctor:** one read-only check for "is this instance worth driving?": process up, right version/build, port owned by us, auth valid. Run it first whenever anything looks off.
- **Drive:** the harness recipe with real selectors and commands from this repo, not examples. Prefer stable handles (ARIA labels, data attributes, prompt strings, route paths) over coordinates and tab order.
- **Evidence:** what to capture and where it goes. Proof standards: exercise the real user path, not internal setters or test-only endpoints; capture the action and the resulting state, not just the final screen; verify side effects (files written, rows inserted, messages sent) alongside what is visible; mocks only where a production boundary already isolates the external system. When the safe path is a dry-run or test mode, verify what it actually skips by observing (files, network, git refs), not by trusting its name.
- **Cleanup:** tear down what the run created. Never kill by process name; kill what you started. Cleanup removes instances and scratch state, never the evidence: proof artifacts survive in a location the skill names.
- **Helpers:** any script the skill ships is executable and its invocation is shown in the skill body.

## 3. Seed the feature map

Create `verify-<app>/features/README.md` plus one file per user-facing feature (top 3-5 to start, from routes, commands, menus or docs). Follow the shape in [`references/feature-map-example/`](references/feature-map-example/README.md): a README index and one file per feature. Each file answers, from the user's point of view: what the feature is, how to reach it, how to drive it, and what observable end state proves it works. The four H2s are `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>` and `Gotchas`. If the seed data lacks a precondition a journey needs, the journey reports a failure and the reason goes in that feature's `Gotchas`. Never weaken the journey to make it pass. The map is the repo's maintained verification source; a proof that drives one convenient entry point is incomplete when the map lists others.

## 4. Prove the generated skill before handing it over

Run its instructions end to end once: launch, doctor, drive ONE mapped feature, capture evidence, clean up. After cleanup, confirm the evidence still exists at the named location; a cleanup that eats the proof fails this step. Fix what fails, and run the generated cleanup after every failed iteration so broken attempts do not strand processes and ports. A generated skill that was never executed is a draft, not a deliverable. If you proved it in a stand-in for the real target (a container instead of a fresh VM, a local stack instead of a remote one), list every setup step the stand-in did that the target will not; those stay unverified.

## 5. Keep the map honest

Tell the principal the map drifts as the app changes: re-run step 3 for new features and step 4 after a feature's UI or commands change. A dedicated maintenance skill is a follow-up once a verify skill exists for a real project.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml.
