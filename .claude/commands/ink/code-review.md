---
name: ink:code-review
description: Review code changes with native /review + Ink enhancements
argument-hint: [--staged | --all | --commit <hash> | --pr <number> | path/to/file]
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

<objective>
Review code changes using Claude Code's native /review command with Ink-specific enhancements:
- Cross-language confusion detection (PHP to JS, Python to JS, JS to Python)
- Anti-pattern detection aligned with Ink standards
- JIRA integration for PR reviews (when configured)

Delegates core review mechanics to /review. Augments output with Ink findings.
</objective>

<context>
Arguments: $ARGUMENTS

**Scope Selection:**
- `--staged` (default): Review only staged changes (`git diff --cached`)
- `--all`: Review all changes (staged + unstaged)
- `--commit <hash>`: Review a specific commit (supports hash, HEAD~N, branch name)
- `--pr <number|url>`: Review a pull request (requires `gh` CLI)
- `path/to/file`: Review specific file(s)
- No args: Same as `--staged`

**Examples:**
```bash
/ink:code-review                    # Review staged changes
/ink:code-review --all              # Review all uncommitted changes
/ink:code-review --commit abc123    # Review specific commit
/ink:code-review --commit HEAD~3    # Review commit 3 behind HEAD
/ink:code-review --pr 42            # Review PR #42
/ink:code-review --pr https://github.com/org/repo/pull/42
/ink:code-review src/api/           # Review specific path
```
</context>

<process>

## 1. Parse Arguments and Determine Scope

Validate git repository: `git rev-parse --is-inside-work-tree 2>/dev/null || echo "NOT_GIT"`

**Map arguments to review scope:**
- `--staged` or no args → "staged changes"
- `--all` → "all uncommitted changes"
- `--commit <ref>` → "commit <ref>"
- `--pr <number>` → "PR #<number>"
- `path/to/file` → the file path

**Validate based on mode:**
- STAGED/ALL: Check for changes with `git diff --cached/HEAD --name-only`
- COMMIT: Verify with `git rev-parse --verify <ref>`
- PR: Check `gh` CLI exists and PR is valid with `gh pr view <number>`

Show appropriate error if validation fails.

---

## 2. Lint & Syntax Check (changed files only)

**Auto-detect project language from changed files and run fast checks:**

```bash
# Get changed files based on mode
FILES=$(git diff --cached --name-only)  # or --name-only HEAD, etc.
```

**Run applicable checks (only if tool exists):**

| Files matched | Command | Detects |
|--------------|---------|---------|
| `*.ts, *.tsx` | `npx tsc --noEmit --pretty 2>&1 \| head -30` | Type errors, syntax errors |
| `*.js, *.jsx` | `npx eslint --no-warn-ignored [files] 2>&1 \| head -30` | Lint + syntax errors |
| `*.py` | `ruff check [files] 2>&1 \| head -20` | Syntax, imports, style |
| `*.go` | `go vet ./... 2>&1 \| head -20` | Suspicious constructs |
| `*.rs` | `cargo clippy --message-format short 2>&1 \| head -20` | Lint + type errors |

**Rules:**
- **REPORT ONLY** — NEVER use `--fix`, NEVER modify files, NEVER auto-correct. This step is read-only.
- Run on changed files only (not full project) — fast, focused
- If tool not installed → skip silently (no error)
- If lint passes → `Lint: [language] OK`
- If lint fails → show errors in report as **SYNTAX/TYPE** severity (before semantic review)
- Never block on lint — report findings and continue to /review

---

## 3. Invoke Native /review

**Instruct to invoke Claude Code's native /review with the determined scope.**

Examples: `/review staged changes`, `/review commit abc123`, `/review PR #42`

Native /review handles: diff parsing, file reading, context extraction, security/quality checks, report generation.

### Fallback (if /review unavailable)

Get changed files based on mode, read each file, check for CRITICAL issues only:
- Hardcoded secrets: `(api_key|apikey|secret|password|token)\s*=\s*["'][^"']+["']`
- SQL/command injection: String concatenation in queries
- Cross-language confusion (see Step 3)

Report: "No critical issues detected (simplified review mode)" + note about using full /review.

---

## 4. Scan for Cross-Language Confusion

Get changed files with extensions based on mode.

**Load references by file type:**
- JS/TS files (`.js/.jsx/.mjs/.ts/.tsx/.mts`):
  - @.claude/ink-workflows/references/cross-language/php-to-js.md
  - @.claude/ink-workflows/references/cross-language/python-to-js.md
- Python files (`.py`):
  - @.claude/ink-workflows/references/cross-language/js-to-python.md

**Execute Grep scans:**

For JS/TS files:
```bash
Grep: \b(isset|empty|is_null|is_array|count|strlen|strpos|explode|implode|array_merge|array_push|in_array|print_r|var_dump|die)\s*\(
Grep: \b(True|False|None)\b
Grep: \b(len|str|int|float|dict|list)\s*\(
```

For Python files:
```bash
Grep: \b(true|false|null)\b
Grep: \bconsole\.(log|error|warn)\s*\(
Grep: \b(const|let|var)\s+\w+
```

Report all matches as CRITICAL (runtime crashes).

---

## 5. Augment Output with Ink Findings

Append after /review output:

```markdown
---

## Ink-Specific Findings

### Lint & Syntax

[If lint ran, show results:]
- **SYNTAX** - `src/api/handler.ts:12` - TS2345: Argument of type 'string' is not assignable...
[If lint passed:] TypeScript: OK | ESLint: OK
[If tool not found:] Skipped (no linter detected)

### Cross-Language Confusion

[If issues found, list each as:]
- **CRITICAL** - `path/to/file.js:42` - `isset(user)` is PHP, not valid JavaScript. Use `user !== undefined && user !== null` instead.

[If none:]
None detected

### Anti-Pattern Check

Reference: @.claude/ink-workflows/references/anti-patterns.md

[Note Ink-specific anti-patterns beyond /review: N+1 queries, missing pagination, hardcoded secrets, SQL injection, empty exception handlers]
[If none: "No additional anti-patterns detected"]
```

---

## 6. JIRA Integration (Optional)

For PR mode only: Check `$JIRA_URL` and `$JIRA_TOKEN`. If set, extract ticket ID from PR title (`[A-Z]+-\d+`) and note: "Findings can be linked to JIRA ticket [TICKET-ID]". Do NOT auto-post.

---

</process>

<success_criteria>
- [ ] Arguments parsed correctly (STAGED/ALL/COMMIT/PR/PATH modes)
- [ ] Lint/syntax check run on changed files (skip if tool not found)
- [ ] /review invoked with correct scope (or fallback used)
- [ ] Cross-language confusion scan completed on changed files
- [ ] Ink-specific findings section appended to output (lint + cross-lang + anti-patterns)
- [ ] Report is actionable with severity levels
</success_criteria>

<references>
- @.claude/ink-workflows/references/anti-patterns.md
- @.claude/ink-workflows/references/cross-language/php-to-js.md
- @.claude/ink-workflows/references/cross-language/python-to-js.md
- @.claude/ink-workflows/references/cross-language/js-to-python.md
</references>
