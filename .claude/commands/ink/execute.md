---
name: ink:execute
user-invocable: false
description: Execute plans in a phase — delegates to executor agent
argument-hint: "[phase number]"
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
Execute implementation plans with predetermined intent.
</objective>

<process>
Intent is predetermined: **execute_phase**. No classification needed.

<step name="dispatch">
Run: `node bin/ink-tools.js route dispatch --intent execute_phase --keywords "$ARGUMENTS" --resolve`

- If `blocked: true` → STOP. Execute EACH item in the `missing` array, then RE-RUN dispatch until `blocked: false`.
- If `blocked: false` → proceed.
</step>

<step name="handle_warnings">
If dispatch response has `warnings` array, you MUST address each using the `fix` field. Warnings are MANDATORY — the Stop hook verifies they were addressed.
</step>

<step name="execute_handler">
Execute `handler_content` from dispatch response (+ `handler_dependencies`).

MANDATORY delegation to ink-executor-agent via Task tool.
Use `node bin/ink-tools.js init execute $PHASE` for startup context.
</step>
</process>
