<purpose>
Resolution handlers for debug workflow.

Handles fix confirmation, implementation, archival, and phase creation.

See @debug.md for investigation steps (check_active_session, gather_bug_context, spawn_debug_agent).
</purpose>

<process>

<step name="investigation_loop_inline">
**FALLBACK: Use when agent delegation fails or user prefers inline.**

**Update file continuously: before EVERY action, after EVERY finding.**

**Phase 1: Initial evidence gathering**
**Code discovery preference:** P2C FIRST (`trace_call_path`, `detect_side_effects`) → Serena (`find_symbol`, `find_referencing_symbols`) → Grep/Glob/Read (last resort only if MCP unavailable).
1. If errors exist -> search codebase for error text
2. Identify relevant code area from symptoms
3. Read relevant files COMPLETELY
4. Run app/tests to observe behavior

Append each finding to Evidence with: timestamp, checked, found, implication.

**Phase 2: Form hypothesis**
SPECIFIC, FALSIFIABLE hypothesis. Update Current Focus.

**Phase 3: Test hypothesis**
ONE hypothesis at a time. Append result to Evidence.

**Phase 4: Evaluate**
- If CONFIRMED: Update status to "confirmed", proceed to `confirm_fix_approach`
- If ELIMINATED: Append to Eliminated section, form new hypothesis

**Context management:**
After 5+ evidence entries, suggest: "Safe to /clear - run /ink:debug to resume."
</step>

<step name="resume_from_file">
Read the debug file. Announce: slug, status, current hypothesis, evidence count, next action.

Based on status:
- "gathering" -> Continue symptom_gathering
- "investigating" -> Continue investigation_loop
- "confirmed" -> Continue confirm_fix_approach
- "fixing" -> Continue fix_and_verify
- "planning" -> Continue create_phase_from_debug
- "verifying" -> Continue verification
</step>

<step name="confirm_fix_approach">
**MANDATORY CHECKPOINT: Ask user before implementing any fix.**

Update status to "confirmed".

**Present findings to user:**
```
## Root Cause Found

**Problem:** [Brief description of root cause]
**Evidence:** [Key evidence that confirmed hypothesis]
**Proposed Fix:** [What needs to change]
**Files Affected:** [List of files]
**Estimated Complexity:** [Simple/Medium/Complex]

---

**How would you like to proceed?**

1. **Fix now** - Implement the fix directly
2. **Plan first** - Create a phase with detailed plan
3. **Investigate more** - Need more evidence
```

**Route based on user choice:**

| User Choice | Action |
|-------------|--------|
| "Fix now" | Update status to "fixing", proceed to `fix_and_verify` |
| "Plan first" | Update status to "planning", proceed to `create_phase_from_debug` |
| "Investigate more" | Return to `investigation_loop` |

**CRITICAL:** Never skip this step. Always give user the choice.
</step>

<step name="fix_and_verify">
Update status to "fixing".

**1. Implement minimal fix**
Make SMALLEST change that addresses root cause.
Update Resolution with: fix, mechanism (WHY it works), files_changed.

**If you can't explain WHY it works:** Return to investigation_loop.

**1.5. Write reproducer test (MANDATORY)**
Before implementing the fix, write a test that reproduces the bug in isolation:

1. **Locate test file** — Find the test file for the affected module (same directory, `*.test.*` or `*.spec.*`). If none exists, create `[module].regression.test.*` alongside the source file.
2. **Write the failing test** — Test must describe the bug: given [trigger condition], expect [correct behavior]. This test MUST fail before the fix is applied.
3. **Confirm test fails** — Run the test suite. If the reproducer test passes before the fix: either the bug is already fixed or the test is wrong. Stop and investigate.
4. **Apply the fix** — Now implement step 1's minimal fix.
5. **Confirm test passes** — Run the test suite again. The reproducer test MUST now pass.

Update Resolution with: `reproducer_test: path/to/test/file`.

**If no test framework exists:** Write the test anyway and note in Resolution that test framework setup is needed as follow-up.

**2. Verify**
- Reproducer test passes (written in step 1.5)
- Symptoms resolved (test against Symptoms section)
- Full test suite passes: `npm test`
- Adjacent feature works

**For intermittent bugs:** Run 10 times, one failure = not fixed.

**3. Evaluate**
- If ANY check fails: Update status to "investigating", return to investigation_loop
- If ALL pass: Proceed to archive_session
</step>

<step name="archive_session">
Update status to "resolved".

```bash
mkdir -p .planning/debug/resolved
mv .planning/debug/[slug].md .planning/debug/resolved/
```

**Ask user before committing:**
```
## Ready to Commit Fix

**Files changed:**
- [list modified files]
- .planning/debug/resolved/[slug].md

**Proposed commit message:**
`fix: [brief description]`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Archive session without committing
3. **Modify message** - Change commit message first
```

**Post-debug options:**
1. "Done" - Debug complete
2. "Test more" - Additional verification
3. "Continue working" - Return to current work
4. "Create phase for follow-up work" - Route to `create_phase_from_debug`
</step>

<step name="create_phase_from_debug">
**Create plan WITHOUT executing - user chose "Plan first".**

Update status to "planning".

**Process:**
1. Read the debug session for context
2. Determine appropriate phase name from debug findings
3. Update ROADMAP.md with new phase
4. Create phase directory in `.planning/phases/`
5. Create detailed plan within that phase directory
6. **STOP - Do not execute**

**Implementation:**
**Primary:**
```bash
# Get next phase number
node bin/ink-tools.js phase resolve-next

# Create phase directory
node bin/ink-tools.js phase create <NEXT_PHASE> "<descriptive-name-from-debug>"
```

Plan goes in `.planning/phases/${PHASE_NAME}/${NEXT_PHASE}-01-PLAN.md` — NOT in `.planning/debug/`.

**Update ROADMAP.md:**
```markdown
## Phase [NEXT_PHASE]: [Name from Debug Findings]

**Goal:** [Derived from debug root cause]

**Plans:**
- [ ] [NEXT_PHASE]-01-PLAN.md — [Description]
```

**Report to user:**
```
## Plan Created (Not Executed)

**Phase [N]:** [Name]
**Plan:** .planning/phases/[phase-name]/[N]-01-PLAN.md

Based on debug session: [slug]

---

**The plan has been created but NOT executed.**

To review the plan: Open .planning/phases/[phase-name]/[N]-01-PLAN.md
To execute: Run `/ink:go`
```

**Archive debug session:**
```bash
mkdir -p .planning/debug/resolved
mv .planning/debug/[slug].md .planning/debug/resolved/
```

**CRITICAL:** Plans MUST be in `.planning/phases/`, NEVER in `.planning/debug/`.
</step>

</process>

<update_rules>
| Section | Rule | When |
|---------|------|------|
| Frontmatter.status | OVERWRITE | Each phase transition |
| Frontmatter.updated | OVERWRITE | Every file update |
| Current Focus | OVERWRITE | Before every action |
| Symptoms | IMMUTABLE | After gathering complete |
| Eliminated | APPEND | When hypothesis disproved |
| Evidence | APPEND | After each finding |
| Resolution | OVERWRITE | As understanding evolves |

**CRITICAL:** Update file BEFORE taking action, not after.
</update_rules>

<success_criteria>
- [ ] **User asked before implementing fix** (confirm_fix_approach)
- [ ] If "Plan first": Plan created in `.planning/phases/`, NOT executed
- [ ] If "Fix now": Fix mechanism explained (WHY it works)
- [ ] Verification: symptoms resolved, tests pass
</success_criteria>
