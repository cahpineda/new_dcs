---
name: ink:autopilot
description: Automated issue resolution -- resolve or create ticket, fix code, run tests, and open PR
argument-hint: "[TICKET-KEY or description] [--jira-project PROJECT_KEY] [--run]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Task
  - mcp__serena__search_for_pattern
  - mcp__serena__find_symbol
  - mcp__serena__get_symbols_overview
  - mcp__serena__replace_symbol_body
  - mcp__serena__find_referencing_symbols
---

<objective>
Autopilot pipeline: resolve/create Jira ticket -> fix code -> verify -> PR -> update ticket.
Interactive gates at ticket, branch, PR, and ticket closure. Use --run to skip all gates and run fully automated.
</objective>

<process>
Execute @.claude/ink-workflows/workflows/autopilot.md with $ARGUMENTS
</process>
