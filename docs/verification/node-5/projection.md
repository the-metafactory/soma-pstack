# Isolated projection probe

Host Soma 0.27.0, seven substrates; all targets under a fresh temporary home.

The normal launcher expected a runtime under that temporary home. The direct installed CLI initially needed profile defaults; init populated them but refused to migrate the already-linked skill outside the temporary home. Re-running project-skill with that profile succeeded. No active installation was changed.

- .codex/skills: full skill and logger match source byte for byte.
- .claude/skills: full skill and logger match source byte for byte.
- .cursor/rules/soma/skills: full skill and logger match source byte for byte.
- .grok/skills: full skill and logger match source byte for byte.
- .dsh/skills: full skill and logger match source byte for byte.
- .anthropic-cowork/skills/skills: full skill and logger match source byte for byte.
- .pi/agent/skills: metadata stub points to the complete matching skill in the temporary Soma registry.

The Codex-projected helper also wrote a valid start row with the working directory outside the repository.
