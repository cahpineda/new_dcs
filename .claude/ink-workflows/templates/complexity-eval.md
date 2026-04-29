# Complexity Evaluation Template

See @references/complexity-criteria.md for scoring criteria details.

## Task: {{TASK_NAME}}

### Classification

**Complexity Level:** [ ] Simple | [ ] Medium | [ ] Complex

### Criteria Check

#### Simple (1 point each)
- [ ] Single file modification
- [ ] Known pattern exists in codebase
- [ ] No external integration
- [ ] No new dependencies
- [ ] Clear requirements, no ambiguity

**Simple Score:** ___/5

#### Medium Indicators (2 points each)
- [ ] 2-3 files modified
- [ ] Requires adapting existing pattern
- [ ] One external integration (API, DB, service)
- [ ] One new dependency
- [ ] Some requirements need clarification

**Medium Score:** ___/10

#### Complex Indicators (3 points each)
- [ ] 4+ files modified
- [ ] New abstraction required
- [ ] Multiple external integrations
- [ ] Multiple new dependencies
- [ ] Significant uncertainty or unknowns
- [ ] Performance-critical
- [ ] Security-sensitive

**Complex Score:** ___/21

### Total Score

```
0-5   → Simple:  Proceed directly to implementation
6-12  → Medium:  Consider POC, search for patterns
13+   → Complex: Require POC, architecture review, pattern search
```

**Total:** ___ → **{{COMPLEXITY_LEVEL}}**

### Implications

| Complexity | POC Required | Pattern Search | Arch Review | Max Tasks |
|------------|--------------|----------------|-------------|-----------|
| Simple     | No           | Optional       | No          | 1         |
| Medium     | Recommended  | Yes            | No          | 2-3       |
| Complex    | Required     | Required       | Required    | 3+        |

### Notes

{{EVALUATION_NOTES}}
