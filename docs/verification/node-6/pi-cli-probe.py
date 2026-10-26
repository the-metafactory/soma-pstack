from pathlib import Path
import os, sys, json, subprocess, selectors, time, shlex
root=Path(__file__).resolve().parent
pi_package=Path(os.environ['PI_PACKAGE_DIR'])
revision=sys.argv[1]
home=root/'cli-homes'/revision
home.mkdir(parents=True,exist_ok=True)
agent=home/'.pi/agent'
agent.mkdir(parents=True,exist_ok=True)
(agent/'settings.json').write_text(json.dumps({'defaultProvider':'anthropic','defaultModel':'claude-sonnet-4-5'}))
entries=json.loads((root/'projections'/revision/'entries.json').read_text())
cmd=['node',str(pi_package/'dist/bundle/cli.js'),'--offline','--mode','rpc','--no-session','--no-extensions','--no-mcp','--no-skills','--no-prompt-templates','--no-themes','--no-context-files']
for entry in entries: cmd+=['-e',entry]
env={k:v for k,v in os.environ.items() if k in ['PATH','SHELL','LANG','LC_ALL']}
env.update({'HOME':str(home),'PI_CODING_AGENT_DIR':str(agent),'TMPDIR':str(root),'XDG_CACHE_HOME':str(root/'cache'),'JITI_FS_CACHE':'0','PI_OFFLINE':'1','NO_COLOR':'1'})
print('COMMAND '+shlex.join(cmd),flush=True)
p=subprocess.Popen(cmd,cwd=home,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=0)
p.stdin.write(b'{"id":"probe-state","type":"get_state"}\n{"id":"probe-commands","type":"get_commands"}\n');p.stdin.flush()
sel=selectors.DefaultSelector()
for stream in [p.stdout,p.stderr]:sel.register(stream,selectors.EVENT_READ)
stdout=[];stderr=[];deadline=time.monotonic()+25
seen_commands=False
buffers={p.stdout:b'',p.stderr:b''}
while sel.get_map() and time.monotonic()<deadline:
    for key,_ in sel.select(timeout=.25):
        chunk=os.read(key.fileobj.fileno(),65536)
        if not chunk:
            sel.unregister(key.fileobj)
            continue
        buffers[key.fileobj]+=chunk
        while b'\n' in buffers[key.fileobj]:
            raw,buffers[key.fileobj]=buffers[key.fileobj].split(b'\n',1)
            line=raw.decode('utf-8',errors='replace')+'\n'
            (stdout if key.fileobj is p.stdout else stderr).append(line)
            print(('STDOUT ' if key.fileobj is p.stdout else 'STDERR ')+line,end='',flush=True)
            try: record=json.loads(line)
            except ValueError: continue
            if record.get('id')=='probe-commands' and not seen_commands:
                seen_commands=True
                p.stdin.close()
    if p.poll() is not None and not sel.get_map():break
if p.poll() is None:
    p.terminate()
    p.wait(timeout=5)
else:p.wait()
print('CLI_EXIT '+str(p.returncode),flush=True)
text=''.join(stderr+stdout)
if revision=='before':
    assert p.returncode==1 and 'bun:ffi' in text
    print('PASS: offline running pi app rejects base projection at bun:ffi')
else:
    assert seen_commands and p.returncode==0
    records=[json.loads(line) for line in stdout if line.startswith('{')]
    commands=next(r for r in records if r.get('id')=='probe-commands')
    assert commands['success'] and any(c.get('name')=='algorithm' and c.get('source')=='extension' for c in commands['data']['commands'])
    print('PASS: offline running pi app starts with head extensions and exposes algorithm command')
