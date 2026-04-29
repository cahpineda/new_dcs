# Code Verification Checklist

## Purpose

Verify existing code before reusing or modifying it. Don't trust code blindly - verify with evidence.

---

## Static Verification

### Code Quality Checks

```bash
# Find TODOs, FIXMEs, HACKs
grep -rn "TODO\|FIXME\|HACK\|XXX\|BUG" src/

# Find commented-out code (potential dead code)
grep -rn "^[[:space:]]*//.*function\|^[[:space:]]*#.*def " src/

# Find empty catch blocks
grep -rn "catch.*{\s*}" src/
grep -rn "except.*:\s*pass" src/

# Find magic numbers
grep -rn "[^0-9][0-9]{2,}[^0-9]" src/ | grep -v "test\|spec"

# Find long functions (>50 lines)
# Use static analysis tool if available
```

### Security Checks

```bash
# Find potential secrets
grep -rn "(password|secret|key|token)\s*=\s*['\"][^'\"]*['\"]" src/

# Find SQL string concatenation
grep -rn "execute.*f\"\|execute.*%s" src/

# Find potential XSS (innerHTML, dangerouslySetInnerHTML)
grep -rn "innerHTML\|dangerouslySetInnerHTML\|v-html" src/

# Find eval usage
grep -rn "eval\s*(" src/
```

### Pattern Violations

```bash
# Find N+1 query patterns (loop with query)
grep -rn "for.*in.*:" src/ -A5 | grep -E "\.query\|\.find\|\.get"

# Find missing error handling around external calls
grep -rn "fetch\|axios\|requests\." src/ -A3 | grep -v "catch\|except\|try"

# Find hardcoded URLs
grep -rn "https?://[^\"']*" src/ | grep -v "test\|spec\|localhost\|example"
```

---

## Dynamic Verification

### Test Coverage

```bash
# Run tests with coverage
npm run test -- --coverage
pytest --cov=src

# Check coverage for specific file
# Target: >80% for production code
```

### Execution Tests

```bash
# Run existing tests
npm test
pytest

# Check for test failures
# Any failure = code may not work as documented
```

### Type Checking

```bash
# TypeScript
npx tsc --noEmit

# Python
mypy src/

# Any type errors = potential runtime issues
```

---

## Requirement Verification

### Against PROJECT.md

For each piece of code being reused:
1. Does it fulfill stated requirements?
2. Are there requirements it should meet but doesn't?
3. Have requirements changed since implementation?

### Against Documentation

Check if code matches its documentation:
- [ ] Function signature matches docstring
- [ ] Behavior matches comments
- [ ] README instructions work

### Against Memory

If using project memory, verify:
- [ ] CAP-* chapter description matches actual code
- [ ] Key decisions still apply
- [ ] No undocumented changes

---

## Historical Verification

### Git History Check

```bash
# Recent changes to file
git log --oneline -10 -- path/to/file.ts

# Check for bug fix commits
git log --oneline --grep="fix\|bug" -- path/to/file.ts

# Find who last modified
git blame path/to/file.ts | head -20
```

### Bug Patterns

If file has history of bugs:
1. Read related bug fix commits
2. Understand what broke and why
3. Consider if reusing could reintroduce issues

---

## Verification by Code Type

### Before Reusing a Function

- [ ] Read the function completely
- [ ] Check for TODO/FIXME comments
- [ ] Verify error handling exists
- [ ] Check test coverage for function
- [ ] Run tests for that function
- [ ] Check git history for bug fixes

### Before Reusing a Pattern

- [ ] Verify pattern works in current context
- [ ] Check if dependencies are satisfied
- [ ] Verify configuration is correct
- [ ] Test with edge cases
- [ ] Check if pattern is marked deprecated

### Before Reusing a Service/Class

- [ ] Understand all public methods
- [ ] Check initialization requirements
- [ ] Verify cleanup/disposal handling
- [ ] Check for thread safety (if relevant)
- [ ] Review dependencies

### Before Modifying Existing Code

- [ ] Read entire file first
- [ ] Understand all callers (grep for usage)
- [ ] Run existing tests
- [ ] Check for related tests that might break
- [ ] Understand why current implementation exists

---

## Trust Levels

### High Trust (minimal verification)
- Code you wrote recently
- Well-tested utilities
- Framework-provided functions
- Standard library

### Medium Trust (standard verification)
- Code from same project, other author
- Patterns from project catalog
- Recently updated code

### Low Trust (thorough verification)
- Legacy code (no recent changes)
- Code with TODOs/FIXMEs
- Code with bug fix history
- External code/libraries
- Code without tests

### Zero Trust (full verification)
- Security-sensitive code
- Payment/financial code
- Code handling PII
- Code with known issues

---

## Red Flags

When verifying code, watch for:

| Red Flag | Risk | Action |
|----------|------|--------|
| Multiple TODO/FIXME | Incomplete | Review each, decide if blocking |
| No tests | Unknown behavior | Write tests first |
| Complex nested logic | Hard to understand | Refactor or document |
| Many magic numbers | Unclear intent | Understand or extract constants |
| Deep git history of fixes | Bug-prone area | Extra careful testing |
| Catches all exceptions | Hides errors | Add specific handling |
| No error handling | Will fail silently | Add handling |
| Outdated dependencies | Security risk | Update if possible |

---

## Verification Report Template

```markdown
# Code Verification: {file/function name}

**Date:** {date}
**Verified by:** {agent/user}
**Trust Level:** {high/medium/low/zero}

## Static Analysis

- [ ] No TODOs/FIXMEs (or acceptable)
- [ ] No security issues found
- [ ] No obvious anti-patterns
- [ ] Types are complete

**Issues Found:**
- {issue 1}
- {issue 2}

## Dynamic Analysis

- [ ] Tests pass
- [ ] Coverage: {X}%
- [ ] Type check passes

## Historical Analysis

- [ ] No recent bug fixes
- [ ] No concerning patterns in git history

## Verdict

**Status:** [SAFE TO USE / NEEDS FIXES / DO NOT USE]

**Conditions:**
- {condition 1}
- {condition 2}
```

---

## Integration Points

- **`/ink:go validate`**: Runs validation checks (contracts, memory, plans)
- **Memory validation**: Runs automatically during execution (if memory.enabled in config)
- **`/ink:go execute`**: Verifies before using patterns
- **Planning phase**: Verifies code before planning reuse
