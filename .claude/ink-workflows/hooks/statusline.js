#!/usr/bin/env node

/**
 * Statusline Hook
 *
 * Reads hook input from stdin (JSON) and outputs statusline text to stdout.
 *
 * Input format (from Claude Code):
 * {
 *   "model": {
 *     "display_name": "Sonnet 4.5",
 *     "id": "claude-sonnet-4-5-20250929"
 *   },
 *   "context_window": {
 *     "used_percentage": 50,
 *     "used_tokens": 100000,
 *     "total_tokens": 200000
 *   },
 *   "workspace": {
 *     "project_dir": "/path/to/project"
 *   }
 * }
 *
 * Output: [Ink] [Phase X: Name] [Plan Y/Z] [context: bar %] [Update: vX.Y.Z]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Render context usage bar with ANSI color codes
 */
function renderBar(percent, width = 10) {
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const ORANGE = '\x1b[38;5;208m';  // 256-color orange
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';
  const DIM = '\x1b[2m';

  const filled = Math.floor(percent / 100 * width);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);

  let color = GREEN;
  if (percent >= 95) color = RED;
  else if (percent >= 80) color = ORANGE;
  else if (percent >= 50) color = YELLOW;

  return `${color}${bar}${RESET} ${DIM}${percent}%${RESET}`;
}

/**
 * Read ink-agent-dev-helper version from .claude/INK_VERSION (written by installer)
 * Falls back to package.json for dev repo context
 */
function getInkVersion(projectDir) {
  try {
    // Primary: .claude/INK_VERSION (present in all installed projects)
    const inkVersionPath = path.join(projectDir, '.claude', 'INK_VERSION');
    if (fs.existsSync(inkVersionPath)) {
      const v = fs.readFileSync(inkVersionPath, 'utf8').trim();
      if (v && /^\d+\.\d+\.\d+/.test(v)) return v;
    }
    // Fallback: package.json (dev repo only)
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name === 'ink-agent-dev-helper') return pkg.version || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse STATE.md for phase and plan info
 */
function parseState(projectDir) {
  try {
    const statePath = path.join(projectDir, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) {
      return null;
    }

    const content = fs.readFileSync(statePath, 'utf8');

    // Extract phase: "Phase: N — Name" or "Phase: X of Y (Name)"
    const phaseMatch = content.match(/Phase:\s*(\d+)\s*(?:—\s*(.+)|of\s*\d+\s*\(([^)]+)\))/m);
    const phaseNum = phaseMatch ? phaseMatch[1] : null;
    const phaseName = phaseMatch ? (phaseMatch[2] || phaseMatch[3] || '').trim() : null;

    // Extract plan: "Plan: X/Y" or "Plan: X of Y"
    const planMatch = content.match(/Plan:\s*(\d+)\s*[\/of]+\s*(\d+)/);
    const currentPlan = planMatch ? planMatch[1] : null;
    const totalPlans = planMatch ? planMatch[2] : null;

    if (!phaseNum && !currentPlan) {
      return null;
    }

    return {
      phase: phaseNum,
      phaseName: phaseName,
      currentPlan: currentPlan,
      totalPlans: totalPlans
    };
  } catch (err) {
    // Silent fail - gracefully degrade to model-only display
    return null;
  }
}

/**
 * Check for update notification
 * Returns { version, status } where status is 'updated' or 'available', or null
 */
function checkUpdateNotification() {
  try {
    const updateFile = path.join(os.homedir(), '.ink-update-notify.json');
    if (!fs.existsSync(updateFile)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(updateFile, 'utf8'));

    // Only show if notification is fresh (< 24 hours)
    if (data.version && data.timestamp) {
      const age = Date.now() - data.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (age < maxAge) {
        return { version: data.version, status: data.status || 'available' };
      }
    }

    return null;
  } catch (err) {
    // Silent fail
    return null;
  }
}

/**
 * Main execution
 */
function main() {
  try {
    // Read stdin synchronously (faster for small input)
    const input = fs.readFileSync(0, 'utf8');

    // Parse hook data
    let hookData = {};
    try {
      hookData = JSON.parse(input);
    } catch (err) {
      // If parse fails, use empty object (graceful degradation)
    }

    // Extract data with defaults
    const modelName = hookData.model?.display_name || 'Claude';
    const contextPercent = hookData.context_window?.used_percentage || 0;
    const projectDir = hookData.workspace?.project_dir || null;

    // Build statusline parts
    const inkVersion = projectDir ? getInkVersion(projectDir) : null;
    const inkLabel = inkVersion ? `[Ink v${inkVersion}]` : '[Ink]';
    const parts = [inkLabel];

    // Add phase/plan info if available
    if (projectDir) {
      const state = parseState(projectDir);
      if (state) {
        // Format: [Phase X: Name] [Plan Y/Z]
        if (state.phase && state.phaseName) {
          parts.push(`[Phase ${state.phase}: ${state.phaseName}]`);
        } else if (state.phase) {
          parts.push(`[Phase ${state.phase}]`);
        }

        if (state.currentPlan && state.totalPlans) {
          parts.push(`[Plan ${state.currentPlan}/${state.totalPlans}]`);
        }
      } else {
        // No STATE.md found - show model only
        parts.push(`[${modelName}]`);
      }
    } else {
      // No project dir - show model only
      parts.push(`[${modelName}]`);
    }

    // Add context bar with optional token count
    const contextBar = renderBar(contextPercent);
    const usedTokens = hookData.context_window?.used_tokens;
    const tokenSuffix = usedTokens ? ` ~${Math.round(usedTokens / 1000)}k` : '';
    parts.push(`[context: ${contextBar}${tokenSuffix}]`);

    // Check for updates
    const updateInfo = checkUpdateNotification();
    if (updateInfo) {
      const CYAN = '\x1b[36m';
      const GREEN = '\x1b[32m';
      const RESET = '\x1b[0m';
      if (updateInfo.status === 'updated') {
        parts.push(`${GREEN}[Updated to v${updateInfo.version}]${RESET}`);
      } else {
        parts.push(`${CYAN}[Update failed: v${updateInfo.version}]${RESET}`);
      }
    }

    // Output single line
    process.stdout.write(parts.join(' '));
    process.exit(0);

  } catch (error) {
    // Fatal error - still exit 0 to avoid blocking Claude
    process.stderr.write(`Statusline error: ${error.message}\n`);
    process.exit(0);
  }
}

main();
