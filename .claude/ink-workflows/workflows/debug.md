<purpose>
Systematic debugging with persistent state that survives context resets.

You are the debugger. The user knows what's wrong (behavior), not why (root cause).

See @debug-resolution.md for fix confirmation, implementation, and archival.
See @references/ui-brand.md for output formatting (banners, spawning indicators).
</purpose>

<philosophy>
**User = reporter. Claude = investigator.**

The user knows: What they expected, what actually happened, any error messages.
The user does NOT know (don't ask): What's causing it, which file has the problem.

Ask about experience. Investigate the cause yourself.
</philosophy>

<references>
@.claude/ink-workflows/references/debugging/debugging-mindset.md
@.claude/ink-workflows/references/debugging/hypothesis-testing.md
@.claude/ink-workflows/references/debugging/investigation-techniques.md
@.claude/ink-workflows/references/debugging/verification-patterns.md
</references>

<template>
@.claude/ink-workflows/templates/DEBUG.md
</template>

<agent>
@.claude/agents/ink-debug-agent.md
</agent>

<process>

<execution_order>
1. `check_active_session` - Check for existing debug sessions
2. `gather_bug_context` - Collect bug description, errors, steps
3. `spawn_debug_agent` - Delegate to ink-debug-agent
4. `handle_agent_result` - Process completion signal
5. See @debug-resolution.md for remaining steps:
   - `confirm_fix_approach` - Present findings, get user decision
   - `fix_and_verify` OR `create_phase_from_debug`
   - `archive_session` - Archive debug file, commit

**IMPORTANT:** After finding root cause, ALWAYS ask user before implementing fix.
</execution_order>

<step name="check_active_session">
**Primary:** Use Glob `.planning/debug/*.md` to check for active debug sessions (exclude `resolved/` directory).

**If sessions exist AND no $ARGUMENTS:**
Display table of active sessions (slug, status, hypothesis, next action).
Wait for user to select or describe new issue.

**If $ARGUMENTS provided:**
Continue to gather_bug_context.

**If no sessions AND no $ARGUMENTS:**
Ask user to describe the issue.
</step>

<step name="gather_bug_context">
Gather bug information for the agent:

1. **From user input:**
   - Bug description (what's happening)
   - Expected behavior
   - Error messages (exact text, stack trace)

2. **Ask if not provided:**
   - "What error message do you see?"
   - "How can I reproduce this?"

3. **Gather code context (P2C-FIRST):**
   **Priority chain:** P2C → Serena → Grep/Glob/Read

   **IF P2C available:** Use FIRST for all code discovery:
   - `mcp__project2context__trace_call_path` with error keyword → trace execution path to error origin
   - `mcp__project2context__detect_side_effects` → identify DB/file/network ops near suspected area
   - DO NOT run Grep for discovery when P2C returned results

   **IF Serena available (after P2C or as fallback):** Use `mcp__serena__find_symbol` for precise function lookup and `mcp__serena__find_referencing_symbols` to trace callers.

   **ONLY IF neither available:** Grep/Glob/Read as last resort.

   **NO git history diving.** Do NOT run `git log`, `git blame`, `git bisect`, or `git diff HEAD~N`. The goal is to find what's wrong in the CURRENT code and fix it — not to find which commit introduced the bug (we can't revert).

4. **Build context block:**
   - Bug description
   - Error messages
   - Reproduction steps
   - Suspected files (from grep/serena, NOT from git history)

Proceed to spawn_debug_agent.
</step>

<step name="spawn_debug_agent">
Display banner and spawning indicator (see @references/ui-brand.md):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► DEBUGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning ink-debug-agent...
  Bug: [brief description]
```

Determine authorization level:
- `investigate_only` - Default, safe
- `investigate_and_propose` - User said "fix it" — agent investigates + proposes, but does NOT implement. Fix requires user approval via `confirm_fix_approach` (see @debug-resolution.md).

**NEVER use `investigate_and_fix` — all fixes require user approval before implementation.**

Spawn the agent:
```
Task(
  prompt="<bug_report>
Description: ${BUG_DESCRIPTION}
Expected: ${EXPECTED_BEHAVIOR}
Actual: ${ACTUAL_BEHAVIOR}
Error: ${ERROR_MESSAGE}
</bug_report>

<context>
Suspected files: ${SUSPECTED_FILES}
Recent changes: ${RECENT_CHANGES}
Reproduction steps: ${REPRODUCTION_STEPS}
</context>

<authorization>${AUTHORIZATION_LEVEL}</authorization>",
  subagent_type="ink-debug-agent",
  description="Debug: ${BUG_SUMMARY}"
)
```

Wait for agent completion signal.
</step>

<step name="handle_agent_result">
Parse agent response:

**If `DEBUG_COMPLETE` with status `root_cause_found`:**
- Display root cause summary
- Show recommended fix
- Continue to `confirm_fix_approach` (see @debug-resolution.md)

**If `DEBUG_COMPLETE` with status `inconclusive`:**
- Display what was ruled out
- Offer: provide more context, investigate manually, or abandon

**If `DEBUG_BLOCKED`:**
- Display blocker information
- Offer: provide what's needed, fall back to inline, or abort

**If agent timeout/error:**
- Offer to retry or fall back to inline investigation
</step>

</process>

<resolution_module>
For fix confirmation, implementation, and archival steps, see @debug-resolution.md:
- `investigation_loop_inline` - Fallback when agent fails
- `resume_from_file` - Resume interrupted debug session
- `confirm_fix_approach` - **MANDATORY: Ask user before fixing**
- `fix_and_verify` - Implement and verify fix
- `archive_session` - Archive and commit
- `create_phase_from_debug` - Create phase without executing
</resolution_module>

<success_criteria>
- [ ] Debug file created IMMEDIATELY
- [ ] File updated after EACH piece of information
- [ ] Current Focus always reflects NOW
- [ ] Can resume perfectly from any /clear
- [ ] Root cause confirmed with evidence before fixing
- [ ] **User asked before implementing fix**
</success_criteria>
