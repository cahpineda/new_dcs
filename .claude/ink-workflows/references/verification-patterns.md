<verification_patterns>

Per-artifact-type verification patterns for detecting stubs, missing wiring, and incomplete implementations. Used by the verifier agent and `ink-tools.js verify` commands.

## How to Use

1. **Verifier agent:** Loads matching artifact types based on project tech stack
2. **ink-tools.js:** `verify stubs` uses language patterns; `verify ink-artifacts` uses Ink patterns
3. **Manual review:** Use grep patterns below for ad-hoc checks

---

## React/UI Components (`react`)

**Stub Indicators:**

| Pattern | Regex | Severity |
|---------|-------|----------|
| Placeholder text | `placeholder\|lorem ipsum\|sample text` | High |
| Empty render | `return\s*\(\s*\)\|return\s+null\s*;?\s*$` | High |
| TODO component | `TODO:.*component\|FIXME:.*render` | Medium |
| Hardcoded div | `<div>placeholder</div>\|<div>TODO</div>` | Medium |

**Wiring Checks:**
- Imported in parent component or page (`import.*{ComponentName}`)
- Registered in router/navigation (`<Route.*component=\|element=`)
- CSS module or styled-component exists (`.module.css\|styled\.`)

**Quality Checks:**
- Has props interface/type definition (`interface.*Props\|type.*Props`)
- Handles loading state (`loading\|isLoading\|Skeleton`)
- Handles error state (`error\|isError\|ErrorBoundary`)

---

## API Routes/Endpoints (`api`)

**Stub Indicators:**

| Pattern | Regex | Severity |
|---------|-------|----------|
| Hardcoded OK response | `res\.json\(\s*\{\s*ok:\s*true\s*\}\)` | High |
| Empty handler | `(req,\s*res)\s*=>\s*\{\s*\}` | High |
| Return 200 only | `res\.status\(200\)\.end\(\)` | High |
| TODO implement | `//\s*TODO:?\s*implement` | Medium |

**Wiring Checks:**
- Route registered (`app\.(get\|post\|put\|delete\|patch)\|router\.`)
- Middleware applied (`app\.use\|router\.use`)
- Referenced in frontend (`fetch\(\|axios\.\|api\.`)

**Quality Checks:**
- Input validation present (`validate\|schema\|zod\|joi\|yup`)
- Error handling (`try.*catch\|\.catch\(`)
- Proper status codes (not just 200 for everything)

---

## Database/Models (`database`)

**Stub Indicators:**

| Pattern | Regex | Severity |
|---------|-------|----------|
| Empty migration up | `async\s+up\s*\([^)]*\)\s*\{\s*\}` | High |
| Missing migration down | File has `up()` but no `down()` function | High |
| Empty seed data | `data\s*=\s*\[\s*\]` | Medium |
| Schema with 0 fields | Model/schema definition with no properties | High |

**Wiring Checks:**
- Model imported in service/controller (`import.*Model\|require.*model`)
- Migration in migration index or migrations directory
- Seed file referenced in seed runner

**Quality Checks:**
- Indexes on frequently queried columns (`createIndex\|addIndex\|@Index`)
- Reversible migration (has `down()` matching `up()`)
- Foreign key constraints (`references\|foreignKey`)
- Timestamps (`createdAt\|updatedAt\|timestamps: true`)

---

## Hooks/Effects (`hooks`)

**Stub Indicators:**

| Pattern | Regex | Severity |
|---------|-------|----------|
| Empty effect | `useEffect\(\(\)\s*=>\s*\{\s*\},\s*\[\]\)` | High |
| Hardcoded return | `return\s+\{\s*data:\s*\[\]\s*\}` | Medium |
| No cleanup | `useEffect` with subscription but no return cleanup | Medium |
| Empty deps array | Subscriptions/timers with `[]` deps (runs once, never updates) | Low |

**Wiring Checks:**
- Hook exported (`export.*function\s+use\|export\s+\{.*use`)
- Hook imported and used in component
- Dependency array matches variables used inside effect

**Quality Checks:**
- Cleanup function for subscriptions/intervals (`return () =>\|clearInterval\|unsubscribe`)
- Error state returned (`error\|isError`)
- Loading state returned (`loading\|isLoading\|pending`)

---

## Environment/Config (`env`)

**Stub Indicators:**

| Pattern | Regex | Severity |
|---------|-------|----------|
| Changeme value | `=changeme\|=CHANGEME` | High |
| TODO value | `=TODO\|=todo` | High |
| Placeholder | `=xxx\|=placeholder\|=replace_me` | High |
| Empty value | `^[A-Z_]+=\s*$` | Medium |

**Wiring Checks:**
- Key referenced in code (`process\.env\.KEY\|os\.environ\|getenv`)
- `.env.example` exists and matches `.env` keys
- No hardcoded secrets in source files (`password\s*=\s*['"][^'"]+['"]` outside .env)

**Quality Checks:**
- All required keys have values
- `.env.example` is committed (not gitignored)
- Startup validation (fail-fast if missing required env vars)
- Sensitive values not logged (`console\.log.*SECRET\|console\.log.*PASSWORD`)

---

## Ink Workflows/Agents (`ink`)

**Stub Indicators:**

| Pattern | Regex | Severity |
|---------|-------|----------|
| Tiny workflow | Workflow file < 8 lines | High |
| Missing purpose | No `<purpose>` tag | High |
| Missing process | No `<process>\|<execution_flow>` tag | High |
| Unfilled placeholder | `\[PLACEHOLDER\]\|\[TODO\]\|\[TBD\]` | Medium |
| Agent without signal | Agent .md without `Completion Signal` section | Medium |

**Wiring Checks:**
- Workflow: @-referenced by ≥1 file OR routed in go-router/handlers
- Agent: listed in agents/README.md AND spawned via `subagent_type=` in ≥1 workflow
- Reference: @-referenced by ≥1 workflow
- Command-internal: referenced in go-handlers-extended or another workflow

**Quality Checks:**
- Workflow under 8KB
- Reference under 12KB
- Agent has complete frontmatter (name, model, description)
- Template uses `[PLACEHOLDER]` syntax

**Automated:** `node bin/ink-tools.js verify ink-artifacts` checks all Ink structural rules.

---

## Extending Patterns

To add a new artifact type:

1. Add a section to this file following the same structure (stub indicators, wiring, quality)
2. Include grep-ready regex patterns in a table
3. If automated detection needed: add patterns to `ink-tools.js verify stubs` (language patterns)
4. Update verifier agent Step 4 table with new artifact type mapping

</verification_patterns>
