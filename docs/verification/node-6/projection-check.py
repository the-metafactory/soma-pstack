from pathlib import Path
import subprocess, os, tempfile
source=Path(os.environ['BLAST_RADIUS_SKILL']).resolve()
root=Path(__file__).resolve().parent
fixture=Path(tempfile.mkdtemp(prefix='projection-',dir=root))
user=fixture/'user';soma=fixture/'soma'
log=root/'projection-check.txt'
with log.open('w') as f:
    for args in [['soma','init','--apply','--home-dir',str(user),'--soma-home',str(soma)],['soma','project-skill',str(source),'--substrate','codex,pi-dev,claude-code,cursor,grok,dsh,anthropic-cowork','--apply','--home-dir',str(user),'--soma-home',str(soma)]]:
        p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        f.write('$ '+repr(args)+'\n'+p.stdout+'EXIT '+str(p.returncode)+'\n')
        assert p.returncode==0,p.stdout
    for location in ['.codex/skills','.claude/skills','.cursor/rules/soma/skills','.grok/skills','.dsh/skills','.anthropic-cowork/skills/skills']:
        target=user/location/'blast-radius'
        for name in ['SKILL.md','arc-manifest.yaml','agents/openai.yaml']:
            assert (target/name).read_bytes()==(source/name).read_bytes()
        f.write('MATCH '+str(target)+': SKILL.md, arc-manifest.yaml, agents/openai.yaml\n')
    registry=soma/'skills/blast-radius/SKILL.md'
    stub=(user/'.pi/agent/skills/blast-radius/SKILL.md').read_text()
    assert registry.read_bytes()==(source/'SKILL.md').read_bytes()
    assert str(registry) in stub and 'name: blast-radius' in stub
    f.write('MATCH pi-dev stub and full registry body: '+str(registry)+'\n')
print('PASS: seven disposable projections and readback')
