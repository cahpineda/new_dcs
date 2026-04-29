#!/usr/bin/env node
'use strict';

/**
 * Context Monitor Hook (PostToolUse)
 *
 * Injects warnings into the prompt stream when context usage crosses thresholds.
 * Debounces checks to every N tool uses per session to avoid noise.
 *
 * Thresholds:
 *   65% → warning: start wrapping up, avoid new sub-tasks
 *   70% → handoff: auto-checkpoint saved to STATE.md, prepare agent handoff
 *   80% → critical: stop immediately, commit what you have
 *
 * Severity escalation: warns once per level, critical repeats every DEBOUNCE_INTERVAL.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEBOUNCE_INTERVAL = 5; // Check every N tool uses
const WARN_THRESHOLD = 65;
const HANDOFF_THRESHOLD = 70; // auto-checkpoint + handoff notice
const CRITICAL_THRESHOLD = 80;

function readState(stateFile) {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch {
    /* use defaults */
  }
  return { count: 0, lastPercent: 0, lastWarnLevel: 0 };
}

function writeState(stateFile, state) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state));
  } catch {
    /* silent */
  }
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[context-monitor] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  // Skip if no context data
  const contextWindow = input.context_window;
  if (!contextWindow) process.exit(0);

  const percent = contextWindow.used_percentage || 0;
  // Nothing to do below warning threshold
  if (percent < WARN_THRESHOLD) process.exit(0);

  const sessionId = (input.session_id || 'default').replace(
    /[^a-zA-Z0-9-]/g,
    '_',
  );
  const stateFile = path.join(os.tmpdir(), `ink-ctx-monitor-${sessionId}.json`);

  const state = readState(stateFile);
  state.count = (state.count || 0) + 1;

  // Determine current severity level
  const severity = percent >= CRITICAL_THRESHOLD ? 3
                 : percent >= HANDOFF_THRESHOLD  ? 2
                 : 1;

  // Decide whether to emit a warning:
  // - New level higher than last warned → always emit
  // - Same critical level → emit every DEBOUNCE_INTERVAL tool uses (persistent reminder)
  // - Same warning level (1) → skip (already notified)
  const isNewLevel = severity > (state.lastWarnLevel || 0);
  const isCriticalRepeat =
    severity === 3 && state.count % DEBOUNCE_INTERVAL === 0;

  if (!isNewLevel && !isCriticalRepeat) {
    writeState(stateFile, state);
    process.exit(0);
  }

  // Update tracked state
  state.lastPercent = percent;
  state.lastWarnLevel = Math.max(state.lastWarnLevel || 0, severity);
  writeState(stateFile, state);

  // Auto-checkpoint at handoff level (once): persist session state so agents can resume cleanly
  if (severity === 2 && isNewLevel) {
    try {
      const { spawnSync } = require('child_process');
      const inkTools = path.join(
        process.env.CLAUDE_PROJECT_DIR || process.cwd(),
        'bin', 'ink-tools.js'
      );
      spawnSync(process.execPath, [
        inkTools, 'state', 'record-session',
        '--stopped-at', `Context at ${Math.round(percent)}% — auto-checkpoint`
      ], { stdio: 'ignore', timeout: 3000 });
    } catch { /* silent */ }
  }

  // Build message
  const usedTokens = contextWindow.used_tokens
    ? ` (~${Math.round(contextWindow.used_tokens / 1000)}k tokens)`
    : '';

  let reason;
  if (severity === 3) {
    reason = [
      `🔴 CONTEXT CRITICAL: ${percent}%${usedTokens} used.`,
      `Stop starting new sub-tasks. Finish the current task, commit your changes, and wrap up this session.`,
      `Do NOT begin new work — save progress now.`,
    ].join(' ');
  } else if (severity === 2) {
    reason = [
      `🟠 Context Handoff: ${percent}%${usedTokens} used. Auto-checkpoint saved.`,
      `Finish the current task and commit before starting anything new.`,
      `If spawning a sub-agent, pass STATE.md context — session state is already saved.`,
    ].join(' ');
  } else {
    reason = [
      `🟡 Context Warning: ${percent}%${usedTokens} used.`,
      `Start wrapping up. Avoid opening new sub-tasks.`,
      `Aim to commit and conclude the current work before context fills.`,
    ].join(' ');
  }

  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}

main();
