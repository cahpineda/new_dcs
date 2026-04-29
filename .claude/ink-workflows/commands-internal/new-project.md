---
name: ink:new-project
description: Initialize a new project with deep context gathering and PROJECT.md
allowed-tools:
  - Read
  - Glob
  - Bash
  - Write
  - AskUserQuestion
---

<objective>

Initialize a new project through comprehensive context gathering.

This is the most leveraged moment in any project. Deep questioning here means better plans, better execution, better outcomes.

Creates `.planning/` with PROJECT.md and config.json.

</objective>

<execution_context>

@.claude/ink-workflows/references/principles.md
@.claude/ink-workflows/references/questioning.md
@.claude/ink-workflows/templates/project.md
@.claude/ink-workflows/templates/config.json

</execution_context>

<process>

<step name="setup">

**MANDATORY FIRST STEP — Execute these checks before ANY user interaction:**

1. **Abort if project exists:**
   - Use Read to check for `.planning/PROJECT.md`.
   - If it exists, output: `ERROR: Project already initialized. Use /ink:progress` and exit.

2. **Initialize git repo in THIS directory** (required even if inside a parent repo):
   - Use Glob to check for a `.git` directory or `.git` file in the current directory (worktrees use a file).
   - If neither exists, run `git init` in the current directory.

3. **Detect existing code (brownfield detection):**
   - Use Glob to collect up to 20 files with extensions: `.ts`, `.js`, `.py`, `.go`, `.rs`, `.swift`, `.java`, `.php`.
   - Ignore matches under `node_modules/` or `.git/`.
   - Use Read to check for package manifests: `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `Package.swift`, `composer.json`.
   - Use Glob to check whether `.planning/codebase/` exists (any files under it).
   - Record:
     - `CODE_FILES` = list of matching files (up to 20)
     - `HAS_PACKAGE` = "yes" if any manifest exists
     - `HAS_CODEBASE_MAP` = "yes" if `.planning/codebase/` exists

   **You MUST complete the checks above using Read/Glob tools before proceeding.**

</step>

<step name="brownfield_offer">

**If existing code detected and .planning/codebase/ doesn't exist:**

Check the results from setup step:
- If `CODE_FILES` is non-empty OR `HAS_PACKAGE` is "yes"
- AND `HAS_CODEBASE_MAP` is NOT "yes"

Use AskUserQuestion:
- header: "Existing Code"
- question: "I detected existing code in this directory. Would you like to map the codebase first?"
- options:
  - "Map codebase first" — Run /ink:map-codebase to understand existing architecture (Recommended)
  - "Skip mapping" — Proceed with project initialization

**If "Map codebase first":**
```
Run `/ink:map-codebase` first, then return to `/ink:new-project`
```
Exit command.

**If "Skip mapping":** Continue to question step.

**If no existing code detected OR codebase already mapped:** Continue to question step.

</step>

<step name="question">

**1. Open (FREEFORM — do NOT use AskUserQuestion):**

Ask inline: "What do you want to build?"

Wait for their freeform response. This gives you the context needed to ask intelligent follow-up questions.

**2. Follow the thread (NOW use AskUserQuestion):**

Based on their response, use AskUserQuestion with options that probe what they mentioned:
- header: "[Topic they mentioned]"
- question: "You mentioned [X] — what would that look like?"
- options: 2-3 interpretations + "Something else"

**3. Sharpen the core:**

Use AskUserQuestion:
- header: "Core"
- question: "If you could only nail one thing, what would it be?"
- options: Key aspects they've mentioned + "All equally important" + "Something else"

**4. Find boundaries:**

Use AskUserQuestion:
- header: "Scope"
- question: "What's explicitly NOT in v1?"
- options: Things that might be tempting + "Nothing specific" + "Let me list them"

**5. Ground in reality:**

Use AskUserQuestion:
- header: "Constraints"
- question: "Any hard constraints?"
- options: Relevant constraint types + "None" + "Yes, let me explain"

**6. Decision gate:**

Use AskUserQuestion:
- header: "Ready?"
- question: "Ready to create PROJECT.md, or explore more?"
- options (ALL THREE REQUIRED):
  - "Create PROJECT.md" — Finalize and continue
  - "Ask more questions" — I'll dig deeper
  - "Let me add context" — You have more to share

If "Ask more questions" → check coverage gaps from `questioning.md` → return to step 2.
If "Let me add context" → receive input via their response → return to step 2.

**Loop control (max 5 iterations):**
```bash
QUESTION_ITERATIONS=${QUESTION_ITERATIONS:-0}
QUESTION_ITERATIONS=$((QUESTION_ITERATIONS + 1))

if [ "$QUESTION_ITERATIONS" -ge 5 ]; then
  echo "Reached maximum question iterations (5)."
  echo "Creating PROJECT.md with current context. You can refine it later."
  # Force continue to project creation
fi
```

Loop until "Create PROJECT.md" selected OR max iterations reached.

</step>

<step name="project">

Synthesize all context into `.planning/PROJECT.md` using the template from `templates/project.md`.

**For greenfield projects:**

Initialize requirements as hypotheses:

```markdown
## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Out of Scope

- [Exclusion 1] — [why]
- [Exclusion 2] — [why]
```

All Active requirements are hypotheses until shipped and validated.

**For brownfield projects (codebase map exists):**

Infer Validated requirements from existing code:

1. Read `.planning/codebase/ARCHITECTURE.md` and `STACK.md`
2. Identify what the codebase already does
3. These become the initial Validated set

```markdown
## Requirements

### Validated

- ✓ [Existing capability 1] — existing
- ✓ [Existing capability 2] — existing
- ✓ [Existing capability 3] — existing

### Active

- [ ] [New requirement 1]
- [ ] [New requirement 2]

### Out of Scope

- [Exclusion 1] — [why]
```

**Key Decisions:**

Initialize with any decisions made during questioning:

```markdown
## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [Choice from questioning] | [Why] | — Pending |
```

**Last updated footer:**

```markdown
---
*Last updated: [date] after initialization*
```

Do not compress. Capture everything gathered.

</step>

<step name="mode">

Ask workflow mode preference:

Use AskUserQuestion:

- header: "Mode"
- question: "How do you want to work?"
- options:
  - "Interactive" — Confirm at each step
  - "YOLO" — Auto-approve, just execute

</step>

<step name="depth">

Ask planning depth preference:

Use AskUserQuestion:

- header: "Depth"
- question: "How thorough should planning be?"
- options:
  - "Quick" — Ship fast, minimal phases/plans (3-5 phases, 1-3 plans each)
  - "Standard" — Balanced scope and speed (5-8 phases, 3-5 plans each)
  - "Comprehensive" — Thorough coverage, more phases/plans (8-12 phases, 5-10 plans each)

**Depth controls compression tolerance, not artificial inflation.** All depths use 2-3 tasks per plan. Comprehensive means "don't compress complex work"—it doesn't mean "pad simple work to hit a number."

</step>

<step name="parallelization">

Ask parallel execution preference:

Use AskUserQuestion:

- header: "Parallelization"
- question: "Enable parallel phase execution?"
- options:
  - "Disabled" — Execute plans sequentially (Recommended)
  - "Enabled" — Run independent plans in parallel (experimental, may not yield best results)

**Parallelization is experimental.** When enabled, `/ink:execute-phase` spawns multiple agents for independent plans. Still being refined—sequential execution is more reliable. Can be changed later in config.json.

</step>

<step name="config">

Create `.planning/config.json` with chosen mode, depth, and parallelization using `templates/config.json` structure.

</step>

<step name="init_memory">

**Initialize memory system for context persistence.**

1. Create memory directory structure:
```bash
mkdir -p .planning/memory/chapters
mkdir -p .planning/memory/archive
```

2. Create INDEX.md from template:
- Read template from `.claude/ink-workflows/templates/memory-index.md`
- Replace `{date}` with today's date
- Replace `{count}` with "0"
- Write to `.planning/memory/INDEX.md`

Memory system initialized silently (user doesn't need to know until they use it).

</step>

<step name="init_patterns">

**Initialize patterns system for reusable code patterns.**

```bash
# Create patterns directory structure
mkdir -p .planning/patterns

# Create INDEX.md from template
cat > .planning/patterns/INDEX.md << 'EOF'
# Pattern Index

**Last updated:** $(date +%Y-%m-%d)
**Total patterns:** 0

## Quick Reference

| Domain | Count | Description |
|--------|-------|-------------|
| AUTH | 0 | Authentication, authorization |
| API | 0 | Endpoints, REST, middleware |
| DB | 0 | Queries, models, migrations |
| UI | 0 | Components, state, forms |

## All Patterns

_No patterns yet. Patterns are saved automatically after successful implementations._

---

*Patterns are identified during execution and saved for reuse.*
EOF

echo "Pattern system initialized"
```

</step>

<step name="serena_onboarding">

**Detect and onboard with Serena MCP (if available).**

1. **Check Serena availability:**
   ```bash
   node bin/ink-tools.js mcp check serena
   ```
   If status is "configured", proceed. Otherwise skip this step silently.

2. **Activate project with Serena:**
   Use `mcp__serena__activate_project` to register the current project.

3. **Run Serena onboarding:**
   Use `mcp__serena__onboarding` to analyze project structure, detect languages, and initialize the language server.

4. **Verify onboarding:**
   Use `mcp__serena__check_onboarding_performed` to confirm indexing completed.

5. **Switch to planning mode:**
   Use `mcp__serena__switch_modes` with mode "planning" — appropriate for project initialization (read-only analysis).

**If any Serena tool fails:** Log warning and continue. Serena onboarding is enhancement, not requirement.

```
[Serena] Project onboarded — language server active, code indexed.
```

**If Serena not available:** Skip silently. No user-facing message needed.

</step>

<step name="detect_niche_domain">

**Check if domain benefits from research.**

Extract domain and check against niche patterns:
```bash
DOMAIN=$(grep -A2 "## What This Is" .planning/PROJECT.md 2>/dev/null | tail -1)
NICHE_PATTERNS="three|babylon|webgl|3d|game|physics|ecs|audio|dsp|synth|shader|glsl|ml|ai|vector|embedding|websocket|webrtc|crdt|real-time"
IS_NICHE=$(echo "$DOMAIN" | grep -iE "$NICHE_PATTERNS" && echo "yes" || echo "no")
```

**If niche domain detected:**

Use AskUserQuestion:
- header: "Research Opportunity"
- question: "Your project involves ${DOMAIN}. Run parallel research now?"
- options:
  - "Yes, research now" — Spawn researchers (recommended)
  - "Skip" — Continue to roadmap

**If "Yes":**
Execute research-phase.md inline → spawns 4 parallel researchers + synthesizer.

**Else:** Continue to commit.

</step>

<step name="commit">

**Ask user before committing:**

```
## Ready to Commit Project Initialization

**Files to commit:**
- .planning/PROJECT.md
- .planning/config.json

**Proposed commit message:**
`docs: initialize [project-name]`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**

Stage and commit with:
- Title: `docs: initialize [project-name]`
- Body line 1: `[One-liner from PROJECT.md]`
- Body line 2: *(blank line)*
- Body line 3: `Creates PROJECT.md with requirements and constraints.`

Use a cross-platform git command (no bash heredoc). For example, pass multiple `-m` flags or write the message to a temp file and use `git commit -F`.

**If user skips:** Continue to next step without committing.

</step>

<step name="done">

Present completion with next steps (see .claude/ink-workflows/references/continuation-format.md):

```
Project initialized:

- Project: .planning/PROJECT.md
- Config: .planning/config.json (mode: [chosen mode])
[If .planning/codebase/ exists:] - Codebase: .planning/codebase/ (7 documents)

---

## ▶ Next Up

**[Project Name]** — create roadmap

`/ink:create-roadmap`

<sub>`/clear` first → fresh context window</sub>

---
```

</step>

</process>

<output>

- `.planning/PROJECT.md`
- `.planning/config.json`

</output>

<success_criteria>

- [ ] Deep questioning completed (not rushed)
- [ ] PROJECT.md captures full context with evolutionary structure
- [ ] Requirements initialized as hypotheses (greenfield) or with inferred Validated (brownfield)
- [ ] Key Decisions table initialized
- [ ] config.json has workflow mode, depth, and parallelization
- [ ] All committed to git

</success_criteria>
