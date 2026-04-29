# MCP Configuration Template

This template provides ready-to-use MCP (Model Context Protocol) configurations for integrating Project2Context and Serena with your Ink workflows.

---

## Overview

| MCP Server | Purpose | Transport |
|------------|---------|-----------|
| Project2Context (P2C) | Semantic codebase analysis, call tracing | SSE |
| Serena | Safe refactoring with reference tracking | Command (stdio) |
| Context7 | Library documentation lookup | Command (stdio) |

---

## Claude Code Configuration

Add to `~/.claude/settings.json` or project-level `.claude/settings.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "description": "Library documentation lookup"
    },
    "project2context": {
      "url": "http://YOUR_P2C_SERVER:PORT/sse?api_key=YOUR_API_KEY",
      "transport": "sse",
      "description": "Project2Context - Codebase analysis MCP"
    },
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "claude-code",
        "--project-from-cwd"
      ],
      "description": "Serena - Semantic code editing"
    }
  }
}
```

### Configuration Notes

**Project2Context:**
- Replace `YOUR_P2C_SERVER:PORT` with your P2C server address
- Replace `YOUR_API_KEY` with your API key
- Transport must be `sse` (Server-Sent Events)

**Serena:**
- Requires Python 3.10+ and `uv` package manager
- Uses `--project-from-cwd` to detect project automatically
- Context `claude-code` optimizes for Claude's tool format

---

## Cursor IDE Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "project2context": {
      "url": "http://YOUR_P2C_SERVER:PORT/sse?api_key=YOUR_API_KEY",
      "transport": "sse"
    },
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "cursor",
        "--project-from-cwd"
      ]
    }
  }
}
```

### Cursor-Specific Notes

- Cursor uses `.cursor/mcp.json` (different from Claude Code)
- Serena context should be `cursor` instead of `claude-code`
- Same P2C configuration works across both platforms

---

## Environment Variables (Optional)

For security, use environment variables instead of hardcoded keys:

```bash
# Add to ~/.zshrc or ~/.bashrc
export P2C_URL="http://your-p2c-server:port"
export P2C_API_KEY="your-api-key"
```

Then reference in configuration:

```json
{
  "mcpServers": {
    "project2context": {
      "url": "${P2C_URL}/sse?api_key=${P2C_API_KEY}",
      "transport": "sse"
    }
  }
}
```

---

## Verification Steps

### 1. Check MCP Server Status

**Claude Code:**
```bash
# Restart Claude Code after configuration changes
# Then in a conversation, ask:
"List my available MCP tools"
```

**Cursor:**
```bash
# Restart Cursor IDE
# Open a new chat and verify MCP tools are listed
```

### 2. Test P2C Connection

If P2C is configured correctly, you should see tools:
- `mcp__project2context__query_repository_summary`
- `mcp__project2context__trace_call_path`
- `mcp__project2context__detect_side_effects`

### 3. Test Serena Connection

If Serena is configured correctly, you should see tools:
- `mcp__serena__find_symbol`
- `mcp__serena__find_referencing_symbols`
- `mcp__serena__get_symbols_overview`
- `mcp__serena__rename_symbol`
- `mcp__serena__replace_symbol_body`
- `mcp__serena__write_memory`

---

## Serena Mode Switching

Serena operates in three modes that control tool access. Use the appropriate mode per phase:

| Mode | Access | When to Use |
|------|--------|-------------|
| `planning` | Read-only (navigate, search) | Research, analysis phases |
| `editing` | Full (read + write + edit) | Execution, debug phases |
| `one-shot` | Quick targeted fix | Single-file edits, no context needed |

To switch modes, instruct Serena via the `mcp__serena__switch_modes` tool or use the context flag in the MCP server args. The `--context claude-code` arg sets the base context; modes are switched at runtime during the session.

**Note:** If mode switching is unavailable in your Serena version, `editing` mode (default) provides full access and is safe to use for all phase types.

---

## Serena Project Onboarding

When using Serena on a new project for the first time, run the onboarding workflow to enable accurate symbol navigation:

```
Step 1: Activate the project
  mcp__serena__activate_project: { "project": "<path-to-project>" }
  OR use --project-from-cwd in server args (auto-activates from working directory)

Step 2: Check if onboarding was performed
  mcp__serena__check_onboarding_performed
  Returns: { performed: true|false }

Step 3: If not performed, run onboarding
  mcp__serena__onboarding
  Returns: instructions for creating project onboarding info

Step 4: Verify tools are available
  mcp__serena__get_current_config
  Returns: active project, available tools, current mode
```

**When to onboard:** First use on any project. Onboarding creates `.serena/` in the project root with project-specific context that improves symbol navigation accuracy.

**Ink memory note:** Serena's `.serena/memories/` is separate from Ink's `.planning/memory/chapters/`. Do not mix these systems.

---

## Troubleshooting

### MCP Server Not Starting

**Symptom:** Tools not appearing after restart

**Solutions:**
1. Check server logs: `npx @modelcontextprotocol/inspector`
2. Verify command is correct and dependencies installed
3. For P2C: Test URL in browser (should show SSE stream)
4. For Serena: Run `uvx --from git+https://github.com/oraios/serena serena --version`

### Authentication Errors (P2C)

**Symptom:** 401/403 errors in logs

**Solutions:**
1. Verify API key is correct
2. Check key has not expired
3. Ensure URL includes `?api_key=` parameter
4. Try regenerating API key

### Serena Project Detection Issues

**Symptom:** Serena commands fail with "no project found"

**Solutions:**
1. Ensure `--project-from-cwd` is in args
2. Check working directory has recognized project markers
3. Create a `pyproject.toml` or `package.json` if missing

### Tool Prefix Mismatch

**Symptom:** Tools appear but with different prefix

**Solutions:**
1. Check MCP server name matches expected prefix
2. Server name `project2context` -> tools are `mcp__project2context__*`
3. Server name `serena` -> tools are `mcp__serena__*`

---

## Minimal Configuration

If you only need one MCP, use these minimal configs:

**P2C Only (Claude Code):**
```json
{
  "mcpServers": {
    "project2context": {
      "url": "http://localhost:8000/sse?api_key=your-key",
      "transport": "sse"
    }
  }
}
```

**Serena Only (Claude Code):**
```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "claude-code", "--project-from-cwd"]
    }
  }
}
```

---

*Template: MCP Configuration*
*Version: 2.0*
*Phase: 60-serena-mcp-integration-configuration-installer-workflows-and-documentation*
