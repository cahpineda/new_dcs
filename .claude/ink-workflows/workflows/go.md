<purpose>
**CRITICAL PRINCIPLE:** One command to rule them all. The developer describes WHAT they want, Claude figures out HOW.

Smart router that detects project state and executes the appropriate workflow.
Eliminates the need to remember 35+ commands.

**Architecture:** LLM classifies intent from natural language → `ink-tools.js route` dispatches deterministically → handler executes.
</purpose>

<module_structure>
**Modules (lazy-loaded):**
- **go-router.md** — Intent reference + dispatch via ink-tools.js route
- **go-handlers.md** — Core handlers (status, new, fix, pause, help)
- **go-handlers-advanced.md** — Advanced handlers (plan, verify, investigate)
- **go-handlers-extended.md** — Extended handlers (delegates to commands-internal)

**Alternative entry points:** 8 dedicated skills (`/ink:fix`, `/ink:new`, `/ink:plan`, `/ink:verify`, `/ink:execute`, `/ink:research`, `/ink:investigate`, `/ink:status`) bypass LLM classification and dispatch directly with predetermined intent. `/ink:go` remains the universal fallback for all 36 intents + ambiguous input.

**Context budget:**
1. Load go.md → ~8% context
2. Dispatch via ink-tools.js → ~8% (router not fully loaded)
3. Handler loads when needed → ~15% total

**Savings:** ~15% less context per /ink:go vs pre-v4.0 (no routing markdown to interpret).
</module_structure>

<execution_flow>
**Step ordering is enforced by the UserPromptSubmit hook (enforce-go-workflow.js).**
The hook injects the mandatory step sequence. This file defines architecture, not step order.

**Key mechanism:** `node bin/ink-tools.js route dispatch --intent {intent} --keywords {keywords} --resolve`
- Returns everything in one call: blocked status, handler_content, handler_dependencies, warnings, memory_chapters.
- Foundation gate is programmatic — dispatch returns `blocked: true` with `missing` array if foundation incomplete.
- Warnings are MANDATORY — must be addressed before executing handler. Stop hook verifies.
- Handler dependencies are auto-resolved — stub handlers that delegate to other files get their content inlined.
- No need to call `get-handler` separately when using `--resolve`.
</execution_flow>

<context_preflight>
After dispatch and warnings (Steps 2-3), BEFORE executing the handler (Step 4 → now Step 5):
If the dispatch response has an intent that requires context:
  Read and execute @.claude/ink-workflows/workflows/context-preflight.md
If the intent is simple (status/help/pause/resume/progress): SKIP entirely.
</context_preflight>

<inline_execution>
**Critical:** Execute workflows INLINE, not as separate commands.

```
User: /ink:go
Claude: [classifies intent → dispatches → loads handler → executes → shows results]
```

Never say "run /ink:execute-plan" — execute it directly.
</inline_execution>

<minimal_questions>
**Ask ONLY when:** genuinely ambiguous, destructive action, or user asked for options.
**Bias toward action.** Wrong action + quick correction > paralysis.

**EXCEPTION — Plan-to-execute gate:** Once ALL PLAN.md files for a phase are fully created and committed, STOP and ask the user if they want to proceed to execution. This gate applies ONLY at the transition from planning to execution — it does NOT apply to creating intermediate planning artifacts (STRUCTURE.md, STACK.md, PROJECT.md, ROADMAP.md, codebase docs, etc.). All files that are part of the planning workflow itself should be created freely without asking.
</minimal_questions>

<success_criteria>
- User ran ONE command
- Correct workflow detected and executed
- No unnecessary questions asked
- State updated for next session
</success_criteria>

<anti_patterns>
**NEVER:**
- Create loose plans outside `.planning/phases/`
- Suggest running commands instead of executing inline
- Ask "Should I proceed?" / "Is this what you meant?" / "Which approach?" (except for the mandatory plan confirmation gate — see <minimal_questions>)
- Say "I'm going to..." before doing it — show, don't tell
- Skip the plan confirmation gate — NEVER auto-execute after planning

**Reference:** @.claude/ink-workflows/references/prompt-engineering-best-practices.md
</anti_patterns>
