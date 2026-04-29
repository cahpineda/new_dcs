<state_detection>
Run state detection to determine project state for routing decisions.

**When to run:** Before intents that need project awareness (continue, plan, execute, fix, add, research, discuss, verify, pause, resume, milestone operations, phase operations, map_codebase, investigate, plan_fix, plan_gaps).

**Skip for:** help, status, settings, set_profile, check_todos, add_todo.

## Primary: ink-tools.js (deterministic)

```bash
INIT=$(node bin/ink-tools.js init go 2>/dev/null)
```

When available, `init go` returns a single JSON object with all routing fields:
- `project_exists`, `roadmap_exists`, `is_brownfield`, `codebase_mapped`, `codebase_stale`
- `paused`, `continue_file`
- `memory_exists`, `memory_chapters`
- `current_phase`, `total_phases`, `phase_dir`, `pending_plan`
- `plan_count`, `summary_count`, `plans_in_phase`, `summaries_in_phase`
- `suggested_route` — one of: route_map_codebase, route_new_project, route_create_roadmap, route_plan_phase, route_execute_plan, route_next_phase_or_complete, route_continue
- `config` — full config.json contents

Claude parses the JSON directly — no jq or bash parsing needed. The JSON is the state object.

Use `--include state` to embed STATE.md content, `--include roadmap` for ROADMAP.md, etc.

## Fallback: manual checks (when ink-tools.js not available)

If `init go` fails or ink-tools.js is not installed, fall back to manual bash checks:

```bash
PROJECT_EXISTS=$([ -f .planning/PROJECT.md ] && echo "yes" || echo "no")
ROADMAP_EXISTS=$([ -f .planning/ROADMAP.md ] && echo "yes" || echo "no")
CONTINUE_FILE=$(ls .planning/.continue-here*.md 2>/dev/null | head -1)
PAUSED=$([ -n "$CONTINUE_FILE" ] && echo "yes" || echo "no")
CODEBASE_MAPPED=$([ -d .planning/codebase ] && [ -f .planning/codebase/STACK.md ] && echo "yes" || echo "no")
HAS_CODE_FILES=$(find . -maxdepth 3 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | head -1)
IS_BROWNFIELD=$([ -n "$HAS_CODE_FILES" ] && echo "yes" || echo "no")

if [ -f .planning/ROADMAP.md ]; then
  CURRENT_PHASE_NUM=$(grep -E "^\- \[ \] \*\*Phase [0-9]+" .planning/ROADMAP.md | head -1 | grep -oE "[0-9]+" | head -1)
  PHASE_DIR=$(ls -d .planning/phases/${CURRENT_PHASE_NUM}-* 2>/dev/null | head -1)
  if [ -n "$PHASE_DIR" ]; then
    PENDING_PLAN=$(for plan in "$PHASE_DIR"/*-PLAN.md; do
      [ -f "$plan" ] || continue
      summary="${plan//-PLAN.md/-SUMMARY.md}"
      [ ! -f "$summary" ] && echo "$plan" && break
    done)
  fi
fi
```

## State Decision Matrix

| IS_BROWNFIELD | CODEBASE_MAPPED | CODEBASE_STALE | PROJECT.md | ROADMAP.md | Pending Plan | Action |
|---------------|-----------------|----------------|------------|------------|--------------|--------|
| yes | no | - | - | - | - | route_map_codebase |
| yes | yes | yes | - | - | - | WARN: "Codebase map is >7 days old. Run `/ink:go map` to refresh." (non-blocking, continue) |
| - | - | - | no | - | - | route_new_project |
| - | - | - | yes | no | - | route_create_roadmap |
| - | - | - | yes | yes | No plans | route_plan_phase |
| - | - | - | yes | yes | Has pending | route_execute_plan |
| - | - | - | yes | yes | All done | route_next_phase_or_complete |
</state_detection>
