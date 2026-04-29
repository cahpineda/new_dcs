# Stack — DCS Cloud2 Analysis Workspace

**Mapped:** 2026-04-29
**Type:** Analysis workspace (no local application code)

## Local Workspace

This directory is an Ink Innovation workflow workspace — not an application codebase.

| Component | Detail |
|-----------|--------|
| Runtime | Node.js (Darwin) |
| Primary tool | `bin/ink-tools.js` — zero-dependency CLI |
| Language | JavaScript (Node.js) |
| Workflow engine | Ink Innovation Agent Dev Helper (markdown-based) |

## Target Codebase: cloud2

The actual codebase being analyzed is the **cloud2** repository, accessed exclusively via the `project2context` MCP.

| Attribute | Value |
|-----------|-------|
| System | DCS — Departure Control System |
| Type | Laravel monolith (PHP) |
| Access | project2context MCP (`https://sandbox.inkcloud.io/mcp`) |
| Client | Multi-tenant (airlines / airports) |
| Frontend | Blade templates + JavaScript |

## MCP Tools Available

| MCP | Purpose |
|-----|---------|
| `project2context` | cloud2 codebase traversal — primary analysis tool |
| `ink-kb-mcp` | INK knowledge base (business rules) |
| `serena` | Code editing and symbol navigation (local workspace) |
| `context7` | External library documentation |
