---
name: ink:diagnose
description: Run diagnostic report — checks installation health, hooks, errors, and environment
argument-hint: ""
---

<objective>
Generate a diagnostic report of the Ink installation for troubleshooting.
The report covers: environment, installation files, hook registration, hook dry-run, update status, MCP config, recent errors, and current state.
</objective>

<process>
<step name="run-diagnostic">
Run the diagnostic script:

```bash
node .claude/ink-workflows/hooks/diagnose.js
```

Show the FULL output to the user — do not summarize or truncate.
</step>

<step name="analysis">
After showing the output, provide a brief analysis:

1. If there are **ERROR** issues: explain what's broken and suggest fixes
2. If there are **WARN** issues: explain what might cause problems
3. If no issues: confirm installation is healthy

If the user needs to share this report, suggest:
```bash
node .claude/ink-workflows/hooks/diagnose.js 2>&1 | pbcopy
```
This copies the report to clipboard (macOS). For Linux: pipe to `xclip -selection clipboard`.
</step>
</process>
