<purpose>
Advanced handlers for /ink:go workflow - planning, verification, and investigation.

Loaded lazily when these specific routes are taken:
- route_plan, route_plan_post_debug
- route_verify, route_investigate

See @go-handlers.md for core handlers (status, new, fix, pause, help).
See @go-router.md for routing logic.
See @references/common-guidelines.md for handler implementation guidelines.
See @references/ui-brand.md for output formatting (banners, symbols, spawning indicators).
</purpose>

<foundation_check>
Foundation gate is programmatic — dispatch returns `blocked: true` if foundation is missing.
Handlers never execute without foundation. No manual check needed.
Reference: ink-tools.js FOUNDATION_REQUIRED_INTENTS (line 3231).
</foundation_check>

<process>

<step name="route_plan">
**User explicitly wants to plan without executing.**

**CRITICAL:** Planning MUST always go through the phase system.

**NOTE:** plan-phase.md now spawns specialized agents:
- ink-planner-agent (opus) for complex phases (>3 requirements or research exists)
- ink-plan-checker-agent (sonnet) when features.planChecker enabled in config.json

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-planner-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-planner-agent`
2. `node bin/ink-tools.js agent spawn-config ink-planner-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

**Process:**

1. **Load config for agent settings:**
   ```bash
   node bin/ink-tools.js config get features.planChecker
   ```

2. **Determine what to plan:**

   | User Says | Action |
   |-----------|--------|
   | "plan" (no detail) | Plan next incomplete phase |
   | "plan phase X" | Plan specific phase X |
   | "plan [feature]" | Create new phase for feature, then plan |

3. **Display banner and delegate to plan-phase workflow:**
   Display stage banner: `Ink ► PLANNING PHASE {N}` (see @references/ui-brand.md)
   Execute @workflows/plan-phase.md with:
   - Phase number (current or specified)
   - Feature description (if new work)
   - execute_after_plan=false (plan only, don't execute)
   - planChecker setting from config.json

4. **Output and MANDATORY confirmation gate:**
   ```
   Plan created: .planning/phases/[XX-name]/[XX]-01-PLAN.md

   Ready to execute? (yes / review first / modify)
   ```

   **STOP here and wait for user confirmation.** Do NOT auto-execute.
   Only proceed to execution when the user explicitly confirms (e.g. "yes", "execute", "dale", "sí").
   This gate applies ONLY at the plan→execute transition, NOT to intermediate planning artifacts.

**NOTE:** When the user confirms execution, execute-plan.md spawns ink-executor-agent (sonnet model) for fresh context. The executor handles task implementation, deviation rules, commits, and SUMMARY.md generation.

**NEVER create loose plans outside the phase system.**
</step>

<step name="route_plan_post_debug">
**Planning after a debug session - MUST create proper phase.**

**Triggered when:** Recent debug resolved today AND intent is "plan".

**CRITICAL:** Plans MUST go in `.planning/phases/XX-name/`, NEVER in `.planning/debug/`.

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-planner-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-planner-agent`
2. `node bin/ink-tools.js agent spawn-config ink-planner-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

**Process:**
1. Read recent debug: Use Glob `.planning/debug/resolved/*.md` → Read most recent
2. Extract: root cause, files changed, follow-up work
3. Determine scope:
   - No follow-up needed → inform user, done
   - Tests/refactoring/more work → create new phase
4. Create phase: `node bin/ink-tools.js phase create <N> "<name>"`
5. Update ROADMAP.md with new phase entry
6. Create plan in phase directory (NOT debug/)
7. Update state: `node bin/ink-tools.js state set "Phase" "<N> — <name>"`
8. Report: phase created, plan path, `/ink:execute {phase}` to execute
</step>

<step name="route_verify">
**User wants to verify/test something.**

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-verifier-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-verifier-agent`
2. `node bin/ink-tools.js agent spawn-config ink-verifier-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

See @go-handler-verify.md for full implementation (phase verification, agent spawning, UAT).
</step>

<step name="route_investigate">
**User wants to understand something without making changes.**

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-debug-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-debug-agent`
2. `node bin/ink-tools.js agent spawn-config ink-debug-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

**Classification:**
| Type | Indicators | Action |
|------|------------|--------|
| Bug/Error | "error", "broken", "why is" | → ink-debug-agent (investigate_only) |
| Technology | "how does [library]" | → ink-research-agent |
| Codebase | "how does [our feature]" | → Handle inline |

**Agent delegation (display spawning indicators per @references/ui-brand.md):**
- Bug: `◆ Spawning ink-debug-agent...` → `Task(prompt="...", subagent_type="ink-debug-agent")` → `✓ ink-debug-agent complete`
- Tech: `◆ Spawning ink-research-agent...` → `Task(prompt="...", subagent_type="ink-research-agent")` → `✓ ink-research-agent complete`

**Inline codebase exploration:**
- Grep for keywords, read key files
- Check memory chapters (`CAP-*.md`) for existing docs

**Output format:**
```
## Investigation: [topic]
### What I Found
### Key Files
### Related Memory
---
Options: document, make changes, investigate deeper
```

**Key principle:** Investigation = read-only. Never modify code.
</step>

</process>
