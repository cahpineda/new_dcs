#!/usr/bin/env node

/**
 * Unified UserPromptSubmit Hook
 *
 * Merges enforce-go-workflow.js + enforce-dedicated-commands.js + enforce-ticket.js
 * into a single Node.js process to eliminate 2x V8 startup overhead (~200ms savings).
 *
 * Logic order (mutually exclusive outputs):
 * 1. If /ink:go → inject go workflow (was: enforce-go-workflow.js)
 * 2. If /ink:* (non-go) → track + inject dedicated workflow (was: enforce-dedicated-commands.js)
 * 3. Always → ticket enforcement (was: enforce-ticket.js)
 *
 * Input (stdin JSON): { "prompt": "...", "cwd": "...", "session_id": "..." }
 * Output: JSON with hookSpecificOutput.additionalContext, or nothing (silent pass)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { fetchJiraCredentials, validateJiraTicket } = require('./atlassian-utils');

// ── TICKET LOCK: backup/restore to survive STATE.md overwrites ───────────────

function ticketLockPath(cwd) {
  return path.join(cwd, '.planning', '.ticket-lock');
}

function saveTicketLock(cwd, ticket, sessionId) {
  try {
    if (!ticket) return;
    const dir = path.join(cwd, '.planning');
    if (!fs.existsSync(dir)) return;
    fs.writeFileSync(ticketLockPath(cwd), JSON.stringify({ ticket, sessionId, ts: Date.now() }));
  } catch {}
}

function readTicketLock(cwd) {
  try {
    const p = ticketLockPath(cwd);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

function restoreTicketIfLost(cwd, stateContent) {
  // STATE.md exists but has no ticket — try to recover from .ticket-lock
  if (!stateContent || /CurrentTicket[:\s|]+[A-Z]+-\d+/.test(stateContent)) return null;
  const lock = readTicketLock(cwd);
  if (!lock || !lock.ticket) return null;

  const statePath = path.join(cwd, '.planning', 'STATE.md');
  let content = stateContent;

  // Re-inject CurrentTicket
  const heading = content.match(/^(##[^\n]*\n)/m);
  if (heading) {
    content = content.replace(heading[0], heading[0] + 'CurrentTicket: ' + lock.ticket + '\n');
  } else {
    content = 'CurrentTicket: ' + lock.ticket + '\n' + content;
  }

  // Re-inject CurrentSessionId
  if (lock.sessionId) {
    const tLine = content.match(/^(CurrentTicket[:\s|]+\S+[^\n]*\n)/m);
    if (tLine) {
      content = content.replace(tLine[0], tLine[0] + 'CurrentSessionId: ' + lock.sessionId + '\n');
    }
  }

  fs.writeFileSync(statePath, content);
  process.stderr.write('[ticket-lock] restored ticket ' + lock.ticket + ' after STATE.md overwrite\n');
  return { ticket: lock.ticket, sessionId: lock.sessionId };
}

// ── SHARED UTILITIES ──────────────────────────────────────────────────────────

function readStateContent(cwd) {
  try {
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) return '';
    return fs.readFileSync(statePath, 'utf8');
  } catch {
    return '';
  }
}

function parseState(stateContent) {
  const ticketMatch = stateContent.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/);
  const sessionMatch = stateContent.match(/CurrentSessionId[:\s|]+(\S+)/);
  const pendingMatch = stateContent.match(/PendingTicket[:\s|]+([A-Z]+-\d+)/);
  return {
    ticket: ticketMatch ? ticketMatch[1].trim() : null,
    sessionId: sessionMatch ? sessionMatch[1].trim() : null,
    pendingTicket: pendingMatch ? pendingMatch[1].trim() : null,
  };
}

function readUserEmail() {
  try {
    const claudeJson = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
    return claudeJson && claudeJson.oauthAccount && claudeJson.oauthAccount.emailAddress
      ? claudeJson.oauthAccount.emailAddress
      : null;
  } catch {
    return null;
  }
}

function emitOutput(eventName, context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext: context,
    },
  }));
}

function normalizeTicket(raw) {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  const withHyphen = s.match(/^([A-Z]{2,10})-(\d+)$/);
  if (withHyphen) return withHyphen[1] + '-' + withHyphen[2];
  const noHyphen = s.match(/^([A-Z]{2,10})(\d+)$/);
  if (noHyphen) return noHyphen[1] + '-' + noHyphen[2];
  return null;
}

function isAffirmative(text) {
  // Matches confirmations at the start of the response (word boundary).
  // Allows "si", "si cambia", "yes please", "sure go ahead", etc.
  // Excludes "go", "ok", "proceed", "correct" — too common in normal conversation
  // and risk confirming a pending ticket switch the user didn't intend.
  return /^(si|yes|yep|sure|confirm|affirmative)\b/i.test(text.trim());
}

function updateStateFile(cwd, fields) {
  const planningDir = path.join(cwd, '.planning');
  const statePath = path.join(planningDir, 'STATE.md');
  fs.mkdirSync(planningDir, { recursive: true });

  let content = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '## Status\n';

  function setField(text, key, value) {
    const regex = new RegExp(key + '[:\\s|]+\\S+');
    if (regex.test(text)) {
      return text.replace(regex, key + ': ' + value);
    }
    const ticketLine = text.match(/^(CurrentTicket[:\s|]+\S+[^\n]*\n)/m);
    if (ticketLine) {
      return text.replace(ticketLine[0], ticketLine[0] + key + ': ' + value + '\n');
    }
    const headingMatch = text.match(/^(##[^\n]*\n)/m);
    if (headingMatch) {
      return text.replace(headingMatch[0], headingMatch[0] + key + ': ' + value + '\n');
    }
    return text + '\n' + key + ': ' + value + '\n';
  }

  function removeField(text, key) {
    return text.replace(new RegExp(key + '[:\\s|]+\\S+\\n?', 'g'), '');
  }

  if (fields.CurrentTicket !== undefined) content = setField(content, 'CurrentTicket', fields.CurrentTicket);
  if (fields.CurrentSessionId !== undefined) content = setField(content, 'CurrentSessionId', fields.CurrentSessionId);
  if (fields.PendingTicket !== undefined) content = setField(content, 'PendingTicket', fields.PendingTicket);
  if (fields.removePendingTicket) content = removeField(content, 'PendingTicket');

  fs.writeFileSync(statePath, content);

  // Backup ticket to .ticket-lock so it survives STATE.md overwrites
  const finalTicket = fields.CurrentTicket || (content.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/) || [])[1];
  const finalSession = fields.CurrentSessionId || (content.match(/CurrentSessionId[:\s|]+(\S+)/) || [])[1];
  if (finalTicket) saveTicketLock(cwd, finalTicket, finalSession || null);
}

// ── BRANCH 1: /ink:go WORKFLOW (was enforce-go-workflow.js) ───────────────────

function handleInkGo(prompt, cwd, stateContent, ticket) {
  const isInkGo = /^\s*\/(ink:go|ink-go)(\s|$)/i.test(prompt);
  if (!isInkGo) return false;
  if (!ticket) return false; // No ticket → fall through to ticket enforcement

  // Jira context check
  const jiraDir = path.join(cwd, '.planning', 'jira');
  let jiraContextPath = null;
  const withTicket = path.join(jiraDir, 'JIRA-CONTEXT-' + ticket + '.md');
  const withoutTicket = path.join(jiraDir, 'JIRA-CONTEXT.md');
  if (fs.existsSync(withTicket)) jiraContextPath = withTicket;
  else if (fs.existsSync(withoutTicket)) jiraContextPath = withoutTicket;

  let jiraContextWarning = null;
  if (!jiraContextPath) {
    jiraContextWarning = 'JIRA-CONTEXT.md is missing. Run /ink:jira ' + ticket + ' BEFORE dispatch to load ticket context.';
  } else {
    const jiraContent = fs.readFileSync(jiraContextPath, 'utf8');
    const jiraKeyMatch = jiraContent.match(/requested_issue_key[:\s]+([A-Z]+-\d+)/);
    if (!jiraKeyMatch || jiraKeyMatch[1].trim() !== ticket) {
      jiraContextWarning = 'JIRA-CONTEXT.md is stale (ticket mismatch). Run /ink:jira ' + ticket + ' BEFORE dispatch to refresh ticket context.';
    }
  }

  const context = [
    ...(jiraContextWarning ? [
      '\u26a0\ufe0f JIRA CONTEXT WARNING: ' + jiraContextWarning,
      'Do NOT proceed with dispatch until /ink:jira ' + ticket + ' completes and JIRA-CONTEXT.md is updated.',
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
    '    Summarize context in \u2264200 tokens → pass as <preflight_context> to handler/agent',
    '  → BUSINESS intents (new_work, research, validate, plan):',
    '    Call mcp__ink-kb-mcp__list_folders → select folder → mcp__ink-kb-mcp__rag_query_simple',
    '    Summarize in \u2264150 tokens → pass as <preflight_context> to handler/agent',
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

  emitOutput('UserPromptSubmit', context);
  return true;
}

// ── BRANCH 2: /ink:* DEDICATED COMMANDS (was enforce-dedicated-commands.js) ───

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

function handleInkDedicated(prompt, cwd, stateContent, ticket) {
  const inkMatch = prompt.match(/\/(ink:[\w-]+|ink-[\w-]+)\b/i);
  if (!inkMatch) return false;

  const rawCmd = inkMatch[1].replace(/^ink[-:]/i, '').toLowerCase();
  if (rawCmd === 'go') return false; // Handled by branch 1
  if (rawCmd === 'ticket' || rawCmd === 'autopilot') return false; // Handled by branch 3 (exempt from ticket enforcement)

  if (!ticket) return false; // No ticket → fall through to ticket enforcement

  const commandName = `ink:${rawCmd}`;
  const intentMatch = prompt.match(/\/ink[:-][\w-]+\s+(.+)/i);
  const intent = intentMatch ? intentMatch[1].trim() : null;

  // Workflow injection for dedicated skills only
  const skillMatch = prompt.match(/ink:(fix|new|research|plan|verify|execute|status|investigate)\b/i);
  if (!skillMatch) return true; // No workflow injection needed — handled

  const skillName = skillMatch[1].toLowerCase();
  const skillIntent = SKILL_INTENT_MAP[skillName];
  if (!skillIntent) return true;

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

  emitOutput('UserPromptSubmit', context);
  return true;
}

// ── BRANCH 3: TICKET ENFORCEMENT (was enforce-ticket.js) ─────────────────────


async function handleTicketEnforcement(prompt, cwd, stateContent, state, currentSessionId) {
  // /ink:onboard is exempt
  if (/^\s*\/ink:onboard/i.test(prompt)) return;

  // /ink:autopilot is exempt
  if (/^\s*\/ink:autopilot/i.test(prompt)) {
    emitOutput('UserPromptSubmit', [
      'TICKET REQUIREMENT WAIVED FOR THIS COMMAND.',
      '/ink:autopilot creates its own Jira tickets during execution.',
      'Proceed with the autopilot pipeline immediately. No ticket needed.',
    ].join('\n'));
    return;
  }

  // /ink:ticket is exempt — it IS the ticket resolver
  if (/^\s*\/ink:ticket/i.test(prompt)) {
    emitOutput('UserPromptSubmit', [
      'TICKET REQUIREMENT WAIVED FOR THIS COMMAND.',
      '/ink:ticket resolves or creates Jira tickets directly.',
      'Proceed with the ticket resolution pipeline immediately.',
    ].join('\n'));
    return;
  }

  // Product team commands are exempt — they create artifacts, not consume tickets
  if (/^\s*\/ink:(custrq|productcat|epicstories)/i.test(prompt)) {
    emitOutput('UserPromptSubmit', [
      'TICKET REQUIREMENT WAIVED FOR THIS COMMAND.',
      'Product team commands operate independently of the ticket system.',
      'Proceed with the command immediately. No ticket needed.',
    ].join('\n'));
    return;
  }

  const isSameSession = currentSessionId && state.sessionId === currentSessionId;

  // ── SAME SESSION WITH ACTIVE TICKET ──
  if (state.ticket && (isSameSession || currentSessionId)) {

    // /ink:jira KEY in active session
    const sameSessionJiraMatch = prompt.match(/\/ink:jira\s+([A-Z]{2,10}-\d{2,})(\s|$)/i);
    if (sameSessionJiraMatch) {
      const requestedKey = normalizeTicket(sameSessionJiraMatch[1]);
      if (!requestedKey) return;
      if (requestedKey === state.ticket) return;
      emitOutput('UserPromptSubmit', [
        'The user ran /ink:jira ' + requestedKey + ' while active ticket is ' + state.ticket + '.',
        'Ask: "Do you want to switch from ' + state.ticket + ' to ' + requestedKey + ' and fetch its context?"',
        'If yes: update CurrentTicket to ' + requestedKey + ' in STATE.md (node bin/ink-tools.js state set "CurrentTicket" "' + requestedKey + '"), then run /ink:jira ' + requestedKey + '.',
        'If no: run /ink:jira ' + requestedKey + ' without switching the active ticket.',
      ].join('\n'));
      return;
    }

    // Pending ticket confirmation
    if (state.pendingTicket && isAffirmative(prompt)) {
      const email = readUserEmail();
      const creds = await fetchJiraCredentials(email);

      if (creds && ((creds.accessToken && creds.cloudId) || creds.status === 'oauth_required')) {
        const statusCode = await validateJiraTicket(creds, state.pendingTicket);
        if (statusCode === 404) {
          updateStateFile(cwd, { removePendingTicket: true });
          emitOutput('UserPromptSubmit',
            'The ticket ' + state.pendingTicket + ' does not exist in Jira (HTTP 404). PendingTicket cleared. ' +
            'Tell the user: "The ticket ' + state.pendingTicket + ' was not found in Jira. Ticket not changed, still on ' + state.ticket + '."'
          );
          return;
        }
      }

      const oldTicket = state.ticket;
      updateStateFile(cwd, { CurrentTicket: state.pendingTicket, removePendingTicket: true });
      emitOutput('UserPromptSubmit', [
        'Ticket switched from ' + oldTicket + ' to ' + state.pendingTicket + ' in STATE.md.',
        '',
        'AUTOMATIC NEXT STEP — do NOT ask permission:',
        'Run all steps of /ink:jira ' + state.pendingTicket + ' (credentials → label → fetch → agent).',
        'After JIRA-CONTEXT.md is created, say:',
        '"Context for ' + state.pendingTicket + ' ready. Run /ink:go to start working."',
      ].join('\n'));
      return;
    }

    // User mentions a different ticket → ask to switch
    // Strict pattern: uppercase-only prefix + explicit hyphen + min 2 digits
    // Prevents false positives like "python3" → PYTHON-3, "claude-1" → CLAUDE-1
    const isInkCommand = /^\s*\/ink:/i.test(prompt);
    const mentionedMatch = isInkCommand ? null : prompt.match(/\b([A-Z]{2,10}-\d{2,})\b/);
    const mentionedTicket = mentionedMatch ? normalizeTicket(mentionedMatch[1]) : null;
    if (mentionedTicket && mentionedTicket !== state.ticket) {
      updateStateFile(cwd, { PendingTicket: mentionedTicket });
      emitOutput('UserPromptSubmit', [
        '\u26a0\ufe0f TICKET CHANGE PENDING — DO NOT USE ANY TOOLS \u26a0\ufe0f',
        '',
        'The user wants to switch from ' + state.ticket + ' to ' + mentionedTicket + '.',
        'The system has already registered the pending change.',
        '',
        'You MUST:',
        '1. Ask ONLY this question: "Do you want to switch from ' + state.ticket + ' to ' + mentionedTicket + '?"',
        '2. Wait for the user to respond.',
        '',
        'You MUST NOT:',
        '- Use Bash, Edit, Write, or any other tool.',
        '- Update STATE.md or any file yourself.',
        '- Proceed with any work.',
        '',
        'The system will handle the ticket switch automatically once the user confirms.',
      ].join('\n'));
      return;
    }

    // Same ticket, nothing to do
    return;
  }

  // ── NEW SESSION or NO TICKET ──

  // /ink:jira KEY — auto-extract ticket
  const jiraCommandMatch = prompt.match(/\/ink:jira\s+([A-Z]{2,10}-\d{2,})(\s|$)/i);
  if (jiraCommandMatch) {
    const newTicket = normalizeTicket(jiraCommandMatch[1]);
    if (!newTicket) return;
    try {
      updateStateFile(cwd, { CurrentTicket: newTicket, CurrentSessionId: currentSessionId || 'unknown', removePendingTicket: true });
    } catch (err) {
      process.stderr.write('[enforce-ticket] failed to set ticket from jira command: ' + err.message + '\n');
    }
    emitOutput('UserPromptSubmit', [
      'Ticket ' + newTicket + ' auto-set from /ink:jira command argument.',
      '',
      'MANDATORY after /ink:jira completes and JIRA-CONTEXT.md is created:',
      'Say: "Context for ' + newTicket + ' ready. Run /ink:go to start working."',
      'Do NOT ask permission for the context fetch.',
    ].join('\n'));
    return;
  }

  // Prompt is exactly a ticket number
  // Case-insensitive: user may type "aca-2829" — normalizeTicket uppercases it
  const ticketMatch = prompt.match(/^([A-Z]{2,10}-\d{2,})$/i);
  const normalizedTicket = ticketMatch ? normalizeTicket(ticketMatch[1]) : null;
  if (normalizedTicket) {
    const newTicket = normalizedTicket;
    const email = readUserEmail();
    const creds = await fetchJiraCredentials(email);

    if (creds && ((creds.accessToken && creds.cloudId) || creds.status === 'oauth_required')) {
      const statusCode = await validateJiraTicket(creds, newTicket);
      if (statusCode === 404) {
        emitOutput('UserPromptSubmit',
          'The ticket ' + newTicket + ' does not exist in Jira (HTTP 404). ' +
          'Tell the user exactly this: "The ticket ' + newTicket + ' was not found in Jira. Please provide a valid ticket number (e.g. INK-999)." ' +
          'Do NOT set a ticket. Do NOT proceed with any work. Wait for the user to provide a valid ticket.'
        );
        return;
      }
    }

    try {
      updateStateFile(cwd, { CurrentTicket: newTicket, CurrentSessionId: currentSessionId || 'unknown', removePendingTicket: true });
      emitOutput('UserPromptSubmit', [
        'Jira ticket ' + newTicket + ' set in .planning/STATE.md.',
        '',
        'AUTOMATIC NEXT STEP — do NOT ask permission:',
        'Run all steps of /ink:jira ' + newTicket + ':',
        '  1. Fetch Jira credentials (fetch_credentials step)',
        '  2. Add ink-monitor label (add_ink_monitor_label step)',
        '  3. Fetch Jira data (fetch_jira_data step)',
        '  4. Format and write JIRA-CONTEXT.md (format_and_write step)',
        'After JIRA-CONTEXT.md is created, say:',
        '"Context for ' + newTicket + ' ready. Run /ink:go to start working."',
      ].join('\n'));
    } catch (err) {
      emitOutput('UserPromptSubmit',
        'Could not auto-create STATE.md (' + err.message + '). Tell the user there was an error setting the ticket and ask them to try again.'
      );
    }
    return;
  }

  // No ticket set — ask for ticket
  emitOutput('UserPromptSubmit', [
    '\u26a0\ufe0f MANDATORY — NO JIRA TICKET SET \u26a0\ufe0f',
    '',
    "You MUST NOT perform any work from the user's request above.",
    'Before doing ANYTHING else:',
    '',
    '1. Tell the user: "Before I can start, I need a Jira ticket number for this session. Please type it now (e.g. INK-999)."',
    '2. Wait for the user to type ONLY the ticket number.',
    '3. The system will automatically set it — no file creation needed from you.',
    '4. Once the ticket is confirmed, proceed with the original request.',
    '',
    'Do NOT attempt the original request. Do NOT create any files yourself.',
  ].join('\n'));
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }

  const prompt = input.prompt || '';
  if (typeof prompt !== 'string') {
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();
  const currentSessionId = input.session_id || null;

  // Read STATE.md once (shared across all branches)
  let stateContent = readStateContent(cwd);
  let state = parseState(stateContent);

  // If STATE.md exists but lost its ticket (workflow overwrote it), restore from .ticket-lock
  if (stateContent && !state.ticket) {
    const recovered = restoreTicketIfLost(cwd, stateContent);
    if (recovered) {
      stateContent = readStateContent(cwd);
      state = parseState(stateContent);
    }
  }

  const hasTicket = /CurrentTicket[:\s|]+[A-Z]+-\d+/.test(stateContent);

  // Branch 1: /ink:go
  if (handleInkGo(prompt, cwd, stateContent, state.ticket)) {
    process.exit(0);
  }

  // Branch 2: /ink:* dedicated commands
  if (handleInkDedicated(prompt, cwd, stateContent, state.ticket)) {
    process.exit(0);
  }

  // Branch 3: Ticket enforcement (always runs if branches 1&2 didn't handle)
  await handleTicketEnforcement(prompt, cwd, stateContent, state, currentSessionId);
  process.exit(0);
}

main().catch(function () { process.exit(0); });
