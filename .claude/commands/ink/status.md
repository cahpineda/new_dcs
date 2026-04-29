---
name: ink:status
user-invocable: false
description: Show project status — lightweight read of state files
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

<objective>
Show current project status with minimal context overhead.
</objective>

<process>
Intent is predetermined: **status**. No classification needed.

<step name="dispatch">
Run: `node bin/ink-tools.js route dispatch --intent status --keywords "" --resolve`

Exempt from foundation gate — status works even without PROJECT.md.
</step>

<step name="execute_handler">
Execute `handler_content` from dispatch response.

Reads STATE.md + PROJECT.md + current phase info. Lightweight, read-only.
</step>
</process>
