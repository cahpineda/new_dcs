#!/usr/bin/env node

/**
 * PreToolUse Hook: Enforce ink-tools.js for .planning/ operations
 *
 * Blocks raw bash commands that directly manipulate .planning/ files,
 * redirecting to the correct ink-tools.js command.
 *
 * Input (stdin JSON from Claude Code):
 * { "tool_name": "Bash", "tool_input": { "command": "cat .planning/STATE.md" } }
 *
 * Output:
 * - Exit 0 with no output → allow
 * - Exit 0 with JSON { "decision": "block", "reason": "..." } → block
 */

const fs = require('fs');

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[enforce-ink-tools] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const command = input.tool_input?.command;
  if (!command || typeof command !== 'string') {
    process.exit(0);
  }

  // Allowlist: never block these
  if (
    command.match(/^\s*node\s+bin\/ink-tools\.js\b/) ||
    command.match(/^\s*git\b/) ||
    command.match(/^\s*npm\b/) ||
    command.match(/^\s*npx\b/)
  ) {
    process.exit(0);
  }

  // Only check commands that touch .planning/
  if (!command.includes('.planning/') && !command.includes('.planning\\')) {
    process.exit(0);
  }

  // Deny rules: pattern → redirect message
  const denyRules = [
    {
      pattern: /\b(cat|grep|sed|jq|head|tail|awk)\b.*\.planning\/STATE\.md/,
      redirect: 'node bin/ink-tools.js state snapshot  # or: state get "Field Name"'
    },
    {
      pattern: /\b(cat|grep|sed|jq|head|tail|awk)\b.*\.planning\/ROADMAP\.md/,
      redirect: 'node bin/ink-tools.js roadmap get-phase <N>  # or: phase list'
    },
    {
      pattern: /\b(ls|find)\b.*\.planning\/phases/,
      redirect: 'node bin/ink-tools.js phase list'
    },
    {
      pattern: /\b(cat|grep|jq|sed)\b.*\.planning\/config\.json/,
      redirect: 'node bin/ink-tools.js config get <key>  # or: config dump'
    },
    {
      pattern: /\b(cat|grep|sed)\b.*\.planning\/memory\/chapters/,
      redirect: 'node bin/ink-tools.js memory list-chapters  # or: memory get-chapter <name>'
    },
    {
      pattern: /\b(cat|grep|sed)\b.*\.planning\/PROJECT\.md/,
      redirect: 'node bin/ink-tools.js project list-sections  # or: project get-section "Section"'
    },
    {
      pattern: /\b(echo|cat)\b.*>.*\.planning\/(STATE\.md|config\.json)/,
      redirect: 'node bin/ink-tools.js state set "Field" "Value"  # or: config set <key> <value>'
    },
    {
      pattern: /\bmkdir\b.*\.planning\/(phases|memory)/,
      redirect: 'node bin/ink-tools.js init dirs'
    }
  ];

  for (const rule of denyRules) {
    if (rule.pattern.test(command)) {
      const result = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Use ink-tools.js instead of raw bash for .planning/ operations.\n\nBlocked: ${command.trim().substring(0, 80)}\nUse instead: ${rule.redirect}`
        }
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
  }

  // No rule matched — allow
  process.exit(0);
}

main();
