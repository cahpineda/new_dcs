<purpose>
MCP tool detection via ink-tools.js deterministic commands. Agents include this to check MCP availability before code-heavy tasks. Minimal size (<3KB) for low context overhead.
</purpose>

<detection_protocol>

## MCP Detection Protocol

**Primary:** Use `node bin/ink-tools.js mcp` commands for deterministic detection.
**Fallback:** Check tool list for MCP prefixes (if ink-tools.js unavailable).

### Quick Check All Configured Servers
```bash
node bin/ink-tools.js mcp list
# Returns: { servers: [{name, platform, type, url, known}], count: N }
```

### Check Specific Server
```bash
node bin/ink-tools.js mcp check <server-name>
# Returns: { name, status: "configured"|"placeholder_key"|"known"|"unknown", tools: [...], fallback: "..." }
```

### Get Tool Inventory
```bash
node bin/ink-tools.js mcp available-tools [server-name]
# Returns: tools with prefixed names for tool list matching
```

### Platform Config Discovery
```bash
node bin/ink-tools.js mcp config-path
# Returns: detected config files across all 5 platforms
```

</detection_protocol>

<usage_pattern>
## Usage Protocol (MANDATORY)

**Step 1: Check MCP availability at task start**
Run `node bin/ink-tools.js mcp check <server>` for each MCP dependency.
If ink-tools.js unavailable, check tool list for prefixes (see fallback table).

**Step 1b: Check for placeholder API keys**
If `mcp check` returns `status: "placeholder_key"`, warn the user:
> ⚠ **[server]** has a placeholder API key — configure a real key in your `.mcp.json` or tools will fail. Falling back to standard tools.
Then use fallback tools only for that server. Do NOT attempt to call MCP tools with a placeholder key.

**Step 2: ENFORCE P2C-FIRST for code discovery**
When P2C is available, it is the **PRIMARY and authoritative** tool for:
- Codebase overview → `query_repository_summary` (replaces Glob for file discovery)
- Call tracing → `trace_call_path` (replaces Grep for import/caller chains)
- Impact analysis → `detect_side_effects` (no standard equivalent)
- Dead code → `query_dead_code` (no standard equivalent)
- Entry points → `export_entry_points` (replaces Grep for export patterns)
- API routes → `query_api_endpoints` (replaces Grep for route definitions)

**DO NOT use Glob/Grep for discovery when P2C is available.** Only use Grep to verify a specific value AFTER P2C identifies the file/symbol.

**Step 3: Alert on fallback mode**
If no MCP servers configured and task involves code analysis: `MCP FALLBACK MODE: Using Glob/Grep/Read — higher token usage expected.`

**Step 4: Enforce verification**
In fallback mode, MUST still verify with Grep/Read/Glob. NEVER skip verification because MCP is unavailable.
</usage_pattern>

<fallback_protocol>
## Fallback Detection (ink-tools.js unavailable)

Check tool list for these prefixes:

| MCP Server | Prefix | Category | Primary Use |
|------------|--------|----------|-------------|
| ink-kb-mcp | `mcp__ink-kb-mcp__` | Knowledge | Business rules, documentation |
| Project2Context | `mcp__project2context__` | Analysis | Call tracing, impact analysis |
| Serena | `mcp__serena__` | Editing+ | Safe refactoring, symbol nav, memory, file ops |
| Context7 | `mcp__context7__` | Reference | Library documentation |

**Detection time:** <100ms (tool list check only, no network)
**Fallback chain:** ink-tools.js mcp check → tool prefix scan → standard tools (Grep/Read/Glob)

</fallback_protocol>

