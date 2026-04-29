#!/usr/bin/env node

/**
 * UserPromptSubmit Hook: Enforce /ink:go workflow
 *
 * When the user invokes /ink:go, injects mandatory step sequence.
 * Uses --resolve flag so dispatch returns handler content + dependencies in one call.
 *
 * Input (stdin JSON): { "prompt": "...", "cwd": "..." }
 * Output: JSON with hookSpecificOutput.additionalContext, or nothing (silent pass)
 */

const fs = require('fs');
const path = require('path');

function readCurrentTicket(cwd) {
  try {
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) return null;
    const content = fs.readFileSync(statePath, 'utf8');
    const match = content.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[enforce-go-workflow] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const prompt = input.prompt || '';
  if (typeof prompt !== 'string') {
    process.exit(0);
  }

  const isInkGo = /^\s*\/(ink:go|ink-go)(\s|$)/i.test(prompt);

  if (!isInkGo) {
    process.exit(0);
  }

  // ── TICKET GUARD ──────────────────────────────────────────────────────────
  // Si no hay ticket activo, enforce-ticket.js maneja este prompt. No inyectar
  // el workflow de /ink:go — dejaría al LLM trabajar sin ticket.
  const cwd = input.cwd || process.cwd();
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  const stateContent = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';
  const hasTicket = /CurrentTicket[:\s|]+[A-Z]+-\d+/.test(stateContent);
  if (!hasTicket) {
    process.exit(0);
  }

  // ── JIRA CONTEXT CHECK ────────────────────────────────────────────────────
  // JIRA-CONTEXT.md is a single file (one active ticket). Check it exists and
  // matches the current ticket before injecting the dispatch workflow.
  const ticketMatch = stateContent.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/);
  const currentTicket = ticketMatch ? ticketMatch[1].trim() : null;
  // Try JIRA-CONTEXT-{TICKET}.md first, then JIRA-CONTEXT.md
  const jiraDir = path.join(cwd, '.planning', 'jira');
  let jiraContextPath = null;
  if (currentTicket) {
    const withTicket = path.join(jiraDir, 'JIRA-CONTEXT-' + currentTicket + '.md');
    const withoutTicket = path.join(jiraDir, 'JIRA-CONTEXT.md');
    if (fs.existsSync(withTicket)) jiraContextPath = withTicket;
    else if (fs.existsSync(withoutTicket)) jiraContextPath = withoutTicket;
  }
  let jiraContextWarning = null;

  if (currentTicket) {
    if (!jiraContextPath) {
      jiraContextWarning = 'JIRA-CONTEXT.md is missing. Run /ink:jira ' + currentTicket + ' BEFORE dispatch to load ticket context.';
    } else {
      const jiraContent = fs.readFileSync(jiraContextPath, 'utf8');
      const jiraKeyMatch = jiraContent.match(/requested_issue_key[:\s]+([A-Z]+-\d+)/);
      if (!jiraKeyMatch || jiraKeyMatch[1].trim() !== currentTicket) {
        jiraContextWarning = 'JIRA-CONTEXT.md is stale (ticket mismatch). Run /ink:jira ' + currentTicket + ' BEFORE dispatch to refresh ticket context.';
      }
    }
  }

  const context =
    [
      ...(jiraContextWarning ? [
        '⚠️ JIRA CONTEXT WARNING: ' + jiraContextWarning,
        'Do NOT proceed with dispatch until /ink:jira ' + currentTicket + ' completes and JIRA-CONTEXT.md is updated.',
        '',
      ] : []),
      'MANDATORY /ink:go WORKFLOW — Execute these steps IN ORDER. Do NOT skip any.',
      '',
      'Step 1: Classify intent — map user input to one of 36 intents (see go-router.md)',
      'Step 2: Dispatch with --resolve — run: node bin/ink-tools.js route dispatch --intent {intent} --keywords "{keywords}" --resolve',
      '  This single command returns everything: handler content, resolved dependencies, foundation gate.',
      '  → If response has "blocked": true — STOP. Read the "missing" array.',
      '    Execute EACH missing action (new-project.md, create-roadmap.md, etc.).',
      '    Then RE-RUN the same dispatch command. Repeat until blocked=false.',
      '  → If response has "blocked": false — proceed to Step 3.',
      '  → "handler_content" contains the handler instructions to execute.',
      '  → "handler_dependencies" contains resolved file contents for any @references in the handler.',
      'Step 3: If dispatch response has "warnings" array, you MUST address each warning BEFORE executing the handler.',
      '  → Read the "fix" field of each warning — it tells you exactly what command to run.',
      '  → For codebase_incomplete: create the missing file by analyzing the codebase or running map-codebase.md.',
      '  → For models_missing: especially critical for DB work — create MODELS.md to prevent schema hallucinations.',
      '  → For codebase_stale: refresh with map-codebase.md if the task depends on architecture knowledge.',
      '  → Warnings are MANDATORY — the Stop hook verifies they were addressed.',
      'Step 4: Context Preflight (CONDITIONAL) — check intent from dispatch response.',
      '  → CODE-heavy intents (fix, plan_fix, investigate, execute_phase, verify, diagnose, plan, continue):',
      '    Check P2C: `node bin/ink-tools.js mcp check project2context`',
      '    P2C MANDATORY when available: call mcp__project2context__query_repository_summary + trace_call_path if debug/fix. DO NOT use Glob/Grep for discovery when P2C returned results.',
      '    ONLY if P2C unavailable: Glob + Grep relevant to the task as last-resort fallback',
      '    Summarize context in ≤200 tokens → pass as <preflight_context> to handler/agent',
      '  → BUSINESS intents (new_work, research, validate, plan):',
      '    Call mcp__ink-kb-mcp__list_folders → select folder → mcp__ink-kb-mcp__rag_query_simple',
      '    Summarize in ≤150 tokens → pass as <preflight_context> to handler/agent',
      '  → Simple intents (status, help, pause, resume, progress): SKIP — zero overhead.',
      '  → Any intent NOT listed above: SKIP — do not add context when it is unclear whether it is needed.',
      'Step 5: Execute handler_content from the dispatch response (+ handler_dependencies for delegation targets).',
      '  Do NOT call get-handler separately — --resolve already included everything.',
      'Step 6: Memory prefetch — After dispatch, check memory_chapters in the response.',
      '  → If skip_memory is false AND memory_chapters is non-empty:',
      '    For each chapter: run `node bin/ink-tools.js memory get-chapter {CHAPTER_NAME}`',
      '    Read the output — it contains architectural decisions and patterns relevant to this task.',
      '    Always include CAP-GOLDEN-RULES (dispatch already ensures this).',
      '    After loading, run `node bin/ink-tools.js memory track-access {CHAPTER_NAME}` for each.',
      '  → If skip_memory is true: skip this step.',
      '  The Stop hook verifies memory chapters were loaded when dispatch provided them.',
      '',
      'The Stop hook verifies: (1) dispatch was called, (2) blocked responses handled, (3) warnings addressed, (4) foundation files exist, (5) memory chapters loaded.',
      'VIOLATIONS WILL BLOCK YOU FROM COMPLETING.',
    ].join('\n');

  const output = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context,
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
