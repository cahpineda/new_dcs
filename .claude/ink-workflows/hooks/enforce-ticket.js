#!/usr/bin/env node

/**
 * UserPromptSubmit Hook: Enforce active Jira ticket
 *
 * Behavior:
 * - No ticket set → ask for ticket number.
 * - Prompt is a ticket number (new session or initial set) → validate + set STATE.md.
 * - Same session, ticket set, user mentions a different ticket → write PendingTicket, ask confirmation.
 * - Same session, PendingTicket exists, user says "si/yes/ok/..." → validate + switch ticket.
 * - Same session, ticket set, no change → silent pass.
 * - New session (different session_id) → require ticket again.
 *
 * Input (stdin JSON): { "prompt": "...", "cwd": "...", "session_id": "..." }
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

function restoreTicketIfLost(cwd) {
  try {
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) return null;
    const content = fs.readFileSync(statePath, 'utf8');
    if (/CurrentTicket[:\s|]+[A-Z]+-\d+/.test(content)) return null;

    const lock = readTicketLock(cwd);
    if (!lock || !lock.ticket) return null;

    let updated = content;
    const heading = updated.match(/^(##[^\n]*\n)/m);
    if (heading) {
      updated = updated.replace(heading[0], heading[0] + 'CurrentTicket: ' + lock.ticket + '\n');
    } else {
      updated = 'CurrentTicket: ' + lock.ticket + '\n' + updated;
    }
    if (lock.sessionId) {
      const tLine = updated.match(/^(CurrentTicket[:\s|]+\S+[^\n]*\n)/m);
      if (tLine) {
        updated = updated.replace(tLine[0], tLine[0] + 'CurrentSessionId: ' + lock.sessionId + '\n');
      }
    }
    fs.writeFileSync(statePath, updated);
    process.stderr.write('[ticket-lock] restored ticket ' + lock.ticket + ' after STATE.md overwrite\n');
    return { ticket: lock.ticket, sessionId: lock.sessionId };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────

function readState(cwd) {
  try {
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) return { ticket: null, sessionId: null, pendingTicket: null };
    const content = fs.readFileSync(statePath, 'utf8');
    const ticketMatch = content.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/);
    const sessionMatch = content.match(/CurrentSessionId[:\s|]+(\S+)/);
    const pendingMatch = content.match(/PendingTicket[:\s|]+([A-Z]+-\d+)/);
    return {
      ticket: ticketMatch ? ticketMatch[1].trim() : null,
      sessionId: sessionMatch ? sessionMatch[1].trim() : null,
      pendingTicket: pendingMatch ? pendingMatch[1].trim() : null,
    };
  } catch {
    return { ticket: null, sessionId: null, pendingTicket: null };
  }
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
    // Insert after CurrentTicket line if it exists, else after first ## heading, else append
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

/**
 * Normalize a ticket string to uppercase with hyphen.
 * Examples: "ink999" → "INK-999", "ink-999" → "INK-999", "INK-999" → "INK-999"
 * Returns null if the string doesn't look like a ticket.
 */
function normalizeTicket(raw) {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  // Already has hyphen: INK-999
  const withHyphen = s.match(/^([A-Z]{2,10})-(\d+)$/);
  if (withHyphen) return withHyphen[1] + '-' + withHyphen[2];
  // Missing hyphen: INK999 → INK-999
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

// Known Jira project keys — allows confident matching even for short prefixes (MT, AE)
var KNOWN_PROJECTS = [
  'ACA', 'AE', 'AS', 'BIOM', 'BRS', 'COM', 'CON', 'CUSS', 'DCS', 'DM',
  'DSGN', 'FL', 'HAWB', 'HAWBC', 'IM', 'IN', 'INFDEVOPS', 'INT', 'ISS',
  'JA', 'JFK', 'KS', 'LC', 'LCT', 'LM', 'LS', 'MB', 'MDP', 'MOB', 'MT',
  'PMI', 'PMT', 'PS', 'QAS', 'QXT', 'RCA', 'RMT', 'SP', 'SRE', 'TF', 'WCI',
];
var KNOWN_PROJECTS_PATTERN = new RegExp(
  '^(' + KNOWN_PROJECTS.join('|') + ')-?\\d+$', 'i'
);

/**
 * Try to normalize a known project ticket in any format.
 * Returns normalized ticket (e.g. "ACA-2829") if the prefix is a known project, null otherwise.
 * Accepts: aca2829, aca-2829, ACA2829, Aca-2829 → ACA-2829
 */
function tryNormalizeKnownProject(text) {
  const s = text.trim();
  if (KNOWN_PROJECTS_PATTERN.test(s)) return normalizeTicket(s);
  return null;
}

async function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[enforce-ticket] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();
  const currentSessionId = input.session_id || null;
  const prompt = (input.prompt || '').trim();

  // /ink:onboard is exempt — it handles ticket setup internally
  if (/^\s*\/ink:onboard/i.test(prompt)) {
    process.exit(0);
  }

  // /ink:autopilot is exempt — it creates its own Jira tickets during execution
  if (/^\s*\/ink:autopilot/i.test(prompt)) {
    var autopilotOverride = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: [
          'TICKET REQUIREMENT WAIVED FOR THIS COMMAND.',
          '/ink:autopilot creates its own Jira tickets during execution.',
          'Proceed with the autopilot pipeline immediately. No ticket needed.',
        ].join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(autopilotOverride));
    process.exit(0);
  }

  // /ink:ticket is exempt — it IS the ticket resolver
  if (/^\s*\/ink:ticket/i.test(prompt)) {
    var ticketOverride = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: [
          'TICKET REQUIREMENT WAIVED FOR THIS COMMAND.',
          '/ink:ticket resolves or creates Jira tickets directly.',
          'Proceed with the ticket resolution pipeline immediately.',
        ].join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(ticketOverride));
    process.exit(0);
  }

  // Product team commands are exempt — they create artifacts, not consume tickets
  if (/^\s*\/ink:(custrq|productcat|epicstories)/i.test(prompt)) {
    var productOverride = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: [
          'TICKET REQUIREMENT WAIVED FOR THIS COMMAND.',
          'Product team commands operate independently of the ticket system.',
          'Proceed with the command immediately. No ticket needed.',
        ].join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(productOverride));
    process.exit(0);
  }

  let state = readState(cwd);

  // If STATE.md exists but lost its ticket (workflow overwrote it), restore from .ticket-lock
  if (!state.ticket) {
    const recovered = restoreTicketIfLost(cwd);
    if (recovered) {
      state = readState(cwd);
    }
  }

  const isSameSession = currentSessionId && state.sessionId === currentSessionId;

  // ── SAME SESSION WITH ACTIVE TICKET ──────────────────────────────────────
  if (state.ticket && isSameSession) {

    // ── /ink:jira KEY en sesión activa ───────────────────────────────────────
    const sameSessionJiraMatch = prompt.match(/\/ink:jira\s+([A-Z]{2,10}-\d{2,})(\s|$)/i);
    if (sameSessionJiraMatch) {
      const requestedKey = normalizeTicket(sameSessionJiraMatch[1]);
      if (!requestedKey) { process.exit(0); }
      if (requestedKey === state.ticket) {
        process.exit(0); // Mismo ticket — dejar pasar, jira corre normal
      }
      // Ticket diferente — preguntar si cambiar, sin PendingTicket flow
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            'The user ran /ink:jira ' + requestedKey + ' while active ticket is ' + state.ticket + '.',
            'Ask: "Do you want to switch from ' + state.ticket + ' to ' + requestedKey + ' and fetch its context?"',
            'If yes: update CurrentTicket to ' + requestedKey + ' in STATE.md (node bin/ink-tools.js state set "CurrentTicket" "' + requestedKey + '"), then run /ink:jira ' + requestedKey + '.',
            'If no: run /ink:jira ' + requestedKey + ' without switching the active ticket.',
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Case 1: pending ticket confirmation — user says "si/yes/ok"
    if (state.pendingTicket && isAffirmative(prompt)) {
      const email = readUserEmail();
      const creds = await fetchJiraCredentials(email);

      if (creds && ((creds.accessToken && creds.cloudId) || creds.status === 'oauth_required')) {
        const statusCode = await validateJiraTicket(creds, state.pendingTicket);
        if (statusCode === 404) {
          updateStateFile(cwd, { removePendingTicket: true });
          const output = {
            hookSpecificOutput: {
              hookEventName: 'UserPromptSubmit',
              additionalContext:
                'The ticket ' + state.pendingTicket + ' does not exist in Jira (HTTP 404). PendingTicket cleared. ' +
                'Tell the user: "The ticket ' + state.pendingTicket + ' was not found in Jira. Ticket not changed, still on ' + state.ticket + '."',
            },
          };
          process.stdout.write(JSON.stringify(output));
          process.exit(0);
        }
      }

      // Valid (or creds unavailable) → switch ticket
      const oldTicket = state.ticket;
      updateStateFile(cwd, { CurrentTicket: state.pendingTicket, removePendingTicket: true });
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            'Ticket switched from ' + oldTicket + ' to ' + state.pendingTicket + ' in STATE.md.',
            '',
            'AUTOMATIC NEXT STEP — do NOT ask permission:',
            'Run all steps of /ink:jira ' + state.pendingTicket + ' (credentials → label → fetch → agent).',
            'After JIRA-CONTEXT.md is created, say:',
            '"Context for ' + state.pendingTicket + ' ready. Run /ink:go to start working."',
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Case 2a: prompt is exactly a known project ticket in any format → ask to switch
    const knownInSession = tryNormalizeKnownProject(prompt);
    if (knownInSession && knownInSession !== state.ticket) {
      updateStateFile(cwd, { PendingTicket: knownInSession });
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            '⚠️ TICKET CHANGE PENDING — DO NOT USE ANY TOOLS ⚠️',
            '',
            'The user wants to switch from ' + state.ticket + ' to ' + knownInSession + '.',
            'The system has already registered the pending change.',
            '',
            'You MUST:',
            '1. Ask ONLY this question: "Do you want to switch from ' + state.ticket + ' to ' + knownInSession + '?"',
            '2. Wait for the user to respond.',
            '',
            'You MUST NOT:',
            '- Use Bash, Edit, Write, or any other tool.',
            '- Update STATE.md or any file yourself.',
            '- Proceed with any work.',
            '',
            'The system will handle the ticket switch automatically once the user confirms.',
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }


    // Case 2b: user mentions a different ticket in text → ask to switch
    // Strict pattern: uppercase-only prefix + explicit hyphen + min 2 digits
    // Prevents false positives like "python3" → PYTHON-3, "claude-1" → CLAUDE-1, "routerv1" → ROUTERV-1
    // Also skip detection when the prompt starts with /ink: — commands may reference tickets as args
    const isInkCommand = /^\s*\/ink:/i.test(prompt);
    const mentionedMatch = isInkCommand ? null : prompt.match(/\b([A-Z]{2,10}-\d{2,})\b/);
    const mentionedTicket = mentionedMatch ? normalizeTicket(mentionedMatch[1]) : null;
    if (mentionedTicket && mentionedTicket !== state.ticket) {
      const newTicket = mentionedTicket;
      updateStateFile(cwd, { PendingTicket: newTicket });
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            '⚠️ TICKET CHANGE PENDING — DO NOT USE ANY TOOLS ⚠️',
            '',
            'The user wants to switch from ' + state.ticket + ' to ' + newTicket + '.',
            'The system has already registered the pending change.',
            '',
            'You MUST:',
            '1. Ask ONLY this question: "Do you want to switch from ' + state.ticket + ' to ' + newTicket + '?"',
            '2. Wait for the user to respond.',
            '',
            'You MUST NOT:',
            '- Use Bash, Edit, Write, or any other tool.',
            '- Update STATE.md or any file yourself.',
            '- Proceed with any work.',
            '',
            'The system will handle the ticket switch automatically once the user confirms.',
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Case 3: stale PendingTicket — user sent a non-affirmative, non-ticket message
    // Clear it so it doesn't accidentally trigger a switch on a future "yes"
    if (state.pendingTicket) {
      updateStateFile(cwd, { removePendingTicket: true });
    }

    // Silent pass — same ticket, nothing to do
    process.exit(0);
  }

  // ── NEW SESSION WITH EXISTING TICKET — confirm before proceeding ─────────
  if (state.ticket && currentSessionId && !isSameSession) {

    // User confirmed → update session ID and proceed
    if (isAffirmative(prompt)) {
      updateStateFile(cwd, { CurrentSessionId: currentSessionId });
      const jiraContextPath = path.join(cwd, '.planning', 'jira', 'JIRA-CONTEXT.md');
      const hasContext = fs.existsSync(jiraContextPath);
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            'New session confirmed. Active ticket: ' + state.ticket + '.',
            hasContext
              ? 'Load .planning/jira/JIRA-CONTEXT.md for ticket context before starting work.'
              : 'No JIRA context found. Consider running /ink:jira ' + state.ticket + ' to fetch ticket context.',
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Known project in any format (aca2829, aca-2829) → accept and normalize
    const knownTicket = tryNormalizeKnownProject(prompt);
    // Strict format match (ABC-123)
    const strictMatch = prompt.match(/^([A-Z]{2,10}-\d{2,})$/);
    const newSessionTicket = knownTicket || (strictMatch ? normalizeTicket(strictMatch[1]) : null);

    if (newSessionTicket && newSessionTicket !== state.ticket) {
      updateStateFile(cwd, { CurrentTicket: newSessionTicket, CurrentSessionId: currentSessionId, removePendingTicket: true });
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            'Ticket switched to ' + newSessionTicket + ' for new session.',
            '',
            'AUTOMATIC NEXT STEP — do NOT ask permission:',
            'Run all steps of /ink:jira ' + newSessionTicket + ' to fetch ticket context.',
            'After JIRA-CONTEXT.md is created, say: "Context for ' + newSessionTicket + ' ready. Run /ink:go to start working."',
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Default: interrupt and ask to confirm active ticket
    const output = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: [
          '⚠️ NEW SESSION — CONFIRM ACTIVE TICKET ⚠️',
          '',
          'Do NOT proceed with the original request.',
          '',
          'Tell the user:',
          '"New session detected. Your active ticket is ' + state.ticket + '.',
          'Type YES to continue with ' + state.ticket + ', or type a new ticket key (e.g. DCS-1234) to switch."',
          '',
          'Wait for their response before doing any work.',
        ].join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  }

  // ── NEW SESSION or NO TICKET ──────────────────────────────────────────────

  // ── /ink:jira KEY — auto-extraer ticket del argumento del comando ──────────
  const jiraCommandMatch = prompt.match(/\/ink:jira\s+([A-Z]{2,10}-\d{2,})(\s|$)/i);
  if (jiraCommandMatch) {
    const newTicket = normalizeTicket(jiraCommandMatch[1]);
    if (!newTicket) { process.exit(0); }
    try {
      updateStateFile(cwd, { CurrentTicket: newTicket, CurrentSessionId: currentSessionId || 'unknown', removePendingTicket: true });
    } catch (err) {
      process.stderr.write('[enforce-ticket] failed to set ticket from jira command: ' + err.message + '\n');
    }
    const output = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: [
          'Ticket ' + newTicket + ' auto-set from /ink:jira command argument.',
          '',
          'MANDATORY after /ink:jira completes and JIRA-CONTEXT.md is created:',
          'Say: "Context for ' + newTicket + ' ready. Run /ink:go to start working."',
          'Do NOT ask permission for the context fetch.',
        ].join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  }

  // Known project in any format → accept and normalize
  const knownTicketInitial = tryNormalizeKnownProject(prompt);
  // Strict format match
  const ticketMatch = prompt.match(/^([A-Z]{2,10}-\d{2,})$/);
  const normalizedTicket = knownTicketInitial || (ticketMatch ? normalizeTicket(ticketMatch[1]) : null);

  if (normalizedTicket) {
    const newTicket = normalizedTicket;

    const email = readUserEmail();
    const creds = await fetchJiraCredentials(email);

    if (creds && ((creds.accessToken && creds.cloudId) || creds.status === 'oauth_required')) {
      const statusCode = await validateJiraTicket(creds, newTicket);
      if (statusCode === 404) {
        const output = {
          hookSpecificOutput: {
            hookEventName: 'UserPromptSubmit',
            additionalContext:
              'The ticket ' + newTicket + ' does not exist in Jira (HTTP 404). ' +
              'Tell the user exactly this: "The ticket ' + newTicket + ' was not found in Jira. Please provide a valid ticket number (e.g. INK-999)." ' +
              'Do NOT set a ticket. Do NOT proceed with any work. Wait for the user to provide a valid ticket.',
          },
        };
        process.stdout.write(JSON.stringify(output));
        process.exit(0);
      }
    }

    try {
      updateStateFile(cwd, { CurrentTicket: newTicket, CurrentSessionId: currentSessionId || 'unknown', removePendingTicket: true });
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
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
          ].join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
    } catch (err) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext:
            'Could not auto-create STATE.md (' + err.message + '). Tell the user there was an error setting the ticket and ask them to try again.',
        },
      };
      process.stdout.write(JSON.stringify(output));
    }
    process.exit(0);
  }

  // Regular prompt with no ticket set — ask for ticket
  const output = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: [
        '⚠️ MANDATORY — NO JIRA TICKET SET ⚠️',
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
      ].join('\n'),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main().catch(function () { process.exit(0); });
