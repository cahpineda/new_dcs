<trigger>
Run this protocol after ANY go-handler that modifies files.

**Detection:** `git diff --name-only HEAD` — if non-empty output, execute this protocol.
**When:** After work is complete and committed, before presenting results to user.
**Enforces:** Golden Rule 3 (Context Rot) — keep all context current after changes.
</trigger>

<protocol>

**Step 1: Update memory (deterministic)**
```bash
node bin/ink-tools.js memory update-from-diff HEAD
```
→ Handles: git diff, file filtering, domain mapping, chapter updates, INDEX sync — all deterministic.
→ Returns JSON: `{ chapters_updated, chapters_created, citations_added, index_synced }`
→ Skips silently if no changes or no `.planning/memory/` directory.
→ Report inline: `Memory: Updated {chapters_updated} ({citations_added} citations)`

**Step 2: Update context documents**
- **STATE.md:** Update session section (last session timestamp, stopped at description)
- **ROADMAP.md:** Only if phase status changed (phase completed, new phase added)

</protocol>

<scope>
Handlers that MUST call this protocol:

| Handler | File | Trigger |
|---------|------|---------|
| route_fix | go-handlers.md | After fix applied and committed |
| route_new | go-handler-new.md | After feature implemented |
| route_new | go-handler-new.md | After feature implemented |
| ad-hoc work | any handler modifying files | After changes committed |

**Note:** `execute-plan-core.md` has its own built-in auto_update_memory (Step 10) + context updates (Steps 14-17). This protocol is for handlers that bypass that pipeline.
</scope>

<clear_suggestion>
After protocol completes, suggest `/clear` to the user if conversation is likely heavy:
```
💡 Context saved. Run /clear to free context before your next task.
```
**When to suggest:** After route_fix or route_new that involved ≥5 tool calls.
**Never suggest during:** multi-plan execution (execute-plan handles its own context).
</clear_suggestion>

<skip_conditions>
Skip this protocol when:
- No files changed (`git diff --name-only HEAD` is empty)
- Only `.planning/` files changed (metadata-only updates)
- Handler is read-only: route_status, route_investigate, route_help, route_progress
- Handler is planning-only: route_plan, route_discuss_phase, route_research_phase
</skip_conditions>
