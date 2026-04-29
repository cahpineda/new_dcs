# Complexity Analysis: The Command Overload Problem

## Current State

**Ink now uses a single smart entry point:**

```
/ink:go [intent]        /ink:check            /ink:debug
/ink:map-codebase       /ink:help
```

**Available intents for /ink:go:**
- `continue` - Resume current work (default)
- `status` - Show progress
- `fix` / `debug` - Debugging workflow
- `new` / `create` - New feature work
- `validate` - Run all validations (contracts, memory, plans)
- `memory` - Query or update project memory
- `pattern` - Find or save code patterns

---

## The Problem: Cognitive Overload

### 1. Decision Paralysis

When a developer sits down to work, they face:

```
"I want to add a feature. Do I..."
- /ink:new-project? (no, project exists)
- /ink:add-phase? (maybe?)
- /ink:plan-phase? (which phase number?)
- /ink:discuss-phase? (should I discuss first?)
- /ink:research-phase? (do I need research?)
- /ink:execute-plan? (is there a plan?)
- /ink:progress? (where am I?)
```

**Result:** Developer spends 5 minutes deciding which command, then picks wrong one.

### 2. Memory Burden

Humans can hold ~7 items in working memory. 27 commands exceeds this by 4x.

```
Commands a dev MIGHT remember:
1. /ink:new-project
2. /ink:plan-phase
3. /ink:execute-plan
4. /ink:progress
5. /ink:help
6. ???
7. ???
```

**The rest require `/ink:help` every time.**

### 3. Error Modes

| Error | Cause | Consequence |
|-------|-------|-------------|
| Wrong command | Similar names | Wasted time, wrong state |
| Skipped step | Forgot required command | Broken workflow |
| Wrong order | Unclear dependencies | Failed execution |
| Wrong arguments | Phase number confusion | Wrong phase modified |

### 4. The "Just Do It" Problem

Developer wants to code, not orchestrate:

```
What dev wants:
"Add login feature"

What Ink requires:
1. /ink:progress (where am I?)
2. /ink:add-phase "login" (or is it /ink:insert-phase?)
3. /ink:discuss-phase 5 (gather context)
4. /ink:research-phase 5 (if needed)
5. /ink:plan-phase 5 (create plan)
6. /ink:execute-plan (run it)
7. /ink:verify-work (test it)
8. /ink:progress (update status)
```

**8 commands for 1 feature.** Developer abandons system after day 2.

---

## Evidence: Command Complexity vs Adoption

| System | Commands | Adoption |
|--------|----------|----------|
| Git | ~20 common | Universal |
| Docker | ~15 common | High |
| Kubernetes | ~50 | Moderate (needs training) |
| Ink | 27+ | ? |

**Git succeeded because 3 commands cover 90% of use:**
- `git add` → `git commit` → `git push`

**Ink's "happy path" requires 5-8 commands.**

---

## Root Cause Analysis

### Why So Many Commands?

1. **Granularity addiction:** Every action gets a command
2. **Optionality explosion:** discuss OR research OR plan → 3 commands
3. **State management overhead:** pause, resume, status, progress
4. **Edge case handling:** insert-phase, remove-phase, plan-fix

### The Philosophical Error

Ink treats Claude like a dumb executor that needs micromanagement.

**Reality:** Claude can figure out "I need to research this" without `/ink:research-phase`.

---

## Solution: Simplification

### Option A: Smart Router (Single Entry Point)

```
/ink "add login feature"
```

Claude figures out:
- Project initialized? If no → run new-project flow
- Phase exists? If no → create phase
- Plan exists? If no → create plan
- Execute plan
- Verify

**One command. Same result.**

### Option B: Tiered Commands

**Tier 1 (memorize these 5):**
```
/ink:start    → Initialize or resume project
/ink:plan     → Plan next work (auto-detects phase)
/ink:do       → Execute current plan
/ink:check    → Verify and show progress
/ink:help     → Show what's available
```

**Tier 2 (when needed):**
```
/ink:debug    → Systematic debugging
/ink:pause    → Stop work cleanly
```

**Tier 3 (power users only):**
```
All other commands...
```

### Option C: Workflow Modes

```
/ink:auto     → Full autopilot (plan → execute → verify loop)
/ink:guided   → Step-by-step with confirmations
/ink:manual   → Access to all 27 commands
```

---

## Recommendation

**Don't add more commands.** Instead:

1. **Create `/ink:go`** — A single smart command that routes to correct workflow
2. **Deprecate** rarely-used commands (fold into others)
3. **Auto-detect** instead of explicit commands:
   - Need research? Claude decides, not user
   - Need discussion? Claude asks if unclear
   - Need verification? Built into execution

### The Goal

```
Developer experience:

Before (current):
"Hmm, /ink:progress, ok phase 3, now /ink:plan-phase 3,
wait should I /ink:discuss-phase first? Let me /ink:help..."

After (simplified):
"/ink:go"
Claude: "I see phase 3 needs planning. Let me gather context
and create the plan. [proceeds automatically]"
```

---

## Metrics for Success

| Metric | Current | Target |
|--------|---------|--------|
| Commands to memorize | 27 | 5 |
| Commands for typical feature | 5-8 | 1-2 |
| Time to first productive use | 30+ min | 5 min |
| Error rate (wrong command) | High | Near zero |

---

## Conclusion

**More commands ≠ more power.**

The best system is one where the developer thinks about their *feature*, not about which command to run.

Ink's complexity is its biggest adoption risk. Simplification > new features.
