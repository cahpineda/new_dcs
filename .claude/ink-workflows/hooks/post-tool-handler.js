#!/usr/bin/env node
'use strict';

/**
 * Unified PostToolUse / PostToolUseFailure Hook
 *
 * Merges learn-from-errors.js + context-monitor.js into a single Node.js process
 * to eliminate 1x V8 startup overhead (~100ms savings per Bash tool use).
 *
 * Logic:
 * 1. If tool is Bash → run error learning (was: learn-from-errors.js)
 * 2. Always → run context monitoring (was: context-monitor.js)
 *
 * Input (stdin JSON): { "tool_name": "...", "tool_input": {...}, "tool_output"/"tool_response": {...}, ... }
 * Output: JSON with hookSpecificOutput.additionalContext if warnings/errors detected
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── BRANCH 1: ERROR LEARNING (was learn-from-errors.js) ──────────────────────

function handleInkToolsError(input, command) {
  const isFailureEvent = input.hook_event_name === 'PostToolUseFailure';

  let errorMsg;

  if (isFailureEvent) {
    const rawError = input.error || '';
    try {
      const errorLine = rawError.trim().split('\n').find(l => l.startsWith('{"error"'));
      if (errorLine) {
        errorMsg = JSON.parse(errorLine).error;
      }
    } catch { /* fall through */ }
    if (!errorMsg) {
      errorMsg = rawError.trim().substring(0, 200) || 'Command failed (no details)';
    }
  } else {
    const response = input.tool_response?.stderr || input.tool_response?.content || '';
    try {
      const errorLine = response.trim().split('\n').find(l => l.startsWith('{"error"'));
      if (errorLine) {
        errorMsg = JSON.parse(errorLine).error;
      }
    } catch { /* fall through */ }
    if (!errorMsg && input.tool_response?.exitCode > 0) {
      errorMsg = response.trim().substring(0, 200);
    }
  }

  if (!errorMsg) return null;

  const cmdParts = command.match(/ink-tools\.js\s+(.+)/);
  const inkCommand = cmdParts ? cmdParts[1].trim() : command;

  const entry = {
    timestamp: new Date().toISOString(),
    command: inkCommand,
    error: errorMsg,
    full_command: command.trim().substring(0, 300),
    session_id: input.session_id || 'unknown'
  };

  const logDir = path.join(input.cwd || process.cwd(), '.planning');
  const logFile = path.join(logDir, 'ink-tools-errors.jsonl');
  try {
    if (fs.existsSync(logDir)) {
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    }
  } catch { /* don't block on log failure */ }

  const hint = buildHint(inkCommand, errorMsg);
  return hint ? `\u26a0 ink-tools.js error logged. ${hint}` : null;
}

function handleComplexityOverrun(input, command) {
  const response = input.tool_response?.content || input.tool_response?.stdout || '';
  if (input.tool_response?.exitCode !== 0) return null;

  const fileMatch = response.match(/(\d+)\s+files?\s+changed/);
  if (!fileMatch) return null;
  const fileCount = parseInt(fileMatch[1], 10);
  if (fileCount <= 3) return null;

  const cwd = input.cwd || process.cwd();
  const quickDir = path.join(cwd, '.planning', 'quick');
  try {
    if (!fs.existsSync(quickDir)) return null;
    const files = fs.readdirSync(quickDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) return null;
  } catch { return null; }

  const logDir = path.join(cwd, '.planning');
  const logFile = path.join(logDir, 'ink-tools-errors.jsonl');
  const entry = {
    timestamp: new Date().toISOString(),
    command: 'COMPLEXITY_OVERRUN',
    error: `Quick task committed ${fileCount} files (threshold: 3)`,
    full_command: command.trim().substring(0, 300),
    session_id: input.session_id || 'unknown'
  };

  try {
    if (fs.existsSync(logDir)) {
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    }
  } catch { /* don't block on log failure */ }

  return `COMPLEXITY_OVERRUN: This quick task touched ${fileCount} files (threshold: 3). Consider using phase planning for similar tasks.`;
}

function buildHint(cmd, error) {
  const hints = [
    { pattern: /Unknown command: (\w+)\. Available: (.+)/,
      hint: (m) => `Unknown command "${m[1]}". Available: ${m[2]}` },
    { pattern: /Usage: ink-tools (\w+) <(.+)>/,
      hint: (m) => `Missing subcommand for "${m[1]}". Options: ${m[2]}` },
    { pattern: /Field "(.+)" not found/,
      hint: (m) => `Field "${m[1]}" doesn't exist in STATE.md. Use "state snapshot" to see available fields.` },
    { pattern: /Chapter "(.+)" not found/,
      hint: (m) => `Chapter "${m[1]}" not found. Use "memory list-chapters" to see available chapters.` },
    { pattern: /Config key "(.+)" not found/,
      hint: (m) => `Config key "${m[1]}" not found. Use "config dump" to see all keys.` },
    { pattern: /Phase (\d+) not found/,
      hint: (m) => `Phase ${m[1]} doesn't exist. Use "phase list" to see available phases.` },
  ];

  for (const h of hints) {
    const match = error.match(h.pattern);
    if (match) return h.hint(match);
  }

  return `Error: ${error.substring(0, 150)}`;
}

// ── BRANCH 2: CONTEXT MONITOR (was context-monitor.js) ──────────────────────

const DEBOUNCE_INTERVAL = 5;
const WARN_THRESHOLD = 65;
const CRITICAL_THRESHOLD = 80;

function handleContextMonitor(input) {
  const contextWindow = input.context_window;
  if (!contextWindow) return null;

  const percent = contextWindow.used_percentage || 0;
  if (percent < WARN_THRESHOLD) return null;

  const sessionId = (input.session_id || 'default').replace(/[^a-zA-Z0-9-]/g, '_');
  const stateFile = path.join(os.tmpdir(), `ink-ctx-monitor-${sessionId}.json`);

  let monitorState;
  try {
    if (fs.existsSync(stateFile)) {
      monitorState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch { /* use defaults */ }
  if (!monitorState) monitorState = { count: 0, lastPercent: 0, lastWarnLevel: 0 };

  monitorState.count = (monitorState.count || 0) + 1;

  const severity = percent >= CRITICAL_THRESHOLD ? 2 : 1;
  const isNewLevel = severity > (monitorState.lastWarnLevel || 0);
  const isCriticalRepeat = severity === 2 && monitorState.count % DEBOUNCE_INTERVAL === 0;

  if (!isNewLevel && !isCriticalRepeat) {
    try { fs.writeFileSync(stateFile, JSON.stringify(monitorState)); } catch {}
    return null;
  }

  monitorState.lastPercent = percent;
  monitorState.lastWarnLevel = Math.max(monitorState.lastWarnLevel || 0, severity);
  try { fs.writeFileSync(stateFile, JSON.stringify(monitorState)); } catch {}

  const usedTokens = contextWindow.used_tokens
    ? ` (~${Math.round(contextWindow.used_tokens / 1000)}k tokens)`
    : '';

  if (severity === 2) {
    return { block: true, reason: [
      `\ud83d\udd34 CONTEXT CRITICAL: ${percent}%${usedTokens} used.`,
      `Stop starting new sub-tasks. Finish the current task, commit your changes, and wrap up this session.`,
      `Do NOT begin new work — save progress now.`,
    ].join(' ') };
  }

  return { block: true, reason: [
    `\ud83d\udfe1 Context Warning: ${percent}%${usedTokens} used.`,
    `Start wrapping up. Avoid opening new sub-tasks.`,
    `Aim to commit and conclude the current work before context fills.`,
  ].join(' ') };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch { process.exit(0); }

  const toolName = input.tool_name || '';
  const command = input.tool_input?.command || '';
  const outputs = [];

  // Branch 1: Error learning (Bash only)
  if (toolName === 'Bash') {
    if (command.includes('ink-tools.js')) {
      const errorHint = handleInkToolsError(input, command);
      if (errorHint) outputs.push(errorHint);
    }

    if (command.match(/git\s+commit/)) {
      const overrunMsg = handleComplexityOverrun(input, command);
      if (overrunMsg) outputs.push(overrunMsg);
    }
  }

  // Branch 2: Context monitor (all tools)
  const ctxResult = handleContextMonitor(input);
  if (ctxResult) {
    // Context monitor uses block/reason format
    process.stdout.write(JSON.stringify({ decision: ctxResult.block ? 'block' : 'allow', reason: ctxResult.reason }));
    process.exit(0);
  }

  // Emit error hints if any
  if (outputs.length > 0) {
    const eventName = input.hook_event_name === 'PostToolUseFailure' ? 'PostToolUseFailure' : 'PostToolUse';
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: outputs.join('\n'),
      },
    }));
  }

  process.exit(0);
}

main();
