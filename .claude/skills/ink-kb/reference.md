# MCP ink-kb-mcp Reference

## Overview

MCP server to query INK's Knowledge Base using RAG (Retrieval-Augmented Generation).

**Endpoint:** https://sandbox.inkcloud.io/kb/mcp
**Transport:** HTTP

---

## Tool: list_folders

Lists all available folders in the Knowledge Base.

**Parameters:** None

**Returns:**
```json
{
  "folders": [
    { "name": "policies", "description": "..." },
    { "name": "confluence", "description": "..." },
    { "name": "test-drive", "description": "..." }
  ]
}
```

**Example Call:**
```json
{
  "tool": "list_folders",
  "server": "ink-kb-mcp",
  "parameters": {}
}
```

**Usage:** Call this tool when you need to discover available folders or when auto-selecting a folder for a user query.

---

## Tool: rag_query_simple

Executes RAG query on the Knowledge Base.

**Parameters:**
- `folder_path` (string, required): Target folder name (e.g., "policies", "confluence", "test-drive")
- `query` (string, required): Your question in natural language

**Returns:**
```json
{
  "response": "Knowledge Base answer...",
  "sources": ["document1.md", "document2.pdf"],
  "chunks_used": 5,
  "data_source_ids": ["ds-123", "ds-456"]
}
```

**Example Call:**
```json
{
  "tool": "rag_query_simple",
  "server": "ink-kb-mcp",
  "parameters": {
    "folder_path": "policies",
    "query": "What are the email validation rules?"
  }
}
```

---

## Folders

The Knowledge Base is organized into folders. The skill automatically selects the most appropriate folder based on query intent.

### Available Folders

**policies**
- Corporate policies, standards, business rules
- Data validation requirements
- Workflows and approval processes
- Compliance requirements
- Integration patterns and API authentication

**confluence**
- General Confluence documentation
- How-to guides and tutorials
- Team wikis and collaborative docs

**test-drive** (fallback)
- Experimental or exploratory queries
- Generic questions without specific domain
- Fallback when no other folder matches

### Automatic Folder Selection

The skill calls `list_folders` to get the current list of folders with their descriptions, then reasons about which folder best matches the user's query intent — no static keyword mapping. This means new folders added to the MCP are automatically considered without any code changes.

- **High confidence** (one folder clearly fits): auto-selects and logs `[Auto-selected folder: ...]`
- **Low confidence** (ambiguous or no clear match): prompts the user to choose from a numbered list with folder names and descriptions

You can also explicitly specify a folder in your query:
- "policies: validation rules for users"
- "confluence documentation about X"

---

## Query Tips

✅ **Good examples:**
- "email validation rules for users"
- "invoice approval workflow"
- "personal data retention policy"
- "API authentication requirements"

❌ **Avoid:**
- Single words: "email", "user"
- Too vague: "information", "help"

**Tip:** Be specific and use natural language in English or Spanish.
