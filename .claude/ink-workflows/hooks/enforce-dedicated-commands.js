#!/usr/bin/env node

/**
 * UserPromptSubmit Hook: Track all /ink:* commands + enforce dedicated skill workflows
 *
 * For the 8 dedicated skills (fix, new, research, plan, verify, execute, status,
 * investigate), injects mandatory dispatch sequence with predetermined intent
 * (no LLM classification needed).
 *
 * Coexists with enforce-go-workflow.js — this hook handles all /ink:* except go,
 * that hook handles /ink:go.
 *
 * Input (stdin JSON): { "prompt": "...", "cwd": "..." }
 * Output: JSON with hookSpecificOutput.additionalContext, or nothing (silent pass)
 */

const fs = require('fs');
const path = require('path');

const SKILL_INTENT_MAP = {
  fix: 'fix',
  new: 'new_work',
  research: 'research',
  plan: 'plan',
  verify: 'verify',
  execute: 'execute_phase',
  status: 'status',
  investigate: 'investigate',
};

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[enforce-dedicated-commands] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const prompt = input.prompt || '';
  if (typeof prompt !== 'string') {
    process.exit(0);
  }

  // Match any /ink:* or /ink-* command
  const inkMatch = prompt.match(/\/(ink:[\w-]+|ink-[\w-]+)\b/i);
  if (!inkMatch) {
    process.exit(0);
  }

  // Normalize: "ink:jira" -> "jira", "ink-go" -> "go"
  const rawCmd = inkMatch[1].replace(/^ink[-:]/i, '').toLowerCase();

  // /ink:go is handled exclusively by enforce-go-workflow.js — skip here
  if (rawCmd === 'go') {
    process.exit(0);
  }

  // ── TICKET GUARD ──────────────────────────────────────────────────────────
  const cwd = input.cwd || process.cwd();
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  const stateContent = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';
  const hasTicket = /CurrentTicket[:\s|]+[A-Z]+-\d+/.test(stateContent);
  if (!hasTicket) {
    process.exit(0);
  }

  // --- Workflow injection for dedicated skills only ---
  const skillMatch = prompt.match(
    /ink:(fix|new|research|plan|verify|execute|status|investigate)\b/i,
  );
  if (!skillMatch) {
    process.exit(0);
  }

  const skillName = skillMatch[1].toLowerCase();
  const skillIntent = SKILL_INTENT_MAP[skillName];
  if (!skillIntent) {
    process.exit(0);
  }

  const context = [
    `MANDATORY /ink:${skillName} WORKFLOW — Intent is predetermined: "${skillIntent}". No classification needed.`,
    '',
    `Step 1: Dispatch — run: node bin/ink-tools.js route dispatch --intent ${skillIntent} --keywords "$ARGUMENTS" --resolve`,
    '  → If response has "blocked": true — STOP. Read the "missing" array.',
    '    Execute EACH missing action (new-project.md, create-roadmap.md, etc.).',
    '    Then RE-RUN the same dispatch command. Repeat until blocked=false.',
    '  → If response has "blocked": false — proceed to Step 2.',
    '  → "handler_content" contains the handler instructions to execute.',
    '  → "handler_dependencies" contains resolved file contents for any @references in the handler.',
    'Step 2: If dispatch response has "warnings" array, you MUST address each warning BEFORE executing the handler.',
    '  → Read the "fix" field of each warning — it tells you exactly what command to run.',
    '  → Warnings are MANDATORY — the Stop hook verifies they were addressed.',
    'Step 3: Execute handler_content from the dispatch response (+ handler_dependencies for delegation targets).',
    '  Do NOT call get-handler separately — --resolve already included everything.',
    'Step 4: Memory prefetch — Check memory_chapters in dispatch response.',
    '  → If skip_memory is false AND memory_chapters is non-empty:',
    '    For each chapter: run `node bin/ink-tools.js memory get-chapter {CHAPTER_NAME}`',
    '    Read the output for architectural context relevant to this task.',
    '    After loading, run `node bin/ink-tools.js memory track-access {CHAPTER_NAME}` for each.',
    '  → If skip_memory is true: skip this step.',
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
