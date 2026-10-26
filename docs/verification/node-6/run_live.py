from pathlib import Path
import subprocess, os, sys, json, shlex
ROOT = Path(__file__).resolve().parent
LOG = ROOT/'live-transcript.txt'
def run(args,cwd=None,expect=0,env=None,*,log_path=LOG):
    cmd=[str(x) for x in args]
    merged=os.environ.copy()
    if env: merged.update(env)
    result=subprocess.run(cmd,cwd=cwd or ROOT,env=merged,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    block=f'\n$ (cwd={cwd or ROOT}) {shlex.join(cmd)}\n{result.stdout}\nEXIT {result.returncode}; expected {expect}\n'
    with log_path.open('a') as f: f.write(block)
    print(block,flush=True)
    if result.returncode!=expect: raise SystemExit(result.returncode or 1)
    return result.stdout
def capture_metadata(*,log_path=LOG):
    metadata=run(['gh','pr','view','1076','--repo','the-metafactory/soma','--json','title,body,mergedAt,baseRefOid,headRefOid,mergeCommit,commits,comments,reviews','--jq','del(.commits[].authors, .commits[].messageBody)'],ROOT,log_path=log_path)
    parsed=json.loads(metadata)
    for commit in parsed['commits']:
        for field in ('authors','messageBody'):
            if field in commit:
                raise ValueError(f'Fresh query contains forbidden commit field: {field}')
    retained=ROOT/'pr-metadata.json'
    retained.write_text(json.dumps(parsed,indent=2,ensure_ascii=False)+'\n')
    if json.loads(retained.read_text())!=parsed:
        raise ValueError('Retained pr-metadata.json differs from fresh query')
    message='PASS: fresh query JSON parses, equals retained pr-metadata.json and contains no commit authors/messageBody fields\n'
    with log_path.open('a') as f: f.write(message)
    print(message,end='',flush=True)
if __name__=='__main__':
    LOG.write_text('Independent live blast-radius invocation of merged Soma PR #1076. Commands run on host; exact base/head archives, no repository writes.\n')
    repo=os.environ['SOMA_REPO']
    pi_package=os.environ['PI_PACKAGE_DIR']
    run(['git','rev-parse','4d6a775f1667f3d0b6c7f66724411ab667ed5c07','4d6a775f1667f3d0b6c7f66724411ab667ed5c07^'],repo)
    run(['git','show','--format=%H%n%s','--no-ext-diff','4d6a775f1667f3d0b6c7f66724411ab667ed5c07'],repo)
    capture_metadata()
    run(['node','--version'],ROOT)
    run(['bun','--version'],ROOT)
    run(['cmp',str(Path(repo)/'bun.lock'),str(ROOT/'after/bun.lock')],ROOT)
    run(['cmp',str(ROOT/'before/bun.lock'),str(ROOT/'after/bun.lock')],ROOT)
    for name in ['before','after']:
        target=ROOT/name/'node_modules'
        if not target.exists(): target.symlink_to(Path(repo)/'node_modules',target_is_directory=True)
    run(['bun','test',str(ROOT/'after/test/pi-dev-extension-imports.test.ts'),str(ROOT/'after/test/goal-accept.test.ts'),'--timeout=60000'],ROOT,env={'TMPDIR':str(ROOT)})
    run(['bun','test',str(ROOT/'project-fixtures.test.ts')],ROOT,env={'TMPDIR':str(ROOT)})
    for rev in ['before','after']:
        run(['node',str(ROOT/'node-loader-probe.mjs'),rev],ROOT,env={'JITI_FS_CACHE':'0','TMPDIR':str(ROOT),'XDG_CACHE_HOME':str(ROOT/'cache'),'PI_PACKAGE_DIR':pi_package})
        run(['python3',str(ROOT/'pi-cli-probe.py'),rev],ROOT,env={'PI_PACKAGE_DIR':pi_package})
