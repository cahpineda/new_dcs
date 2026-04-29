#!/usr/bin/env node

/**
 * SessionStart Hook: Verify .planning/ structure
 *
 * Runs on every session start. Checks that all required base documents
 * and directories exist in .planning/. Reports missing items via
 * additionalContext so Claude can create them before any work begins.
 *
 * Required structure:
 *   .planning/
 *   .planning/phases/
 *   .planning/memory/
 *   .planning/memory/chapters/
 *   .planning/PROJECT.md
 *   .planning/ROADMAP.md
 *   .planning/STATE.md
 *   .planning/memory/INDEX.md
 *   .planning/config.json
 */

const fs = require('fs');
const path = require('path');

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[verify-planning-structure] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();
  const planningDir = path.join(cwd, '.planning');

  const requiredDirs = [
    '.planning',
    '.planning/phases',
    '.planning/memory',
    '.planning/memory/chapters',
  ];

  const requiredFiles = [
    { path: '.planning/PROJECT.md', description: 'Project definition', createWith: 'new-project.md' },
    { path: '.planning/ROADMAP.md', description: 'Phase roadmap', createWith: 'create-roadmap.md' },
    { path: '.planning/STATE.md', description: 'Session state tracking', createWith: 'new-project.md' },
    { path: '.planning/memory/INDEX.md', description: 'Memory chapter index', createWith: 'memory bootstrap' },
    { path: '.planning/config.json', description: 'Model profiles and feature toggles', createWith: 'new-project.md' },
  ];

  const missingDirs = [];
  const missingFiles = [];

  for (const dir of requiredDirs) {
    const fullPath = path.join(cwd, dir);
    if (!fs.existsSync(fullPath)) {
      missingDirs.push(dir);
    }
  }

  for (const file of requiredFiles) {
    const fullPath = path.join(cwd, file.path);
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(file);
    }
  }

  // Nothing missing — silent pass
  if (missingDirs.length === 0 && missingFiles.length === 0) {
    process.exit(0);
  }

  // Build report
  const lines = [
    'PLANNING STRUCTURE INCOMPLETE — Required base documents/directories are missing.',
    '',
  ];

  if (missingDirs.length > 0) {
    lines.push('Missing directories:');
    for (const dir of missingDirs) {
      lines.push('  - ' + dir);
    }
    lines.push('');
  }

  if (missingFiles.length > 0) {
    lines.push('Missing files:');
    for (const file of missingFiles) {
      lines.push('  - ' + file.path + ' (' + file.description + ') — create via: ' + file.createWith);
    }
    lines.push('');
  }

  // If .planning/ itself doesn't exist, this is a fresh project
  if (missingDirs.includes('.planning')) {
    lines.push(
      'This appears to be a fresh project. Run `/ink:go` or `/ink:new` to initialize the project structure.',
      'All work must flow through .planning/ — do NOT create loose plans or state files outside it.'
    );
  } else {
    lines.push(
      'Create missing directories with: node bin/ink-tools.js init dirs',
      'Then create missing files using the indicated workflows.',
      'Do NOT proceed with any work until the .planning/ structure is complete.'
    );
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: lines.join('\n'),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
