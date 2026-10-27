from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = Path(__file__).resolve().parent
CLI = Path.home() / '.soma/runtime/codex/current/src/cli.ts'
MEMBER = ROOT / 'skills/typescript-best-practices'
TRANSCRIPT = EVIDENCE / 'projection.jsonl'


def run(args):
    result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True)
    with TRANSCRIPT.open('a') as output:
        output.write(json.dumps({'command': [str(arg) for arg in args],
                                 'exit': result.returncode,
                                 'stdout': result.stdout, 'stderr': result.stderr}) + '\n')
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)


if __name__ == '__main__':
    TRANSCRIPT.write_text('')
    scratch = Path(tempfile.mkdtemp(prefix='tsbp-projection-'))
    home = scratch / 'home'
    soma = scratch / 'soma'
    options = ['--home-dir', str(home), '--soma-home', str(soma)]
    run(['bun', str(CLI), 'init', '--apply', *options, '--substrate', 'codex'])
    substrates = 'codex,pi-dev,claude-code,cursor,grok,dsh,anthropic-cowork'
    run(['bun', str(CLI), 'project-skill', str(MEMBER), '--apply',
         '--substrate', substrates, *options])
    full = ['.codex/skills/typescript-best-practices', '.claude/skills/typescript-best-practices',
            '.cursor/rules/soma/skills/typescript-best-practices', '.grok/skills/typescript-best-practices',
            '.dsh/skills/typescript-best-practices', '.anthropic-cowork/skills/skills/typescript-best-practices']
    sources = [file for file in MEMBER.rglob('*') if file.is_file()]
    for target in full:
        for source in sources:
            projected = home / target / source.relative_to(MEMBER)
            if projected.read_bytes() != source.read_bytes():
                raise AssertionError(f'Projection differs: {projected}')
    pi = home / '.pi/agent/skills/typescript-best-practices/SKILL.md'
    stub = pi.read_text()
    registry = soma / 'skills/typescript-best-practices'
    if str(registry) not in stub:
        raise AssertionError('Pi stub does not name registry source')
    for source in sources:
        if (registry / source.relative_to(MEMBER)).read_bytes() != source.read_bytes():
            raise AssertionError('Registry differs')
    summary = {'scratch': str(scratch), 'fullProjections': full,
               'filesComparedPerProjection': len(sources), 'piStub': stub,
               'result': 'Six full projections match; Pi stub resolves to matching registry.'}
    with TRANSCRIPT.open('a') as output:
        output.write(json.dumps(summary) + '\n')
    print(summary['result'])
