import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(import.meta.dir, "../skills/playbooks/scripts/worktree-audit.ts");
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function git(cwd: string, ...args: string[]) {
  const result = Bun.spawnSync(["git", "-C", cwd, ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "worktree-audit-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "base");
  for (const name of ["merged", "wip", "scratch", "recent"]) git(repo, "worktree", "add", "-q", "-b", name, join(root, name));
  git(join(root, "wip"), "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "ahead");
  writeFileSync(join(root, "wip", "tracked.txt"), "a\n");
  git(join(root, "wip"), "add", "tracked.txt");
  writeFileSync(join(root, "scratch", "notes.txt"), "b\n");
  writeFileSync(join(root, ".gitignore"), "sessions/*/*\n");
  git(root, "init", "-q");
  const sessions = join(root, "sessions", repo.replace(/[/.]/g, "-") + "--worktrees");
  mkdirSync(sessions, { recursive: true });
  writeFileSync(join(sessions, "s.jsonl"), `{"command":"cd ${join(root, "recent")} && ls"}\n{"command":"ls ${join(root, "merged")}-r2"}\n`);
  return { root, repo, sessionsDir: join(root, "sessions") };
}

function audit(repo: string, sessionsDir: string) {
  const result = Bun.spawnSync(["bun", script, "-b", "main", repo], {
    stdout: "pipe", stderr: "pipe", env: { ...process.env, SOMA_AUDIT_SESSIONS_DIR: sessionsDir, GH_TOKEN: "" },
  });
  expect(result.exitCode).toBe(0);
  const rows = result.stdout.toString().trim().split("\n").slice(2).map((line) => line.split("\t"));
  return new Map(rows.map((cells) => [cells[8]!.split("/").at(-1)!, cells]));
}

test("the audit buckets each worktree and leaves every one in place", () => {
  const { root, repo, sessionsDir } = fixture();
  const rows = audit(repo, sessionsDir);
  expect([...rows.keys()].sort()).toEqual(["merged", "recent", "scratch", "wip"]);
  expect(rows.get("merged")!.slice(2, 4)).toEqual(["YES", "clean"]);
  expect(rows.get("merged")![7]).toBe("safe");
  expect(rows.get("wip")!.slice(2, 4)).toEqual(["no", "wip:1"]);
  expect(rows.get("wip")![7]).toBe("hold-wip");
  expect(rows.get("scratch")![3]).toBe("scratch:1");
  expect(rows.get("recent")![7]).toBe("verify-recent-session");
  expect(rows.get("merged")![6]).toBe("-");
  const listed = Bun.spawnSync(["git", "-C", repo, "worktree", "list"], { stdout: "pipe" }).stdout.toString();
  for (const name of ["merged", "wip", "scratch", "recent"]) expect(listed).toContain(join(root, name));
});
