# Long-form docs (repo docs, ADRs, GLOSSARY, Confluence)

## What this source contains

- `docs/` in the repository: design notes, specs, runbooks, retros
- ADRs (`docs/adr/`, `docs/decisions/`, or wherever the repo keeps them)
- `GLOSSARY.md`, or the legacy `CONTEXT.md`, which fixes what a term means
- `README.md`, `CHANGELOG.md` and release notes
- Confluence pages, for SWITCH work: design rationale written out before it became code

Best at long-form design rationale. Strongest when the why was argued in prose before it was code.

## How to search it

Read-only. Search the repository first:

```bash
rg -l -i '<symbol>|<keyword>' docs/ --glob '*.md'
rg -n -C2 '<symbol>' docs/ GLOSSARY.md CONTEXT.md README.md CHANGELOG.md
ls docs/adr docs/decisions 2>/dev/null
git log --oneline -- docs/ | head -30
```

Read each hit whole. A doc's own date and its last commit tell you whether it predates or follows the code.

### Confluence (SWITCH work only)

Use the `confluence` skill's CLI, read verbs only: `search`, `get`, `children`, `comments`, `whoami`. Never run `create`, `update`, `publish`, `comment` or `attach`.

```bash
confluence search 'text ~ "<keyword>" and type = page' --limit 20
confluence get <pageId>
confluence comments <pageId>
```

Run the Confluence part when the repository or the question is SWITCH work (a SWITCH project, a space the principal names, a page the code links). Otherwise record "Confluence skipped: not SWITCH work" as the reason and search the repository only. If the CLI is missing, the token is rejected or the host is unreachable, report the command and its error, and carry on with the repository docs.
