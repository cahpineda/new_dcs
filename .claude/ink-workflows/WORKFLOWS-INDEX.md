# Workflows Index

This index is automatically generated. To regenerate, run:

```bash
npm run generate-index
```

**Last Generated:** 2026-04-22

---

## Table of Contents

- [Other Workflows](#other-workflows)

---

## Other Workflows

### autopilot

**Purpose:** Automated issue resolution: natural language or ticket key -> Jira -> fix -> verify -> PR.

**File:** `.claude/ink-workflows/workflows/autopilot.md`

---

### autopilot-fix

**Purpose:** Fix and verification module for the autopilot pipeline.

**File:** `.claude/ink-workflows/workflows/autopilot-fix.md`

---

### autopilot-jira

**Purpose:** Post-fix Jira operations for autopilot: update ticket with PR link/comment and optional status transition.

**File:** `.claude/ink-workflows/workflows/autopilot-jira.md`

---

### autopilot-loop

**Purpose:** Branch, commit, and push module for the autopilot pipeline.

**File:** `.claude/ink-workflows/workflows/autopilot-loop.md`

---

### autopilot-pr

**Purpose:** PR creation module for the autopilot pipeline.

**File:** `.claude/ink-workflows/workflows/autopilot-pr.md`

---

### complete-milestone

**Purpose:** Mark a shipped version as complete. Creates MILESTONES.md entry, archives to milestones/v[X.Y]-ROADMAP.md, evolves PROJECT.md, tags in git.

**File:** `.claude/ink-workflows/workflows/complete-milestone.md`

---

### context-preflight

**Purpose:** Load code and/or business context BEFORE the handler.

**File:** `.claude/ink-workflows/workflows/context-preflight.md`

---

### create-milestone

**Purpose:** Create a new milestone for an existing project. Defines phases, updates roadmap, and resets state tracking.

**File:** `.claude/ink-workflows/workflows/create-milestone.md`

---

### create-roadmap

**Purpose:** Define phases of implementation from PROJECT.md. Each phase delivers one coherent capability.

**File:** `.claude/ink-workflows/workflows/create-roadmap.md`

---

### custrq

**Purpose:** Create an Ink Innovation Customer Request document by conversationally gathering product or feature requirements. Publishes to Confluence under the Customer Requests folder, organised by airline.

**File:** `.claude/ink-workflows/workflows/custrq.md`

---

### debug

**Purpose:** Systematic debugging with persistent state that survives context resets.

**File:** `.claude/ink-workflows/workflows/debug.md`

---

### debug-resolution

**Purpose:** Resolution handlers for debug workflow.

**File:** `.claude/ink-workflows/workflows/debug-resolution.md`

---

### detect-mcp-tools

**Purpose:** MCP tool detection via ink-tools.js deterministic commands. Agents include this to check MCP availability before code-heavy tasks. Minimal size (<3KB) for low context overhead.

**File:** `.claude/ink-workflows/workflows/detect-mcp-tools.md`

---

### discovery-phase

**Purpose:** Execute discovery at appropriate depth level.

**File:** `.claude/ink-workflows/workflows/discovery-phase.md`

---

### discuss-milestone

**Purpose:** Help the user figure out what they want to build in the next milestone through collaborative thinking.

**File:** `.claude/ink-workflows/workflows/discuss-milestone.md`

---

### discuss-phase

**Purpose:** Gather phase context through collaborative thinking before planning. Help the user articulate their vision for how this phase should work, look, and feel.

**File:** `.claude/ink-workflows/workflows/discuss-phase.md`

---

### epicstories

**Purpose:** Create a Jira Epic and Story specifications from a Customer Request document or conversationally gathered requirements. Generates structured previews, then creates them in Jira after user confirmation.

**File:** `.claude/ink-workflows/workflows/epicstories.md`

---

### execute-phase

**Purpose:** Execute all plans in a phase with intelligent parallelization.

**File:** `.claude/ink-workflows/workflows/execute-phase.md`

---

### execute-phase-runtime

**Purpose:** Runtime execution module for execute-phase workflow.

**File:** `.claude/ink-workflows/workflows/execute-phase-runtime.md`

---

### execute-plan

**Purpose:** Orchestrator for plan execution workflow. This file coordinates specialized modules for execution, deviations, TDD, commits, and examples.

**File:** `.claude/ink-workflows/workflows/execute-plan.md`

---

### execute-plan-commits

**Purpose:** File tracking protocol for plan execution. This module defines how to track modified files after each task.

**File:** `.claude/ink-workflows/workflows/execute-plan-commits.md`

---

### execute-plan-core

**Purpose:** Core execution flow for plan execution. See @execute-plan.md for deviation rules, commit rules, and execution strategies.

**File:** `.claude/ink-workflows/workflows/execute-plan-core.md`

---

### execute-plan-deviations

**Purpose:** Deviation handling rules for plan execution.

**File:** `.claude/ink-workflows/workflows/execute-plan-deviations.md`

---

### execute-plan-tdd

**Purpose:** TDD (Test-Driven Development) execution flow for plans with `type: tdd` in frontmatter. This module defines the RED-GREEN-REFACTOR cycle execution.

**File:** `.claude/ink-workflows/workflows/execute-plan-tdd.md`

---

### execute-plan-wiring

**Purpose:** Wiring check module for plan execution. Scans new files after plan completion to detect unwired code.

**File:** `.claude/ink-workflows/workflows/execute-plan-wiring.md`

---

### go

**Purpose:** **CRITICAL PRINCIPLE:** One command to rule them all. The developer describes WHAT they want, Claude figures out HOW.

**File:** `.claude/ink-workflows/workflows/go.md`

---

### go-handler-new

**Purpose:** Handler for route_new intent in /ink:go and /ink:new workflows.

**File:** `.claude/ink-workflows/workflows/go-handler-new.md`

---

### go-handler-verify

**Purpose:** Handler for route_verify intent in /ink:go workflow.

**File:** `.claude/ink-workflows/workflows/go-handler-verify.md`

---

### go-handlers

**Purpose:** Core handlers for /ink:go workflow - high-frequency routes.

**File:** `.claude/ink-workflows/workflows/go-handlers.md`

---

### go-handlers-advanced

**Purpose:** Advanced handlers for /ink:go workflow - planning, verification, and investigation.

**File:** `.claude/ink-workflows/workflows/go-handlers-advanced.md`

---

### go-handlers-extended

**Purpose:** Extended handlers for /ink:go that delegate to commands-internal files.

**File:** `.claude/ink-workflows/workflows/go-handlers-extended.md`

---

### go-router

**Purpose:** Route /ink:go intent to correct workflow via deterministic dispatch.

**File:** `.claude/ink-workflows/workflows/go-router.md`

---

### jira-context

**Purpose:** Jira context generation.

**File:** `.claude/ink-workflows/workflows/jira-context.md`

---

### list-phase-assumptions

**Purpose:** Surface Claude's assumptions about a phase before planning, enabling users to correct misconceptions early.

**File:** `.claude/ink-workflows/workflows/list-phase-assumptions.md`

---

### map-codebase

**Purpose:** Analyze existing codebase and generate structured documents in .planning/codebase/

**File:** `.claude/ink-workflows/workflows/map-codebase.md`

---

### plan-phase

**Purpose:** Create executable PLAN.md for a phase. PLAN.md IS the prompt that Claude executes.

**File:** `.claude/ink-workflows/workflows/plan-phase.md`

---

### productcat

**Purpose:** Generate product catalogue pages for Confluence in the Ink Product Catalogue style.

**File:** `.claude/ink-workflows/workflows/productcat.md`

---


### research-phase

**Purpose:** Research unknown domain before planning. Spawns 4 parallel researcher agents (stack, features, architecture, pitfalls) followed by a synthesizer to produce unified RESEARCH.md.

**File:** `.claude/ink-workflows/workflows/research-phase.md`

---

### resume-project

**Purpose:** Restore full project context and present clear status for session continuity.

**File:** `.claude/ink-workflows/workflows/resume-project.md`

---

### resume-task

**Purpose:** Resume an interrupted subagent execution using the Task tool's resume parameter.

**File:** `.claude/ink-workflows/workflows/resume-task.md`

---

### ticket-resolver

**Purpose:** Reusable ticket resolution module. Detects whether input contains a Jira key or natural language.

**File:** `.claude/ink-workflows/workflows/ticket-resolver.md`

---

### transition

**Purpose:** Mark current phase complete and advance to next. Updates ROADMAP.md, evolves PROJECT.md, updates STATE.md.

**File:** `.claude/ink-workflows/workflows/transition.md`

---

### validate-decisions

**Purpose:** Validate technical decisions against research and best practices.

**File:** `.claude/ink-workflows/workflows/validate-decisions.md`

---

### verify-work

**Purpose:** Guide manual user acceptance testing with persistent state. Extract deliverables from SUMMARY.md, create/resume UAT.md, guide user through each test with auto-severity inference, log issues, and offer diagnosis for failures.

**File:** `.claude/ink-workflows/workflows/verify-work.md`

---

