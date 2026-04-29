<purpose>
Wiring check module for plan execution. Scans new files after plan completion to detect unwired code.
Loaded conditionally when features.autoWiringCheck is enabled.

See @execute-plan-core.md for main execution flow.
See @execute-plan-deviations.md for Rule 6 (per-task wiring check).
</purpose>

<wiring_check>

## Post-Plan Wiring Scan

**Trigger:** After create_summary, before update_current_position.
**Config:** `features.autoWiringCheck` in config.json (default: true). Skip if false.

### 1. Collect New Files

```bash
# Get files added during this plan's commits
# Use the first and last commit hashes tracked during execution
NEW_FILES=$(git diff --diff-filter=A --name-only {first_commit}^..{last_commit})
```

If no new files, skip with: `Wiring: No new files to check.`

### 2. Filter Exceptions

Remove files matching these patterns (same as deviation Rule 6):
- Test files: `*.test.*`, `*.spec.*`, `__tests__/`
- Config files: `*.config.*`, `.env*`, `tsconfig*`, `*.json`, `*.yml`, `*.yaml`
- Entry points: `index.*`, `main.*`, `app.*`, `server.*`
- Migrations: `migrations/`, `*.migration.*`
- Type declarations: `*.d.ts`, `types.*`, `*.types.*`
- Documentation: `*.md`, `LICENSE`, `README*`
- Static assets: `*.css`, `*.svg`, `*.png`, `*.ico`

### 3. Language-Aware Import Check

**Code discovery preference:** P2C FIRST (`trace_call_path` for import chains, `query_dead_code` for unwired files) → Serena (`find_referencing_symbols` for import/export wiring, `find_symbol` for export verification) → Grep/Glob/Read (last resort only if MCP unavailable).

For each remaining file, search for references using language-appropriate patterns:

**TypeScript/JavaScript** (`*.ts`, `*.tsx`, `*.js`, `*.jsx`):
```bash
# Check for import/require of the file (without extension)
BASENAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
grep -r "from.*['\"].*${BASENAME}['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "node_modules" | wc -l
```

**Python** (`*.py`):
```bash
BASENAME=$(basename "$FILE" .py)
grep -r "from.*${BASENAME}\|import.*${BASENAME}" --include="*.py" | wc -l
```

**Go** (`*.go`):
```bash
PACKAGE=$(basename $(dirname "$FILE"))
grep -r "\".*/${PACKAGE}\"" --include="*.go" | wc -l
```

**PHP** (`*.php`):
```bash
BASENAME=$(basename "$FILE" .php)
grep -r "use.*${BASENAME}\|require.*${BASENAME}\|include.*${BASENAME}" --include="*.php" | wc -l
```

**Ruby** (`*.rb`):
```bash
BASENAME=$(basename "$FILE" .rb)
grep -r "require.*${BASENAME}\|require_relative.*${BASENAME}" --include="*.rb" | wc -l
```

**Java** (`*.java`):
```bash
BASENAME=$(basename "$FILE" .java)
grep -r "import.*${BASENAME}" --include="*.java" | wc -l
```

**Rust** (`*.rs`):
```bash
BASENAME=$(basename "$FILE" .rs)
grep -r "mod ${BASENAME}\|use.*${BASENAME}" --include="*.rs" | wc -l
```

### 4. Track Results

```
CHECKED = 0
UNWIRED = []

for each FILE in filtered new files:
  CHECKED += 1
  refs = language_aware_grep(FILE)
  if refs == 0:
    UNWIRED.append(FILE)
```

### 5. Append to SUMMARY.md

Add a "## Wiring Status" section to the SUMMARY.md created in the previous step:

**If all wired:**
```markdown
## Wiring Status
All {CHECKED} new files are referenced. No wiring issues detected.
```

**If unwired files found:**
```markdown
## Wiring Status
Checked {CHECKED} new files. {len(UNWIRED)} potentially unwired:
- `src/services/analytics.ts` - no imports found
- `src/utils/format-date.ts` - no imports found

These may be wired in a later plan or phase. Review if unexpected.
```

### 6. Report Inline

Single-line report to orchestrator:

```
Wiring: {CHECKED} files checked, {len(UNWIRED)} unwired
```

If unwired > 0, also list the files briefly.

</wiring_check>

<auto_verify>

## Auto-Verify on Phase Completion

**Trigger:** Phase is complete (all plans have SUMMARYs) AND `features.autoVerify == true`.
**Config:** `features.autoVerify` in config.json (default: false). Skip if false.

### Spawn Verifier

Same pattern as @go-handler-verify.md:

**Handoff context:** If `.planning/agent-handoff.json` exists, include its content in the verifier's prompt context. The verifier will delete the file after reading.

```
PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUMBER}-* 2>/dev/null | head -1)

Task(
  prompt="<verification_request>
Phase: ${PHASE_NUMBER}
Phase Directory: ${PHASE_DIR}
Context: Auto-verification after phase completion. Verify implementation against phase goals.
</verification_request>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@${PHASE_DIR}/
</context>",
  subagent_type="ink-verifier-agent",
  description="Auto-verify: Phase ${PHASE_NUMBER}"
)
```

### Handle Results

**If `VERIFICATION_COMPLETE` with status=passed:**
```
Auto-verification passed. Score: [score]. Report: [path].
```

**If `VERIFICATION_COMPLETE` with status=partial or failed:**
```
Auto-verification found issues.

Score: [score]
Report: [path]
Issues: [list]

Suggested actions:
- /ink:go fix - Address verification issues
- /ink:go [next action] - Continue despite issues
```

Present both options. Auto-verify is non-blocking — the user decides whether to fix or proceed.

</auto_verify>
