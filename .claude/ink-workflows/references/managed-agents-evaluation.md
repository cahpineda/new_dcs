# Managed Agents Evaluation

> Decision date: 2026-04-28 | Outcome: NO full migration from Task tool

## 1. Executive Summary

Claude Managed Agents (beta: `managed-agents-2026-04-01`) was evaluated as a
replacement for the Claude Code Task tool in ink-agent-dev-helper. **Decision: do
NOT migrate.** Three hard blockers make full migration impractical at this time.

The one viable integration point — **Memory Stores** — is deferred to a standalone
future phase as an optional complement to `.planning/memory/chapters/`.

## 2. API Shape

**Required header on all requests:** `anthropic-beta: managed-agents-2026-04-01`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/agents` | POST | Create agent definition |
| `/v1/agents/{id}` | POST | Update agent |
| `/v1/sessions` | POST | Create session (attach agent + resources) |
| `/v1/sessions/{id}/events` | POST | Send user message |
| `/v1/sessions/{id}/stream` | GET | SSE event stream |
| `/v1/memory_stores` | POST | Create memory store |
| `/v1/memory_stores/{id}/memories` | POST/GET | CRUD on memories |

**Key SSE event types received:**
- `agent.message` — text response content
- `agent.tool_use` — tool invocation (handled automatically in container)
- `agent.tool_result` — tool output
- `agent.custom_tool_use` — custom tool (requires `user.custom_tool_result` response)
- `session.status_idle` — agent finished turn
- `session.status_terminated` — session ended

## 3. Comparison Matrix

| Dimension | Task Tool (Claude Code) | Managed Agents API |
|-----------|------------------------|-------------------|
| Execution context | Local environment | Cloud container |
| Lifecycle | Ephemeral per-request | Stateful session |
| Tool execution | Manual (developer handles) | Autonomous in container |
| Local file access | Full (`.planning/`, hooks) | None without resource upload |
| Hook system | Yes (PreToolUse/Stop/etc.) | No equivalent |
| Memory | In-context only (200k window) | Persistent Memory Stores (cross-session) |
| Cost | Free (part of Claude Code) | Pay-per-token (API) |
| Latency | Low (instant spawn) | Higher (cold start + cloud) |
| Scalability | Single instance | Horizontally scalable |
| Agent versioning | None | Built-in (POST /v1/agents versions) |

## 4. Migration Blockers

### Blocker 1 — No local file access
Agents run in cloud containers. The `.planning/` directory (phases, STATE.md,
ROADMAP.md, memory chapters) is not accessible without uploading files as session
resources before every invocation.

**Theoretical mitigation:** Sync `.planning/` to a Memory Store before each session.
**Verdict:** Impractical for a workflow that reads/writes dozens of planning files per phase.

### Blocker 2 — No hook system equivalent
ink-agent-dev-helper relies on PreToolUse/PostToolUse/Stop hooks
(e.g., `enforce-ink-tools.js`, `enforce-ticket.js`, `telemetry-session.js`).
Managed Agents has no hook interception mechanism — tool execution is opaque.

**Theoretical mitigation:** Move enforcement logic into agent system prompts or custom tools.
**Verdict:** Fragile and incomplete — system prompts can be ignored; custom tools add RTT.

### Blocker 3 — Cold start latency
Each new session provisions a cloud container. For the ink workflow (frequent
short agent invocations: planner, verifier, checker), cold starts would compound
into significant user-facing delays.

**Theoretical mitigation:** Reuse sessions across multiple turns.
**Verdict:** Viable for long-running tasks, but changes the session lifecycle model significantly.

## 5. Viable Integration — Memory Stores

Memory Stores are the single compelling feature for ink-agent-dev-helper:

- **Persistent:** Survive across sessions (no context window decay)
- **Sized for chapters:** 100KB per memory, 8 stores per session
- **File-like access:** Mounted at `/mnt/memory/` inside container
- **Versioned:** Every mutation creates an immutable version (30-day retention)

**Candidate use case:** Replace or mirror `.planning/memory/chapters/` as a remote
persistent layer — agents in future phases could read/write architectural decisions
without re-loading chapter files into context.

**Status:** Deferred to a standalone future phase. Requires designing a sync protocol
between local chapters and remote Memory Store without breaking the existing `memory`
command group in `ink-tools.js`.

## 6. Prototype Reference

A working prototype demonstrating the full API flow is at:
`.claude/ink-workflows/helpers/invoke-managed-agent.js`

```bash
# Requires ANTHROPIC_API_KEY and a pre-created Agent ID (POST /v1/agents)
node .claude/ink-workflows/helpers/invoke-managed-agent.js \
  --agent-id agent_01XYZ \
  --message "analyze this codebase" \
  [--session-id ses_01ABC]   # omit to create new session
  [--show-events]            # print all SSE events to stderr
```

The script is zero-dependency (native `https`), Node 16 compatible, and ZSH-safe.

## 7. Verification Sources

- Claude Code guide agent research (2026-04-28)
- Official docs: `platform.claude.com/docs/en/managed-agents/`
- Beta header confirmed: `managed-agents-2026-04-01`
