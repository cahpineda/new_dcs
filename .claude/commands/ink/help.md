---
name: ink:help
description: Show available Ink commands
---

<objective>
Display Ink command reference.
Output ONLY the reference content. Do NOT add project-specific analysis.
</objective>

<reference>
# Ink Commands

**One command to rule them all:**

```
/ink:go [what you want]
```

## Intent Patterns (37)

### Project Flow
| You type | What happens |
|----------|--------------|
| `/ink:go` | Continues where you left off |
| `/ink:go status` | Shows current status |
| `/ink:go progress` | Detailed progress view |
| `/ink:go pause` | Save context for later |
| `/ink:go resume` | Resume from saved context |

### Feature Development
| You type | What happens |
|----------|--------------|
| `/ink:go add login` | Plans and implements feature |
| `/ink:go plan` | Plan without executing |
| `/ink:go verify` | Run validation suite |
| `/ink:go validate` | Check contracts (API/DB) |

### Todos
| You type | What happens |
|----------|--------------|
| `/ink:go add todo dark mode` | Capture idea for later |
| `/ink:go todos` | List and work on pending todos |

### Debugging
| You type | What happens |
|----------|--------------|
| `/ink:go fix the bug` | Debug and fix an issue |
| `/ink:go plan fix` | Plan a fix without executing |
| `/ink:go investigate auth` | Understand code (no changes) |

### Phase Management
| You type | What happens |
|----------|--------------|
| `/ink:go add phase` | Add phase to end of milestone |
| `/ink:go insert phase` | Insert urgent phase (creates X.1) |
| `/ink:go remove phase 5` | Remove a future phase |
| `/ink:go research phase 2` | Research before planning |
| `/ink:go discuss phase 2` | Gather context for a phase |
| `/ink:go execute phase` | Execute all plans in a phase |
| `/ink:go assumptions` | List assumptions before planning |

### Milestone Management
| You type | What happens |
|----------|--------------|
| `/ink:go new milestone` | Start a new milestone |
| `/ink:go discuss milestone` | Discuss milestone scope |
| `/ink:go complete milestone` | Archive and ship a version |
| `/ink:go plan gaps` | Create phases for audit gaps |
| `/ink:go coverage audit` | Audit test coverage after plan execution |

### Configuration
| You type | What happens |
|----------|--------------|
| `/ink:go settings` | View all settings |
| `/ink:go settings mode yolo` | Auto-approve all steps |
| `/ink:go settings depth comprehensive` | Thorough planning |
| `/ink:go profile quality` | Use best models |
| `/ink:go map codebase` | Analyze existing codebase |

### Knowledge Management
| You type | What happens |
|----------|--------------|
| `/ink:go memory` | Update project memory |
| `/ink:go pattern` | Save a reusable pattern |
| `/ink:go cleanup` | Reset planning state for new feature |
| `/ink:go help` | Show this reference |

---

## Standalone Commands (14)

| Command | Purpose |
|---------|---------|
| `/ink:go [intent]` | Smart router - does everything |
| `/ink:autopilot [finding.json]` | Automated: findings → Jira → fix → PR (zero intervention) |
| `/ink:onboard` | Interactive first-time setup guide |
| `/ink:code-review [scope]` | Code review (works outside projects) |
| `/ink:qa-test-cases [ticket]` | Generate test cases with RAG — reuses existing, fills gaps |
| `/ink:qa-autopilot [ticket]` | Automated QA cycle: ticket → Playwright tests → PR → Jira comment. Run `/ink:qa-autopilot --help` for full docs. *(plugin)* |
| `/ink:help` | This reference |

**Auto-invocable skills:** `ink-kb` (business context), `ink-confluence` (read/write/search Confluence pages and folders), `ink-notebook` (personal NotebookLM RAG). Can also be invoked manually.

---

## Product Commands (3)

| Command | Purpose |
|---------|---------|
| `/ink:productcat [feature]` | Generate product catalogue page and publish to Confluence |
| `/ink:custrq [description]` | Create Customer Request document conversationally |
| `/ink:epicstories [input]` | Create Jira Epic + Stories from requirements |

---

## Fast-Path Commands (8)

Skip intent classification — ~73% less context overhead:

| Command | What happens |
|---------|--------------|
| `/ink:fix [bug]` | Debug and fix (inline or agent) |
| `/ink:new [feature]` | Implement feature (full pipeline) |
| `/ink:plan [phase]` | Create plan (planner agent) |
| `/ink:verify [phase]` | Verify work (verifier agent) |
| `/ink:execute [phase]` | Execute plans (executor agent) |
| `/ink:research [topic]` | Research technology (4 parallel agents) |
| `/ink:investigate [question]` | Understand code (read-only) |
| `/ink:status` | Show project status |

**When to use these vs `/ink:go`:**
- Use these when you KNOW what you want to do
- Use `/ink:go` when you're unsure or want auto-detection

---

## Code Review (standalone)

Works outside project context:

```
/ink:code-review                    # Review staged changes (default)
/ink:code-review --all              # Review all uncommitted changes
/ink:code-review --commit abc123    # Review specific commit
/ink:code-review --pr 42            # Review PR #42
/ink:code-review src/api/           # Review specific path
```

---

## Settings via /ink:go

**View settings:**
```
/ink:go settings
```

**Change mode:**
```
/ink:go settings mode yolo        # Auto-approve all
/ink:go settings mode interactive # Confirm steps (default)
```

**Change planning depth:**
```
/ink:go settings depth quick          # Minimal planning
/ink:go settings depth standard       # Balanced (default)
/ink:go settings depth comprehensive  # Thorough research
```

**Change model profile:**
```
/ink:go profile quality   # opus for planning+execution
/ink:go profile balanced  # opus planning, sonnet execution (default)
/ink:go profile budget    # sonnet for everything
```

---

## File Structure

```
.planning/
├── PROJECT.md        # Vision
├── ROADMAP.md        # Phases
├── STATE.md          # Memory & context
├── config.json       # Settings (mode, depth, profile, features)
├── phases/           # Plans & summaries
├── quick/            # Quick task records
├── todos/            # Todo tracking
│   ├── pending/      # Waiting
│   ├── in-progress/  # Active
│   └── completed/    # Done
├── memory/           # Auto-managed knowledge
├── patterns/         # Auto-saved reusable code
└── jira/             # Jira context files
```

---

## That's It

**You probably just need `/ink:go` or one of the 8 fast-path commands.**

Everything else is automatic.

</reference>
