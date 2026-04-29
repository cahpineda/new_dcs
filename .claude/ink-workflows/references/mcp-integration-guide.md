# MCP Integration Guide

Comprehensive guide for integrating Model Context Protocol (MCP) tools with Ink workflows. This guide covers when to use each MCP, how they integrate with the Ink phase system, and best practices for optimal performance.

---

## Overview

Ink workflows can leverage MCP servers to enhance capabilities for large codebase operations. MCPs are **optional** - all workflows function without them, but large projects (>50K LOC) benefit significantly from semantic analysis.

| MCP Server | Category | Primary Use Case |
|------------|----------|------------------|
| Project2Context (P2C) | Analysis | Codebase understanding, call tracing, impact analysis |
| Serena | Editing | Safe refactoring with reference tracking |
| Context7 | Reference | Library documentation lookup |
| NotebookLM | Knowledge | Personal RAG — citation-backed answers from dev-uploaded docs |

---

## When to Use Each MCP

### Decision Matrix

| Scenario | P2C | Serena | Context7 | NotebookLM |
|----------|-----|--------|----------|------------|
| Research new library | - | - | **YES** | - |
| Analyze codebase structure | **YES** | - | - | - |
| Find code by keyword | - | **YES** | - | - |
| Find functions by name | - | **YES** | - | - |
| Understand file structure | - | **YES** | - | - |
| Find all usages of a function | **YES** | **YES** | - | - |
| Rename a symbol safely | - | **YES** | - | - |
| Trace call dependencies | **YES** | - | - | - |
| Complex debugging | **YES** | - | - | - |
| Safe refactoring | - | **YES** | - | - |
| Dead code analysis | **YES** | - | - | - |
| API impact assessment | **YES** | - | - | - |
| Query dev-uploaded docs (PDFs, specs, ADRs) | - | - | - | **YES** |
| Answer from personal knowledge base | - | - | - | **YES** |

### Project Size Guidelines

| Project Size | LOC | MCP Recommendation |
|--------------|-----|-------------------|
| Small | <10K | Standard tools sufficient |
| Medium | 10-50K | P2C for analysis, Serena optional |
| Large | 50-200K | P2C + Serena strongly recommended |
| Very Large | >200K | P2C + Serena essential |

### Why MCP Matters for Large Codebases

Without MCP, agents must:
1. Read entire files to understand context (high token cost)
2. Use Grep patterns that may miss dynamic references
3. Manually trace call chains (error-prone)
4. Risk breaking references during refactoring

With MCP:
1. Query semantic index for targeted information
2. Get precise symbol locations and references
3. Trace calls through the semantic graph
4. Refactor with guaranteed reference updates

---

## Integration Architecture

### Phase System Integration

| Phase Type | Primary MCP | Secondary MCP |
|------------|-------------|---------------|
| Research | Context7 | P2C (for existing code analysis) |
| Planning | P2C | - |
| Execution | Serena | P2C (for impact checks) |
| Verification | P2C | - |
| Debug | P2C | - |

### Serena Mode Mapping

Serena has three operating modes. Match mode to phase type for optimal access control:

| Phase Type | Serena Mode | Rationale |
|------------|-------------|-----------|
| Research | `planning` | Read-only; no code changes during discovery |
| Planning | `planning` | Read-only; analyze structure, no edits |
| Execution | `editing` | Full access; code modifications required |
| Verification | `planning` | Read-only; inspect results without changing |
| Debug | `editing` | May need targeted fixes during diagnosis |
| Quick fix | `one-shot` | Targeted single-file edit, no project context needed |

**Default:** If unsure, use `editing` mode (superset of `planning`).

### Agent Integration Points

Ink agents integrate MCPs at specific points:

**Research Agent:**
- Uses P2C `query_repository_summary` for codebase overview
- Uses P2C `query_api_endpoints` for API discovery
- Uses Context7 for library documentation

**Executor Agent:**
- Uses Serena `find_symbol` for precise location
- Uses Serena `replace_symbol_body` for safe edits
- Uses P2C `detect_side_effects` before changes

**Verifier Agent:**
- Uses P2C `trace_call_path` to verify changes propagate
- Uses P2C `query_dead_code` to catch orphaned code

**Debug Agent:**
- Uses P2C `trace_call_path` for root cause analysis

---

## Tool Mapping with Fallbacks

### Project2Context Tools

| P2C Tool | Purpose | Fallback |
|----------|---------|----------|
| `query_repository_summary` | High-level codebase overview | Glob + Read (package.json, README) |
| `trace_call_path` | Follow function call chains | Grep for function name + manual tracing |
| `detect_side_effects` | Find code affected by changes | Grep for variable/function usage |
| `query_dead_code` | Identify unused code | Not easily replicated (skip) |
| `export_entry_points` | List public API surfaces | Grep for export statements |
| `query_api_endpoints` | Find HTTP routes | Grep for route patterns |

### Serena Tools

**Navigation**

| Serena Tool | Purpose | Fallback |
|-------------|---------|----------|
| `find_symbol` | Locate symbol definitions by name path | Grep for symbol name |
| `find_referencing_symbols` | Find all symbol usages | Grep for symbol usage |
| `get_symbols_overview` | File symbol inventory | Read file + manual parsing |

**Editing**

| Serena Tool | Purpose | Fallback |
|-------------|---------|----------|
| `rename_symbol` | Rename with reference updates | Grep + Edit (multiple files) |
| `replace_symbol_body` | Replace function body | Edit tool on specific file |
| `insert_before_symbol` | Add code before symbol | Read + Edit with line targeting |
| `insert_after_symbol` | Add code after symbol | Read + Edit with line targeting |
| `replace_content_in_file` | Replace text by line range | Edit tool |
| `insert_lines_in_file` | Insert at specific line | Edit tool |

**File Operations**

| Serena Tool | Purpose | Fallback |
|-------------|---------|----------|
| `list_dir` | List directory contents | Bash `ls` |
| `find_file` | Find files by name pattern | Glob |
| `search_for_pattern` | Regex search across files | Grep tool |

**Memory**

| Serena Tool | Purpose | Fallback |
|-------------|---------|----------|
| `write_memory` | Save Serena project context | `.planning/memory/chapters/` (different system) |
| `read_memory` | Retrieve Serena memories | N/A (Serena-internal) |
| `list_memories` | List Serena memory files | N/A (Serena-internal) |

### Fallback Strategy

When MCP is unavailable, agents follow this pattern:

```
1. Attempt MCP tool (if available)
2. On failure or unavailability:
   - Log fallback in task output
   - Use standard tool equivalent
   - Accept reduced efficiency/accuracy
3. Document MCP would improve results
```

---

## Best Practices

### 0. Use Deterministic MCP Commands (Preferred)

Instead of checking tool prefixes manually, use ink-tools.js:
- `node bin/ink-tools.js mcp check <server>` — check if configured
- `node bin/ink-tools.js mcp available-tools <server>` — get tool list with prefixed names
- `node bin/ink-tools.js mcp list` — all configured servers across platforms
- `node bin/ink-tools.js agent spawn-config <agent>` — includes `mcp_status` per dependency

### 1. Check MCP Availability Early

Detect MCP tools at task start, not during execution:

```markdown
<mcp_detection>
**Primary:** node bin/ink-tools.js mcp check <server-name>
**Fallback:** Check your available tools at task start:
- Look for `mcp__project2context__*` prefix
- Look for `mcp__serena__*` prefix
Report availability before proceeding.
</mcp_detection>
```

### 2. Use P2C Before Serena

For refactoring tasks:
1. **First:** Use P2C to analyze impact and find all references
2. **Then:** Use Serena to make safe changes
3. **Finally:** Use P2C to verify changes propagated correctly

### 3. Prefer Serena for Multi-File Changes

When a change affects multiple files, use Serena for renames — reference tracking prevents broken imports. Standard Edit requires manual tracking and risks incomplete updates.

### 4. Document MCP Usage in Summaries

In SUMMARY.md, include a brief MCP usage table (tool, times used, purpose).

---

## Performance Comparison

### Token Savings

| Operation | Without MCP | With MCP | Savings |
|-----------|-------------|----------|---------|
| Codebase overview | ~50K tokens (read files) | ~2K tokens (P2C query) | 96% |
| Find all references | ~20K tokens (grep + read) | ~1K tokens (Serena) | 95% |
| Impact analysis | ~30K tokens (manual trace) | ~3K tokens (P2C) | 90% |
| Safe rename | ~15K tokens (grep + edit) | ~2K tokens (Serena) | 87% |

### Detection Overhead

MCP detection adds negligible overhead: <10ms (tool list check, no network round-trip).

---

## Configuration Quick Reference

### Claude Code (.claude/settings.json or .mcp.json)

```json
{
  "mcpServers": {
    "project2context": {
      "url": "http://server:port/sse?api_key=KEY",
      "transport": "sse"
    },
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "claude-code", "--project-from-cwd"]
    }
  }
}
```

### Cursor IDE (.cursor/mcp.json)

```json
{
  "mcpServers": {
    "project2context": {
      "url": "http://server:port/sse?api_key=KEY",
      "transport": "sse"
    },
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "cursor", "--project-from-cwd"]
    }
  }
}
```

### OpenCode (opencode.json at project root)

```json
{
  "mcp": {
    "project2context": {
      "type": "http",
      "url": "http://server:port/mcp?api_key=KEY"
    },
    "serena": {
      "type": "stdio",
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--project-from-cwd"]
    }
  },
  "permission": {
    "read": "allow",
    "edit": "allow",
    "bash": "ask"
  }
}
```

Note: OpenCode uses `{ mcp: {} }` format (not `mcpServers`), requires explicit `type` field on each server, and auto-discovers MCP tools without manual tool lists.

---

## Troubleshooting Common Issues

### Tools Not Appearing

1. Restart IDE after configuration changes
2. Verify JSON syntax is valid
3. Check server is running (P2C) or command exists (Serena)
4. Look for errors in IDE console/logs

### P2C Connection Failures

1. Test URL directly: `curl http://server:port/sse`
2. Verify API key is valid and not expired
3. Check network connectivity to server
4. Ensure firewall allows connection

### Serena Project Detection

1. Ensure working directory has project markers
2. Add `package.json`, `pyproject.toml`, or similar
3. Check `--project-from-cwd` is in args
4. Verify Python/uv is installed

### Performance Degradation

1. Check server health (P2C dashboard if available)
2. Reduce concurrent MCP requests
3. Use fallback tools temporarily
4. Report issues to MCP server maintainer

---

## See Also

- **Configuration Template:** `@.claude/ink-workflows/templates/mcp-config-template.md`
- **Detection Reference:** `@.claude/ink-workflows/references/mcp-detection.md`
- **Detection Workflow:** `@.claude/ink-workflows/workflows/detect-mcp-tools.md`

---

*Guide: MCP Integration Patterns*
*Version: 2.0*
*Phase: 60-serena-mcp-integration-configuration-installer-workflows-and-documentation*
