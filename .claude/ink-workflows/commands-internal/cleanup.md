---
name: ink:cleanup
description: Reset planning state for a new feature
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Clean up `.planning/` directory between features, preserving reusable knowledge.
</objective>

<instructions>

## 1. Pre-Flight Check

```bash
# Verify project exists
if [ ! -f ".planning/PROJECT.md" ]; then
  echo "NO_PROJECT"
else
  echo "PROJECT_EXISTS"
fi
```

If NO_PROJECT: output "No active project to clean up." and stop.

## 2. Show Current State

```bash
# Read project name
PROJECT_NAME=$(head -5 .planning/PROJECT.md | grep -m1 "^#" | sed 's/^# //')

# Count phases and plans
PHASE_COUNT=$(ls -d .planning/phases/*/ 2>/dev/null | wc -l | tr -d ' ')
PLAN_COUNT=$(ls .planning/phases/*/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
SUMMARY_COUNT=$(ls .planning/phases/*/*-SUMMARY.md 2>/dev/null | wc -l | tr -d ' ')
PENDING=$((PLAN_COUNT - SUMMARY_COUNT))
```

Present:
```markdown
# Project Cleanup

**Project:** {PROJECT_NAME}
**Phases:** {PHASE_COUNT} | **Plans:** {PLAN_COUNT} completed, {PENDING} pending

## Will DELETE (feature-specific):
- PROJECT.md, ROADMAP.md, STATE.md
- phases/ ({PHASE_COUNT} phases, {PLAN_COUNT} plans)
- jira/, debug/, quick/, todos/ (if they exist)

## Will KEEP (reusable):
- config.json (your preferences)
- memory/ (codebase knowledge)
- codebase/ (codebase analysis)
- patterns/ (saved code patterns)
- milestones/ (version history)
```

## 3. Confirm Action

If PENDING > 0: show extra warning:
```
WARNING: Phase has {PENDING} pending (unexecuted) plans. These will be deleted.
```

Ask user: "This will reset .planning/ for a new feature. Continue? [y/n]"

If user declines: output "Cleanup cancelled." and stop.

## 4. Execute Cleanup

```bash
# Delete feature-specific files
rm -f .planning/PROJECT.md
rm -f .planning/ROADMAP.md
rm -f .planning/STATE.md
rm -f .planning/.ticket-lock

# Delete feature-specific directories
rm -rf .planning/phases/
rm -rf .planning/jira/
rm -rf .planning/debug/
rm -rf .planning/quick/
rm -rf .planning/todos/

# Keep: config.json, memory/, codebase/, patterns/, milestones/
```

## 5. Report

```markdown
Planning state cleaned.

**Kept:** config.json, memory/, codebase/, patterns/
**Deleted:** PROJECT.md, ROADMAP.md, STATE.md, phases/

Run `/ink:go` to start your next feature.

Tip: Consider committing the cleanup:
  git add .planning/ && git commit -m "chore: cleanup after {PROJECT_NAME}"
```

**Do NOT commit automatically** — suggest only.

</instructions>

<edge_cases>

**No .planning/ directory:**
```
No planning directory found. Nothing to clean up.
```

**No PROJECT.md but other files exist:**
```
No active project found, but .planning/ has leftover files.
Clean up anyway? [y/n]
```

**Memory directory has chapters:**
```
Note: Keeping {N} memory chapters for your next feature.
```

</edge_cases>
