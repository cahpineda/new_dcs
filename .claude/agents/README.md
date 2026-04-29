---
name: agents-documentation
description: Documentation file - not an executable agent
---

# Ink Agents

13 specialized subagents for the Ink workflow system. Each runs with isolated context and a custom system prompt following the [Claude Code subagent specification](https://code.claude.com/docs/en/sub-agents).

## Available Agents

| Agent | Model | Memory | Skills | Tool Strategy | MCP Deps | Spawn Mode | maxTurns | mcpServers |
|-------|-------|--------|--------|---------------|----------|------------|----------|------------|
| ink-executor-agent | sonnet | project | ink-kb | inherit all | Serena, P2C | FOREGROUND | 15 | serena |
| ink-tdd-agent | sonnet | project | ink-kb | inherit all | Serena, P2C | FOREGROUND | 20 | — |
| ink-planner-agent | sonnet | project | ink-kb | deny Edit | P2C, Context7 | FOREGROUND | 20 | context7 |
| ink-debug-agent | sonnet | project | — | inherit all | Serena, P2C | FOREGROUND | 10 | serena |
| ink-discuss-agent | sonnet | project | — | deny Edit | Serena, P2C | FOREGROUND | 12 | serena, project2context |
| ink-verifier-agent | sonnet | project | — | deny Edit | P2C | FOREGROUND | 5 | serena |
| ink-research-agent | sonnet | — | ink-kb | deny Edit | P2C, Context7 | FOREGROUND | 8 | context7 |
| ink-plan-checker-agent | sonnet | — | — | deny Write, Edit | P2C | FOREGROUND | 8 | - |
| ink-stack-researcher-agent | sonnet | — | — | deny Edit | P2C, Context7 | FOREGROUND | 8 | context7 |
| ink-features-researcher-agent | sonnet | — | — | allowlist | None | BACKGROUND OK | 8 | - |
| ink-architecture-researcher-agent | sonnet | — | — | deny Edit | P2C | FOREGROUND | 8 | - |
| ink-pitfalls-researcher-agent | sonnet | — | — | deny Edit | P2C, Context7 | FOREGROUND | 8 | context7 |
| ink-research-synthesizer-agent | sonnet | — | — | allowlist | None | BACKGROUND OK | 5 | - |
| ink-integration-checker-agent | sonnet | — | — | deny Edit | P2C | FOREGROUND | 5 | - |
| ink-coverage-auditor-agent | sonnet | project | — | deny impl edits | None | FOREGROUND | 15 | - |

**Total: 14 agents** (12 FOREGROUND, 2 BACKGROUND OK)

**Tool strategies:**
- **inherit all**: No `tools` or `disallowedTools` — inherits everything from parent including MCP tools
- **deny X**: Uses `disallowedTools` — inherits all tools (incl. MCP) minus denied ones
- **allowlist**: Uses `tools` — only listed tools available (no MCP inheritance). Used for MCP-free agents

## Frontmatter Fields

All agents use only [officially supported frontmatter fields](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields):

| Field | Used | Notes |
|-------|------|-------|
| `name` | All 14 | Unique identifier, lowercase with hyphens |
| `description` | All 14 | When Claude should delegate to this agent |
| `model` | All 14 | `sonnet`, `opus`, or `inherit` (minimum: sonnet) |
| `disallowedTools` | 8 agents | Denylist — inherits all tools (incl. MCP) minus denied ones |
| `tools` | 2 agents | Explicit allowlist — only for MCP-free agents |
| `memory` | 5 agents | `project` scope — persists to `.claude/agent-memory/<name>/` |
| `skills` | 3 agents | `[ink-kb]` — full skill content injected at startup |
| `maxTurns` | All 14 | Turn limit (5–20) to prevent runaway agents |
| `mcpServers` | 8 agents | MCP servers the agent is allowed to use; omitted for MCP-free agents |
| `permissionMode` | — | Not used |
| `hooks` | 10 agents | PreToolUse hooks enforcing disallowedTools at runtime with `exit 2` |

## Hook Enforcement

11 agents have `hooks: PreToolUse` in frontmatter to enforce tool restrictions at runtime. This provides defense-in-depth: `disallowedTools` is advisory (Claude sees it), hooks with `exit 2` are enforcement (tool call is blocked).

| Agent | Hook Matcher | Blocks |
|-------|-------------|--------|
| ink-planner-agent | `Edit\|NotebookEdit` | Edit |
| ink-verifier-agent | `Edit\|NotebookEdit` | Edit |
| ink-plan-checker-agent | `Write\|Edit\|NotebookEdit` | Write + Edit |
| ink-research-agent | `Edit\|NotebookEdit` | Edit |
| ink-stack-researcher-agent | `Edit\|NotebookEdit` | Edit |
| ink-architecture-researcher-agent | `Edit\|NotebookEdit` | Edit |
| ink-pitfalls-researcher-agent | `Edit\|NotebookEdit` | Edit |
| ink-integration-checker-agent | `Edit\|NotebookEdit` | Edit |
| ink-features-researcher-agent | `Edit\|NotebookEdit` | Edit |
| ink-research-synthesizer-agent | `Edit\|NotebookEdit` | Edit |

**No hooks (write-enabled):** ink-executor-agent, ink-debug-agent

**Rule:** Every agent with `disallowedTools` containing Edit or Write MUST have a matching PreToolUse hook. This is validated by `agent validate` via the `hooks_consistent` check.

## MCP-Safe Spawn Rules

**CRITICAL:** MCP tools are NOT available in background subagents ([docs](https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background)).

| Spawn Mode | When | Rule |
|-----------|------|------|
| FOREGROUND | Agent has MCP dependencies | Never use `run_in_background=true` |
| BACKGROUND | Agent has NO MCP dependencies | Can use `run_in_background=true` |

**Background-safe agents:** ink-features-researcher-agent, ink-research-synthesizer-agent
**All others:** FOREGROUND only

### Native Spawn Pattern

```
Task(
  prompt="<context>{only context data, not agent instructions}</context>",
  subagent_type="ink-{role}-agent",
  description="Brief description"
)
```

**Do NOT:**
- Use `subagent_type="general-purpose"` for Ink agents
- Include `Read @.claude/agents/...` in prompt (agent loads own system prompt)
- Include `model="..."` in Task call (agent frontmatter defines model)
- Use `run_in_background=true` on MCP-dependent agents

## Persistent Memory

4 core agents have `memory: project` which creates `.claude/agent-memory/<name>/` for cross-session learning:

| Agent | What it remembers |
|-------|-------------------|
| ink-executor-agent | Code patterns, conventions, file structure |
| ink-debug-agent | Recurring bugs, root causes, workarounds |
| ink-planner-agent | Estimation accuracy, architectural decisions |
| ink-verifier-agent | False positives, project-specific criteria |

Memory is [project-scoped](https://code.claude.com/docs/en/sub-agents#enable-persistent-memory) and shareable via version control. The agent's MEMORY.md is auto-loaded at startup (first 200 lines).

## Preloaded Skills

3 agents have `skills: [ink-kb]` which [injects the full skill content](https://code.claude.com/docs/en/sub-agents#preload-skills-into-subagents) at startup:

- **ink-planner-agent** — plans respecting business rules
- **ink-executor-agent** — implements validating against policies
- **ink-research-agent** — researches with business context

Skills are NOT inherited from the parent conversation — they must be explicitly listed.

## Agent Patterns

### Planner + Checker

```
Task(subagent_type="ink-planner-agent")   # Creates PLAN.md
Task(subagent_type="ink-plan-checker-agent")  # Validates across 7 dimensions
```

Planner includes **impact analysis** (Step 4): for tasks that modify shared structures (formats, templates, conventions), it discovers consumers via grep and generates migration tasks. Tags breaking changes with `breaking_change: true` so the verifier can verify consumer compatibility.

Checker validates: completeness, feasibility, testability, dependencies, consistency, constraints, goal alignment. Optional via `features.planChecker` in config.json.

### Executor

```
Task(subagent_type="ink-executor-agent")
```

Implements each task from PLAN.md with atomic commits, deviation handling (5 rules), and SUMMARY.md generation. Config: `features.executorAgent` (default: true).

### Verifier

```
Task(subagent_type="ink-verifier-agent")
```

Goal-backward analysis: starts from phase goals, works backward to required artifacts. Checks existence, substance, wiring, and **consumer compatibility** (Step 6: for breaking changes, discovers consumers of modified formats and verifies they're compatible with the new format). Produces VERIFICATION.md.

### Parallel Research

```
# FOREGROUND (MCP-dependent)
Task(subagent_type="ink-stack-researcher-agent")
Task(subagent_type="ink-architecture-researcher-agent")
Task(subagent_type="ink-pitfalls-researcher-agent")

# BACKGROUND OK (no MCP)
Task(subagent_type="ink-features-researcher-agent", run_in_background=true)

# After all complete:
Task(subagent_type="ink-research-synthesizer-agent", run_in_background=true)
```

Output: `.planning/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS,SUMMARY}.md`

### Integration Checker

```
Task(subagent_type="ink-integration-checker-agent")
```

Cross-phase wiring verification. Spawned during milestone audit to verify exports/imports/references are connected across phases. Produces integration report with connected/orphaned/broken counts.

## Wave Execution

When executing phases with multiple plans, the orchestrator groups plans by `wave` frontmatter and spawns executors:

- **Wave N plans** execute in parallel (foreground, sequential within wave)
- **Wave N+1** starts after Wave N completes
- Plans with `autonomous: false` have checkpoint handling

Config:
| Key | Default | Purpose |
|-----|---------|---------|
| `features.waveExecution` | true | Enable wave-based execution |
| `features.maxConcurrentAgents` | 3 | Limit parallel agents |

## Creating New Agents

1. Create `.claude/agents/ink-{role}-agent.md`
2. Add frontmatter with only [official fields](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields): `name`, `description`, `model`, and optionally `memory`, `skills`
3. Choose tool strategy:
   - **Has MCP deps?** Use `disallowedTools` (inherits all tools incl. MCP)
   - **No MCP deps?** Use `tools` allowlist (explicit, no MCP inheritance)
4. Write system prompt as markdown body
5. Add `## MCP Dependencies` section documenting which MCP tools the agent uses and spawn mode
6. Add `## Memory Management` section if `memory: project` is set
7. Update this README table

### Specialization Test

Before creating a new agent:
1. Can you describe its job in ONE sentence?
2. Does it need different tools than existing agents?
3. Would it benefit from a different model?
4. Does it produce high-volume output where context isolation is valuable?
5. Can you list 3+ things it explicitly does NOT do?

If most answers are "no": use an existing agent or a skill instead.

## Model Selection

| Model | Best For | Trade-off |
|-------|----------|-----------|
| sonnet | Research, verification, implementation, debugging | Minimum model — good balance of quality and cost |
| opus | Complex reasoning, architecture planning | Most capable, slower |
| inherit | When parent model is appropriate | Uses orchestrator's model |

## Context Budgets

| Role | Max Context | Rationale |
|------|-------------|-----------|
| Orchestrator | 40% | Route, spawn, aggregate — stay lightweight |
| Agent | 50% | Fresh context for deep work |

## Naming Convention

Format: `ink-{role}-agent.md`

Rules:
- Lowercase with hyphens
- Descriptive role in the middle
- Always ends with `-agent.md`
- `name` in frontmatter matches filename (without `.md`)

---

*13 agents as of v3.3 (2026-03-06)*
*Ref: [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents)*
