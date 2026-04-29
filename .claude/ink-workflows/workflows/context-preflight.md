<purpose>
Load code and/or business context BEFORE the handler.
Only run when the intent requires it — simple intents have ZERO overhead.
</purpose>

<intent_categories>
CODE context (P2C):
  fix, plan_fix, investigate, execute_phase, verify, diagnose, continue,
  plan_post_debug, plan_gaps, map_codebase, audit_milestone

BUSINESS context (ink-kb):
  new_work, research, validate

BOTH (code + business):
  plan

SKIP (zero overhead):
  status, help, pause, resume, progress, add_todo, add_phase, insert_phase,
  remove_phase, discuss_phase, discuss_milestone, memory, pattern, check_todos,
  assumptions, new_milestone, complete_milestone, settings, set_profile, cleanup

DEFAULT (any intent not listed above): SKIP — do not add context when it's unclear whether it's needed.
</intent_categories>

<step name="check_p2c">
If the intent requires CODE context:

**MANDATORY: Check P2C first — `node bin/ink-tools.js mcp check project2context`**

**IF P2C available (status: "configured"):**
1. `mcp__project2context__query_repository_summary` → codebase overview (replaces ALL Glob/Grep for discovery)
2. If intent is fix/investigate/diagnose: `mcp__project2context__trace_call_path` → trace paths relevant to intent keywords
3. If intent is plan/execute: `mcp__project2context__export_entry_points` → public API surface
4. Summarize in ≤200 tokens: affected modules, relevant entry points, patterns found
→ Store as $CODE_CONTEXT
**DO NOT run additional Glob/Grep for discovery when P2C returned results — P2C output is authoritative.**
Only use Grep to verify a specific symbol/string AFTER P2C identifies the relevant files.

**ONLY IF P2C unavailable (status: "placeholder_key", "known", or "unknown"):**
- Glob + Grep on paths relevant to keywords
- Summarize in ≤150 tokens
→ Store as $CODE_CONTEXT
</step>

<step name="check_ink_kb">
If the intent requires BUSINESS context:

1. `mcp__ink-kb-mcp__list_folders` → discover available folders
2. Select folder most relevant to intent + keywords (policies/confluence/test-drive)
3. `mcp__ink-kb-mcp__rag_query_simple` → specific query derived from the intent
4. Summarize in ≤150 tokens: business rules, constraints, applicable validations
→ Store as $BUSINESS_CONTEXT
</step>

<step name="pass_forward">
When delegating to the handler (or spawning an agent via Task):
- If context was loaded: include under `<preflight_context>` tag in the agent prompt
- If no preflight ran (simple intent): continue unchanged
</step>
