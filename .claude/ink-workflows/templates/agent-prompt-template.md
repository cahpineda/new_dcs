# Agent Prompt Template

**Purpose**: Standardized template for spawning subagents via Cursor IDE Task tool with best practices built-in.

**Reference**: @.cursor/ink-workflows/references/prompt-engineering-best-practices.md

---

## Template Structure

Use this template when spawning subagents to ensure consistent quality and adherence to best practices.

```markdown
**AGENT ROLE:** [Explore/Plan/Execute/Debug/Research]

**CRITICAL CONTEXT:**
[Highest priority information the agent MUST know - max 150 tokens]
- Project constraints
- Architectural decisions from memory
- Non-negotiable requirements

**TASK OBJECTIVE:**
[Clear, specific task description in 1-2 sentences]

**INSTRUCTIONS (Priority Order):**

1. **CRITICAL:** [Highest priority rule - never violate]
   Example: "NEVER modify files outside `.planning/phases/`"

2. **IMPORTANT:** [High priority guideline - affects core functionality]
   Example: "Use parallel tool calls for independent file reads"

3. [Standard instruction - regular requirement]
   Example: "Check existing patterns before proposing new approaches"

4. [Standard instruction]
   Example: "Reference @.cursor/rules/coding-standards.mdc for style"

**DECISION TREE:**
IF [condition 1] → [action 1]
ELSE IF [condition 2] → [action 2]
ELSE IF [condition 3] → [action 3]
ELSE → [default action]

Example:
IF (searching for specific file/class) → Use Grep directly
ELSE IF (open-ended exploration) → Use Glob + Read pattern
ELSE IF (need full codebase understanding) → Use systematic discovery
ELSE → Ask for clarification

**WHEN TO USE TOOLS:**
- Use [tool_name] when: [specific condition]
- Use [tool_name] when: [specific condition]
- **NEVER** use [tool_name] for: [prohibited use case]

Example:
- Use Read tool when: You know specific file paths
- Use Grep tool when: Searching for patterns in code
- Use Glob tool when: Finding files by name pattern
- **NEVER** use Bash for: File reading (use Read tool instead)

**RESPONSE QUALITY:**
- **Concise by default**: 1-3 sentences for simple findings
- **Scale detail**: Brief for simple, comprehensive for complex
- **No meta-commentary**: Don't say "I'm now going to..." - just do it
- **Focus on findings**: Present results, not process

**MEMORY CONTEXT (Compact ~150 tokens):**
[Relevant architectural decisions from .planning/memory/]

Example:
- Uses TypeScript 5.x with strict mode
- Auth system: Passport.js with JWT strategy
- Database: PostgreSQL with Prisma ORM
- Prefers composition over inheritance
- Security: All inputs validated at boundaries

**ANTI-PATTERNS TO AVOID:**
- **NEVER** [anti-pattern 1] - Rationale
- **NEVER** [anti-pattern 2] - Rationale
- **Avoid** [soft anti-pattern] - Better alternative

Example:
- **NEVER** create placeholder/incomplete code - Always provide working implementations
- **NEVER** skip tests for speed - Quality is non-negotiable
- **Avoid** asking "Should I proceed?" - Bias toward action

**COMPLETION CRITERIA:**
[How agent knows task is done]

Example:
- All matching files identified and analyzed
- Pattern documented with examples
- Findings formatted in structured markdown
- References to specific file paths and line numbers provided

**DELIVERABLE FORMAT:**
[Expected output format]

Example:
## Findings
- [Finding 1 with file:line reference]
- [Finding 2 with file:line reference]

## Recommendations
1. [Recommendation with rationale]
2. [Recommendation with rationale]

## Next Steps
- [Suggested action]
```

---

## Usage Examples

### Example 1: Research Agent

```typescript
Task({
  description: "Research auth libraries",
  prompt: `**AGENT ROLE:** Research Agent
**CRITICAL CONTEXT:** Node.js 18+, TypeScript 5.x, bundle <50kb
**TASK OBJECTIVE:** Research OAuth 2.0 libraries with PKCE, active maintenance, strong security.
**INSTRUCTIONS:** 1. CRITICAL: Only libs with security audits OR >10k stars 2. IMPORTANT: Native TypeScript 3. Search npm/GitHub 4. Compare top 3-5
**DECISION TREE:** CVEs in last year → Skip. Unmaintained >1yr → Skip. No TS → Lower priority. ELSE → Evaluate.
**MEMORY CONTEXT:** Rejected Auth0 (cost). Prefer self-hosted. Stack: Express, PostgreSQL, JWT.
**DELIVERABLE:** Comparison table (stars, bundle, update, TS, security) + recommendation with rationale.`,
  subagent_type: "Explore", model: "sonnet"
})
```

### Example 2: Debug Agent

```typescript
Task({
  description: "Investigate login timeout",
  prompt: `**AGENT ROLE:** Debug Agent
**CRITICAL CONTEXT:** Login OK but logout after 1min (expected: 24h). Stack: Express, JWT, Redis.
**TASK OBJECTIVE:** Find root cause of premature session expiration.
**INSTRUCTIONS:** 1. CRITICAL: Read-only, NO file modifications 2. Check JWT expiry + Redis TTL 3. Search session configs 4. Check middleware chain
**DECISION TREE:** Explicit 1min expiry → Report. Conflicting configs → Compare. Redis TTL too short → Report. ELSE → Check middleware.
**MEMORY CONTEXT:** Auth refactored 2wks ago to JWT. Redis added last week. No issues pre-Redis.
**DELIVERABLE:** Root Cause Analysis with file:line evidence, ranked hypotheses, recommended fix.`,
  subagent_type: "Explore", model: "sonnet"
})
```

### Example 3: Explore Agent

```typescript
Task({
  description: "Map authentication flow",
  prompt: `**AGENT ROLE:** Explore Agent
**CRITICAL CONTEXT:** Document auth flow for Next.js 14 app with custom auth.
**TASK OBJECTIVE:** Map complete auth flow: login → token handling → protected routes.
**INSTRUCTIONS:** 1. CRITICAL: Cover entire flow (login, refresh, logout) 2. Identify middleware/guards 3. Trace UI→API→DB→Response→Storage
**DECISION TREE:** App router → middleware.ts + route.ts. Pages router → _app.tsx + api/. ELSE → Check both.
**MEMORY CONTEXT:** JWT in httpOnly cookies, React Context for auth state, HOC for protected routes.
**DELIVERABLE:** Step-by-step flow with file:line refs, key files with roles, flow diagram.`,
  subagent_type: "Explore", model: "sonnet"
})
```

---

## Best Practices

### DO:
✅ Use priority markers (CRITICAL, IMPORTANT)
✅ Provide decision trees for complex logic
✅ Include memory context (~150 tokens)
✅ Specify anti-patterns to avoid
✅ Define clear completion criteria
✅ Use concise, actionable instructions

### DON'T:
❌ Overload with unnecessary context
❌ Use vague instructions
❌ Skip priority markers
❌ Forget anti-patterns section
❌ Leave deliverable format ambiguous
❌ Include meta-instructions about being helpful

---

## Template Checklist

Before spawning agent, verify:
- [ ] CRITICAL context provided (<150 tokens)
- [ ] Task objective clear (1-2 sentences)
- [ ] Instructions prioritized (1-2-3 format)
- [ ] Decision tree for complex choices
- [ ] Tool usage guidance specific
- [ ] Anti-patterns documented
- [ ] Completion criteria defined
- [ ] Deliverable format specified
- [ ] Response quality expectations set

---

**Reference Documentation:**
- @.cursor/ink-workflows/references/prompt-engineering-best-practices.md - Full best practices guide
- @.cursor/rules/project-context.mdc - Project-specific patterns
- @.cursor/agents/ - Example agent definitions
