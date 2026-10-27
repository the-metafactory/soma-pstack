#!/usr/bin/env bun
// Read-only worktree audit for the Cleanup card. Classifies every git worktree
// but the main one by size, merge state, uncommitted work, remote and PR state,
// and the newest agent session that touched it, then suggests a bucket. It
// never fetches, writes or deletes; removal stays gated by the principal's
// approval.
//
// Usage: bun worktree-audit.ts [-b|--base <ref>] [repo-path]
//   -b sets the ref the MERGED column checks against. Without it: origin/HEAD,
//   then origin/main, then origin/master. The ref is read as it is locally;
//   run `git fetch` first for a fresh one.
//   SOMA_AUDIT_SESSIONS_DIR overrides ~/.claude/projects, where Claude Code
//   keeps one directory of session transcripts per working directory.
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const COLUMNS = ["SIZE", "AGE", "MERGED", "DIRTY", "REMOTE", "PR", "LAST_SESSION", "BUCKET", "WORKTREE"] as const;

const RECENT_DAYS = 4;
const DAY_MS = 86_400_000;

function run(cmd: string[], cwd?: string): { code: number; out: string; err: string } {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  return { code: result.exitCode, out: result.stdout.toString().trim(), err: result.stderr.toString().trim() };
}

const git = (cwd: string, ...args: string[]) => run(["git", "-C", cwd, ...args]);

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): { base?: string; repo?: string } {
  const parsed: { base?: string; repo?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-b" || arg === "--base") {
      if (argv[i + 1] === undefined) fail(`${arg} needs a ref`);
      parsed.base = argv[++i];
    } else if (arg.startsWith("-")) {
      fail(`unknown option: ${arg}`);
    } else {
      parsed.repo = arg;
    }
  }
  return parsed;
}

function resolveBase(repo: string, requested?: string): string {
  const candidates = requested === undefined
    ? [git(repo, "symbolic-ref", "--short", "refs/remotes/origin/HEAD").out, "origin/main", "origin/master"]
    : [requested];
  const base = candidates.find((ref) => ref !== "" && git(repo, "rev-parse", "--verify", "--quiet", `${ref}^{commit}`).code === 0);
  if (base === undefined) fail(requested === undefined ? "no base ref found; pass -b <ref>" : `base ref not found: ${requested}`);
  if (requested === undefined) console.error(`warn: no -b given; MERGED checks against ${base}`);
  return base;
}

function worktrees(repo: string): string[] {
  return git(repo, "worktree", "list", "--porcelain").out
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length));
}

function pullRequests(repo: string): Map<string, string> {
  const listed = run(["gh", "pr", "list", "--author", "@me", "--state", "all", "--limit", "1000", "--json", "number,state,headRefName"], repo);
  const byBranch = new Map<string, string>();
  if (listed.code !== 0) {
    console.error("warn: gh could not list PRs; the PR column is empty");
    return byBranch;
  }
  for (const pr of JSON.parse(listed.out) as { number: number; state: string; headRefName: string }[]) {
    if (!byBranch.has(pr.headRefName)) byBranch.set(pr.headRefName, `#${pr.number}/${pr.state.toLowerCase()}`);
  }
  return byBranch;
}

/** Claude Code names a session directory after its working directory, with `/` and `.` as `-`. */
const sessionSlug = (path: string) => path.replace(/[/.]/g, "-");

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Newest transcript time per worktree, from one scan of the session
 * directories named after the main repo or after any worktree, since a
 * session started inside a worktree outside the repo's path has its own. A path counts only when it does not run on into a longer name,
 * so `soma-682` does not match `soma-682-r2`. `--no-ignore` because a gitignore
 * above the sessions directory (`~/.claude` ignores its transcript files) would
 * otherwise hide every transcript. An rg failure stops the audit: reading it as
 * "no session" would bucket a live worktree as safe.
 */
function lastSessions(sessionsDir: string, main: string, paths: readonly string[]): Map<string, number> {
  const newest = new Map<string, number>();
  if (paths.length === 0 || !existsSync(sessionsDir)) return newest;
  const slugs = [main, ...paths].map(sessionSlug);
  const dirs = readdirSync(sessionsDir)
    .filter((name) => slugs.some((slug) => name.startsWith(slug)))
    .map((name) => join(sessionsDir, name));
  if (dirs.length === 0) return newest;
  const patterns = paths.flatMap((path) => ["-e", `${escapeRegex(path)}(?:[^A-Za-z0-9._-]|$)`]);
  const hits = run(["rg", "--no-ignore", "--with-filename", "--no-line-number", "--only-matching", ...patterns, ...dirs]);
  if (hits.code > 1) fail(`rg could not scan ${sessionsDir}: ${hits.err || `exit ${hits.code}`}`);
  const byLength = [...paths].sort((a, b) => b.length - a.length);
  const mtimes = new Map<string, number>();
  for (const line of hits.out.split("\n").filter(Boolean)) {
    const split = line.indexOf(":/");
    const file = line.slice(0, split);
    const match = line.slice(split + 1);
    const path = byLength.find((candidate) => match === candidate || (match.startsWith(candidate) && match.length === candidate.length + 1));
    if (path === undefined) continue;
    const mtime = mtimes.get(file) ?? statSync(file).mtimeMs;
    mtimes.set(file, mtime);
    newest.set(path, Math.max(newest.get(path) ?? 0, mtime));
  }
  return newest;
}

function dirtyState(worktree: string): string {
  const lines = git(worktree, "status", "--porcelain").out.split("\n").filter(Boolean);
  const tracked = lines.filter((line) => !line.startsWith("??")).length;
  if (lines.length === 0) return "clean";
  return tracked > 0 ? `wip:${tracked}` : `scratch:${lines.length}`;
}

function remoteState(worktree: string, branch: string): string {
  if (branch === "") return "detached";
  if (git(worktree, "rev-parse", "--verify", "--quiet", `refs/remotes/origin/${branch}`).code !== 0) return "no-remote";
  const [behind = 0, ahead = 0] = git(worktree, "rev-list", "--left-right", "--count", `origin/${branch}...HEAD`).out.split(/\s+/).map(Number);
  if (ahead > 0 && behind > 0) return `diverged+${ahead}-${behind}`;
  if (ahead > 0) return `ahead${ahead}`;
  if (behind > 0) return `behind${behind}`;
  return "pushed";
}

/** `safe` needs the work landed (an ancestor of base or a merged PR) and nothing unpushed on top. */
function bucket(row: { dirty: string; pr: string; remote: string; merged: boolean; recent: boolean }): string {
  if (row.dirty.startsWith("wip:")) return "hold-wip";
  if (/\/(open|draft)$/.test(row.pr)) return "hold-open-pr";
  if (row.recent) return "verify-recent-session";
  if (/^(ahead|diverged)/.test(row.remote)) return "review";
  return row.merged || row.pr.endsWith("/merged") ? "safe" : "review";
}

const { base: requestedBase, repo: repoArg } = parseArgs(process.argv.slice(2));
const repo = repoArg ?? run(["git", "rev-parse", "--show-toplevel"]).out;
if (repo === "" || git(repo, "rev-parse", "--git-dir").code !== 0) fail("not in a git repo; pass a repo path");

const base = resolveBase(repo, requestedBase);
const [main, ...candidates] = worktrees(repo);
const prs = pullRequests(repo);
const sessionsDir = process.env.SOMA_AUDIT_SESSIONS_DIR ?? join(homedir(), ".claude", "projects");
const sessions = lastSessions(sessionsDir, main!, candidates);
const now = Date.now();

const rows = candidates.map((worktree) => {
  const kb = Number(run(["du", "-sk", worktree]).out.split("\t")[0] ?? 0);
  const head = git(worktree, "rev-parse", "HEAD").out;
  const headTime = Number(git(worktree, "log", "-1", "--format=%ct", "HEAD").out) * 1000;
  const branch = git(worktree, "symbolic-ref", "--quiet", "--short", "HEAD").out;
  const merged = git(repo, "merge-base", "--is-ancestor", head, base).code === 0;
  const dirty = dirtyState(worktree);
  const pr = (branch !== "" && prs.get(branch)) || "-";
  const session = sessions.get(worktree);
  const recent = session !== undefined && now - session <= RECENT_DAYS * DAY_MS;
  const remote = remoteState(worktree, branch);
  return {
    kb,
    cells: [
      `${Math.round(kb / 1024)}M`,
      headTime > 0 ? `${Math.floor((now - headTime) / DAY_MS)}d` : "?",
      merged ? "YES" : "no",
      dirty,
      remote,
      pr,
      session === undefined ? "-" : new Date(session).toISOString().slice(0, 10),
      bucket({ dirty, pr, remote, merged, recent }),
      worktree,
    ],
  };
});

console.log(`# base: ${base}`);
console.log(COLUMNS.join("\t"));
for (const { cells } of rows.sort((a, b) => b.kb - a.kb)) console.log(cells.join("\t"));
