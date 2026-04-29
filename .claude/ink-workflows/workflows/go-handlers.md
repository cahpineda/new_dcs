<purpose>
Core handlers for /ink:go workflow - high-frequency routes.

Loaded for: status, new, fix, pause, help.

See @go-handlers-advanced.md for: plan, plan_post_debug, verify, investigate.
See @go-handlers-extended.md for extended handlers (progress, phases, milestones, etc.).
See @go-router.md for routing logic.
See @references/ui-brand.md for output formatting (banners, symbols, spawning indicators).
</purpose>

<agent_delegation_rules>
Certain handlers delegate to specialized agents:

| Intent | Condition | Agent | Workflow |
|--------|-----------|-------|----------|
| execute | single plan | ink-executor-agent | execute-plan.md |
| execute | phase (multiple) | ink-executor-agent(s) | execute-phase.md |
| investigate | new tech | ink-research-agent | research-phase.md |
| fix | any bug | ink-debug-agent | debug.md |

**When to delegate vs inline:**
- Delegate: Complex investigation, fresh context needed
- Inline: Simple lookup, quick fix, clear location known

See @.claude/agents/README.md for agent documentation.
</agent_delegation_rules>

<process>

<foundation_check>
Foundation gate is programmatic — dispatch returns `blocked: true` if foundation is missing.
Handlers never execute without foundation. No manual check needed.
Reference: ink-tools.js FOUNDATION_REQUIRED_INTENTS (line 3231).
</foundation_check>

<step name="route_status">
**Show current status without changing anything.**

Read and present:
```
## Project Status

**Project:** [name from PROJECT.md]
**Progress:** [X]% complete

**Current Position:**
- Phase [N] of [M]: [Phase Name]
- Plan [A] of [B] in phase
- Status: [In progress / Ready to plan / Ready to execute]

**Next Action:**
[What /ink:go would do if run without arguments]

---

Run `/ink:go` to continue.
```
</step>

<step name="route_new">
**Handle new feature/work request.**
See @go-handler-new.md for full implementation (memory bootstrap, keyword mapping, complexity routing).
</step>

<step name="route_fix">
**Handle bug fix / debug request.**

**Classify bug complexity:**

| Complexity | Indicators | Action |
|------------|------------|--------|
| Simple | Clear error + exact location + single file | Fix inline |
| Medium | Error message but unclear cause or multiple files | Delegate to ink-debug-agent |
| Complex | Intermittent, unknown root cause, insufficient context | Escalate to phase with plan |

**For simple bugs → fix inline (with tracking):**
```
Fixing: [description]
[Read file → Identify issue → Fix → Verify → Commit]
Fixed. [what changed]
```
Create tracking record: `mkdir -p .planning/quick && echo "fix: [description] | [timestamp] | [files]" >> .planning/quick/fixes.log`

**For medium bugs → delegate to debug agent (INVESTIGATE ONLY):**
Display: `◆ Spawning ink-debug-agent...`
```
Task(
  prompt="<bug_report>[description]</bug_report>
  <authorization>investigate_and_propose</authorization>
  <instruction>Find root cause and propose fix. Do NOT implement the fix — return your findings for user approval.</instruction>",
  subagent_type="ink-debug-agent",
  description="Investigate: [bug summary]"
)
```
Display: `✓ ink-debug-agent complete.`

**For complex bugs or insufficient context → escalate to phase:**
When ANY of these are true, do NOT attempt inline fix:
- Root cause is unknown and affects multiple systems
- Debug agent returned `DEBUG_BLOCKED` or `inconclusive`
- Fix requires changes across 3+ files without clear scope
- No reproduction steps and no error messages

→ Escalate: suggest `/ink:new fix [description]` to create a proper phase with plan.
This ensures investigation is documented, changes are tracked, and the fix goes through plan → execute → verify.

**Handle agent result (MANDATORY APPROVAL GATE — see @debug-resolution.md#confirm_fix_approach):**

After the debug agent returns, ALWAYS present findings to the user before implementing:

```
## Root Cause Found

**Problem:** [from DEBUG.md root_cause]
**Evidence:** [key evidence]
**Proposed Fix:** [what needs to change]
**Files Affected:** [list]
**Confidence:** [high/medium/low]

---

**How would you like to proceed?**

1. **Fix now** — Implement the proposed fix
2. **Plan first** — Create a phase with detailed plan
3. **Investigate more** — Need more evidence
```

**Route based on user choice:**
- "Fix now" → Implement fix, verify tests pass, then ask commit confirmation
- "Plan first" → Create phase via `create_phase_from_debug` (see @debug-resolution.md)
- "Investigate more" → Re-spawn debug agent or investigate inline

**CRITICAL: NEVER skip this approval step. Even for high-confidence results, the user MUST confirm.**

Result routing:
- `DEBUG_COMPLETE` (any confidence): Show findings + approval gate above
- `DEBUG_BLOCKED` or `inconclusive`: **Escalate to phase** — suggest `/ink:new fix [description]` with diagnosis context from DEBUG.md

**Post-execution (MANDATORY after commit):**

1. **Update memory (deterministic):**
   ```bash
   node bin/ink-tools.js memory update-from-diff HEAD
   ```
   → Auto-detects changed files, maps to chapters, adds citations, updates INDEX.
   → Report: `Memory: Updated {chapters_updated} ({citations_added} citations)`
2. **Update STATE.md:** `node bin/ink-tools.js state set "Last Session" "<timestamp>"` — session section
3. **Check phase completion (conditional):** If the fix touched files inside a phase directory (`.planning/phases/<N>-*/`), detect the phase number and run:
   ```bash
   node bin/ink-tools.js phase count <N>
   ```
   - If `all_complete: true` → run `node bin/ink-tools.js phase complete <N>` to mark phase done in ROADMAP.md and STATE.md, then report: `Phase <N> marked complete ✅`
   - If plans still remain → report: `Phase <N>: {remaining} plan(s) remaining` and suggest next plan
   - If fix was not scoped to a phase → skip this step
4. **Suggest /clear** if ≥5 tool calls in this fix session
</step>

<step name="route_pause">
**User wants to stop cleanly.**

```
Pausing work...

[Create .continue-here.md with full context]
[Update STATE.md]

Work paused. Context saved to .continue-here.md.

💡 Run /clear to free context. Resume anytime with /ink:go.
```
</step>

<step name="route_help">
**User needs guidance.**

```
## Ink Quick Reference

**Main command:**
`/ink:go [what you want]` — Does the right thing automatically

**Examples:**
- `/ink:go` — Continue where you left off
- `/ink:go add dark mode` — Implement a feature
- `/ink:go fix the login bug` — Debug and fix
- `/ink:go status` — See progress

**That's it.** One command handles everything.

---

**Power user commands** (rarely needed):
- `/ink:debug` — Systematic debugging session
- `/ink:pause` — Save context for later

**Full command list:** `/ink:help full`
```
</step>

</process>

<advanced_handlers>
For planning and analysis handlers, see @go-handlers-advanced.md:
- route_plan - Plan without executing
- route_plan_post_debug - Planning after debug session
- route_verify - Verification (spawns ink-verifier-agent)
- route_investigate - Understanding without changes
</advanced_handlers>
