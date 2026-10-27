import { afterEach, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(import.meta.dir, "../skills/worktree-audit/scripts/worktree-audit.ts");
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function git(cwd: string, ...args: string[]): string {
  const result = Bun.spawnSync(["git", "-C", cwd, "-c", "user.email=t@t", "-c", "user.name=t", ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.toString().trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "worktree-audit-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "commit", "-q", "--allow-empty", "-m", "base");
  for (const name of ["merged", "wip", "scratch", "recent"]) git(repo, "worktree", "add", "-q", "-b", name, join(root, name));
  git(join(root, "wip"), "commit", "-q", "--allow-empty", "-m", "ahead");
  writeFileSync(join(root, "wip", "tracked.txt"), "a\n");
  git(join(root, "wip"), "add", "tracked.txt");
  writeFileSync(join(root, "scratch", "notes.txt"), "b\n");
  const ahead = git(repo, "commit-tree", "-p", "HEAD", "-m", "remote moved on", `${git(repo, "rev-parse", "HEAD")}^{tree}`);
  git(repo, "update-ref", "refs/remotes/origin/merged", ahead);
  // ~/.claude ignores its own transcript files; the audit must still see them.
  writeFileSync(join(root, ".gitignore"), "sessions/*/*\n");
  git(root, "init", "-q");
  const sessions = join(root, "sessions", repo.replace(/[/.]/g, "-") + "--worktrees");
  mkdirSync(sessions, { recursive: true });
  writeFileSync(join(sessions, "s.jsonl"), `{"command":"cd ${join(root, "recent")} && ls"}\n{"command":"ls ${join(root, "merged")}-r2"}\n`);
  return { root, repo, sessionsDir: join(root, "sessions") };
}

function audit(repo: string, sessionsDir: string, path = process.env.PATH) {
  const result = Bun.spawnSync([process.execPath, script, "-b", "main", repo], {
    stdout: "pipe", stderr: "pipe", env: { ...process.env, PATH: path, SOMA_AUDIT_SESSIONS_DIR: sessionsDir, GH_TOKEN: "" },
  });
  const [, header = "", ...lines] = result.stdout.toString().trim().split("\n");
  const columns = header.split("\t");
  const rows = lines.map((line) => Object.fromEntries(line.split("\t").map((cell, i) => [columns[i], cell])) as Record<string, string>);
  return { code: result.exitCode, stderr: result.stderr.toString(), rows: new Map(rows.map((row) => [row.WORKTREE!.split("/").at(-1)!, row])) };
}

test("the audit buckets each worktree and leaves every one in place", () => {
  const { root, repo, sessionsDir } = fixture();
  const { code, rows } = audit(repo, sessionsDir);
  expect(code).toBe(0);
  expect([...rows.keys()].sort()).toEqual(["merged", "recent", "scratch", "wip"]);
  expect(rows.get("merged")).toMatchObject({ MERGED: "YES", DIRTY: "clean", REMOTE: "behind1", LAST_SESSION: "-", BUCKET: "safe" });
  expect(rows.get("wip")).toMatchObject({ MERGED: "no", DIRTY: "wip:1", REMOTE: "no-remote", BUCKET: "hold-wip" });
  expect(rows.get("scratch")).toMatchObject({ DIRTY: "scratch:1" });
  expect(rows.get("recent")).toMatchObject({ BUCKET: "verify-recent-session" });
  const listed = git(repo, "worktree", "list");
  for (const name of ["merged", "wip", "scratch", "recent"]) expect(listed).toContain(join(root, name));
});

test("an rg that cannot run stops the audit instead of reading as no session", () => {
  const { root, repo, sessionsDir } = fixture();
  const bin = join(root, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "rg"), "#!/bin/sh\necho 'rg: broken' >&2\nexit 2\n");
  chmodSync(join(bin, "rg"), 0o755);
  const { code, stderr } = audit(repo, sessionsDir, `${bin}:${process.env.PATH}`);
  expect(code).toBe(1);
  expect(stderr).toContain("rg could not scan");
});
