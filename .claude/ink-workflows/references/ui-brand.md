<ui_patterns>

Visual patterns for user-facing Ink output. Workflows @-reference this file for consistent formatting.

## Stage Banners

Use for major workflow transitions. 55-character width.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Stage names (uppercase):**
- `PLANNING PHASE {N}`
- `EXECUTING WAVE {N}`
- `RESEARCHING`
- `DEBUGGING`
- `VERIFYING`
- `CREATING MILESTONE`
- `PHASE {N} COMPLETE ✓`
- `MILESTONE COMPLETE`

---

## Checkpoint Boxes

User action required. 62-character width.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
→ {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**Types:**
- `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
- `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
- `CHECKPOINT: Action Required` → `→ Type "done" when complete`

---

## Status Symbols

```
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending
⚡ Auto-approved
⚠  Warning
```

---

## Progress Display

**Phase/milestone level:**
```
Progress: ████████░░ 80%
```

**Task level:**
```
Tasks: 2/4 complete
```

**Plan level:**
```
Plans: 3/5 complete
```

---

## Spawning Indicators

Single agent:
```
◆ Spawning {agent-name}...
✓ {agent-name} complete: {artifact written}
```

Parallel agents:
```
◆ Spawning {N} researchers in parallel...
  → Stack research
  → Features research
  → Architecture research
  → Pitfalls research

✓ Stack research complete: STACK.md
✓ Features research complete: FEATURES.md
✓ Architecture research complete: ARCHITECTURE.md
✓ Pitfalls research complete: PITFALLS.md
```

---

## Next Up Block

Always at end of major completions. See @references/continuation-format.md for full variants.

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**{Identifier}: {Name}** — {one-line description}

`/ink:go`

───────────────────────────────────────────────────────────────

**Also available:**
- `/ink:go {alternative}` — description

───────────────────────────────────────────────────────────────
```

---

## Error Box

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**To fix:** {Resolution steps}
```

---

## Anti-Patterns

- Varying box/banner widths across workflows
- Mixing banner styles (`===`, `---`, `***`)
- Skipping `Ink ►` prefix in banners
- Random emoji (no rockets, sparkles, stars — use ONLY defined symbols above)
- Missing "Next Up" block after completions
- Ad-hoc "Spawning..." text without ◆ symbol

</ui_patterns>
