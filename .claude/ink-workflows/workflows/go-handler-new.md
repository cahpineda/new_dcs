<purpose>
Handler for route_new intent in /ink:go and /ink:new workflows.
Loaded lazily only when user describes new feature/work.
See @go-handlers.md for other core handlers.
</purpose>

<process>

<step name="route_new">
**Handle new feature/work request.**

**Step 1:** Memory pre-loaded by router (INDEX + keyword-matched chapters + GOLDEN-RULES).

**Step 2: Route to phase pipeline.**

All new work goes through the full pipeline — no quick path.
Scope determines phase vs milestone:

| Scope | Indicators | Action |
|-------|------------|--------|
| **Single phase** | Focused on one area, clear deliverable | → `route_add_phase` + plan + **wait for confirmation** + execute |
| **Milestone** | Spans multiple concerns, needs multiple phases | → `route_new_milestone` + define phases + plan first + **wait for confirmation** |

**For Phase:** Create phase → plan via ink-planner-agent → **notify user and wait for confirmation** → execute via ink-executor-agent.
**For Milestone:** Create milestone → define phases → plan first phase → **notify user and wait for confirmation**.

**MANDATORY — Plan-to-Execute Gate:**
Once ALL PLAN.md files for the phase are created and committed, STOP and inform the user. Do NOT proceed to execution automatically. This gate does NOT apply to intermediate planning artifacts (STRUCTURE.md, STACK.md, PROJECT.md, ROADMAP.md, codebase docs, etc.) — create those freely as part of the normal planning workflow.

```
Plan created: .planning/phases/[XX-name]/[XX]-NN-PLAN.md

Ready to execute? (yes / review first / modify)
```

Only proceed to execution when the user explicitly confirms (e.g. "yes", "execute", "dale", "sí", "go ahead").

**Post-execution (MANDATORY after commit):**

1. **Update memory (deterministic):**
   ```bash
   node bin/ink-tools.js memory update-from-diff HEAD
   ```
   → Auto-detects changed files, maps to chapters, adds citations, updates INDEX.
   → Report: `Memory: Updated {chapters_updated} ({citations_added} citations)`
2. **Update STATE.md:** `node bin/ink-tools.js state set "Last Session" "<timestamp>"` — session section
3. **Check phase completion (conditional):** If work touched files inside a phase directory (`.planning/phases/<N>-*/`), detect the phase number and run:
   ```bash
   node bin/ink-tools.js phase count <N>
   ```
   - If `all_complete: true` → run `node bin/ink-tools.js phase complete <N>` to mark phase done in ROADMAP.md and STATE.md, then report: `Phase <N> marked complete ✅`
   - If plans still remain → report remaining count and suggest next plan
   - If work was not scoped to a phase → skip this step
4. **Suggest /clear** if ≥5 tool calls in this session
</step>

</process>
