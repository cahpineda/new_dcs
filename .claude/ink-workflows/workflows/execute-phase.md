<purpose>
Execute all plans in a phase with intelligent parallelization.

**Critical:** One subagent per plan, always. Fresh 200k context per plan.

See @execute-phase-runtime.md for agent spawning and monitoring.
</purpose>

<execution_order>
1. load_state - Read STATE.md
2. identify_phase - Find phase directory and unexecuted plans
3. analyze_dependencies - Build dependency graph from plan frontmatter
4. calculate_waves - Topological sort, assign wave numbers
5. spawn_agents - See @execute-phase-runtime.md
6. monitor_completion - See @execute-phase-runtime.md
7. create_summary - See @execute-phase-runtime.md
8. offer_next - See @execute-phase-runtime.md
</execution_order>

<process>

<step name="load_state" priority="first">
Read STATE.md. If missing but .planning/ exists, reconstruct from artifacts.
If .planning/ doesn't exist, error - project not initialized.
</step>

<step name="identify_phase">
**Find phase and plans:**

**Primary:** `node bin/ink-tools.js phase list` — find phase directory
**Primary:** Use Glob `.planning/phases/${PHASE_ARG}-*/*-PLAN.md` — list plan files
**Primary:** Use Glob `.planning/phases/${PHASE_ARG}-*/*-SUMMARY.md` — find completed plans

Compare plan files vs summary files to identify unexecuted plans.

| Condition | Action |
|-----------|--------|
| 0 unexecuted | "All complete" |
| 1 unexecuted | "Use /ink:execute-plan" |
| 2+ unexecuted | Proceed to analysis |
</step>

<step name="analyze_dependencies">
**Build dependency graph from plan frontmatter.**

```bash
for plan_file in "${UNEXECUTED[@]}"; do
  PLAN_ID=$(basename "$plan_file" | sed 's/-PLAN.md//')

  # Extract depends_on array (YAML list format)
  DEPENDS_ON=$(sed -n '/^depends_on:/,/^[a-z_]*:/p' "$plan_file" | grep '^\s*-')

  # Extract files_modified array
  FILES_MODIFIED=$(sed -n '/^files_modified:/,/^[a-z_]*:/p' "$plan_file" | grep '^\s*-')

  # Check for checkpoints in task definitions
  HAS_CHECKPOINT=$(grep -c 'type="checkpoint' "$plan_file" 2>/dev/null || echo "0")
done
```

**Build graph:**
```
GRAPH = {}

For each plan P:
  GRAPH[P] = {
    depends_on: [],      # Explicit dependencies
    files_modified: [],  # Files touched
    has_checkpoint: false
  }

  # Detect file conflicts (implicit dependencies)
  for other_plan Q where Q < P:
    if intersection(Q.files_modified, P.files_modified) not empty:
      GRAPH[P].depends_on.append(Q)

  # Detect SUMMARY references
  CONTEXT_REFS=$(grep '@.*SUMMARY' "$plan_file")
  # Add as dependencies
```

**Dependency rules (priority order):**
1. Explicit `depends_on` from frontmatter
2. File conflicts: if plans modify same file, later depends on earlier
3. SUMMARY references: if plan B uses A's SUMMARY, B depends on A
4. Checkpoint plans: marked for foreground execution
</step>

<step name="calculate_waves">
**Assign wave numbers using Kahn's algorithm.**

```
WAVES = {}
FOREGROUND_PLANS = []

# Calculate in-degree
IN_DEGREE = {}
for plan in GRAPH:
  IN_DEGREE[plan] = len(GRAPH[plan].depends_on)

# Wave 1: Plans with no dependencies
CURRENT_WAVE = []
for plan in GRAPH:
  if IN_DEGREE[plan] == 0:
    CURRENT_WAVE.append(plan)
    WAVES[plan] = 1

wave_num = 1
while CURRENT_WAVE:
  NEXT_WAVE = []
  wave_num += 1

  for completed_plan in CURRENT_WAVE:
    for plan in GRAPH:
      if completed_plan in GRAPH[plan].depends_on:
        IN_DEGREE[plan] -= 1
        if IN_DEGREE[plan] == 0:
          WAVES[plan] = wave_num
          NEXT_WAVE.append(plan)

  CURRENT_WAVE = NEXT_WAVE
```

**Detect circular dependencies:**
```
UNASSIGNED = [p for p in GRAPH if p not in WAVES]
if UNASSIGNED:
  ERROR: "Circular dependency detected"
  ABORT execution
```

**Wave execution rules:**
- Plans in same wave can run in parallel (subject to MAX_CONCURRENT)
- Wave N+1 plans only start after ALL Wave N plans complete
- FOREGROUND_PLANS run sequentially (checkpoints need user interaction)
</step>

</process>

<runtime_module>
For agent spawning, monitoring, and summary creation, see @execute-phase-runtime.md.
</runtime_module>

<error_handling>
| Error | Action |
|-------|--------|
| Agent failure | Log, continue others, mark dependents blocked |
| Merge conflict | Stop, present to user |
| Config missing | Use defaults |

**Recovery:** Run `/ink:execute-plan` on failed plans individually.
</error_handling>

<success_criteria>
- All plans executed (parallel where possible)
- All agents completed
- Commits created
- STATE.md and ROADMAP.md updated
</success_criteria>
