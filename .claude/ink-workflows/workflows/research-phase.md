<purpose>
Research unknown domain before planning. Spawns 4 parallel researcher agents (stack, features, architecture, pitfalls) followed by a synthesizer to produce unified RESEARCH.md.

Triggered by /ink:research-phase [phase] for niche/complex domains where Claude's training is likely stale.

**Agent delegation:** This workflow delegates to specialized research agents for isolated, focused research with fresh context.

See @references/ui-brand.md for output formatting (banners, spawning indicators).
</purpose>

<when_to_use>
**Research these domains (Claude fails without it):**
- 3D graphics (Three.js, Babylon.js, procedural generation)
- Game dev (physics engines, ECS patterns)
- Audio/music (Web Audio, DSP, synthesis)
- Shaders (GLSL, Metal, compute shaders)
- ML/AI integration (model serving, vector DBs)
- Real-time (WebSockets, WebRTC, CRDT sync)
- Specialized frameworks with active ecosystems

**Skip for commodity domains:**
- Standard auth (JWT, OAuth), CRUD APIs
- Forms/validation, well-documented integrations (Stripe, SendGrid)
</when_to_use>

<key_insight>
Current planning asks: "Which library should I use?"
This workflow asks: "What do I not know that I don't know?"

For niche domains, the question isn't library selection - it's:
- What's the established architecture pattern?
- What libraries form the standard stack?
- What problems do people commonly hit?
- What should NOT be hand-rolled?
</key_insight>

<process>

<execution_order>
1. `validate_phase` - Verify phase exists in roadmap
2. `check_existing` - Check if RESEARCH.md already exists
3. `prepare_context` - Gather context for agents
4. `spawn_parallel_researchers` - Delegate to 4 specialized researchers
5. `spawn_synthesizer` - Aggregate findings into RESEARCH.md
6. `handle_completion` - Process agent results
7. `git_commit` - Commit research file
</execution_order>

<step name="validate_phase">
**Primary:** `node bin/ink-tools.js roadmap get-phase ${PHASE}` — get phase details from roadmap

If found: Extract phase number, name, description. Continue.
If not found: Error and exit.

Get phase directory:
**Primary:** `node bin/ink-tools.js phase list` — find phase directory from listing
</step>

<step name="check_existing">
**Primary:** Use Glob `${PHASE_DIR}/*-RESEARCH.md` to check for existing research files.

If exists: Offer "Update / View / Skip". Wait for response.
If not: Continue to prepare_context.
</step>

<step name="prepare_context">
Gather context for research agent:

**Primary:**
- `node bin/ink-tools.js roadmap get-phase ${PHASE}` — phase description
- `node bin/ink-tools.js project get-section "Core Value"` — project context
- `node bin/ink-tools.js state get "Accumulated Decisions"` — prior decisions
- Read `${PHASE_DIR}/*-CONTEXT.md` if it exists

Build the context block for the agent.
</step>

<step name="spawn_parallel_researchers">
Display stage banner and spawning indicators (see @references/ui-brand.md):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► RESEARCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning 4 researchers in parallel...
  → Stack research
  → Features research
  → Architecture research
  → Pitfalls research
```

Check config for parallel research feature:
**Primary:** `node bin/ink-tools.js config get features.parallelResearch`

**If parallelResearch=true (default):**

Validate all research agents before spawn:
`node bin/ink-tools.js agent validate ink-stack-researcher-agent`
`node bin/ink-tools.js agent validate ink-features-researcher-agent`
`node bin/ink-tools.js agent validate ink-architecture-researcher-agent`
`node bin/ink-tools.js agent validate ink-pitfalls-researcher-agent`
→ All must return valid=true. Spawn config confirms foreground flags (features-researcher: foreground=false, rest: true).

Spawn researchers with MCP-safe spawn modes:
```
Task(
  prompt="<context>
Phase: ${PHASE}
Description: ${PHASE_DESC}
Project: ${PROJECT_CONTEXT}
</context>
<output_path>.planning/research/STACK.md</output_path>",
  subagent_type="ink-stack-researcher-agent",
  description="Research stack for Phase ${PHASE}"
)

Task(
  prompt="<context>
Phase: ${PHASE}
Description: ${PHASE_DESC}
Project: ${PROJECT_CONTEXT}
</context>
<output_path>.planning/research/FEATURES.md</output_path>",
  subagent_type="ink-features-researcher-agent",
  run_in_background=true,
  description="Research features for Phase ${PHASE}"
)

Task(
  prompt="<context>
Phase: ${PHASE}
Description: ${PHASE_DESC}
Project: ${PROJECT_CONTEXT}
</context>
<output_path>.planning/research/ARCHITECTURE.md</output_path>",
  subagent_type="ink-architecture-researcher-agent",
  description="Research architecture for Phase ${PHASE}"
)

Task(
  prompt="<context>
Phase: ${PHASE}
Description: ${PHASE_DESC}
Project: ${PROJECT_CONTEXT}
</context>
<output_path>.planning/research/PITFALLS.md</output_path>",
  subagent_type="ink-pitfalls-researcher-agent",
  description="Research pitfalls for Phase ${PHASE}"
)
```

Wait for all 4 completion signals.
</step>

<step name="spawn_synthesizer">
After all 4 researchers complete, display completion and spawn synthesizer:
```
✓ Stack research complete: STACK.md
✓ Features research complete: FEATURES.md
✓ Architecture research complete: ARCHITECTURE.md
✓ Pitfalls research complete: PITFALLS.md

◆ Spawning ink-research-synthesizer-agent...
```

```
Task(
  prompt="<context>
Phase: ${PHASE}
Description: ${PHASE_DESC}
Research files:
- .planning/research/STACK.md
- .planning/research/FEATURES.md
- .planning/research/ARCHITECTURE.md
- .planning/research/PITFALLS.md
</context>
<output_path>${PHASE_DIR}/${PHASE}-RESEARCH.md</output_path>",
  subagent_type="ink-research-synthesizer-agent",
  run_in_background=true,
  description="Synthesize research for Phase ${PHASE}"
)
```

Wait for SYNTHESIS_COMPLETE signal.
</step>

<step name="handle_completion">
Parse agent responses:

**If all researchers + synthesizer `COMPLETE`:**
- Display: "Research complete. File: ${PHASE_DIR}/${PHASE}-RESEARCH.md"
- Show summary: key findings, confidence level
- Continue to git_commit

**If any researcher `BLOCKED`:**
- Display blocker information for that researcher
- Offer options:
  1. Continue with remaining research → synthesizer uses partial data
  2. Retry blocked researcher → re-spawn with additional context
  3. Fall back to inline research → execute in orchestrator
- Wait for user response

**If synthesizer `BLOCKED`:**
- Display conflict details if conflicts_found: true
- Offer options:
  1. Manual synthesis → user resolves conflicts
  2. Fall back to inline synthesis → orchestrator aggregates
  3. Abort → exit workflow

**If agent timeout/error:**
- Display error details
- Offer to retry or fall back to inline research
</step>

<step name="git_commit">
**Ask user before committing:**

```
## Ready to Commit Research

**Files to commit:**
- ${PHASE_DIR}/${PHASE}-RESEARCH.md

**Proposed commit message:**
`docs(${PHASE}): complete phase research`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add "${PHASE_DIR}/${PHASE}-RESEARCH.md"
git commit -m "docs(${PHASE}): complete phase research

Phase ${PHASE}: ${PHASE_NAME}
- Standard stack identified
- Architecture patterns documented
- Common pitfalls catalogued"
```
</step>

</process>

<fallback_inline>
If parallel spawning fails or parallelResearch=false:

**Option 1: Single ink-research-agent (existing behavior)**
- Spawn single general-purpose research agent
- Produces comprehensive RESEARCH.md in one pass

**Option 2: Execute research inline in orchestrator context**
1. Load context (PROJECT.md, STATE.md, CONTEXT.md)
2. Identify research domains from phase description
3. Execute research directly:
   - Context7 first (authoritative)
   - Official docs second
   - WebSearch third (verify everything)
4. Write RESEARCH.md using template
5. Commit

Use fallback when:
- Task tool unavailable
- parallelResearch=false in config
- Agent fails after 2 retry attempts
</fallback_inline>

<success_criteria>
- [ ] Phase validated against roadmap
- [ ] 4 parallel researchers spawned with domain context
- [ ] All 4 completion signals received
- [ ] Synthesizer spawned with research artifacts
- [ ] RESEARCH.md created with unified findings
- [ ] Blocked signals handled with user options
- [ ] Conflicts resolved if synthesizer detected any
- [ ] RESEARCH.md committed to git
</success_criteria>
