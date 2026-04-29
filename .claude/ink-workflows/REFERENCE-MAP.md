# Reference Map

**Purpose:** Document how files are referenced to prevent false orphan detection.

**Generated:** 2026-01-27
**Phase:** 07 - Context Rot Prevention
**Updated:** 2026-02-02 - Migrated to .claude/ architecture (Phase 17)

---

## Architecture Note

As of v2.1, all workflow files live in `.claude/ink-workflows/`. Platform directories
(`.claude/`, `.cursor/`, `.opencode/`, `.agent/`) use symlinks to reference the shared core:

```
.claude/
  ink-workflows/  <- Single source of truth
  agents/         <- All agent definitions

.claude/
  ink-workflows -> ../.claude/ink-workflows (symlink)
  agents -> ../.claude/agents (symlink)
  commands/ink/*.md (platform-specific entry points)

.cursor/
  ink-workflows -> ../.claude/ink-workflows (symlink)
  agents -> ../.claude/agents (symlink)
  commands/*.md (platform-specific entry points)
```

Path references in shared files use `@.claude/ink-workflows/...` syntax.
Platform command entry points use their native paths (e.g., `@.claude/ink-workflows/...`)
which resolve through symlinks to the same shared files.

---

## Reference Types

This map categorizes files by their reference mechanism. Files can be referenced through:
1. Direct `@` links (grep-detectable)
2. Dynamic code invocations (not grep-detectable)
3. Scaffolding use (templates that CREATE files in user projects)

Understanding these patterns prevents false positive orphan detection.

---

## 1. @ Referenced (Direct)

Files linked via `@filename` in markdown. Detected by standard grep searches.

**Detection:** `grep -r "@filename" .claude/ink-workflows/`

These files are already tracked by Phase 6 ORPHAN-FILES.md audit and do not appear as orphans.

---

## 2. Modular File Splits (Lazy Loading)

Files split to prevent context rot. Each module is loaded only when needed.

| Parent File | Module | Purpose | Size |
|-------------|--------|---------|------|
| go-handlers.md | go-handlers-advanced.md | Planning, verify, investigate routes | ~8KB |
| execute-phase.md | execute-phase-runtime.md | Agent spawning, monitoring, summary | ~8KB |
| debug.md | debug-resolution.md | Fix confirmation, implementation, archival | ~8KB |

**Loading pattern:** Parent file loads first (~6-8KB), module loads only when specific route/step is needed.

**Context savings:** ~40% reduction vs monolithic files (from 20KB/16KB/13KB down to ~8KB each).

---

## 3. Dynamically Invoked (Code)

Files called by router/handlers via code logic, NOT via `@` links. These appear as "orphans" in grep-based audits but are actively used.

### go-router.md Dynamic Invocations

| File | Line | Step | Context |
|------|------|------|---------|
| `commands-internal/new-project.md` | 86 | route_new_project | Inline execution when no PROJECT.md |
| `commands-internal/create-roadmap.md` | 91 | route_create_roadmap | Inline execution when no ROADMAP.md |
| `commands-internal/plan-phase.md` | 96 | route_plan_phase | Inline execution when no plans exist |
| `commands-internal/execute-plan.md` | 101 | route_execute_plan | Inline execution when pending plan |
| `commands-internal/validate.md` | 122 | route_validate | Inline execution on "validate" intent |
| `commands-internal/memory.md` | 126 | route_memory | Inline execution on "memory" intent |
| `commands-internal/pattern.md` | 131 | route_pattern | Inline execution on "pattern" intent |

### go-handlers.md Dynamic Invocations

| File | Line | Handler | Context |
|------|------|---------|---------|
| `workflows/debug.md` | 168 | route_fix | Used inline for complex bug debugging |

### go-handlers-extended.md Dynamic Invocations

| File | Handler | Context |
|------|---------|---------|
| `commands-internal/progress.md` | route_progress | Detailed progress view |
| `commands-internal/plan-fix.md` | route_plan_fix | Plan fix without executing |
| `commands-internal/add-phase.md` | route_add_phase | Add phase to milestone end |
| `commands-internal/insert-phase.md` | route_insert_phase | Insert urgent phase |
| `commands-internal/remove-phase.md` | route_remove_phase | Remove future phase |
| `commands-internal/research-phase.md` | route_research_phase | Research before planning |
| `commands-internal/discuss-phase.md` | route_discuss_phase | Gather phase context |
| `commands-internal/execute-phase.md` | route_execute_phase | Execute entire phase |
| `commands-internal/list-phase-assumptions.md` | route_list_assumptions | Surface assumptions |
| `commands-internal/resume-task.md` | route_resume | Resume from task pause |
| `commands-internal/resume-work.md` | route_resume | Resume from work pause |
| `commands-internal/new-milestone.md` | route_new_milestone | Start new milestone |
| `commands-internal/discuss-milestone.md` | route_discuss_milestone | Discuss milestone scope |
| `commands-internal/complete-milestone.md` | route_complete_milestone | Archive and ship |

### Workflow Cross-References (Programmatic)

These workflows are invoked programmatically or referenced in WORKFLOWS-INDEX.md but lack direct `@` references:

| File | Referenced By | Context |
|------|--------------|---------|
| `workflows/discovery-phase.md` | WORKFLOWS-INDEX.md:35 | Phase discovery workflow |
| `workflows/transition.md` | WORKFLOWS-INDEX.md:422 | Milestone transition handling |
| `workflows/validate-decisions.md` | WORKFLOWS-INDEX.md:107 | Decision validation workflow |

---

## 4. Scaffolding Templates

Templates used to CREATE files in user projects. They are NOT loaded as context but rather copied/adapted to create project artifacts.

**Key distinction:** These files don't need `@` references - they are source templates for generated files.

| Template | Creates | Used By |
|----------|---------|---------|
| `templates/project.md` | `.planning/PROJECT.md` | `commands-internal/new-project.md` |
| `templates/config.json` | `.planning/config.json` | `commands-internal/new-project.md` |
| `templates/roadmap.md` | `.planning/ROADMAP.md` | `workflows/create-roadmap.md`, `commands-internal/create-roadmap.md` |
| `templates/state.md` | `.planning/STATE.md` | `workflows/create-roadmap.md`, `commands-internal/create-roadmap.md` |
| `templates/research.md` | `.planning/research/RESEARCH.md` | `workflows/research-phase.md`, `commands-internal/research-phase.md` |
| `templates/discovery.md` | `.planning/phases/*/DISCOVERY.md` | `workflows/discovery-phase.md` |
| `templates/phase-prompt.md` | `.planning/phases/*/*-PLAN.md` | `workflows/plan-phase.md`, `commands-internal/plan-phase.md` |
| `templates/summary.md` | `.planning/phases/*/*-SUMMARY.md` | `workflows/execute-plan-core.md`, multiple commands |
| `templates/context.md` | `.planning/phases/*/CONTEXT.md` | `workflows/discuss-phase.md`, `commands-internal/discuss-phase.md` |
| `templates/continue-here.md` | `.planning/.continue-here*.md` | `workflows/go-handlers.md` (route_pause), resume flows |
| `templates/uat-issues.md` | `.planning/phases/*/UAT-ISSUES.md` | `workflows/verify-work.md`, `commands-internal/verify-work.md` |
| `templates/DEBUG.md` | `.planning/DEBUG.md` | `workflows/debug.md` |
| `templates/milestone.md` | `.planning/MILESTONES.md` entries | `workflows/complete-milestone.md` |
| `templates/milestone-archive.md` | `.planning/milestones/v*-MILESTONE-AUDIT.md` | `workflows/complete-milestone.md`, `commands-internal/complete-milestone.md` |
| `templates/milestone-context.md` | Milestone discussion context | `workflows/discuss-milestone.md` |
| `templates/validation.md` | `.planning/VALIDATION.md` | `workflows/validate-decisions.md` |
| `templates/complexity-eval.md` | Task complexity evaluation | `workflows/plan-phase.md` |
| `templates/issues.md` | `.planning/ISSUES.md` | Issue tracking flows |
| `templates/codebase/*.md` (7 files) | `.planning/codebase/*.md` | `workflows/map-codebase.md` |

---

## 5. Future Features (Not Yet Integrated)

Files designed but not wired into execution flows. Keep for future integration.

| File | Feature | Status | Notes |
|------|---------|--------|-------|
| `templates/memory-index.md` | Memory system index | Designed | Memory chapters use this |
| `templates/chapter.md` | Memory chapters | Designed | For CAP-*.md chapters |
| `templates/pattern.md` | Pattern catalog | Referenced | Linked via `commands-internal/pattern.md` |
| `templates/patterns-index.md` | Pattern index | Designed | For pattern system |
| `commands-internal/progress.md` | Progress display | Designed | Overlaps with status.md |
| `commands-internal/status.md` | Status display | Designed | Handled by go-handlers route_status |
| `templates/agent-history.md` | Subagent tracking | Designed | For future subagent history |
| `templates/poc.md` | POC documentation | Designed | POC system not implemented |

---

## 6. Power Tools (User-Invocable but Not Router-Wired)

Commands-internal files that are designed for direct user invocation but not wired through go-router. They are NOT orphans - they serve specific power-user needs.

| File | Purpose | Invocation |
|------|---------|------------|
| `commands-internal/add-phase.md` | Add phase to roadmap | Direct command |
| `commands-internal/insert-phase.md` | Insert phase between existing | Direct command |
| `commands-internal/remove-phase.md` | Remove phase from roadmap | Direct command |
| `commands-internal/plan-fix.md` | Create fix plan for UAT issues | `/ink:plan-fix {phase}-{plan}` |

---

## 7. True Orphans (Dead Code)

Files with no current use, integration, or clear future purpose.

### Deleted in Phase 6

| File | Reason | Commit |
|------|--------|--------|
| `commands-internal/add-todo.md` | TODO system never implemented | 4a78399 |
| `commands-internal/check-todos.md` | TODO system never implemented | 4a78399 |
| `commands-internal/consider-issues.md` | Superseded by plan-fix workflow | 4a78399 |
| `commands-internal/pause-work.md` | Duplicated by go-handlers route_pause | 4a78399 |

### Remaining Candidates (Keep as Documentation)

| File | Category | Recommendation |
|------|----------|----------------|
| `references/future-improvements.md` | Planning doc | Keep - project improvement ideas |
| `references/architecture-kb.md` | Knowledge base | Keep - valuable reference |
| `references/complexity-analysis.md` | Methodology | Keep - complexity guidance |
| `references/debugging/when-to-research.md` | Debugging | Keep - research trigger patterns |

---

## Phase 6 Reconciliation

Cross-validation of Phase 6 ORPHAN-FILES.md analysis showing false positive corrections:

### False Positives (Actually Used)

| Phase 6 "Orphan" | Actual Category | Why Not Orphan |
|------------------|-----------------|----------------|
| `templates/continue-here.md` | Scaffolding | Creates `.continue-here.md` pause files |
| `templates/discovery.md` | Scaffolding | Creates `DISCOVERY.md` (used by discovery-phase.md:67) |
| `templates/milestone.md` | Scaffolding | Creates milestone entries (used by complete-milestone.md:58) |
| `templates/milestone-context.md` | Scaffolding | Creates milestone context (used by discuss-milestone.md:130) |
| `templates/issues.md` | Scaffolding | Creates `ISSUES.md` for issue tracking |
| `templates/complexity-eval.md` | Scaffolding | Creates complexity evaluation (linked by plan-phase.md) |
| `templates/validation.md` | Scaffolding | Creates `VALIDATION.md` (used by validate-decisions.md:108) |
| `commands-internal/add-phase.md` | Power Tool | User-invocable phase management |
| `commands-internal/insert-phase.md` | Power Tool | User-invocable phase insertion |
| `commands-internal/remove-phase.md` | Power Tool | User-invocable phase removal |
| `commands-internal/plan-fix.md` | Power Tool | Fix planning (referenced by verify-work.md:156) |
| `workflows/discovery-phase.md` | Dynamic | In WORKFLOWS-INDEX.md, uses templates/discovery.md |
| `workflows/transition.md` | Dynamic | In WORKFLOWS-INDEX.md, handles milestone transitions |
| `workflows/validate-decisions.md` | Dynamic | In WORKFLOWS-INDEX.md, uses templates/validation.md |

### Correctly Identified Orphans (Kept as Docs)

| Phase 6 "Orphan" | Status | Action Taken |
|------------------|--------|--------------|
| `templates/agent-history.md` | Future Feature | Keep - subagent tracking |
| `templates/chapter.md` | Future Feature | Keep - memory chapters |
| `templates/patterns-index.md` | Future Feature | Keep - pattern system |
| `templates/memory-index.md` | Future Feature | Keep - memory system |
| `templates/poc.md` | Future Feature | Keep - POC documentation |

### False Positive Analysis

**Phase 6 Orphan Count:** 37 files marked as orphans
**Actually Orphan:** ~14 files (kept as documentation/future features)
**False Positives:** ~23 files (dynamic invocation, scaffolding, power tools)

**False Positive Rate:** ~62%

**Root Cause:** Grep-based orphan detection misses:
1. Dynamic code invocations (execute `filename` inline)
2. Scaffolding templates (used to CREATE, not load)
3. Power tools (user-invocable without router wiring)
4. WORKFLOWS-INDEX.md documentation references

---

## Audit Guidelines

When checking for orphans, apply these rules:

1. **Check dynamic invocations first**
   - Search `go-router.md` and `go-handlers.md` for code-level references
   - Files mentioned in `Execute X inline` patterns are NOT orphans

2. **Check scaffolding usage**
   - Templates that CREATE user files don't need `@` references
   - Look for patterns like "Use template from X" or "Write to Y using X"

3. **Check power tool status**
   - `commands-internal/` files may be direct user commands
   - Check if file has `name: ink:*` header indicating user command

4. **Check WORKFLOWS-INDEX.md**
   - Workflows documented there are part of the system even without direct refs

5. **Check future feature markers**
   - Files in `templates/` for systems not yet deployed (memory, patterns)
   - Keep for future integration, mark as "designed not deployed"

---

*Map created during Phase 7 Plan 02 - Context Rot Prevention*
