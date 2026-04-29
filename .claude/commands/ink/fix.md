---
name: ink:fix
user-invocable: false
description: Debug and fix a bug — deterministic routing, no intent classification
argument-hint: "[bug description]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Task
  - WebSearch
  - WebFetch
  - mcp__serena__search_for_pattern
  - mcp__serena__find_symbol
  - mcp__serena__get_symbols_overview
  - mcp__serena__find_referencing_symbols
  - mcp__ink-kb-mcp__rag_query_simple
  - mcp__ink-kb-mcp__list_folders
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Debug and fix a bug with predetermined intent — no LLM classification overhead.
</objective>

<process>
Intent is predetermined: **fix**. No classification needed.

<step name="dispatch">
Run: `node bin/ink-tools.js route dispatch --intent fix --keywords "$ARGUMENTS" --resolve`

- If `blocked: true` → STOP. Execute EACH item in the `missing` array (new-project.md, create-roadmap.md, etc.), then RE-RUN dispatch until `blocked: false`.
- If `blocked: false` → proceed. `handler_content` has the handler instructions. `handler_dependencies` has resolved @references.
</step>

<step name="handle_warnings">
If dispatch response has `warnings` array, you MUST read each warning's `fix` field and execute it before proceeding. Warnings are MANDATORY — the Stop hook verifies they were addressed.
</step>

<step name="execute_handler">
Execute `handler_content` from dispatch response (+ `handler_dependencies` for delegation targets).

Bug complexity classification from handler:
- **Simple** (typo, config, obvious) → fix inline
- **Medium/Complex** → delegate to ink-debug-agent via Task tool

Post-fix: `node bin/ink-tools.js memory update-from-diff HEAD`
</step>
</process>
