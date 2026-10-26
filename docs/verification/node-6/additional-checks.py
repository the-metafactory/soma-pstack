from pathlib import Path
import os, shutil
from functools import partial
from run_live import run as run_logged
root=Path(__file__).resolve().parent
repo=Path(os.environ['SOMA_REPO'])
log=root/'additional-checks.txt'
log.write_text('Supplemental checks after completion audit; source snapshots only.\n')
run=partial(run_logged,log_path=log)
run(['git','rev-parse','a59fc622116df0a50c3761a4d3f252a240958de1:bun.lock','4d6a775f1667f3d0b6c7f66724411ab667ed5c07:bun.lock','a59fc622116df0a50c3761a4d3f252a240958de1:src/core/dir-lock.ts','4d6a775f1667f3d0b6c7f66724411ab667ed5c07:src/core/dir-lock.ts'],repo)
run(['rg','-n','LockBusyError|withExclusiveLock','src','test'],root/'after')
run(['bun','test',str(root/'after/test/boundaries.test.ts'),'-t',"core's shared types entry"])
run(['bun',str(root/'boundary-probe.ts'),str(root/'after')])
base_test=root/'before/test/pi-dev-extension-imports.test.ts'
assert not base_test.exists()
shutil.copyfile(root/'after/test/pi-dev-extension-imports.test.ts',base_test)
try:
    run(['bun','test',str(base_test)],expect=1)
finally:
    base_test.unlink()
pi=Path(os.environ['PI_PACKAGE_DIR'])
for path,start,end in [(root/'after/src/core/dir-lock.ts',1,35),(root/'after/src/flows/goal-accept.ts',118,140),(root/'after/test/goal-accept.test.ts',190,218),(root/'after/src/policy/policy-path-guard.ts',1,8),(root/'after/src/substrates/adapters/pi-dev/path-guard.ts',174,188),(pi/'dist/core/extensions/loader.js',462,484),(pi/'dist/core/extensions/loader.js',510,578)]:
    lines=path.read_text().splitlines()
    with log.open('a') as f:
        f.write('\nSOURCE '+str(path)+'\n')
        for i in range(start-1,min(end,len(lines))):
            f.write(str(i+1)+': '+lines[i]+'\n')
print('PASS: lockfile and lock-code provenance, caller search, focused core boundary check, intended base guard failure and source excerpts')
