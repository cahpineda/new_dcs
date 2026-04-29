#!/usr/bin/env node
'use strict';

/**
 * PreToolUse Hook: project2context Repository Guard
 *
 * Ensures a repository is always specified before calling mcp__project2context__*
 * tools. Prevents silent failures caused by missing repo context.
 *
 * Logic:
 * 1. If tool is not mcp__project2context__* → allow
 * 2. If tool is on the exempt list (list_repositories) → allow
 * 3. If tool_input has a non-empty `repository` field → save to cache + allow
 * 4. If cache has a previously selected repo → deny with "retry using: <cached>"
 * 5. No cache → deny with instructions to call list_repositories + ask user
 *
 * Cache file: .planning/.p2c-context.json
 *
 * Input (stdin JSON): { "tool_name": "...", "tool_input": {...}, "cwd": "..." }
 * Output:
 *   - Exit 0 (no output) → allow
 *   - JSON { hookSpecificOutput: { permissionDecision: "deny", ... } } → block
 */

const fs = require('fs');
const path = require('path');

// Tools that don't need a repository parameter (discovery / index-level)
const EXEMPT_TOOLS = new Set([
  'list_repositories',
  'reindex_repository_changes',
]);

const CACHE_FILE = '.planning/.p2c-context.json';

function readCache(cwd) {
  try {
    const p = path.join(cwd, CACHE_FILE);
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      return data.selectedRepository || null;
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(cwd, repository) {
  try {
    const p = path.join(cwd, CACHE_FILE);
    const dir = path.dirname(p);
    if (fs.existsSync(dir)) {
      fs.writeFileSync(p, JSON.stringify({ selectedRepository: repository, updatedAt: new Date().toISOString() }, null, 2));
    }
  } catch { /* non-blocking */ }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }

  const toolName = input.tool_name || '';

  // Only handle project2context tools
  if (!toolName.startsWith('mcp__project2context__')) {
    process.exit(0);
  }

  const specificTool = toolName.replace('mcp__project2context__', '');

  // Exempt tools pass through without repo check
  if (EXEMPT_TOOLS.has(specificTool)) {
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();
  const toolInput = input.tool_input || {};

  // Check if repository param is already in the tool call
  const hasRepo = (
    typeof toolInput.repository === 'string' &&
    toolInput.repository.trim().length > 0
  );

  if (hasRepo) {
    // Save as selected repo for future calls in this session
    writeCache(cwd, toolInput.repository.trim());
    process.exit(0);
  }

  // No repo in tool_input — check cache
  const cachedRepo = readCache(cwd);

  if (cachedRepo) {
    deny([
      'PROJECT2CONTEXT: missing required "repository" parameter in tool call.',
      '',
      'Previously selected repository: "' + cachedRepo + '"',
      '',
      'ACTION REQUIRED: Retry this exact tool call adding:',
      '  repository: "' + cachedRepo + '"',
      '',
      'If a different repository is needed, ask the user first, then update the selection.',
    ].join('\n'));
    return;
  }

  // No cache — need to discover repos and ask the user
  deny([
    'PROJECT2CONTEXT: missing required "repository" parameter.',
    '',
    'MANDATORY STEPS — execute in order before retrying:',
    '',
    '1. Call mcp__project2context__list_repositories (no parameters needed)',
    '   This returns the list of all indexed repositories.',
    '',
    '2. Ask the user:',
    '   "Which repository do you want to query? Indexed repos: [list from step 1]"',
    '   Wait for their answer.',
    '',
    '3. Retry the original tool call with: repository: "<user selection>"',
    '',
    'Do NOT guess the repository name — use only values returned by list_repositories.',
  ].join('\n'));
}

main();
