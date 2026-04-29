#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) { process.stderr.write('[learn-from-errors] stdin parse failed: ' + (e.message || 'unknown') + '\n'); process.exit(0); }

  // Only process Bash tool calls
  if (input.tool_name !== 'Bash') process.exit(0);
  const command = input.tool_input?.command || '';

  // Branch 1: ink-tools.js error learning
  if (command.includes('ink-tools.js')) {
    handleInkToolsError(input, command);
  }

  // Branch 2: git commit complexity overrun audit
  if (command.match(/git\s+commit/)) {
    handleComplexityOverrun(input, command);
  }

  process.exit(0);
}

function handleInkToolsError(input, command) {
  // PostToolUseFailure has { error: string, is_interrupt: bool } — no tool_response
  // PostToolUse has { tool_response: { stderr, content, exitCode } }
  const isFailureEvent = input.hook_event_name === 'PostToolUseFailure';

  let errorMsg;

  if (isFailureEvent) {
    // PostToolUseFailure: error is a top-level string
    const rawError = input.error || '';
    // Try to extract JSON error from the error string
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
    // PostToolUse: error is in tool_response
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

  if (!errorMsg) return;

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
  if (hint) {
    const output = {
      hookSpecificOutput: {
        hookEventName: isFailureEvent ? 'PostToolUseFailure' : 'PostToolUse',
        additionalContext: `\u26a0 ink-tools.js error logged. ${hint}`,
      },
    };
    process.stdout.write(JSON.stringify(output));
  }
}

function handleComplexityOverrun(input, command) {
  const response = input.tool_response?.content || input.tool_response?.stdout || '';
  if (input.tool_response?.exitCode !== 0) return;

  // Parse file count from git commit output (e.g., "8 files changed")
  const fileMatch = response.match(/(\d+)\s+files?\s+changed/);
  if (!fileMatch) return;
  const fileCount = parseInt(fileMatch[1], 10);
  if (fileCount <= 3) return;

  // Check if a quick task is active
  const cwd = input.cwd || process.cwd();
  const quickDir = path.join(cwd, '.planning', 'quick');
  try {
    if (!fs.existsSync(quickDir)) return;
    const files = fs.readdirSync(quickDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) return;
  } catch { return; }

  // Quick task active AND files > 3 → complexity overrun
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

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `COMPLEXITY_OVERRUN: This quick task touched ${fileCount} files (threshold: 3). Consider using phase planning for similar tasks.`,
    },
  };
  process.stdout.write(JSON.stringify(output));
}

function buildHint(cmd, error) {
  // Common mistake patterns -> targeted hints
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

main();
