# POC Template

## POC: {{TASK_NAME}}

### Objective

Validate that {{CONCEPT}} works before writing production code.

**Complexity:** {{COMPLEXITY_LEVEL}}
**POC Required:** {{YES/NO}}

---

### Hypothesis

> If I {{ACTION}}, then {{EXPECTED_RESULT}}.

---

### Minimal Test

**Environment:** {{REPL / TestClient / SQLite / Mock}}

**Code:**
```{{LANGUAGE}}
# Minimal implementation to test hypothesis
# Should be <20 lines
# No error handling, no edge cases, no production concerns

{{POC_CODE}}
```

**Run command:**
```bash
{{RUN_COMMAND}}
```

---

### Success Criteria

- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

---

### Result

**Status:** [ ] PASS | [ ] FAIL

**If PASS:**
- Proceed to production implementation
- Scale with: error handling, logging, types, tests

**If FAIL:**
- Document why it failed
- Revise hypothesis or approach
- Do NOT proceed to production code

---

### Scaling to Production

When POC passes, add these production concerns:

1. **Error Handling**
   - Input validation
   - Exception catching
   - Meaningful error messages

2. **Observability**
   - Logging at appropriate levels
   - Metrics if performance-critical
   - Correlation IDs for tracing

3. **Type Safety**
   - Full type annotations
   - Strict mode compliance
   - Interface definitions

4. **Testing**
   - Unit tests covering POC scenario
   - Edge case tests
   - Error path tests

5. **Integration**
   - Connect to real dependencies
   - Use dependency injection
   - Follow codebase patterns

---

### Notes

{{POC_NOTES}}
