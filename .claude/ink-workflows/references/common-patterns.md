# Common Patterns Reference

**Purpose:** Document reusable patterns found across multiple workflows to reduce duplication and improve consistency.

**When to use:** Reference these patterns in workflows instead of reimplementing the logic.

---

## 1. State Detection Pattern

**Purpose:** Check project state to determine current phase and pending work.

**When to use:** At the start of workflows that need to know project state.

**Pattern:**
```bash
# Check if project initialized
PROJECT_EXISTS=$([ -f .planning/PROJECT.md ] && echo "yes" || echo "no")
ROADMAP_EXISTS=$([ -f .planning/ROADMAP.md ] && echo "yes" || echo "no")

# Find current phase
if [ -f .planning/ROADMAP.md ]; then
  CURRENT_PHASE_NUM=$(grep -E "^\- \[ \] \*\*Phase [0-9]+" .planning/ROADMAP.md | head -1 | grep -oE "[0-9]+" | head -1)
  PHASE_DIR=$(ls -d .planning/phases/${CURRENT_PHASE_NUM}-* 2>/dev/null | head -1)
  
  if [ -n "$PHASE_DIR" ]; then
    # Find first plan without summary
    PENDING_PLAN=$(for plan in "$PHASE_DIR"/*-PLAN.md; do
      [ -f "$plan" ] || continue
      summary="${plan//-PLAN.md/-SUMMARY.md}"
      [ ! -f "$summary" ] && echo "$plan" && break
    done)
  fi
fi
```

**Used in:**
- `go-router.md` - State detection for routing
- `execute-plan.md` - Check for pending plans
- `plan-phase.md` - Determine next phase to plan

**Reference:** `@.claude/ink-workflows/references/common-patterns.md#state-detection`

---

## 2. Git Operation Pattern

**Purpose:** Safely perform git operations with pre-flight validation AND user confirmation.

**When to use:** Before any git commit, add, or status operations.

**CRITICAL:** Only the USER commits. Agents and workflows NEVER run `git add` or `git commit`.
Agents track modified files and suggest commit messages. The orchestrator presents these to the user.

**Pattern:**
```bash
# Pre-flight checks
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: Not a git repository"
  exit 1
fi

# Check for uncommitted changes (warn, don't fail)
if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: Repository has uncommitted changes"
fi
```

**Commit Confirmation Pattern (MANDATORY):**
```markdown
## Ready to Commit

**Files to commit:**
- [list of files]

**Commit message:**
`type(scope): description`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify files** - Make changes before committing

Would you like to commit these changes?
```

**Implementation:**
```bash
# Only commit if user confirms
if [ "$USER_CHOICE" = "commit" ]; then
  git add [specific files]
  git commit -m "type(scope): description"
fi
```

**Used in:**
- `execute-plan-commits.md` - Task commits
- `complete-milestone.md` - Milestone commits
- `map-codebase.md` - Codebase map commits
- `debug.md` - Debug session commits
- All workflows that make git commits

**Reference:** `@.claude/ink-workflows/references/common-patterns.md#git-operations`

---

## 3. Path Validation Pattern

**Purpose:** Validate and sanitize user-provided paths to prevent path traversal attacks.

**When to use:** Before any file operations using user-provided paths.

**Pattern:**
```bash
# Validate path is safe
if ! node scripts/validate-paths.js "$USER_PATH"; then
  echo "Error: Invalid or unsafe path: $USER_PATH"
  exit 1
fi

# Sanitize path
SANITIZED=$(node -e "const {sanitizePath} = require('./scripts/validate-paths.js'); console.log(sanitizePath('$USER_PATH'))")

# Use sanitized path
FILE_PATH="$SANITIZED"
```

**With validation utilities:**
```javascript
const { isPathSafe, sanitizePath } = require('./scripts/validate-paths.js');

const userPath = process.argv[2];
if (!isPathSafe(userPath)) {
  console.error('Path is not safe');
  process.exit(1);
}

const safePath = sanitizePath(userPath);
// Use safePath for file operations
```

**Used in:**
- `bin/install.js` - Installation paths
- Workflows accepting file paths from users
- Any workflow with user file input

**Reference:** `@.claude/ink-workflows/references/common-patterns.md#path-validation`

---

## 4. Validation Pattern

**Purpose:** Pre-flight checks before workflow execution.

**When to use:** At the start of workflows to validate prerequisites.

**Pattern:**
```bash
# Check prerequisites
if [ ! -f .planning/PROJECT.md ]; then
  echo "Error: Project not initialized. Run /ink:go to initialize."
  exit 1
fi

# Check file existence
if [ ! -f "$REQUIRED_FILE" ]; then
  echo "Error: Required file not found: $REQUIRED_FILE"
  exit 1
fi

# Validate dependencies
if ! command -v node > /dev/null; then
  echo "Error: Node.js not found"
  exit 1
fi
```

**Used in:**
- `execute-plan.md` - Validate plan exists
- `plan-phase.md` - Validate roadmap exists
- `debug.md` - Validate debug file structure

**Reference:** `@.claude/ink-workflows/references/common-patterns.md#validation`

---

## 5. Error Handling Pattern

**Purpose:** Consistent error handling across workflows.

**When to use:** For all error scenarios in workflows.

**Pattern:**
```bash
# Fail-fast validation
if [ ! -f "$REQUIRED_FILE" ]; then
  echo "Error: $REQUIRED_FILE not found"
  echo "Action: Create file or check path"
  exit 1
fi

# Try operation with error handling
if ! some_operation; then
  echo "Error: Operation failed"
  echo "Context: [what was being done]"
  exit 1
fi

# State preservation on error
# Don't corrupt .planning/ files if operation fails
```

**Used in:**
- All workflows for consistency
- File operations
- Git operations
- External command execution

**Reference:** `@.claude/ink-workflows/references/common-patterns.md#error-handling`

---

## 6. File Operation Pattern

**Purpose:** Safe file read/write operations.

**When to use:** When reading or writing files in workflows.

**Pattern:**
```bash
# Read file with error handling
if [ -f "$FILE_PATH" ]; then
  CONTENT=$(cat "$FILE_PATH")
else
  echo "Error: File not found: $FILE_PATH"
  exit 1
fi

# Write file atomically (temp file + rename)
TEMP_FILE="${FILE_PATH}.tmp"
echo "$CONTENT" > "$TEMP_FILE"
mv "$TEMP_FILE" "$FILE_PATH"
```

**Used in:**
- Template generation
- State file updates
- Document creation

**Reference:** `@.claude/ink-workflows/references/common-patterns.md#file-operations`

---

## Usage in Workflows

To use these patterns in workflows, reference them:

```markdown
<step name="validate_state">
Use state detection pattern from @common-patterns.md#state-detection
</step>

<step name="validate_paths">
Use path validation pattern from @common-patterns.md#path-validation
</step>
```

**Benefits:**
- Reduces duplication
- Ensures consistency
- Easier maintenance (update pattern once, all workflows benefit)
- Lower context usage (reference instead of inline code)

---

*Patterns extracted: 2026-01-26*
*Update when new common patterns are identified*
