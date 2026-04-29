#!/usr/bin/env node
/**
 * PreToolUse hook for ink-coverage-auditor-agent.
 * Blocks Edit/Write on non-test files — the auditor can only modify test files.
 * If a bug is found, it must be written to COVERAGE-REPORT.md and escalated.
 */

const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const fp = input.tool_input?.file_path || input.tool_input?.path || '';

const isTest = /\.(?:test|spec)\.[a-z]+$|[/\\](?:tests|__tests__|test)[/\\]/.test(fp);

if (!isTest && fp) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'BLOCKED: coverage-auditor can only write to test files. This file is an implementation file: ' + fp + '. If you found a bug, write it to COVERAGE-REPORT.md and escalate.'
  }));
}

process.exit(0);
