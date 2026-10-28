import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const manifest = new URL('./arc-manifest.yaml', import.meta.url);
const original = readFileSync(manifest, 'utf8');
const entry = '  - path: skills/benchmark-checklist\n';
const mode = process.argv[2] ?? 'separated';
try {
  const changed = mode === 'adjacent'
    ? original.replace(entry, entry + entry)
    : original + entry;
  writeFileSync(manifest, changed);
  const result = spawnSync('bun', ['scripts/check-pack.ts'], {
    cwd: new URL('.', import.meta.url), encoding: 'utf8',
  });
  process.stdout.write(result.stdout);
  process.stdout.write(result.stderr);
  console.log(`exit code: ${result.status}`);
} finally {
  writeFileSync(manifest, original);
}
