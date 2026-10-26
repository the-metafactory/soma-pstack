import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=dirname(fileURLToPath(import.meta.url));
const piPackage=process.env.PI_PACKAGE_DIR;
assert(piPackage, 'Set PI_PACKAGE_DIR to an installed pi-coding-agent package');
const { loadExtensions } = await import(pathToFileURL(join(piPackage,'dist/core/extensions/loader.js')));
const piVersion=JSON.parse(readFileSync(join(piPackage,'package.json'),'utf8')).version;
const revision=process.argv[2];
const paths=JSON.parse(readFileSync(`${root}/projections/${revision}/entries.json`,'utf8'));
const result=await loadExtensions(paths,`${root}/fixture-home`);
console.log(JSON.stringify({node:process.version,pi:piVersion,revision,extensions:result.extensions.map(e=>({path:e.path,handlers:[...e.handlers.keys()],tools:[...e.tools.keys()]})),errors:result.errors},null,2));
if (revision==='before') {
  assert(result.errors.some(e=>e.path.endsWith('soma-path-guard.ts')&&e.error.includes('bun:ffi')));
  console.log('PASS: base fails actual pi loader at bun:ffi');
} else {
  assert.equal(result.errors.length,0);
  assert.equal(result.extensions.length,paths.length);
  const guard=result.extensions.find(e=>e.path.endsWith('soma-path-guard.ts'));
  assert(guard?.handlers.has('tool_call'));
  console.log(`PASS: head loads all ${paths.length} projected extensions; path guard tool_call registered`);
}
