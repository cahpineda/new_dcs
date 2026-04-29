<purpose>
Route /ink:go intent to correct workflow via deterministic dispatch.

LLM handles intent classification (natural language understanding).
Code handles dispatch (ink-tools.js route → JSON with handler, memory, agent).

See @go.md for orchestrator. See @go-handlers.md for handler implementations.
</purpose>

<execution_order>
1. **parse_intent** — LLM classifies user input to one intent
2. **dispatch** — `ink-tools.js route dispatch --resolve` returns handler content + dependencies + foundation gate in ONE call
3. **handle_warnings** — MANDATORY: address each warning from dispatch response
4. **execute** — Follow handler_content from dispatch response
</execution_order>

<intent_reference>

**Semantic classification — NOT keyword matching.**
Understand INTENT from natural language in ANY language (EN/ES/mixed).
Map to exactly ONE intent. When ambiguous, pick the more actionable one.

| Intent → Route | Trigger |
|----------------|---------|
| continue → route_continue | No input, "sigue", "next", "dale" |
| status → route_status | See current state |
| progress → route_progress | Detailed progress |
| fix → route_fix | Bug/error/broken ("falla", "no funciona") |
| plan_fix → route_plan_fix | Plan a fix only |
| investigate → route_investigate | Understand without changes ("explain", "¿cómo?") |
| new_work → route_new | ANY code change: add/create/refactor/update/optimize/rename/move/migrate/delete/split/merge/improve |
| plan → route_plan | Plan without executing |
| research → route_research_phase | Research phase technology |
| discuss_phase → route_discuss_phase | Discuss phase scope |
| execute_phase → route_execute_phase | Execute phase plans |
| assumptions → route_list_assumptions | Surface assumptions |
| add_phase → route_add_phase | Add phase to roadmap |
| insert_phase → route_insert_phase | Insert urgent phase |
| remove_phase → route_remove_phase | Remove future phase |
| verify → route_verify | Test/verify something |
| validate → route_validate | Run validation |
| memory → route_memory | Manage memory |
| pattern → route_pattern | Save pattern |
| pause → route_pause | Stop, save context ("parar") |
| resume → route_resume | Resume from pause ("retomar") |

| add_todo → route_add_todo | Capture idea for later |
| check_todos → route_check_todos | List pending todos |
| plan_gaps → route_plan_gaps | Fix milestone audit gaps |
| map_codebase → route_map_codebase | Analyze codebase |
| new_milestone → route_new_milestone | Start new milestone |
| discuss_milestone → route_discuss_milestone | Discuss milestone scope |
| diagnose → route_diagnose | Diagnose UAT failures |
| audit_milestone → route_audit_milestone | Audit milestone quality |
| complete_milestone → route_complete_milestone | Ship/archive milestone |
| settings → route_settings | View/change config |
| set_profile → route_set_profile | Change model profile |
| cleanup → route_cleanup | Reset planning state |
| coverage_audit → route_coverage_audit | Audit test coverage / missing tests |
| help → route_help | Show commands/guidance |

**State routes for continue intent (auto-detected):**
| State route | Trigger |
|-------------|---------|
| continue → route_continue | Initial routing for continue intent |
| new_project → route_new_project | No project found |
| create_roadmap → route_create_roadmap | Project exists, no roadmap |
| plan_phase → route_plan_phase | Phase exists, no plans |
| execute_plan → route_execute_plan | Plans ready to execute |
| next_phase_or_complete → route_next_phase_or_complete | All plans done, move to next phase or complete |
| resume → route_resume | Paused session |
| map_codebase → route_map_codebase | Brownfield, not mapped |

**Priority rules:**
1. Code change verb (refactor/update/optimize/rename/delete/migrate...) → **new_work**
2. Problem described (error/crash/broken/fails/falla/no funciona) → **fix**
3. Question about code (¿por qué?/¿cómo?/how/what/explain) → **investigate**
4. "phase" + action → phase-specific intent
5. "milestone" + action → milestone-specific intent
6. Empty/"go"/"dale"/"sigue" → **continue**


</intent_reference>

<routing_process>

**Phase System Enforcement:** See @references/foundation-check.md. All plans in `.planning/phases/XX-name/` — NEVER loose plans.

<step name="parse_intent">
Classify user input to ONE intent from the table above.
Understand meaning, not keywords. Works in any language.
Extract keywords relevant to the task (file names, domains, technologies).
</step>

<step name="dispatch">
```bash
node bin/ink-tools.js route dispatch --intent {intent} --keywords "{keyword1},{keyword2}" --resolve
```
Returns JSON with ALL data in one call:
- `blocked`: true/false — foundation gate result
- `missing`: array of actions needed (only when blocked=true)
- `handler_content`: full handler instructions to execute
- `handler_dependencies`: resolved @reference file contents
- `warnings`: array of issues to address BEFORE executing (MANDATORY)
- `memory_chapters`: chapters to prefetch (if skip_memory=false)
- `state_route`: for continue intent, auto-detected next action

**If blocked=true:** Execute each action in `missing`, then re-run dispatch.
**If blocked=false:** Proceed to execute handler_content.

Do NOT call `route get-handler` separately — `--resolve` includes everything.
State routes (new_project, create_roadmap, etc.) are auto-resolved into handler_content + dependencies.
</step>

<step name="prefetch_memory">
If `skip_memory` is false in dispatch JSON:
1. Load `memory_chapters` from dispatch response
2. For each chapter: `node bin/ink-tools.js memory get-chapter {CHAPTER}`
3. Always load GOLDEN-RULES: `node bin/ink-tools.js memory get-chapter CAP-GOLDEN-RULES`
4. Track access: `node bin/ink-tools.js memory track-access {CHAPTER}`
</step>

</routing_process>
