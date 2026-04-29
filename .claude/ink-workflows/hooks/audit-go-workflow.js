#!/usr/bin/env node

/**
 * Stop Hook: Audit /ink:go AND dedicated command workflow compliance
 *
 * Fires on every Stop event. Performs TWO checks:
 * 1. Transcript audit: verifies route dispatch was called
 * 2. State audit: verifies foundation files actually exist (if intent required them)
 *
 * Covers both /ink:go AND /ink:(fix|new|research|plan|verify|execute|status|investigate)
 *
 * Input (stdin JSON): { "transcript_path": "...", "stop_hook_active": bool, "cwd": "..." }
 * Output: { "decision": "block", "reason": "..." } or nothing (allow stop)
 */

const fs = require('fs');
const path = require('path');

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[audit-go-workflow] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  // Prevent infinite loop: if stop hook already active, allow
  if (input.stop_hook_active === true) {
    process.exit(0);
  }

  const transcriptPath = input.transcript_path;
  if (!transcriptPath || typeof transcriptPath !== 'string') {
    process.exit(0);
  }

  // Read full transcript for session-wide checks
  let allLines = [];
  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    allLines = content.split('\n').filter(Boolean);
  } catch (e) {
    process.stderr.write('[audit-go-workflow] transcript read failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  // /ink:onboard is exempt — it references /ink:go in its narration but doesn't run the workflow
  const hasInkOnboard = allLines.some(line => /\bink[:-]onboard\b/i.test(line));
  if (hasInkOnboard) {
    process.exit(0);
  }

  // Check if any ink workflow command was invoked (match both colon and hyphen formats)
  // Word boundaries prevent false positives from "link-go", "ink-google", "ink-good", etc.
  const hasInkGo = allLines.some(line => /\bink[:-]go\b/i.test(line));
  const hasInkDedicated = allLines.some(line => /\bink[:-](fix|new|research|plan|verify|execute|status|investigate)\b/i.test(line));

  if (!hasInkGo && !hasInkDedicated) {
    // Not an ink workflow session — allow stop
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();

  // Check if route dispatch was called
  const hasRouteDispatch = allLines.some(line => /route\s+dispatch/i.test(line));

  // Check if dispatch returned blocked=true
  // NOTE: Weak filename-pattern checking (e.g. new-project.md appearing in transcript) was
  // removed — it does not confirm PROJECT.md was written to disk. The authoritative check
  // is the STATE AUDIT filesystem check below (fs.existsSync).
  // Match both raw JSON ("blocked":true) and JSONL-escaped (\"blocked\":true) forms
  const hasBlocked = allLines.some(line =>
    (/"blocked"\s*:\s*true/.test(line) || /\\"blocked\\"\s*:\s*true/.test(line)) &&
    /intent|missing|foundation/i.test(line)
  );

  const commandName = hasInkGo ? '/ink:go' : '/ink:dedicated';
  if (!hasRouteDispatch) {
    const result = {
      decision: 'block',
      reason: `WORKFLOW VIOLATION: ${commandName} was invoked but you did NOT call \`node bin/ink-tools.js route dispatch\`. This is mandatory. Run: node bin/ink-tools.js route dispatch --intent <intent> --keywords "<keywords>" --resolve`
    };
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Check if warnings were present but ignored
  const hasWarnings = allLines.some(line => /"warnings"\s*:\s*\[/.test(line) && /"type"/.test(line));
  const hasWarningHandled = !hasWarnings || allLines.some(line =>
    /map-codebase\.md|MODELS\.md|ARCHITECTURE\.md|Addressing warning/i.test(line)
  );
  if (hasWarnings && !hasWarningHandled) {
    const result = {
      decision: 'block',
      reason: 'WORKFLOW VIOLATION: dispatch returned warnings but you did not address them. Warnings are MANDATORY — read the "fix" field of each warning and execute the required action.'
    };
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Check if dispatch returned memory_chapters and they were loaded
  const hasMemoryChapters = allLines.some(line => /"memory_chapters"\s*:\s*\[/.test(line) && !/\[\s*\]/.test(line.match(/"memory_chapters"\s*:\s*\[[^\]]*\]/)?.[0] || '[]'));
  const hasSkipMemory = allLines.some(line => /"skip_memory"\s*:\s*true/.test(line));
  const hasMemoryLoaded = allLines.some(line => /memory\s+get-chapter/i.test(line));

  if (hasMemoryChapters && !hasSkipMemory && !hasMemoryLoaded) {
    const result = {
      decision: 'block',
      reason: 'WORKFLOW VIOLATION: dispatch returned memory_chapters but you did not load them. For each chapter in memory_chapters, run: node bin/ink-tools.js memory get-chapter {CHAPTER_NAME}'
    };
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // ── STATE AUDIT: verify real files exist ──
  const planningDir = path.join(cwd, '.planning');

  // Detect if the dispatched intent required foundation
  // MUST match FOUNDATION_REQUIRED_INTENTS in ink-tools.js
  const foundationIntents = /--intent\s+(new_work|fix|plan|plan_post_debug|verify|investigate|progress|add_phase|insert_phase|remove_phase|research|discuss_phase|execute_phase|assumptions|new_milestone|complete_milestone|plan_fix|plan_gaps|map_codebase|diagnose|audit_milestone|validate|cleanup|continue|coverage_audit)/i;
  // Use allLines (full transcript) so long sessions (>300 lines) still detect the intent
  const intentMatch = allLines.find(line => foundationIntents.test(line));

  if (intentMatch) {
    // Skip foundation check if dispatch was already blocked — the workflow never ran
    if (hasBlocked) {
      process.exit(0);
    }

    // Skip foundation check if .planning/ directory doesn't exist at all —
    // this project has never been initialized with ink workflows (e.g. the dev repo itself)
    if (!fs.existsSync(planningDir)) {
      process.exit(0);
    }

    const violations = [];

    if (!fs.existsSync(path.join(planningDir, 'PROJECT.md'))) {
      violations.push('.planning/PROJECT.md does not exist');
    }
    if (!fs.existsSync(path.join(planningDir, 'ROADMAP.md'))) {
      violations.push('.planning/ROADMAP.md does not exist');
    }

    if (violations.length > 0) {
      const result = {
        decision: 'block',
        reason: `STATE VIOLATION: The dispatched intent requires foundation but these files are missing:\n- ${violations.join('\n- ')}\n\nYou MUST create these before completing. Run the appropriate commands-internal workflow (new-project.md, create-roadmap.md) to create them.`
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
  }

  // Soft check: if files were created/modified, suggest memory update
  const hasFileChanges = allLines.some(line => /\bCreated\b.*\.(ts|js|py|go|rs|md)\b|\bModified\b.*\.(ts|js|py|go|rs|md)\b/i.test(line));
  const hasMemoryUpdate = allLines.some(line => /memory\s+update-from-diff/i.test(line));

  // This is advisory only — don't block, just log to stderr
  if (hasFileChanges && !hasMemoryUpdate) {
    process.stderr.write('MEMORY ADVISORY: Files were modified but memory was not updated. Consider running: node bin/ink-tools.js memory update-from-diff\n');
  }

  // All checks passed — allow stop
  process.exit(0);
}

main();
