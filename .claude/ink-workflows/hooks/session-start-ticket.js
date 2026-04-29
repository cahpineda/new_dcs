#!/usr/bin/env node
/**
 * SessionStart Hook: Ticket presence check and session greeting.
 *
 * - No ticket set → inject MANDATORY: ask user for ticket before anything.
 * - Ticket set, new session → write new CurrentSessionId, inject confirm/switch prompt.
 * - Same session resume → silent pass.
 *
 * Writing CurrentSessionId here ensures enforce-ticket.js sees isSameSession=true
 * on the first UserPromptSubmit (no double-ask).
 *
 * Input (stdin JSON): { "cwd": "...", "session_id": "..." }
 * Never outputs decision:block.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ── TICKET LOCK: restore ticket if STATE.md was overwritten ──────────────────

function readTicketLock(cwd) {
  try {
    const p = path.join(cwd, '.planning', '.ticket-lock');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

function restoreTicketIfLost(statePath, cwd) {
  try {
    if (!fs.existsSync(statePath)) return false;
    const content = fs.readFileSync(statePath, 'utf8');
    if (/CurrentTicket[:\s|]+[A-Z]+-\d+/.test(content)) return false;

    const lock = readTicketLock(cwd);
    if (!lock || !lock.ticket) return false;

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
    process.stderr.write('[session-start-ticket] restored ticket ' + lock.ticket + ' from .ticket-lock\n');
    return true;
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────

function readState(statePath) {
  try {
    if (!fs.existsSync(statePath)) return { ticket: null, sessionId: null };
    const content = fs.readFileSync(statePath, 'utf8');
    const ticketMatch = content.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/);
    const sessionMatch = content.match(/CurrentSessionId[:\s|]+(\S+)/);
    return {
      ticket: ticketMatch ? ticketMatch[1].trim() : null,
      sessionId: sessionMatch ? sessionMatch[1].trim() : null,
    };
  } catch { return { ticket: null, sessionId: null }; }
}

function writeSessionId(statePath, sessionId) {
  try {
    let content = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '## Status\n';
    if (/CurrentSessionId[:\s|]+\S+/.test(content)) {
      content = content.replace(/CurrentSessionId[:\s|]+\S+/, 'CurrentSessionId: ' + sessionId);
    } else {
      const ticketLine = content.match(/^(CurrentTicket[:\s|]+\S+[^\n]*\n)/m);
      if (ticketLine) {
        content = content.replace(ticketLine[0], ticketLine[0] + 'CurrentSessionId: ' + sessionId + '\n');
      } else {
        const headingMatch = content.match(/^(##[^\n]*\n)/m);
        if (headingMatch) {
          content = content.replace(headingMatch[0], headingMatch[0] + 'CurrentSessionId: ' + sessionId + '\n');
        } else {
          content += '\nCurrentSessionId: ' + sessionId + '\n';
        }
      }
    }
    fs.writeFileSync(statePath, content);
  } catch (err) {
    process.stderr.write('[session-start-ticket] failed to write session ID: ' + err.message + '\n');
  }
}

function main() {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); }
  catch (e) { process.stderr.write('[session-start-ticket] stdin parse failed: ' + (e.message || 'unknown') + '\n'); input = {}; }

  const cwd = input.cwd || process.cwd();
  const sessionId = input.session_id || null;
  const statePath = path.join(cwd, '.planning', 'STATE.md');

  // STATE.md missing → verify-planning-structure.js ya reportó esto. Exit silently.
  if (!fs.existsSync(statePath)) process.exit(0);

  // If STATE.md lost its ticket (workflow overwrote it), restore from .ticket-lock
  restoreTicketIfLost(statePath, cwd);

  const state = readState(statePath);

  // ── CASE 1: Sin ticket ────────────────────────────────────────────────────
  if (!state.ticket) {
    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: [
          'NO JIRA TICKET SET FOR THIS SESSION.',
          '',
          'Before doing ANYTHING else, say EXACTLY this to the user:',
          '"Before I can help, I need your Jira ticket number for this session (e.g., ACA-123). Please type it now."',
          '',
          'Wait for the user to reply. Do NOT greet, summarize, or act before the ticket is set.',
          'The system will auto-set it once the user types a valid ticket number.',
          'Once set, AUTOMATICALLY run /ink:jira [KEY] without asking permission.',
          'After context is ready, say: "Context for [KEY] ready. Run /ink:go to start working."',
        ].join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  }

  // ── CASE 2: Misma sesión (resume) ─────────────────────────────────────────
  if (sessionId && state.sessionId === sessionId) {
    process.exit(0); // Silent pass
  }

  // ── CASE 3: Ticket existe, sesión nueva ───────────────────────────────────
  // Escribir nuevo sessionId AHORA para que enforce-ticket.js vea isSameSession=true
  if (sessionId) {
    writeSessionId(statePath, sessionId);
    // Update .ticket-lock with new sessionId
    try {
      const lockPath = path.join(cwd, '.planning', '.ticket-lock');
      fs.writeFileSync(lockPath, JSON.stringify({ ticket: state.ticket, sessionId: sessionId, ts: Date.now() }));
    } catch {}
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        'NEW SESSION — existing ticket found.',
        '',
        'Say EXACTLY this to the user:',
        '"Welcome back! Last session you were working on ' + state.ticket + '.',
        'Type \'' + state.ticket + '\' to continue, or type a different ticket number to switch."',
        '',
        'Wait for the user to reply before doing ANYTHING.',
        'Once confirmed: AUTOMATICALLY run /ink:jira [CONFIRMED_TICKET] without asking permission.',
        'After context is ready, say: "Context for [TICKET] ready. Run /ink:go to start working."',
      ].join('\n'),
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
