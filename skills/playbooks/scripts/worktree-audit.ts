#!/usr/bin/env bun
// Read-only worktree audit for the Cleanup card. Classifies every git worktree
// but the main one by size, merge state, uncommitted work, remote and PR state,
// and the newest agent session that touched it, then suggests a bucket. It never
// deletes anything; removal stays gated by the principal's approval.
//
// Usage: bun worktree-audit.ts [-b|--base <ref>] [repo-path]
//   -b sets the ref the MERGED column checks against. Without it: origin/HEAD,
//   then origin/main, then origin/master.
//   SOMA_AUDIT_SESSIONS_DIR overrides ~/.claude/projects, where Claude Code
//   keeps one directory of session transcripts per working directory.
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RECENT_DAYS = 4;

function run(cmd: string[], cwd?: string): { ok: boolean; out: string } {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  return { ok: result.exitCode === 0, out: result.stdout.toString().trim() };
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
  if (requested?.startsWith("origin/")) {
    const branch = requested.slice("origin/".length);
    if (!git(repo, "fetch", "--quiet", "origin", `+refs/heads/${branch}:refs/remotes/${requested}`).ok) {
      console.error(`warn: could not fetch ${requested}; MERGED may be stale`);
    }
  }
  const candidates = requested === undefined
    ? [git(repo, "symbolic-ref", "--short", "refs/remotes/origin/HEAD").out, "origin/main", "origin/master"]
    : [requested];
  const base = candidates.find((ref) => ref !== "" && git(repo, "rev-parse", "--verify", "--quiet", `${ref}^{commit}`).ok);
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
  if (!listed.ok) return byBranch;
  for (const pr of JSON.parse(listed.out) as { number: number; state: string; headRefName: string }[]) {
    if (!byBranch.has(pr.headRefName)) byBranch.set(pr.headRefName, `#${pr.number}/${pr.state.toLowerCase()}`);
  }
  return byBranch;
}

/** Claude Code names a session directory after its working directory, with `/` and `.` as `-`. */
const sessionSlug = (path: string) => path.replace(/[/.]/g, "-");

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Newest transcript under the repo's session directories that mentions the
 * worktree path. The path must not run on into a longer name, so `soma-682`
 * does not match `soma-682-r2`. `--no-ignore` because a gitignore above the
 * sessions directory (`~/.claude` ignores its transcript files) would otherwise
 * hide every transcript.
 */
function lastSession(sessionsDir: string, mainSlug: string, worktree: string): number | undefined {
  if (!existsSync(sessionsDir)) return undefined;
  const dirs = readdirSync(sessionsDir).filter((name) => name.startsWith(mainSlug)).map((name) => join(sessionsDir, name));
  if (dirs.length === 0) return undefined;
  const hits = run(["rg", "-l", "--no-ignore", "-e", `${escapeRegex(worktree)}([^A-Za-z0-9._-]|$)`, ...dirs]);
  const mtimes = hits.out.split("\n").filter(Boolean).map((file) => statSync(file).mtimeMs);
  return mtimes.length === 0 ? undefined : Math.max(...mtimes);
}

function dirtyState(worktree: string): string {
  const lines = git(worktree, "status", "--porcelain").out.split("\n").filter(Boolean);
  const tracked = lines.filter((line) => !line.startsWith("??")).length;
  if (lines.length === 0) return "clean";
  return tracked > 0 ? `wip:${tracked}` : `scratch:${lines.length}`;
}

function remoteState(worktree: string, branch: string, head: string): string {
  if (branch === "") return "detached";
  const remote = git(worktree, "rev-parse", "--verify", "--quiet", `refs/remotes/origin/${branch}`);
  if (!remote.ok) return "no-remote";
  return remote.out === head ? "pushed" : `ahead${git(worktree, "rev-list", "--count", `origin/${branch}..HEAD`).out}`;
}

function bucket(row: { dirty: string; pr: string; merged: boolean; recent: boolean }): string {
  if (row.dirty.startsWith("wip:")) return "hold-wip";
  if (/\/(open|draft)$/.test(row.pr)) return "hold-open-pr";
  if (row.recent) return "verify-recent-session";
  return row.merged || row.pr !== "-" ? "safe" : "review";
}

const { base: requestedBase, repo: repoArg } = parseArgs(process.argv.slice(2));
const repo = repoArg ?? run(["git", "rev-parse", "--show-toplevel"]).out;
if (repo === "" || !git(repo, "rev-parse", "--git-dir").ok) fail("not in a git repo; pass a repo path");

const base = resolveBase(repo, requestedBase);
const [main, ...candidates] = worktrees(repo);
const prs = pullRequests(repo);
const sessionsDir = process.env.SOMA_AUDIT_SESSIONS_DIR ?? join(homedir(), ".claude", "projects");
const now = Date.now();
const day = 86_400_000;

const rows = candidates.map((worktree) => {
  const du = run(["du", "-sk", worktree]).out.split("\t")[0] ?? "0";
  const head = git(worktree, "rev-parse", "HEAD").out;
  const headTime = Number(git(worktree, "log", "-1", "--format=%ct", "HEAD").out) * 1000;
  const branch = git(worktree, "symbolic-ref", "--quiet", "--short", "HEAD").out;
  const merged = git(repo, "merge-base", "--is-ancestor", head, base).ok;
  const dirty = dirtyState(worktree);
  const pr = (branch !== "" && prs.get(branch)) || "-";
  const session = lastSession(sessionsDir, sessionSlug(main!), worktree);
  const recent = session !== undefined && now - session <= RECENT_DAYS * day;
  return {
    kb: Number(du),
    cells: [
      `${Math.round(Number(du) / 1024)}M`,
      headTime > 0 ? `${Math.floor((now - headTime) / day)}d` : "?",
      merged ? "YES" : "no",
      dirty,
      remoteState(worktree, branch, head),
      pr,
      session === undefined ? "-" : new Date(session).toISOString().slice(0, 10),
      bucket({ dirty, pr, merged, recent }),
      worktree,
    ],
  };
});

console.log(`# base: ${base}`);
console.log(["SIZE", "AGE", "MERGED", "DIRTY", "REMOTE", "PR", "LAST_SESSION", "BUCKET", "WORKTREE"].join("\t"));
for (const { cells } of rows.sort((a, b) => b.kb - a.kb)) console.log(cells.join("\t"));
