<purpose>
Execute discovery at appropriate depth level.
Produces DISCOVERY.md (for Level 2-3) that informs PLAN.md creation.
Called from plan-phase.md with depth parameter.

NOTE: For comprehensive ecosystem research, use /ink:research-phase instead.

See @references/ui-brand.md for output formatting (spawning indicators, "Next Up" blocks).
</purpose>

<depth_levels>
| Level | Name         | Time      | Output         | When                                |
|-------|--------------|-----------|----------------|-------------------------------------|
| 1     | Quick Verify | 2-5 min   | No file        | Confirming syntax, single library   |
| 2     | Standard     | 15-30 min | DISCOVERY.md   | Choosing options, new integration   |
| 3     | Deep Dive    | 1+ hour   | Full DISCOVERY | Architectural decisions, novel      |
</depth_levels>

<source_hierarchy>
**Context7 BEFORE WebSearch** (Claude's data is 6-18 months stale)

1. Context7 MCP FIRST - Current docs, no hallucination
2. Official docs - When Context7 lacks coverage
3. WebSearch LAST - Comparisons and trends only

See templates/discovery.md for full protocol.
</source_hierarchy>

<execution_order>
1. determine_depth - Check depth parameter
2. Execute level-specific workflow (1, 2, or 3)
3. For Level 2-3: create_discovery_output
4. confidence_gate - Check >=90%
5. offer_next - Ready for planning
</execution_order>

<step name="level_1_quick_verify">
**Level 1: Quick Verification (2-5 min)**

1. Resolve library in Context7:
   `mcp__context7__resolve-library-id with libraryName: "[library]"`

2. Fetch relevant docs:
   `mcp__context7__query-docs with context7CompatibleLibraryID, topic`

3. Verify: Current version, API syntax unchanged, no breaking changes

4. **If verified:** Return to plan-phase.md. No DISCOVERY.md needed.
5. **If concerns:** Escalate to Level 2.
</step>

<step name="level_2_standard">
**Level 2: Standard Discovery (15-30 min)**

1. Identify options and comparison criteria
2. Context7 for each option (resolve + query-docs)
3. Official docs for gaps
4. WebSearch for comparisons: "[A] vs [B] {year}", "[X] known issues"
5. Cross-verify WebSearch findings with authoritative sources
6. Consult references/research-pitfalls.md for quality check
7. Create DISCOVERY.md with recommendation, findings, code examples

**Output:** `.planning/phases/XX-name/DISCOVERY.md`
</step>

<step name="level_3_deep_dive">
**Level 3: Deep Dive (1+ hour)**

1. Scope discovery using templates/discovery.md
2. Exhaustive Context7 research (all libraries, patterns)
3. Official docs deep read (architecture, best practices, limitations)
4. WebSearch for ecosystem context (how others solved it)
5. Cross-verify ALL findings
6. Quality check with references/research-pitfalls.md
7. Create comprehensive DISCOVERY.md with quality report
8. If LOW confidence on critical findings → add validation checkpoints

**Output:** `.planning/phases/XX-name/DISCOVERY.md` (comprehensive)
</step>

<step name="create_discovery_output">
Write `.planning/phases/XX-name/DISCOVERY.md`:
- Summary with recommendation
- Key findings with sources
- Code examples if applicable
- Metadata (confidence, dependencies, open questions, assumptions)
</step>

<step name="confidence_gate">
**LOW confidence:**
Ask user: "Discovery confidence is LOW: [reason]. Dig deeper / Proceed anyway / Pause?"

**MEDIUM confidence:**
Note: "Discovery complete (medium confidence). [reason]. Proceed?"

**HIGH confidence:**
Proceed directly: "Discovery complete (high confidence)."
</step>

<step name="offer_next">
Display "Next Up" block (see @references/continuation-format.md):
```
Discovery complete: .planning/phases/XX-name/DISCOVERY.md
Recommendation: [one-liner]
Confidence: [level]

## ▶ Next Up
**Phase [N]: [Name]** — Create phase plan

**Also available:**
- `/ink:go discuss phase [N]` — gather context first
- `/ink:go research phase [N]` — dig deeper
- Review discovery
```

NOTE: DISCOVERY.md is NOT committed separately - committed with phase completion.
</step>

<success_criteria>
**Level 1:** Context7 consulted, verified or escalated, no files
**Level 2:** Context7 + WebSearch verified, DISCOVERY.md created, confidence MEDIUM+
**Level 3:** Exhaustive research, all findings verified, comprehensive DISCOVERY.md
</success_criteria>
