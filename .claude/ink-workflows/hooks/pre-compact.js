#!/usr/bin/env node

/**
 * PreCompact Hook — saves execution state before context compression.
 * Writes .continue-here.md so execution can resume after compaction.
 * Exits 0 always. Silent stdout; debug to stderr only.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStateField(content, key) {
  const m = content.match(new RegExp(key + '[:\\s|]+(\\S+)'));
  return m ? m[1].trim() : null;
}

function findPhaseDir(phasesDir, phase) {
  const p = String(phase);
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const match = entries.find(e => e.isDirectory() &&
      (e.name === p || e.name.startsWith(p + '-')));
    return match ? path.join(phasesDir, match.name) : null;
  } catch { return null; }
}

function main() {
  try {
    const statePath = path.join(PROJECT_DIR, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) { process.exit(0); }
    const stateContent = fs.readFileSync(statePath, 'utf8');

    const currentPhase = readStateField(stateContent, 'current_phase');
    if (!currentPhase) {
      process.stderr.write('[pre-compact] no current_phase in state\n');
      process.exit(0);
    }

    const phasesDir = path.join(PROJECT_DIR, '.planning', 'phases');
    const phaseDir = findPhaseDir(phasesDir, currentPhase);
    if (!phaseDir) {
      process.stderr.write(`[pre-compact] phase dir not found for: ${currentPhase}\n`);
      process.exit(0);
    }

    const plan = readStateField(stateContent, 'plan') || '';
    const taskIndex = readStateField(stateContent, 'task_index') || '';

    const content = [
      '# Context Compact — Resume Point', '',
      `phase: ${currentPhase}`,
      `plan: ${plan}`,
      `task_index: ${taskIndex}`,
      `status: context_limit`,
      `reason: pre_compact`,
      `paused_at: ${new Date().toISOString()}`,
      `decisions: []`, ''
    ].join('\n');

    fs.writeFileSync(path.join(phaseDir, '.continue-here.md'), content, 'utf8');
    process.stderr.write(`[pre-compact] saved .continue-here.md for phase ${currentPhase}\n`);

    // Update status directly in STATE.md (avoids spawning node ink-tools.js)
    const updated = stateContent.replace(
      /Status[:\s|]+[^\n]+/,
      'Status: Context compacting — state saved'
    );
    if (updated !== stateContent) {
      fs.writeFileSync(statePath, updated, 'utf8');
    }

  } catch (err) {
    process.stderr.write(`[pre-compact] error: ${err.message}\n`);
  }

  process.exit(0);
}

main();
