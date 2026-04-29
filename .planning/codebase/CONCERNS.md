# Concerns — DCS Cloud2 Analysis Workspace

**Mapped:** 2026-04-29

## Workspace Concerns

Minimal — this is a clean analysis workspace with no tech debt.

| Concern | Severity | Notes |
|---------|----------|-------|
| project2context MCP availability | Medium | If P2C MCP is unavailable, analysis is blocked — no fallback for cloud2 traversal |
| cloud2 repo not indexed | Low | P2C may need indexing time on first query |

## Known Risks for the Analysis Task (ACA-2962)

These are risks for the ANALYSIS WORK, not the workspace itself:

| Risk | Impact | Mitigation |
|------|--------|------------|
| Multitenancy deeply embedded | High coupling makes module boundaries unclear | Document as-is; flag for rewrite strategy |
| PSS/GDS integrations are per-tenant | Makes mandatory vs optional classification complex | Use frequency analysis via P2C |
| Shared DB tables across modules | High rewrite complexity | Explicitly flag as hotspots |
| Large codebase — P2C token limits | May miss some areas | Use targeted queries per module |
