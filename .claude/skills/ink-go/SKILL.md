---
name: ink:go
description: Smart entry point - automatically detects and executes the right workflow
argument-hint: "[optional: what you want to do, e.g., 'add login feature']"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch, WebFetch, mcp__serena__search_for_pattern, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__find_referencing_symbols, mcp__ink-kb-mcp__rag_query_simple, mcp__ink-kb-mcp__list_folders, mcp__context7__resolve-library-id, mcp__context7__query-docs, mcp__project2context__query_repository_summary, mcp__project2context__trace_call_path, mcp__project2context__export_entry_points, mcp__project2context__detect_side_effects
hooks:
  UserPromptSubmit:
    - matcher: ''
      hooks:
        - type: command
          command: 'node "$CLAUDE_PROJECT_DIR/.claude/ink-workflows/hooks/enforce-go-workflow.js"'
        - type: command
          command: 'node "$CLAUDE_PROJECT_DIR/.claude/ink-workflows/hooks/enforce-dedicated-commands.js"'
        - type: command
          command: 'node "$CLAUDE_PROJECT_DIR/.claude/ink-workflows/hooks/enforce-ticket.js"'
  Stop:
    - matcher: ''
      hooks:
        - type: command
          command: '"$CLAUDE_PROJECT_DIR/.claude/ink-workflows/hooks/audit-go-workflow.sh"'
          timeout: 10
---

<objective>
Single intelligent command that figures out what to do next.
No need to remember 27 commands — just `/ink:go` and describe what you want.
</objective>

<philosophy>
**The dev thinks about features, not commands.**

This command:

1. Detects project state automatically
2. Routes to the correct workflow
3. Handles the full cycle (plan → execute → verify)
4. Only asks when genuinely ambiguous
   </philosophy>

<execution_context>
@.claude/ink-workflows/workflows/go.md
</execution_context>

<usage_examples>

**No arguments — do the obvious next thing:**

```
/ink:go
```

→ Detects state, continues where you left off

**With intent — smart routing:**

```
/ink:go add user authentication
```

→ Creates phase if needed, plans, executes

**Quick task:**

```
/ink:go fix the login bug
```

→ Routes to debug or quick fix flow

**Check status:**

```
/ink:go what's the status?
```

→ Shows progress without separate command

</usage_examples>

<success_criteria>

- User doesn't need to know other commands
- Correct workflow detected from context
- Full cycle completed or clear next step given
- Minimal questions asked
  </success_criteria>
