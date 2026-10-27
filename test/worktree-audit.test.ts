import { afterEach, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(import.meta.dir, "../skills/worktree-audit/scripts/worktree-audit.ts");
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

const slug = (path: string) => path.replace(/[/.]/g, "-");

function git(cwd: string, ...args: string[]): string {
  const result = Bun.spawnSync(["git", "-C", cwd, "-c", "user.email=t@t", "-c", "user.name=t", ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.toString().trim();
}

function executable(path: string, body: string) {
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "worktree-audit-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "commit", "-q", "--allow-empty", "-m", "base");
  const names = ["merged", "wip", "scratch", "recent", "squashed", "closed", "unpushed"];
  for (const name of names) git(repo, "worktree", "add", "-q", "-b", name, join(root, name));
  git(join(root, "wip"), "commit", "-q", "--allow-empty", "-m", "ahead");
  writeFileSync(join(root, "wip", "tracked.txt"), "a\n");
  git(join(root, "wip"), "add", "tracked.txt");
  writeFileSync(join(root, "scratch", "notes.txt"), "b\n");
  const ahead = git(repo, "commit-tree", "-p", "HEAD", "-m", "remote moved on", `${git(repo, "rev-parse", "HEAD")}^{tree}`);
  git(repo, "update-ref", "refs/remotes/origin/merged", ahead);
  for (const name of ["squashed", "closed", "unpushed"]) {
    git(join(root, name), "commit", "-q", "--allow-empty", "-m", `${name} work`);
    git(repo, "update-ref", `refs/remotes/origin/${name}`, git(join(root, name), "rev-parse", name === "unpushed" ? "HEAD~1" : "HEAD"));
  }

  const bin = join(root, "bin");
  mkdirSync(bin);
  const prs = [
    { number: 1, state: "MERGED", headRefName: "squashed" },
    { number: 2, state: "CLOSED", headRefName: "closed" },
    { number: 3, state: "MERGED", headRefName: "unpushed" },
  ];
  executable(join(bin, "gh"), `echo '${JSON.stringify(prs)}'`);

  // ~/.claude ignores its own transcript files; the audit must still see them.
  writeFileSync(join(root, ".gitignore"), "sessions/*/*\n");
  git(root, "init", "-q");
  const sessions = join(root, "sessions");
  // A session started inside a worktree outside the repo's path gets its own directory.
  mkdirSync(join(sessions, slug(join(root, "recent"))), { recursive: true });
  writeFileSync(join(sessions, slug(join(root, "recent")), "s.jsonl"), `{"command":"cd ${join(root, "recent")} && ls"}\n`);
  mkdirSync(join(sessions, `${slug(repo)}--worktrees`), { recursive: true });
  writeFileSync(join(sessions, `${slug(repo)}--worktrees`, "s.jsonl"), `{"command":"ls ${join(root, "merged")}-r2"}\n`);
  return { root, repo, bin, sessionsDir: sessions, names };
}

function audit(repo: string, sessionsDir: string, bin: string) {
  const result = Bun.spawnSync([process.execPath, script, "-b", "main", repo], {
    stdout: "pipe", stderr: "pipe", env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SOMA_AUDIT_SESSIONS_DIR: sessionsDir },
  });
  const [, header = "", ...lines] = result.stdout.toString().trim().split("\n");
  const columns = header.split("\t");
  const rows = lines.map((line) => Object.fromEntries(line.split("\t").map((cell, i) => [columns[i], cell])) as Record<string, string>);
  return { code: result.exitCode, stderr: result.stderr.toString(), rows: new Map(rows.map((row) => [row.WORKTREE!.split("/").at(-1)!, row])) };
}

test("the audit buckets each worktree and leaves every one in place", () => {
  const { root, repo, bin, sessionsDir, names } = fixture();
  const { code, rows } = audit(repo, sessionsDir, bin);
  expect(code).toBe(0);
  expect([...rows.keys()].sort()).toEqual([...names].sort());
  expect(rows.get("merged")).toMatchObject({ MERGED: "YES", DIRTY: "clean", REMOTE: "behind1", LAST_SESSION: "-", BUCKET: "safe" });
  expect(rows.get("wip")).toMatchObject({ MERGED: "no", DIRTY: "wip:1", REMOTE: "no-remote", BUCKET: "hold-wip" });
  expect(rows.get("scratch")).toMatchObject({ DIRTY: "scratch:1" });
  expect(rows.get("recent")).toMatchObject({ BUCKET: "verify-recent-session" });
  expect(rows.get("squashed")).toMatchObject({ MERGED: "no", REMOTE: "pushed", PR: "#1/merged", BUCKET: "safe" });
  expect(rows.get("closed")).toMatchObject({ PR: "#2/closed", BUCKET: "review" });
  expect(rows.get("unpushed")).toMatchObject({ REMOTE: "ahead1", PR: "#3/merged", BUCKET: "review" });
  const listed = git(repo, "worktree", "list");
  for (const name of names) expect(listed).toContain(join(root, name));
}, 30_000);

test("an rg that cannot run stops the audit instead of reading as no session", () => {
  const { repo, bin, sessionsDir } = fixture();
  executable(join(bin, "rg"), "echo 'rg: broken' >&2\nexit 2");
  const { code, stderr } = audit(repo, sessionsDir, bin);
  expect(code).toBe(1);
  expect(stderr).toContain("rg could not scan");
}, 30_000);
