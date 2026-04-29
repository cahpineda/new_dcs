#!/usr/bin/env node

/**
 * PreToolUse Hook: Validate PLAN.md Structure
 *
 * Blocks Write calls to PLAN.md files that lack required frontmatter fields or XML structure tags.
 * Forces agents to use `node bin/ink-tools.js template fill phase-prompt` before writing PLAN.md files.
 *
 * Input (stdin JSON from Claude Code):
 * { "tool_name": "Write", "tool_input": { "file_path": "...", "content": "..." } }
 *
 * Output:
 * - Exit 0 with no output → allow (file is valid or not a PLAN.md)
 * - Exit 0 with JSON { "decision": "block", "reason": "..." } → block write
 */

const fs = require('fs');

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[validate-plan-structure] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const toolName = input.tool_name;
  const filePath = input.tool_input?.file_path || '';
  const content = input.tool_input?.content || '';

  // Only check Write tool calls to PLAN.md files
  if (toolName !== 'Write') {
    process.exit(0);
  }

  // Only validate files matching .planning/phases/*/XX-NN-PLAN.md pattern
  if (!filePath.match(/\.planning\/phases\/.+-PLAN\.md$/)) {
    process.exit(0);
  }

  // Extract frontmatter (content between --- delimiters)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

  // Check required frontmatter fields
  const requiredFields = ['phase', 'plan', 'type', 'depends_on', 'files_modified'];
  const missingFields = [];

  for (const field of requiredFields) {
    // Match field name followed by colon (YAML format)
    if (!frontmatter.match(new RegExp(`^\\s*${field}\\s*:`, 'm'))) {
      missingFields.push(field);
    }
  }

  // Check required XML tags
  const requiredTags = [
    'objective',
    'context',
    'tasks',
    'verification',
    'success_criteria',
    'output'
  ];
  const missingTags = [];

  for (const tag of requiredTags) {
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    if (!content.includes(openTag) || !content.includes(closeTag)) {
      missingTags.push(tag);
    }
  }

  // If any required element is missing, block the write
  if (missingFields.length > 0 || missingTags.length > 0) {
    const missing = [...missingFields, ...missingTags];
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `PLAN.md structure incomplete. Use: node bin/ink-tools.js template fill phase-prompt --vars '{"PHASE":"XX-name","PLAN":"NN"}' --out ${filePath} first. Missing: ${missing.join(', ')}`
      }
    }));
    process.exit(0);
  }

  // All required elements present — allow the write
  process.exit(0);
}

main();
