<foundation_check>
Required before handlers that modify project state. Run BEFORE routing to handler.

```bash
# Brownfield detection
HAS_CODE_FILES=$(find . -maxdepth 3 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.cs" -o -name "*.swift" -o -name "*.kt" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" 2>/dev/null | head -1)
CODEBASE_MAPPED=$([ -d .planning/codebase ] && [ -f .planning/codebase/STACK.md ] && echo "yes" || echo "no")
if [ -n "$HAS_CODE_FILES" ] && [ "$CODEBASE_MAPPED" != "yes" ]; then
  # → Execute commands-internal/map-codebase.md
  # → Then continue with foundation checks below
fi

# Project foundation
if [ ! -f ".planning/PROJECT.md" ]; then
  # → Execute commands-internal/new-project.md
fi

if [ ! -f ".planning/ROADMAP.md" ]; then
  # → Execute commands-internal/create-roadmap.md
fi

# Memory system bootstrap (covers: old Ink versions, interrupted init, fresh upgrades)
if [ -f ".planning/PROJECT.md" ] && [ ! -d ".planning/memory" ]; then
  mkdir -p .planning/memory/chapters
  mkdir -p .planning/memory/archive
  cat > .planning/memory/INDEX.md << 'MEMEOF'
# Memory Index

**Updated:** $(date +%Y-%m-%d)
**Chapters:** 0

## Concepts

| Domain | Chapter | Key Decision | Status |
|--------|---------|--------------|--------|

## Quick Lookup

**By Keyword:**
- (keywords will be added as you build)

## Recent Updates

| Date | Chapter | Change |
|------|---------|--------|

---
*Chapters are created automatically during implementation.*
MEMEOF
fi

# ALL plans MUST be created in .planning/phases/XX-name/
# → NEVER create loose plans outside the phase system
```

**Handlers requiring check:** route_new, route_fix, route_plan, route_plan_post_debug, route_verify, route_investigate, route_add_phase, route_insert_phase, route_remove_phase, route_research_phase, route_discuss_phase, route_execute_phase, route_list_assumptions, route_new_milestone, route_complete_milestone, route_plan_fix, route_plan_gaps, route_map_codebase, route_diagnose, route_audit_milestone, route_validate, route_cleanup

**Handlers that skip:** route_status, route_help, route_pause, route_resume, route_progress, route_settings, route_set_profile, route_check_todos, route_add_todo, route_discuss_milestone, route_memory, route_pattern

**Note:** `route_continue` is handled dynamically by state detection — foundation check runs as part of the detected state route.
</foundation_check>
