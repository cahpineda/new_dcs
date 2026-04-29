# Cross-Language Confusion Detection

Modular pattern library for detecting language-specific functions used in the wrong file type.

## Purpose

Catch common errors where developers accidentally use:
- PHP functions in JavaScript/TypeScript files (`isset()`, `empty()`)
- Python syntax in JavaScript files (`len()`, `True`, `False`)
- JavaScript syntax in Python files (`console.log()`, `null`, `undefined`)

## Architecture

**Design principle:** Load ONLY what's needed to minimize context overhead.

- Each file contains patterns for ONE language pair (e.g., PHP→JS)
- ink-code-review.md loads patterns based on file extension
- Reduces overhead from ~25k tokens to ~4-5k tokens per review (80% savings)

## Pattern Files

| File | Purpose | Use When |
|------|---------|----------|
| `php-to-js.md` | Detect PHP functions in JS/TS | .js, .jsx, .ts, .tsx |
| `python-to-js.md` | Detect Python syntax in JS/TS | .js, .jsx, .ts, .tsx |
| `js-to-python.md` | Detect JS syntax in Python | .py |

## Automated Scanning Protocol

The /ink:code-review wrapper uses these references for automated cross-language confusion detection.

### How It Works

1. Determine file extensions in changed files
2. Load relevant reference file(s) based on extension:
   | File Extension | Load Reference |
   |----------------|----------------|
   | .js, .jsx, .mjs, .ts, .tsx, .mts | php-to-js.md + python-to-js.md |
   | .py | js-to-python.md |
3. Execute Grep scans using the regex patterns from each reference
4. Flag all matches as CRITICAL (runtime crash)
5. Report with correction suggestion from reference tables

### Severity Levels

| Level | Description | Example |
|-------|-------------|---------|
| CRITICAL | Syntax error, immediate runtime crash | `isset()` in .js file |
| HIGH | Wrong function, likely runtime error | `len()` in .js file |

## Reference File Format

Each language pair file contains:
1. **Pattern summary** - What confusion patterns to detect
2. **Grep Patterns** section - Copy-paste regex patterns for automated scanning
3. **Correction Table** - Maps wrong function to correct equivalent with explanation
4. **Context Notes** - When false positives might occur

## Detection Phases

**Phase A: Static Pattern Matching**
- Regex-based quick scan
- Zero false-positive patterns (always errors)
- Fast execution via Grep tool

**Phase B: Context7 MCP Validation** (optional)
- For ambiguous cases (e.g., `print()` could be valid)
- Uses MCP to query language-specific docs
- Higher confidence, slower execution

## Contribution Guidelines

When adding new patterns:
1. Keep files focused (one language pair per file)
2. Maximum ~80-100 lines per file
3. Include correction examples
4. Mark zero-false-positive patterns clearly

---

*Created: 2026-02-04*
*Based on approach by @cahpineda in PR #4*
