---
name: ink:discuss
user-invocable: false
description: Capture implementation decisions before planning
argument-hint: "[phase number] [--assumptions]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
  - mcp__serena__find_symbol
  - mcp__serena__get_symbols_overview
  - mcp__serena__find_referencing_symbols
  - mcp__project2context__query_repository_summary
  - mcp__project2context__trace_call_path
---

<objective>
Capture implementation decisions before planning through Q&A or Assumptions Mode.
</objective>

<process>
Intent is predetermined: **discuss_phase**. No classification needed.

<step name="dispatch">
Run: `node bin/ink-tools.js route dispatch --intent discuss_phase --keywords "$ARGUMENTS" --resolve`

- If `blocked: true` → STOP. Execute EACH item in the `missing` array, then RE-RUN dispatch until `blocked: false`.
- If `blocked: false` → proceed.
</step>

<step name="handle_warnings">
If dispatch response has `warnings` array, address each using the `fix` field. Warnings are MANDATORY.
</step>

<step name="parse_mode">
Parse `$ARGUMENTS` for `--assumptions` flag. If present, set mode to "assumptions".

Otherwise check config default:
`node bin/ink-tools.js config get features.discussPhase.defaultMode`

Fallback: "qa" if config key not set.
</step>

<step name="execute_handler">
MANDATORY delegation to `ink-discuss-agent` via Task tool.

Pass phase number and mode in the task prompt:
- Phase: extracted from $ARGUMENTS
- Mode: resolved in parse_mode step

Wait for `DISCUSS_COMPLETE` signal from agent.
</step>

<step name="next_steps">
After `DISCUSS_COMPLETE`, offer:

```
## Next Steps

- `/ink:plan ${PHASE}` — Create execution plan using captured context
- `/ink:research ${PHASE}` — Research technical unknowns first
```
</step>
</process>
