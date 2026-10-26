from pathlib import Path
from functools import partial
import os, tempfile
from run_live import run as run_logged
source=Path(os.environ['BLAST_RADIUS_SKILL']).resolve()
root=Path(__file__).resolve().parent
fixture=Path(tempfile.mkdtemp(prefix='projection-',dir=root))
user=fixture/'user';soma=fixture/'soma'
log=root/'projection-check.txt'
log.write_text('Disposable projection topology and Pi stub check. Linked bodies are not independent content copies.\n')
run=partial(run_logged,log_path=log)
run(['soma','init','--apply','--home-dir',str(user),'--soma-home',str(soma)])
run(['soma','project-skill',str(source),'--substrate','codex,pi-dev,claude-code,cursor,grok,dsh,anthropic-cowork','--apply','--home-dir',str(user),'--soma-home',str(soma)])
for target in [soma/'skills/blast-radius',*[user/location/'blast-radius' for location in ['.codex/skills','.claude/skills','.cursor/rules/soma/skills','.grok/skills','.dsh/skills','.anthropic-cowork/skills/skills']]]:
    assert target.is_symlink(), f'Expected directory symlink: {target}'
    assert target.resolve(strict=True)==source, f'Wrong projection target: {target}'
    for name in ['SKILL.md','arc-manifest.yaml','agents/openai.yaml']:
        assert (target/name).is_file(), f'Missing linked member file: {target/name}'
    with log.open('a') as f:
        f.write(f'LINK {target} -> {source}; required member files resolve\n')
registry=soma/'skills/blast-radius/SKILL.md'
stub_path=user/'.pi/agent/skills/blast-radius/SKILL.md'
assert not stub_path.is_symlink()
assert stub_path.resolve()!=registry.resolve()
stub=stub_path.read_text()
assert str(registry) in stub and 'name: blast-radius' in stub
with log.open('a') as f:
    f.write(f'STUB {stub_path}: independent file names blast-radius and references {registry}\n')
print('PASS: six substrate links, registry target and independent Pi stub verified')
