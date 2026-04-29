# Anthropic Features Roadmap

This reference tracks adoption of Anthropic/Claude Code 2025 features in the Ink workflow system — what has been adopted, what was deferred and why, and the recommended order for future phases.

---

## 1. Purpose

Ink regularly evaluates new Anthropic platform capabilities for adoption. This document:

- Records which features are **active** in the current codebase
- Documents **deferred features** with the reason for deferral
- Provides a **phased roadmap** so future phases have a clear starting point

Sources verified via Context7 (`/anthropic/anthropic-sdk-python`, `/anthropic/courses`) and WebSearch on 2026-04-28.

---

## 2. Adopted in Phase 82

### Feature: `effort` frontmatter field

**What it is:** The `effort` field in Claude Code agent frontmatter controls inference effort (extended thinking budget) per agent. Accepted values: `low | medium | high | xhigh | max`.

**How Ink uses it:** Each of the 14 specialized agents now declares an effort level matched to its cognitive load profile.

**Tier mapping:**

| Effort level | Agents | Rationale |
|---|---|---|
| `xhigh` | `ink-planner-agent`, `ink-debug-agent` | Deep reasoning required: plan decomposition and systematic root-cause analysis are the most cognitively demanding tasks in the pipeline |
| `high` | `ink-executor-agent`, `ink-verifier-agent`, `ink-tdd-agent`, `ink-plan-checker-agent`, `ink-integration-checker-agent`, `ink-coverage-auditor-agent` | Sustained multi-step work: implementation, verification, TDD cycles, and integration checks require strong reasoning without full extended-thinking overhead |
| `medium` | `ink-research-agent`, `ink-discuss-agent`, `ink-architecture-researcher-agent`, `ink-features-researcher-agent`, `ink-pitfalls-researcher-agent`, `ink-stack-researcher-agent`, `ink-research-synthesizer-agent` | Research and synthesis: broad information gathering where speed and breadth matter more than deep inference |

**Change scope:** Frontmatter-only — one line inserted after `model:` in each agent file. No agent body was modified.

---

## 3. Roadmap — Deferred to Future Phases

The following Anthropic features were evaluated during Phase 82 research but require Agent SDK work or harness changes not suitable for a simple frontmatter update. They are listed in recommended adoption order.

### Phase N+1: Interleaved Thinking via Agent SDK wrapper [DONE — Phase 83]

- **Beta header:** `interleaved-thinking-2025-05-14`
- **What it does:** Allows the model to emit thinking blocks between tool calls, improving multi-step reasoning in agentic loops.
- **Why deferred:** Not supported in Claude Code agent frontmatter. Requires direct Anthropic SDK calls with `betas=["interleaved-thinking-2025-05-14"]` and streaming handling. Must be implemented as an Agent SDK wrapper around the planner and debug agents.
- **Recommended target:** `ink-planner-agent` and `ink-debug-agent` (already `xhigh` effort — highest ROI for interleaved thinking).
- **Value:** Highest-value next step. Planner plan quality and debug root-cause accuracy are the two biggest levers on overall pipeline quality.

**Status:** Implemented as `spawn-thinking-agent.js` (zero-dep, native https). Available via `node bin/ink-tools.js think`. Deprecated beta header replaced with adaptive/enabled thinking params.

### Phase N+2: Claude Managed Agents evaluation [DONE — Phase 84]

- **Beta header:** `managed-agents-2026-04-01`
- **What it does:** Anthropic-hosted orchestration for multi-agent loops with built-in memory and handoffs.
- **Why deferred:** Requires formal evaluation of whether Ink's existing `.planning/` state management and wave-execution model should be replaced or complemented by managed agents. Architectural decision needed before implementation.
- **Recommended approach:** Spike with a single isolated workflow (e.g., `/ink:research`) before committing to full adoption.

**Status:** Evaluated. Decision: NO full migration (hooks, local files, cold starts blockers). Memory Stores viable as optional complement — deferred to standalone phase. See `managed-agents-evaluation.md`.

### Phase N+3: Context Compaction for Long-Running Agents

- **What it does:** Automatic context window summarization when approaching the 200k token limit, allowing agents to run indefinitely.
- **Why deferred:** Current agents are bounded by `maxTurns` (5–25) and rarely hit the context ceiling. Need is rare today but will grow as agent complexity increases.
- **Trigger condition:** When any agent consistently hits context limits or `maxTurns` must be raised above 30 to complete tasks.

### Phase N+4: Prompt Caching Optimization (1-Hour TTL) [BLOCKED]

- **What it does:** Cache stable prompt prefixes for up to 1 hour, reducing latency and cost for repeated agent invocations.
- **Why blocked:** Investigated 2026-04-28. The 1-hr TTL regressed to 5-min default in early March 2026. Explicit `cache_control` with `ttl: "1h"` is not configurable in Claude Code agent markdown frontmatter or CLAUDE.md — only available via direct Anthropic API calls. No actionable change possible within the current Claude Code agent architecture.
- **Unblock condition:** Anthropic adds `cache_control` frontmatter field to Claude Code agent files, OR system migrates to Agent SDK for direct API control.
- **Action:** Filed as feature request candidate to Anthropic.

### Phase N+5: Message Batches — 300k Output for Research Phases [DONE — Phase 85]

- **What it does:** The Batches API allows up to 300k output tokens per request, enabling much larger research artifacts in a single call.
- **Why deferred:** Requires refactoring `ink-research-agent` and the four parallel researcher agents to use the Batches API instead of streaming. The current synchronous request pattern must be replaced with async batch submission and polling.
- **Recommended approach:** Refactor research agents to a batch-aware runner before adopting this feature.

**Status:** Implemented as `batch-research.js` (zero-dep, native https). 50% cost discount on all tokens + 300k output via beta header `output-300k-2026-03-24`. Available via `node bin/ink-tools.js batch`. Best for parallel research phases. No real-time streaming — uses poll-then-fetch pattern.

---

## 4. Verification Sources

| Claim | Source | Verified |
|---|---|---|
| `effort` field is supported in Claude Code agent frontmatter | Context7 `/anthropic/anthropic-sdk-python` + Claude Code docs | 2026-04-28 |
| `effort` accepted values: `low\|medium\|high\|xhigh\|max` | Claude Code agent frontmatter docs | 2026-04-28 |
| `interleaved-thinking-2025-05-14` beta header | Context7 Anthropic SDK extended thinking docs | 2026-04-28 |
| `managed-agents-2026-04-01` beta header | Context7 Anthropic managed agents docs | 2026-04-28 |
| Beta headers are NOT supported in Claude Code agent frontmatter | Claude Code agent frontmatter specification | 2026-04-28 |
| 1-hour prompt cache TTL | Anthropic prompt caching documentation | 2026-04-28 |
| Message Batches 300k output limit | Anthropic Batches API documentation | 2026-04-28 |
