<purpose>
Analyze existing codebase and generate structured documents in .planning/codebase/

Spawns parallel Explore agents for thorough analysis without context exhaustion.
</purpose>

<execution_order>
1. check_existing - Check if .planning/codebase/ exists
2. p2c_prefetch - Check if repo is indexed in project2context (GATE: determines agent count)
3. create_structure - Create directory
4. spawn_agents - 2 agents (if P2C indexed) OR 5 agents (if not)
5. collect_results - Wait and gather findings
6. write_documents - Fill templates: p2c-sourced docs + agent findings
7. verify_output - Check all docs created
8. generate_memory_md - Create memory.md
9. generate_project_context - Create .claude/rules/project-context.mdc
10. commit_codebase_map - Git commit
11. offer_next - Show completion and next steps
</execution_order>

<documents>

| Doc | Purpose | Source when P2C indexed | Source when P2C unavailable |
|-----|---------|------------------------|------------------------------|
| STACK.md | Tech stack, dependencies | P2C: export_package_graph + summary | Agent 1 |
| INTEGRATIONS.md | External APIs, services | P2C: repository_summary | Agent 1 |
| ARCHITECTURE.md | System design, patterns | P2C: repository_summary + structure | Agent 2 |
| STRUCTURE.md | Directory layout | P2C: analyze_repository_structure | Agent 2 |
| TESTING.md | Test framework, structure | P2C: query_test_coverage | Agent 3 |
| CONVENTIONS.md | Code style, naming | Agent A (always) | Agent 3 |
| CONCERNS.md | Tech debt, issues | Agent A (always) | Agent 4 |
| MODELS.md | Database schema, entities | Agent B (always) | Agent 5 |

</documents>

<process>

<step name="check_existing" priority="first">
**Primary:** Use Glob `.planning/codebase/*.md` to check if codebase mapping already exists.

If exists: Ask user - Refresh / Update / Skip
If not: Continue to create_structure
</step>

<step name="create_structure">
**Primary:** Use Write tool to create files in `.planning/codebase/` (directory auto-created).
</step>

<step name="p2c_prefetch" priority="gate">
**This step determines how many agents to spawn. Run it BEFORE create_structure.**

1. `node bin/ink-tools.js mcp check project2context`
2. If available: `mcp__project2context__list_repositories` → check if this repo is in the index

**IF repo is indexed ($P2C_FULL_COVERAGE = true):**
Run these calls to cover 5 of the 8 documents without agents:
- `mcp__project2context__query_repository_summary` → STACK, ARCHITECTURE, INTEGRATIONS
- `mcp__project2context__analyze_repository_structure` → STRUCTURE
- `mcp__project2context__export_package_graph` → STACK (dependency details)
- `mcp__project2context__query_test_coverage` → TESTING
- `mcp__project2context__export_entry_points` → ARCHITECTURE (entry points)

Store all results as $P2C_CONTEXT.

**Only 2 agents needed** for the remaining docs:
- CONVENTIONS (code style is implicit, not in p2c indexes)
- CONCERNS (TODOs/FIXME require file-level reading)
- MODELS (schema parsing requires reading model files directly)

**IF repo is NOT indexed ($P2C_FULL_COVERAGE = false):**
Skip all p2c calls. All 5 agents will run with Glob/Grep/Read.
</step>

<step name="spawn_agents">
**Agent count is determined by $P2C_FULL_COVERAGE from p2c_prefetch.**

---

### PATH A — P2C indexed ($P2C_FULL_COVERAGE = true): 2 agents only

Spawn 2 parallel Explore agents with `run_in_background=true`.
Each agent receives $P2C_CONTEXT as `<prefetched_context>` and must NOT re-discover what P2C already covered.

**Agent A: Conventions + Concerns**
Focus: Code style, naming conventions, TODO/FIXME, complexity, security gaps
Outputs: CONVENTIONS.md + CONCERNS.md
Search: `.eslintrc`, `.prettierrc`, comments in source files, large files

**Agent B: Models + Schema (ANTI-HALLUCINATION)**
Focus: Database tables, model definitions, entity relationships, field types
Outputs: MODELS.md
Search patterns by framework:
- Prisma: `prisma/schema.prisma`
- TypeORM: `*.entity.ts`
- Sequelize: `models/*.js`
- Drizzle: `schema.ts`
- Raw SQL: `migrations/*.sql`, `schema.sql`
- Mongoose: `*.model.ts`

**Remaining 5 docs (STACK, ARCHITECTURE, STRUCTURE, INTEGRATIONS, TESTING) are written directly from $P2C_CONTEXT in the write_documents step — no agents needed.**

---

### PATH B — P2C unavailable ($P2C_FULL_COVERAGE = false): 5 agents

Spawn 5 parallel Explore agents with `run_in_background=true`.
Code discovery: Serena (`get_symbols_overview`, `find_symbol`) → Grep/Glob/Read (last resort).

**Agent 1: Stack + Integrations**
Focus: Languages, runtime, frameworks, dependencies, external services
Search: package.json, .env files, config files, API clients

**Agent 2: Architecture + Structure**
Focus: Patterns, layers, data flow, entry points, directory organization
Search: index.ts, main.ts, src/ structure, import patterns

**Agent 3: Conventions + Testing**
Focus: Code style, naming, test framework, coverage
Search: .eslintrc, .prettierrc, *.test.*, vitest.config

**Agent 4: Concerns**
Focus: TODO/FIXME, complexity, security, missing tests
Search: Comments, large files, error handling gaps

**Agent 5: Models + Schema (ANTI-HALLUCINATION)**
Focus: Database tables, model definitions, entity relationships, field types
Search same patterns as Agent B above.

---

**Key instruction for all agents:** Always include file paths in backticks.

Output format for MODELS.md:
```markdown
## Tables/Collections

| Name | Purpose | Key Fields |
|------|---------|------------|
| users | User accounts | id, email, name, created_at |

## Field Details

### users
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Primary key |
| email | varchar(255) | UNIQUE, NOT NULL | User email |

## Relationships
- users.id → orders.user_id (one-to-many)
```
</step>

<step name="collect_results">
Use TaskOutput to collect from each agent.
Aggregate findings by document.
</step>

<step name="write_documents">
For each document, read its template from `.claude/ink-workflows/templates/codebase/{name}.md`, extract "File Template", fill placeholders, write to `.planning/codebase/{NAME}.md`.

**Source routing:**

If $P2C_FULL_COVERAGE = true:
- STACK.md, ARCHITECTURE.md, STRUCTURE.md, INTEGRATIONS.md, TESTING.md → fill from $P2C_CONTEXT
- CONVENTIONS.md, CONCERNS.md → fill from Agent A output
- MODELS.md → fill from Agent B output

If $P2C_FULL_COVERAGE = false:
- All 8 docs → fill from agent outputs (agents 1–5)
</step>

<step name="verify_output">
**Primary:** Use Glob `.planning/codebase/*.md` to verify all 8 documents exist.
All 8 docs must exist with content (MODELS.md may be minimal if no database detected).
</step>

<step name="generate_memory_md">
Generate `memory.md` in project root.
- High-level architecture overview
- Quick navigation for @.claude/ink-workflows/commands-internal/memory.md reference
- Summarizes .planning/codebase/ findings
- Keep ~100-150 lines
</step>

<step name="generate_project_context">
Generate `.claude/rules/project-context.mdc`.
- alwaysApply: true
- Patterns, conventions, guidelines from analysis
</step>

<step name="commit_codebase_map">
**Ask user before committing:**

```
## Ready to Commit Codebase Map

**Files to commit:**
- .planning/codebase/*.md (7 analysis documents)
- memory.md
- .claude/rules/project-context.mdc

**Proposed commit message:**
`docs: map existing codebase`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing (can commit later)
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add .planning/codebase/*.md memory.md .claude/rules/project-context.mdc
git commit -m "docs: map existing codebase

Co-Authored-By: ink-dev-helper "
```

**If user skips:** Continue to offer_next without committing.
</step>

<step name="offer_next">
```
Codebase mapping complete.

Created .planning/codebase/:
- STACK.md - Technologies and dependencies
- ARCHITECTURE.md - System design and patterns
- STRUCTURE.md - Directory layout
- CONVENTIONS.md - Code style and patterns
- TESTING.md - Test structure
- INTEGRATIONS.md - External services
- CONCERNS.md - Technical debt
- MODELS.md - Database schema and entities (prevents SQL hallucinations)

Next: /ink:new-project (use codebase context for planning)
```
</step>

</process>

<success_criteria>
- .planning/codebase/ created with 8 documents (including MODELS.md)
- memory.md generated in project root
- .claude/rules/project-context.mdc created
- All committed to git
</success_criteria>
