#!/usr/bin/env node

/**
 * SessionStart Hook: Auto-refresh codebase staleness timestamp
 *
 * Checks if .planning/codebase/STACK.md is >7 days old.
 * If so, touches it to reset the staleness timer — an active session
 * means the developer is working, so the codebase map is current enough.
 *
 * This prevents the codebase_stale warning from firing on every dispatch
 * during active development sessions.
 *
 * Runs asynchronously (non-blocking).
 */

const fs = require('fs');
const path = require('path');

const SEVEN_DAYS_MS = 7 * 86400 * 1000;

function main() {
  try {
    // Project root: 3 levels up from .claude/ink-workflows/hooks/
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const stackFile = path.join(projectRoot, '.planning', 'codebase', 'STACK.md');

    if (!fs.existsSync(stackFile)) {
      process.exit(0);
      return;
    }

    const stat = fs.statSync(stackFile);
    const age = Date.now() - stat.mtimeMs;

    if (age > SEVEN_DAYS_MS) {
      const now = new Date();
      fs.utimesSync(stackFile, now, now);
    }
  } catch {
    // Silent — non-critical hook
  }

  process.exit(0);
}

main();
