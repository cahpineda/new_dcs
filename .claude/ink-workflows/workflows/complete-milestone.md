<purpose>
Mark a shipped version as complete. Creates MILESTONES.md entry, archives to milestones/v[X.Y]-ROADMAP.md, evolves PROJECT.md, tags in git.

See @references/ui-brand.md for output formatting (banners, "Next Up" blocks).
</purpose>

<required_reading>
1. templates/milestone.md
2. templates/milestone-archive.md
3. .planning/ROADMAP.md
4. .planning/PROJECT.md
</required_reading>

<process>

<execution_order>
0. check_audit - Check for milestone audit (optional pre-ship gate)
1. verify_readiness - Check all phases complete
2. gather_stats - Count phases, commits, timeline
3. extract_accomplishments - Get 4-6 key accomplishments from summaries
4. create_milestone_entry - Add to MILESTONES.md
5. evolve_project_full_review - Full PROJECT.md evolution
6. reorganize_roadmap - Group completed phases
7. archive_milestone - Create milestones/v[X.Y]-ROADMAP.md
8. archive_summaries - Move SUMMARY files to .planning/archive/
9. archive_issues - Move ISSUES.md to .planning/memory/archive/
10. update_state - Update STATE.md
11. git_tag - Tag release
12. git_commit_milestone - Commit changes
13. offer_next - Show next steps
</execution_order>

<step name="check_audit">
**Optional pre-ship audit gate.** Check if a milestone audit exists:

**Primary:** Use Glob `.planning/milestones/*-MILESTONE-AUDIT.md` to check for existing audit.

**If no audit exists:**
```
⚠ No milestone audit found. Run `/ink:go audit milestone` first for a quality gate.
Proceed without audit? (y/n)
```

In yolo mode: Skip audit check, proceed directly.

**If audit exists:** Read YAML frontmatter status.
- `passed` → Proceed with confidence
- `tech_debt` → Note deferred items, proceed
- `gaps_found` → Warn: "Audit found gaps. Run `/ink:go plan gaps` to remediate, or proceed anyway."
</step>

<step name="verify_readiness">
`node bin/ink-tools.js state snapshot` for full state. `node bin/ink-tools.js init verify <N>` for plan/summary counts and completion status per phase.

Present: "Milestone [Name]: [X] phases, [Y] plans complete. Ready to ship?"

In yolo mode: Auto-approve and proceed.
In interactive mode: Wait for confirmation.
</step>

<step name="gather_stats">
`node bin/ink-tools.js timestamp date` for completion date. `node bin/ink-tools.js phase list` for phase counts and status overview.

Present: "Phases: X-Y, Plans: Z, Files: N, Timeline: D days"
</step>

<step name="extract_accomplishments">
**Primary:** `node bin/ink-tools.js extract decisions .planning/phases/*-*/*-SUMMARY.md` — extract key decisions/accomplishments from summaries.
**Alternative:** Read phase SUMMARY.md files directly using Read tool.

Extract 4-6 key accomplishments from phase summaries.
</step>

<step name="create_milestone_entry">
Create/update .planning/MILESTONES.md using templates/milestone.md:

```markdown
## v[X.Y] [Name] (Shipped: YYYY-MM-DD)

**Delivered:** [One sentence]
**Phases:** [X-Y] ([Z] plans)

**Key accomplishments:**
- [List from extract step]

**Stats:** [Files], [LOC], [Days]
**Git range:** feat(XX-XX) to feat(YY-YY)
**Next:** [User's next goal]
```
</step>

<step name="evolve_project_full_review">
Full PROJECT.md review at milestone:

1. "What This Is" - Update if product changed
2. Core Value - Verify still correct
3. Requirements audit:
   - Active shipped -> Validated with "v[X.Y]"
   - New requirements -> Active
   - Out of Scope - Review reasoning
4. Context - Update LOC, stack, feedback
5. Key Decisions - Add all from milestone summaries
6. Update footer: "Last updated: [date] after v[X.Y]"
</step>

<step name="reorganize_roadmap">
Update ROADMAP.md with milestone grouping:

```markdown
## Milestones
- v1.0 MVP (Phases 1-4) - SHIPPED YYYY-MM-DD
- v1.1 Security (Phases 5-6) - In Progress

## Phases
<details><summary>v1.0 MVP (Phases 1-4) - SHIPPED</summary>
[Collapsed completed phases]
</details>

### v1.1 Security (In Progress)
- [ ] Phase 5: [Name]
- [ ] Phase 6: [Name]
```
</step>

<step name="archive_milestone">
Create .planning/milestones/v[X.Y]-ROADMAP.md:

1. Read templates/milestone-archive.md
2. Extract milestone phases from ROADMAP.md
3. Fill template placeholders
4. Write archive file
5. Update ROADMAP.md with link: "See milestones/v[X.Y]-ROADMAP.md"
</step>

<step name="archive_summaries">
**Archive phase summaries from completed milestone:**

```bash
MILESTONE_NAME="v[X.Y]"  # From current milestone
ARCHIVE_DIR=".planning/archive/$MILESTONE_NAME"

# Create archive structure
mkdir -p "$ARCHIVE_DIR"

# Move SUMMARY files from each phase
for phase_dir in .planning/phases/*/; do
  phase_name=$(basename "$phase_dir")
  if ls "$phase_dir"*-SUMMARY.md 1>/dev/null 2>&1; then
    mkdir -p "$ARCHIVE_DIR/$phase_name"
    mv "$phase_dir"*-SUMMARY.md "$ARCHIVE_DIR/$phase_name/"
    echo "Archived: $phase_name"
  fi
done

echo "Summaries archived to $ARCHIVE_DIR"
```

Note: PLAN.md files stay in place (needed for reference during development).
</step>

<step name="archive_issues">
**Archive ISSUES.md to memory archive if it exists:**

```bash
if [ -f ".planning/ISSUES.md" ]; then
  MILESTONE_NAME="v[X.Y]"  # From current milestone variable
  ARCHIVE_DIR=".planning/memory/archive/$MILESTONE_NAME"

  # Create archive directory
  mkdir -p "$ARCHIVE_DIR"

  # Move ISSUES.md to archive
  mv .planning/ISSUES.md "$ARCHIVE_DIR/ISSUES.md"

  echo "Archived: ISSUES.md -> $ARCHIVE_DIR/ISSUES.md"
else
  echo "No ISSUES.md to archive"
fi
```

**Why archive instead of delete:**
- Historical record of resolved issues
- Can reference past issues when similar problems arise
- Part of milestone audit trail

**Fresh ISSUES.md:**
- Not automatically created for next milestone
- Created on-demand when first issue is logged
</step>

<step name="update_state">
Use `node bin/ink-tools.js state set` for position fields, then `node bin/ink-tools.js state update-progress` to recalculate progress bar. `node bin/ink-tools.js state record-session --stopped-at "v[X.Y] milestone complete"` for session fields.

Clear resolved blockers, keep open ones.
</step>

<step name="git_tag">
```bash
git tag -a v[X.Y] -m "v[X.Y] [Name] - [One sentence]"
```

Ask: "Push tag to remote? (y/n)"
</step>

<step name="git_commit_milestone">
**Ask user before committing:**

```
## Ready to Commit Milestone Completion

**Files to commit:**
- .planning/MILESTONES.md
- .planning/PROJECT.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/milestones/v[X.Y]-ROADMAP.md

**Proposed commit message:**
`chore: complete v[X.Y] milestone`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add .planning/MILESTONES.md .planning/PROJECT.md .planning/ROADMAP.md
git add .planning/STATE.md .planning/milestones/v[X.Y]-ROADMAP.md
git add .planning/memory/archive/  # Include archived ISSUES.md
git commit -m "chore: complete v[X.Y] milestone"
```
</step>

<step name="offer_next">
Display milestone completion banner and "Next Up" (see @references/ui-brand.md, @references/continuation-format.md):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► MILESTONE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v[X.Y] [Name] complete
Shipped: [N] phases, [M] plans
Summary: .planning/MILESTONES.md

## ▶ Next Up
**Plan v[X.Y+1]** — Define next milestone scope
`/ink:go`
```
</step>

</process>

<milestone_naming>
- v1.0 MVP, v1.1 Security, v1.2 Performance
- v2.0 for major rewrites/breaking changes
- Keep names short (1-2 words)
</milestone_naming>

<what_qualifies>
Create milestones for: Initial release, public releases, major feature sets, before archiving.
NOT for: Every phase, work in progress, internal iterations.
</what_qualifies>

<success_criteria>
- [ ] MILESTONES.md entry created
- [ ] PROJECT.md evolved (requirements, decisions)
- [ ] ROADMAP.md reorganized
- [ ] Milestone archived
- [ ] ISSUES.md archived (if existed)
- [ ] STATE.md updated
- [ ] Git tag created
- [ ] Milestone committed
</success_criteria>
