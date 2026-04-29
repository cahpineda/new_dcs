# Verification Fallback

Inline fallback when Task tool is unavailable for phase verification.

## Quality Gate Validation

Run validation suite inline:

```
Verifying: [description or last completed work]

Running validation suite...

1. Quality Gate
   ├─ Lint: [PASS/FAIL]
   ├─ Types: [PASS/FAIL]
   └─ Tests: [PASS/FAIL]

2. Contract Validation (if API/DB exists)
   ├─ API Spec: [PASS/FAIL]
   └─ DB Schema: [PASS/FAIL]

3. Plan Pre-flight (if plan exists)
   └─ References: [PASS/FAIL]

Overall: [PASS/FAIL]
```

## Result Handling

**If all pass:**
```
All validations passed

Project is in good state. Ready to continue.
```

**If failures:**
```
Validation issues found:

[List specific issues]

Options:
- /ink:go fix [issue]      → Debug specific problem
- Manual fix then re-run   → /ink:go
```

## Consolidation

This fallback step consolidates:
- Phase verification (agent-based goal-backward analysis)
- Plan-level UAT (manual user acceptance testing)
- Quality gate fallback (lint, types, tests)
- Contract validation fallback (API/DB)
- Pre-flight for next plan (if exists)

User doesn't need to remember separate commands.
