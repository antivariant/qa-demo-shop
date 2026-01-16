# AGENTS.md

## Codex Working Modes

Codex supports two explicit modes of operation.

### Fast Mode (default)
- Apply small, localized changes directly.
- Do not propose a plan unless explicitly requested.
- Focus on minimal diffs and speed.

Typical use cases:
- Fixing CI failures
- Small refactors
- Formatting or lint fixes
- Addressing minor review comments

### Planned Mode (explicit)
- Used for large or architectural changes.
- Always start with a step-by-step plan.
- Wait for explicit approval before modifying code.
- Highlight risks and alternatives.

Planned Mode is enabled ONLY when explicitly requested
(e.g. "propose a plan", "design first", "plan this change").
