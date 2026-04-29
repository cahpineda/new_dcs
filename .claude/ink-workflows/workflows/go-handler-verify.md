<purpose>
Handler for route_verify intent in /ink:go workflow.
Loaded lazily only when user requests verification.
See @go-handlers-advanced.md for other advanced handlers.
</purpose>

<process>

<step name="route_verify">
**User wants to verify/test something.**

**Note: route_verify supports two modes:**
- Phase verification (spawns ink-verifier-agent for goal-backward analysis)
- Plan verification (delegates to verify-work.md for manual UAT)

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-verifier-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-verifier-agent`
2. `node bin/ink-tools.js agent spawn-config ink-verifier-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

**For phase verification (default) - spawn verifier agent:**

1. **Determine phase to verify:**

   **Primary:** `node bin/ink-tools.js phase list` — find most recent phase with SUMMARY.md but no VERIFICATION.md.

   If user says "verify" without specifying a phase:
   ```bash
   node bin/ink-tools.js phase list
   # From the output, identify the most recent completed-but-unverified phase
   # Then resolve the phase directory:
   node bin/ink-tools.js phase resolve-next
   ```

   If user says "verify phase 14":
   ```bash
   node bin/ink-tools.js phase list
   # Use phase 14 from the output
   ```

2. **Spawn verifier agent:**
   ```
   Task(
     prompt="<verification_request>
   Phase: ${PHASE_TO_VERIFY}
   Phase Directory: ${PHASE_DIR}
   Context: Verify implementation against phase goals from ROADMAP.md
   </verification_request>

   <context>
   @.planning/ROADMAP.md
   @.planning/REQUIREMENTS.md
   @${PHASE_DIR}/
   </context>",
     subagent_type="ink-verifier-agent",
     description="Verify: Phase ${PHASE_TO_VERIFY} implementation"
   )
   ```

3. **Handle agent result:**

   **If `VERIFICATION_COMPLETE` with status=passed:**
   ```
   Verification passed.

   Score: [score from agent]
   Report: [report_file path]

   All requirements satisfied. Phase verified.
   ```

   **If `VERIFICATION_COMPLETE` with status=partial:**
   ```
   Verification found issues.

   Score: [score from agent]
   Report: [report_file path]
   Failed: [list of failed_requirements]

   Review report for details. Consider `/ink:fix` or `/ink:plan-fix`.
   ```

   **If `VERIFICATION_COMPLETE` with status=failed:**
   ```
   Verification failed.

   Score: [score from agent]
   Report: [report_file path]
   Critical issues: [list of failed_requirements]

   Phase does not meet requirements. Run /ink:go to address.
   ```

**For plan-level verification - delegate to UAT workflow:**

If user specifies a specific plan (e.g., "verify 14-02"):
- Execute @.claude/ink-workflows/workflows/verify-work.md inline
- This guides manual user acceptance testing
- Different purpose: UAT vs goal-backward verification

**Model selection:** Uses profile's verification model (sonnet in balanced profile).
Read from config.json profiles.[current].verification.

**Inline fallback (if Task tool unavailable):**
See @references/verification-fallback.md for quality gate validation suite.
</step>

</process>
