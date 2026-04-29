---
name: ink:investigate
user-invocable: false
description: Understand code without changes — delegates to debug agent in read-only mode
argument-hint: "[question about the codebase]"
allowed-tools:
  - Read
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
Understand code behavior without making changes — read-only investigation.
</objective>

<process>
Intent is predetermined: **investigate**. No classification needed.

<step name="dispatch">
Run: `node bin/ink-tools.js route dispatch --intent investigate --keywords "$ARGUMENTS" --resolve`

- If `blocked: true` → STOP. Execute EACH item in the `missing` array, then RE-RUN dispatch until `blocked: false`.
- If `blocked: false` → proceed.
</step>

<step name="handle_warnings">
If dispatch response has `warnings` array, you MUST address each using the `fix` field. Warnings are MANDATORY — the Stop hook verifies they were addressed.
</step>

<step name="execute_handler">
Execute `handler_content` from dispatch response (+ `handler_dependencies`).

MANDATORY delegation to ink-debug-agent via Task tool in investigate_only mode.
Read-only — no file modifications allowed.
</step>
</process>
