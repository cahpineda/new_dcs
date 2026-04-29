# MCP Detection Reference Guide

Reference guide for detecting and using MCP (Model Context Protocol) tools in Ink workflows. MCPs provide enhanced capabilities for large codebase operations but are optional.

---

## Tool Discovery via ToolSearch (MANDATORY for deferred tools)

Servers with many tools (serena, project2context, notebooklm, ink-qa-rag) run in **deferred** mode — their tools are not available in context until explicitly fetched via ToolSearch.

**Always-loaded servers** (available upfront, no ToolSearch required):
- `ink-kb-mcp` — `list_folders`, `rag_query_simple`
- `context7` — `resolve-library-id`, `query-docs`

**Deferred servers** (require ToolSearch before use):
- `serena` — 40+ semantic editing tools
- `project2context` — 20+ codebase analysis tools
- `notebooklm` — 8+ personal RAG tools
- `ink-qa-rag` — QA RAG tools

**Required pattern for deferred servers:**

```
1. Determine which tool from a deferred server is needed
2. Call ToolSearch with a descriptive query (e.g. "select:mcp__serena__find_symbol")
3. Verify the schema was loaded in the response
4. Only then call the tool

NEVER call mcp__serena__*, mcp__project2context__*, mcp__notebooklm__*, mcp__ink-qa-rag__*
without first running ToolSearch in the same session/subtask.
```

**ToolSearch query examples:**
| Need | Query |
|------|-------|
| Edit a symbol in code | `"select:mcp__serena__replace_symbol_body"` |
| Find a function in codebase | `"select:mcp__serena__find_symbol"` |
| Analyze full codebase | `"select:mcp__project2context__query_repository_summary"` |
| Trace call path | `"select:mcp__project2context__trace_call_path"` |
| Query NotebookLM | `"select:mcp__notebooklm__ask_question"` |
| Keyword semantic search | `"serena find symbol"` or `"project2context api endpoints"` |

---

## Detection Philosophy

**Core Principles:**

1. **P2C is the PRIMARY tool for code discovery** - When available, ALWAYS use P2C before Glob/Grep/Read. Do NOT use Grep for discovery when P2C returned results.
2. **MCPs are mandatory when available** - All Ink workflows must work without MCPs (graceful fallback), but when present they are the FIRST choice, not optional enhancers
3. **Detection is implicit** - Agents check their available tool list at execution start
4. **Non-blocking detection** - Never wait for MCP responses to determine availability
5. **Graceful fallback** - When MCP unavailable, use standard tools (Read, Edit, Write, Bash, Grep, Glob)
6. **Token savings are significant** - P2C reduces token usage by 60-80% on code-heavy tasks vs Glob/Grep

**When to use MCPs:**

| Scenario | Recommendation |
|----------|---------------|
| Any codebase with P2C configured | **ALWAYS use P2C FIRST** — saves tokens regardless of size |
| Small project (<10K LOC) without P2C | Standard tools sufficient |
| Medium project (10-50K LOC) without P2C | Serena preferred, Grep/Glob fallback |
| Large project (>50K LOC) without P2C | Serena strongly preferred |
| Refactoring with many references | Serena for reference tracking |
| Impact analysis before changes | P2C `detect_side_effects` (no equivalent in standard tools) |
| Dead code detection | P2C `query_dead_code` (no equivalent in standard tools) |

---

## Project2Context Detection

**MCP Server:** Project2Context (P2C)
**Purpose:** Semantic understanding of large codebases with call tracing and impact analysis

### Tool List

Check for tools with prefix `mcp__project2context__`:

| Tool | Purpose |
|------|---------|
| `query_repository_summary` | Get high-level codebase overview |
| `trace_call_path` | Follow function call chains |
| `detect_side_effects` | Identify what code changes affect |
| `query_dead_code` | Find unused code paths |
| `export_entry_points` | List public API surfaces |
| `query_api_endpoints` | Find HTTP endpoints and routes |

### Detection Pattern

```
If any tool starting with `mcp__project2context__` is in your available tools:
  Set P2C_AVAILABLE = true
Else:
  Set P2C_AVAILABLE = false
  Use fallback tools
```

### Usage Example

When analyzing a large codebase:

```
IF P2C_AVAILABLE:
  Use mcp__project2context__query_repository_summary to get codebase overview
  Use mcp__project2context__trace_call_path to understand dependencies
ELSE:
  Use Glob("**/*.{ts,js}") to list files
  Use Grep for function definitions and calls
  Use Read to inspect key files
```

---

## Serena Detection

**MCP Server:** Serena
**Purpose:** Semantic-safe code modifications with reference tracking

### Tool List

Check for tools with prefix `mcp__serena__`:

**Semantic Code Navigation**

| Tool | Purpose |
|------|---------|
| `find_symbol` | Locate symbol definitions precisely by name path |
| `find_referencing_symbols` | Find all usages of a symbol across codebase |
| `get_symbols_overview` | High-level symbol inventory for a file |

**Symbol Editing**

| Tool | Purpose |
|------|---------|
| `replace_symbol_body` | Replace function/method/class body |
| `insert_before_symbol` | Add code before a symbol |
| `insert_after_symbol` | Add code after a symbol |
| `rename_symbol` | Rename with reference updates across codebase |

**File Operations**

| Tool | Purpose |
|------|---------|
| `list_dir` | List files and directories |
| `find_file` | Find files by name pattern |
| `search_for_pattern` | Regex search across files |

**Memory**

| Tool | Purpose |
|------|---------|
| `write_memory` | Save architectural decisions and notes |
| `read_memory` | Retrieve stored memory chapters |
| `list_memories` | List available memory files |
| `edit_memory` | Update memory content |
| `delete_memory` | Remove obsolete memories |

**Project Management**

| Tool | Purpose |
|------|---------|
| `activate_project` | Set active project context |
| `check_onboarding_performed` | Verify project is onboarded |
| `onboarding` | Run project onboarding workflow |
| `get_current_config` | Show active project and tool config |
| `initial_instructions` | Load Serena instructions manual |

**Utility**

| Tool | Purpose |
|------|---------|
| `replace_content_in_file` | Replace text in file by line range |
| `insert_lines_in_file` | Insert content at specific line |

### Detection Pattern

```
If any tool starting with `mcp__serena__` is in your available tools:
  Set SERENA_AVAILABLE = true
Else:
  Set SERENA_AVAILABLE = false
  Use fallback tools
```

### Usage Example

When refactoring a function:

```
IF SERENA_AVAILABLE:
  Use mcp__serena__find_symbol to locate function
  Use mcp__serena__get_references to find all usages
  Use mcp__serena__replace_symbol_body to update implementation
ELSE:
  Use Grep to find function definition
  Use Grep to find usages (may miss some)
  Use Edit to modify function body
```

---

## Fallback Mapping

Complete mapping of MCP tools to standard tool equivalents:

### Project2Context Fallbacks

| P2C Tool | Standard Fallback | Notes |
|----------|-------------------|-------|
| `query_repository_summary` | Glob + Read (package.json, README, key files) | Less comprehensive but functional |
| `trace_call_path` | Grep for function name + Read callers | Manual chain following required |
| `detect_side_effects` | Grep for variable/function usage | May miss indirect effects |
| `query_dead_code` | Not easily replicated | Skip or defer analysis |
| `export_entry_points` | Grep for export statements | Pattern-based detection |
| `query_api_endpoints` | Grep for route patterns | Framework-specific patterns |

### Serena Fallbacks

| Serena Tool | Standard Fallback | Notes |
|-------------|-------------------|-------|
| `find_symbol` | Grep for symbol name | May match non-definitions |
| `find_referencing_symbols` | Grep for symbol usage | May miss dynamic references |
| `get_symbols_overview` | Read file + manual parsing | Less structured output |
| `rename_symbol` | Grep + Edit (multiple files) | Risk of incomplete rename |
| `replace_symbol_body` | Edit tool on specific file | No reference validation |
| `insert_before_symbol` | Read + Edit with line targeting | Requires line number calculation |
| `insert_after_symbol` | Read + Edit with line targeting | Requires line number calculation |
| `list_dir` / `find_file` | Glob / Read (native tools) | Native tools are equivalent |
| `search_for_pattern` | Grep tool | Direct equivalent |
| `replace_content_in_file` / `insert_lines_in_file` | Edit tool | Native tool is equivalent |
| `write_memory` / `read_memory` / `list_memories` | `.planning/memory/chapters/` files | Ink memory system |
| `activate_project` / `onboarding` | Manual project setup | One-time setup operation |
| `initial_instructions` | Read Serena docs directly | No equivalent shortcut |

### Serena Modes

Serena operates in different modes that control tool access:

| Mode | Access Level | Best For |
|------|-------------|----------|
| `planning` | Read-only (navigate + search) | Research, analysis, understanding code |
| `editing` | Full access (read + write + symbol edits) | Implementation, refactoring, fixes |
| `one-shot` | Quick fixes without full project context | Targeted single-file edits |

### Memory Coexistence

Serena and Ink maintain separate memory systems that serve different purposes:

| System | Location | Purpose | Managed By |
|--------|----------|---------|-----------|
| Serena memories | `.serena/memories/` | Serena project context, onboarding notes | `mcp__serena__write_memory` |
| Ink memory | `.planning/memory/chapters/` | Architectural decisions, domain knowledge (CAP-*.md) | `ink-tools.js memory` commands |

**Rule:** Never mix these systems. Ink agents use `.planning/memory/chapters/` exclusively. Serena memories are internal to Serena's project understanding and should not be read/written by Ink workflows directly.

### When to Prefer MCP

**RULE: When P2C is available, ALWAYS use it FIRST. It is not a preference — it is mandatory for token efficiency.**

| Scenario | P2C Tool | Why P2C is Mandatory |
|----------|----------|---------------------|
| Any code discovery task | `query_repository_summary` | Replaces dozens of Glob/Grep calls with single response |
| Debugging / investigation | `trace_call_path` | Instant call chain vs manual Grep tracing |
| Pre-change impact analysis | `detect_side_effects` | No standard equivalent exists |
| Dead code detection | `query_dead_code` | No standard equivalent exists |
| API/route discovery | `query_api_endpoints` | Replaces framework-specific Grep patterns |
| Entry point discovery | `export_entry_points` | Replaces Grep for export statements |
| Renaming used symbol | Serena `rename_symbol` | Reference tracking prevents broken code |

---

## Integration Instructions

### Referencing This Guide

In agent prompts, include:

```markdown
<mcp_reference>
@.claude/ink-workflows/references/mcp-detection.md
</mcp_reference>
```

### Inline Detection Snippet

Agents can use this snippet at task start:

```markdown
<mcp_detection>
Check your available tools for MCP prefixes:

1. **Project2Context**: Look for `mcp__project2context__*` tools
   - If found: P2C_AVAILABLE=true → **USE FIRST for ALL code discovery** (codebase overview, call tracing, entry points, dead code)
   - DO NOT use Glob/Grep for discovery when P2C is available — P2C output is authoritative
   - If not found: Fall through to Serena or Glob/Grep/Read

2. **Serena**: Look for `mcp__serena__*` tools
   - If found: SERENA_AVAILABLE=true → use for precise symbol navigation and refactoring
   - If not found: Use Edit for modifications

3. **Fallback mode**: If neither MCP available
   - Use standard tools exclusively
   - Accept higher token usage on code-heavy tasks
   - Document in task output that MCP would improve results
</mcp_detection>
```

### Conditional MCP Usage in Task Actions

Pattern for task specifications:

```xml
<task type="auto">
  <action>
    Analyze the auth module for dependencies.

    <if mcp="project2context">
      Use mcp__project2context__trace_call_path to map auth flow.
    </if>
    <if mcp="none">
      Use Grep to find auth function calls.
      Use Read to inspect key files.
    </if>
  </action>
</task>
```

### Agent Workflow Integration

When creating agent prompts:

```markdown
<mcp_context>
Before executing code-heavy tasks:

1. Check if P2C available (mcp__project2context__* tools)
2. Check if Serena available (mcp__serena__* tools)
3. Report capabilities in task preamble
4. Use appropriate toolset based on availability

See: @.claude/ink-workflows/workflows/detect-mcp-tools.md
</mcp_context>
```

---

## MCP Configuration

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "project2context": {
      "url": "http://your-p2c-server/sse",
      "transport": "sse"
    },
    "serena": {
      "command": "npx",
      "args": ["-y", "serena-mcp"]
    }
  }
}
```

### Cursor IDE

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "project2context": {
      "url": "http://your-p2c-server/sse?api_key=<key>",
      "transport": "sse"
    }
  }
}
```

---

## Performance Considerations

| Aspect | With MCP | Without MCP |
|--------|----------|-------------|
| Token usage (large codebase) | 60-80% reduction | Full file reads required |
| Refactoring safety | Reference tracking | Manual verification |
| Analysis accuracy | Semantic understanding | Pattern matching |
| Detection overhead | <100ms (tool list check) | N/A |

**Key insight:** MCP detection adds negligible overhead (<100ms) since it only checks the agent's tool list, not the MCP server.

---

*Reference: MCP Detection Patterns*
*Version: 2.0*
*Phase: 60-serena-mcp-integration-configuration-installer-workflows-and-documentation*
