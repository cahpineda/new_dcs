<purpose>
Create a new milestone for an existing project. Defines phases, updates roadmap, and resets state tracking.

Used after completing a milestone when ready to define the next chunk of work.

See @references/ui-brand.md for output formatting (banners, "Next Up" blocks).
</purpose>

<required_reading>
Read these files:
1. .claude/ink-workflows/templates/roadmap.md (milestone-grouped format)
2. .planning/ROADMAP.md
3. .planning/STATE.md
4. .planning/MILESTONES.md (if exists)
</required_reading>

<process>

<execution_order>
1. `load_context` - Load ROADMAP.md, STATE.md, MILESTONES.md
2. `get_milestone_info` - Get milestone version and name
3. `identify_phases` - Identify phases for new milestone
4. `detect_research_needs` - Determine if research is needed
5. `confirm_phases` - Confirm with user (unless yolo mode)
6. `update_roadmap` - Update ROADMAP.md with new milestone
7. `create_phase_directories` - Create .planning/phases/ directories
8. `update_state` - Update STATE.md with new position
9. `git_commit` - Commit milestone initialization
10. `cleanup_context` - Delete MILESTONE-CONTEXT.md if exists
11. `offer_next` - Offer to plan first phase
</execution_order>

<step name="load_context">
**Primary:** `node bin/ink-tools.js state snapshot` — current state
**Primary:** `node bin/ink-tools.js phase list` — phase listing from roadmap
**Fallback:** Read .planning/MILESTONES.md and .planning/MILESTONE-CONTEXT.md if they exist.

Extract: Previous milestone version, last phase number, deferred issues.
Calculate next milestone version (v1.0 -> v1.1 or v2.0).
</step>

<step name="get_milestone_info">
**If MILESTONE-CONTEXT.md exists (from /ink:discuss-milestone):**
Use features, scope, constraints from context file.

**Otherwise:**
Ask for milestone name in format: "v[X.Y] [Name]"
Options: Features, Improvements, Fixes, Refactor, Major version, Other
</step>

<step name="identify_phases">
Calculate starting phase number:
**Primary:** `node bin/ink-tools.js phase list` — get last phase number
**Primary:** `node bin/ink-tools.js config get depth` — check depth setting

Next phase = last_phase + 1

Check depth setting:
| Depth | Phases/Milestone |
|-------|------------------|
| Quick | 3-5 |
| Standard | 5-8 |
| Comprehensive | 8-12 |

For each phase, capture: number, name (kebab-case), one-line goal, research flag.
</step>

<step name="detect_research_needs">
**Research Likely:**
- "integrate [service]", "connect to [API]"
- "authentication", "auth", "JWT"
- "payment", "billing", "Stripe"
- "real-time", "websocket", "sync"
- "AI", "OpenAI", "LLM", "embeddings"
- Any technology not in codebase

**Research Unlikely:**
- "add button", "create form", "update UI"
- "CRUD operations", "refactor", "clean up"
- Technology already in package.json
</step>

<step name="confirm_phases">
**Yolo mode:** Auto-approve, proceed to update_roadmap.

**Interactive:** Present phase breakdown, ask "Does this feel right?"
If "adjust": Revise and present again.
</step>

<step name="update_roadmap">
Update `.planning/ROADMAP.md`:

1. **Update Milestones section:**
```markdown
- [completed] **v1.0 [Previous]** - [link] (shipped)
- **v[X.Y] [Name]** - Phases [N]-[M] (in progress)
```

2. **Add phase details:**
```markdown
### v[X.Y] [Name] (In Progress)

#### Phase [N]: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase [N-1]
**Research**: [Likely/Unlikely]
Plans: TBD
```

3. **Update Progress table** with new phases.
</step>

<step name="create_phase_directories">
**Primary:** `node bin/ink-tools.js phase create <NN> "<name>"` — for each phase
Use two-digit padding: 10-name, 11-name, etc.
</step>

<step name="update_state">
**Primary:**
- `node bin/ink-tools.js state set "Phase" "<N> — <Name>"`
- `node bin/ink-tools.js state set "Plan" "Not started"`
- `node bin/ink-tools.js state set "Status" "Ready to plan"`
- `node bin/ink-tools.js state set "Progress" "0%"`
</step>

<step name="git_commit">
**Ask user before committing:**

```
## Ready to Commit Milestone Creation

**Files to commit:**
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/phases/

**Proposed commit message:**
`docs: create milestone v[X.Y] [Name] ([N] phases)`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add .planning/ROADMAP.md .planning/STATE.md .planning/phases/
git commit -m "docs: create milestone v[X.Y] [Name] ([N] phases)

Phases:
- [N]. [name]: [goal]
- [N+1]. [name]: [goal]"
```
</step>

<step name="cleanup_context">
```bash
rm -f .planning/MILESTONE-CONTEXT.md
```
</step>

<step name="offer_next">
Display banner and "Next Up" block (see @references/ui-brand.md, @references/continuation-format.md):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► CREATING MILESTONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone v[X.Y] [Name] created:
- Phases: [N]-[M] ([count] phases)
- Directories created
- ROADMAP.md updated
- STATE.md reset

## ▶ Next Up
**Phase [N]: [Name]** — [Goal]
`/ink:go`
```
</step>

</process>

<phase_naming>
Use `XX-kebab-case-name` format with continuous numbering:
- `10-user-profiles`
- `11-notifications`

Numbers continue from previous milestone.
</phase_naming>

<anti_patterns>
- Don't restart phase numbering at 01 (continue sequence)
- Don't add time estimates
- Don't create Gantt charts
- Respect depth setting for phase count
- Don't modify completed milestone sections
</anti_patterns>

<success_criteria>
- [ ] Next phase number calculated correctly
- [ ] Phases defined per depth setting
- [ ] Research flags assigned
- [ ] ROADMAP.md updated
- [ ] Phase directories created
- [ ] STATE.md reset
- [ ] Git commit made
</success_criteria>
