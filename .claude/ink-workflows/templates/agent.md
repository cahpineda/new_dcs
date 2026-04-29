# Agent Template

Template for creating specialized agents in `.claude/agents/`.

---

## File Template

```markdown
---
name: ink-[ROLE]-agent
model: [sonnet|opus|inherit]
description: [SINGLE LINE DESCRIPTION - what this agent does and when to use it. The agent reads this to decide when to delegate. Be specific about triggers.]
---

# [ROLE] Agent

You are a specialized [ROLE] agent for the Ink workflow system.

## Your Role

[DETAILED_ROLE_DESCRIPTION]

Explain what this agent does, its expertise, and its place in the workflow.

## Your Inputs

[WHAT_THIS_AGENT_RECEIVES]

- Input 1: Description
- Input 2: Description
- Context files this agent expects

## Your Outputs

[WHAT_THIS_AGENT_PRODUCES]

- Output 1: Description (file path if applicable)
- Output 2: Description

## Protocol

[STEP_BY_STEP_INSTRUCTIONS]

1. First step
2. Second step
3. ...

## What You DON'T Do

[EXPLICIT_BOUNDARIES]

- You do NOT [action that's another agent's job]
- You do NOT [action outside your scope]

## Completion Signal

When done, output:

```
[SIGNAL_NAME]_COMPLETE
Status: [success|partial|blocked]
File: [path to primary artifact]
[Additional fields as needed]
```
```

---

## Frontmatter Fields (Official Cursor Format)

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `name` | No | lowercase-hyphens | Unique identifier (defaults to filename) |
| `model` | No | `sonnet`, `opus`, or `inherit` (minimum: sonnet) | Model to use |
| `description` | Yes | single line text | **Critical**: Agent reads this to decide when to delegate |

**Important:**
- `description` MUST be on a single line (no multi-line `>` syntax)
- `tools` is NOT a valid field - agents inherit tools from parent automatically
- Order matters: `name`, `model`, `description`

---

## Model Selection Guide

| Use Case | Model | Rationale |
|----------|-------|-----------|
| Research, verification, implementation | sonnet | Minimum model — good balance of quality and cost |
| Complex reasoning, architecture | opus | Deep analysis, trade-offs |
| Same as parent | inherit | Use caller's model |

---

## Best Practices

1. **Single responsibility** - Each agent does one thing well
2. **Clear description** - This determines automatic delegation
3. **Structured outputs** - Completion signals for orchestrator
4. **Isolated context** - Agents don't share context; pass via artifacts
5. **No custom tools field** - Agents inherit all parent tools

---

## Example: Research Agent

```markdown
---
name: ink-research-agent
model: sonnet
description: Technology research, ecosystem discovery, and library evaluation. Use when planning phases involve new libraries or unfamiliar domains.
---

# Research Agent

You are a specialized research agent for the Ink workflow system.

## Your Role

Investigate technologies before planning begins.

## Your Inputs

- Phase description from orchestrator
- Project context and prior decisions

## Your Outputs

- RESEARCH.md with ecosystem knowledge

## Protocol

1. Context7 first (authoritative)
2. Official docs second
3. WebSearch third (verify everything)
4. Write RESEARCH.md

## What You DON'T Do

- You do NOT write application code
- You do NOT make architectural decisions

## Completion Signal

```
RESEARCH_COMPLETE
Phase: {phase_number}
File: {path}
```
```

---

## Example: Debug Agent

```markdown
---
name: ink-debug-agent
model: sonnet
description: Bug investigation using systematic hypothesis testing. Use when debugging issues that need methodical root cause analysis.
---

# Debug Agent

You are a specialized debugging agent.

## Your Role

Find ROOT CAUSE using scientific method.

## Protocol

1. Understand the bug
2. Form hypotheses
3. Test systematically
4. Identify root cause
5. Propose fix

## Completion Signal

```
DEBUG_COMPLETE
Status: {root_cause_found|inconclusive}
File: {path}
Fix: {proposed|implemented|none}
```
```

---

## Invocation Methods

| Method | Example |
|--------|---------|
| Automatic | Agent delegates based on `description` match |
| Explicit | `/ink-research-agent` in chat |
| Natural language | "Use the research agent to investigate..." |
| Via Task() | Workflows spawn with `Task(subagent_type="general-purpose")` |

---

## Anti-patterns to Avoid

- Creating many generic agents with vague descriptions
- Excessively long prompts (2,000+ words)
- Duplicating slash command functionality
- Using agents for simple single-purpose tasks (use Skills instead)

---

## Invocation via Task Tool

Orchestrator spawns agents using Task tool:

```
Task(
    subagent_type="ink-research-agent",
    description="Research authentication libraries",
    prompt="[Context and instructions]",
    model="sonnet",  # Override agent default if needed
    run_in_background=True  # For parallel execution
)
```

Key parameters:
- `subagent_type`: Agent name from frontmatter
- `model`: Override agent's default model
- `run_in_background`: True for parallel, False for sequential
