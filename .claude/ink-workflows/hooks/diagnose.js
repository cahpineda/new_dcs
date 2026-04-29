#!/usr/bin/env node

/**
 * Ink Diagnostic Report Generator
 *
 * Checks installation health, hook registration, recent errors, and environment.
 * Outputs a shareable text report for remote troubleshooting.
 *
 * Usage: node .claude/ink-workflows/hooks/diagnose.js [--json]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const JSON_MODE = process.argv.includes('--json');
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const claudeDir = path.join(projectDir, '.claude');
const hooksDir = path.join(claudeDir, 'ink-workflows', 'hooks');
const planningDir = path.join(projectDir, '.planning');
const homeDir = os.homedir();

// ── Report accumulator ──────────────────────────────────────────────────────
const sections = [];
const issues = [];

function section(title, entries) {
  sections.push({ title, entries });
}

function issue(severity, msg) {
  issues.push({ severity, msg });
}

function run(cmd, args, opts) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
    ...opts,
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    exitCode: result.status,
  };
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function readText(p) {
  try { return fs.readFileSync(p, 'utf8').trim(); } catch { return null; }
}

function ago(ms) {
  if (!ms || ms <= 0) return 'unknown';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

// ── 1. Environment ──────────────────────────────────────────────────────────
function checkEnvironment() {
  const entries = [];

  entries.push(['OS', os.platform() + ' ' + os.release()]);
  entries.push(['Arch', os.arch()]);
  entries.push(['Node.js', process.version]);
  entries.push(['Shell', process.env.SHELL || 'unknown']);
  entries.push(['CWD', projectDir]);
  entries.push(['CLAUDE_PROJECT_DIR', process.env.CLAUDE_PROJECT_DIR || '(not set)']);

  // Claude Code version
  const cc = run('claude', ['--version']);
  entries.push(['Claude Code', cc.ok ? cc.stdout.split('\n')[0] : 'not found']);

  // Git
  const git = run('git', ['--version']);
  entries.push(['Git', git.ok ? git.stdout : 'not found']);

  // User email
  const claudeJson = readJSON(path.join(homeDir, '.claude.json'));
  const email = claudeJson && claudeJson.oauthAccount && claudeJson.oauthAccount.emailAddress;
  entries.push(['User email', email || '(not found in ~/.claude.json)']);
  if (!email) issue('WARN', 'User email not found — telemetry will send userEmail: "unknown"');

  section('Environment', entries);
}

// ── 2. Installation ─────────────────────────────────────────────────────────
function checkInstallation() {
  const entries = [];

  // INK_VERSION
  const version = readText(path.join(claudeDir, 'INK_VERSION'));
  entries.push(['INK_VERSION', version || '(missing)']);
  if (!version) issue('ERROR', '.claude/INK_VERSION missing — installation may be corrupt');

  // Directory structure
  const dirs = [
    '.claude',
    '.claude/commands/ink',
    '.claude/ink-workflows',
    '.claude/ink-workflows/hooks',
    '.claude/ink-workflows/workflows',
    '.claude/agents',
  ];
  const missingDirs = dirs.filter(d => !fileExists(path.join(projectDir, d)));
  entries.push(['Directory structure', missingDirs.length === 0 ? 'OK (' + dirs.length + ' dirs)' : 'MISSING: ' + missingDirs.join(', ')]);
  if (missingDirs.length > 0) issue('ERROR', 'Missing directories: ' + missingDirs.join(', '));

  // Key files
  const keyFiles = [
    '.claude/settings.json',
    '.claude/ink-workflows/hooks/constants.js',
    '.claude/ink-workflows/hooks/audit-go-workflow.js',
    '.claude/ink-workflows/hooks/telemetry-session.js',
    '.mcp.json',
  ];
  for (const f of keyFiles) {
    const exists = fileExists(path.join(projectDir, f));
    entries.push([f, exists ? 'OK' : 'MISSING']);
    if (!exists) issue('ERROR', f + ' missing');
  }

  // bin/ink-tools.js
  const inkTools = path.join(projectDir, 'bin', 'ink-tools.js');
  if (fileExists(inkTools)) {
    const r = run('node', [inkTools, 'timestamp']);
    entries.push(['ink-tools.js', r.ok ? 'OK (v' + (version || '?') + ')' : 'ERROR: ' + r.stderr.substring(0, 80)]);
  } else {
    entries.push(['ink-tools.js', 'MISSING']);
    issue('ERROR', 'bin/ink-tools.js missing');
  }

  // .planning/ state
  entries.push(['.planning/ exists', fileExists(planningDir) ? 'yes' : 'no']);
  if (fileExists(planningDir)) {
    entries.push(['STATE.md', fileExists(path.join(planningDir, 'STATE.md')) ? 'exists' : 'missing']);
    entries.push(['PROJECT.md', fileExists(path.join(planningDir, 'PROJECT.md')) ? 'exists' : 'missing']);
    entries.push(['ROADMAP.md', fileExists(path.join(planningDir, 'ROADMAP.md')) ? 'exists' : 'missing']);
  }

  section('Installation', entries);
}

// ── 3. Hook Registration ────────────────────────────────────────────────────
function checkHooks() {
  const entries = [];
  const settings = readJSON(path.join(claudeDir, 'settings.json'));

  if (!settings) {
    entries.push(['settings.json', 'CANNOT PARSE']);
    issue('ERROR', '.claude/settings.json is missing or invalid JSON');
    section('Hook Registration', entries);
    return;
  }

  entries.push(['settings.json', 'valid JSON']);
  entries.push(['Model', settings.model || '(not set)']);

  // Check hooks object
  const hooks = settings.hooks;
  if (!hooks) {
    entries.push(['hooks', 'NOT DEFINED']);
    issue('ERROR', 'No hooks section in settings.json — hooks will not run');
    section('Hook Registration', entries);
    return;
  }

  // Expected hooks by event
  const expected = {
    SessionStart: ['check-updates.js', 'refresh-codebase-stamp.js', 'verify-planning-structure.js', 'session-start-ticket.js'],
    PreToolUse: ['enforce-ink-tools.js', 'validate-plan-structure.js'],
    PostToolUse: ['learn-from-errors.js', 'context-monitor.js', 'report-errors.js'],
    PostToolUseFailure: ['learn-from-errors.js', 'report-errors.js'],
    UserPromptSubmit: ['enforce-go-workflow.js', 'enforce-dedicated-commands.js', 'enforce-ticket.js'],
    Stop: ['audit-go-workflow.js', 'telemetry-session.js'],
    PreCompact: ['pre-compact.js'],
  };

  for (const [event, expectedHooks] of Object.entries(expected)) {
    const registered = hooks[event];
    if (!registered || !Array.isArray(registered) || registered.length === 0) {
      entries.push([event, 'NOT REGISTERED']);
      issue('ERROR', event + ' hooks not registered');
      continue;
    }

    // Extract hook filenames from registered commands
    const registeredFiles = [];
    for (const matcher of registered) {
      if (matcher.hooks && Array.isArray(matcher.hooks)) {
        for (const h of matcher.hooks) {
          const cmd = h.command || '';
          const match = cmd.match(/hooks\/([^"]+\.(?:js|sh))/);
          if (match) registeredFiles.push(match[1]);
        }
      }
    }

    const missing = expectedHooks.filter(h => !registeredFiles.some(r => r.includes(h)));
    const extra = registeredFiles.filter(r => !expectedHooks.some(h => r.includes(h)));

    if (missing.length === 0) {
      entries.push([event, 'OK (' + registeredFiles.length + ' hooks)']);
    } else {
      entries.push([event, 'MISSING: ' + missing.join(', ')]);
      issue('ERROR', event + ' missing hooks: ' + missing.join(', '));
    }
    if (extra.length > 0) {
      entries.push([event + ' (extra)', extra.join(', ')]);
    }
  }

  // Check statusLine
  if (settings.statusLine && settings.statusLine.command) {
    entries.push(['statusLine', 'configured']);
  } else {
    entries.push(['statusLine', 'NOT CONFIGURED']);
    issue('WARN', 'StatusLine not configured');
  }

  // Check settings.local.json for hook overrides
  const local = readJSON(path.join(claudeDir, 'settings.local.json'));
  if (local) {
    entries.push(['settings.local.json', 'exists']);
    if (local.hooks) {
      entries.push(['local hooks override', 'YES — may suppress project hooks']);
      issue('WARN', 'settings.local.json has hooks section — may override project hooks');
    } else {
      entries.push(['local hooks override', 'no (safe)']);
    }
  } else {
    entries.push(['settings.local.json', 'none']);
  }

  // Check global settings for hook conflicts
  const globalSettings = readJSON(path.join(homeDir, '.claude', 'settings.json'));
  if (globalSettings && globalSettings.hooks) {
    entries.push(['global hooks', 'YES — may conflict']);
    issue('WARN', '~/.claude/settings.json has hooks section — may conflict with project hooks');
  }

  section('Hook Registration', entries);
}

// ── 4. Hook File Verification ───────────────────────────────────────────────
function checkHookFiles() {
  const entries = [];
  const settings = readJSON(path.join(claudeDir, 'settings.json'));
  if (!settings || !settings.hooks) {
    entries.push(['skipped', 'no settings.json']);
    section('Hook Files', entries);
    return;
  }

  // Extract all hook file paths
  const hookFiles = new Set();
  for (const [_event, matchers] of Object.entries(settings.hooks)) {
    if (!Array.isArray(matchers)) continue;
    for (const m of matchers) {
      if (!m.hooks || !Array.isArray(m.hooks)) continue;
      for (const h of m.hooks) {
        const cmd = h.command || '';
        // Extract the file path after hooks/
        const match = cmd.match(/hooks\/([^"]+)/);
        if (match) hookFiles.add(match[1]);
      }
    }
  }

  for (const file of hookFiles) {
    const fullPath = path.join(hooksDir, file);
    if (fileExists(fullPath)) {
      entries.push([file, 'OK']);
    } else {
      entries.push([file, 'MISSING']);
      issue('ERROR', 'Hook script missing: ' + file);
    }
  }

  // Check constants.js can be loaded
  try {
    const constants = require(path.join(hooksDir, 'constants.js'));
    entries.push(['constants.js', 'OK (telemetry: ' + (constants.INK_TELEMETRY_BASE_URL || 'not set') + ')']);
  } catch (e) {
    entries.push(['constants.js', 'LOAD ERROR: ' + e.message]);
    issue('ERROR', 'constants.js cannot be loaded: ' + e.message);
  }

  section('Hook Files', entries);
}

// ── 5. Stop Hook Dry-Run ────────────────────────────────────────────────────
function checkStopHooks() {
  const entries = [];

  const mockInput = {
    transcript_path: '/dev/null',
    stop_hook_active: false,
    session_id: 'diag-dry-run',
    cwd: projectDir,
  };

  // Test audit hook
  const auditPath = path.join(hooksDir, 'audit-go-workflow.js');
  if (fileExists(auditPath)) {
    const r = spawnSync('node', [auditPath], {
      input: JSON.stringify(mockInput),
      encoding: 'utf8',
      timeout: 5000,
    });
    const exitOk = r.status === 0;
    const hasStdout = (r.stdout || '').trim().length > 0;
    const hasStderr = (r.stderr || '').trim().length > 0;
    entries.push(['audit-go-workflow.js', exitOk ? 'OK (exit 0' + (hasStdout ? ', has output' : ', silent') + ')' : 'FAILED (exit ' + r.status + ')']);
    if (hasStderr) entries.push(['  stderr', r.stderr.trim().substring(0, 200)]);
    if (!exitOk) issue('ERROR', 'audit-go-workflow.js dry-run failed');
  } else {
    entries.push(['audit-go-workflow.js', 'MISSING']);
  }

  // Test telemetry hook
  const telemetryPath = path.join(hooksDir, 'telemetry-session.js');
  if (fileExists(telemetryPath)) {
    const r = spawnSync('node', [telemetryPath], {
      input: JSON.stringify(mockInput),
      encoding: 'utf8',
      timeout: 10000,
    });
    const exitOk = r.status === 0;
    const hasStderr = (r.stderr || '').trim().length > 0;
    entries.push(['telemetry-session.js', exitOk ? 'OK (exit 0)' : 'FAILED (exit ' + r.status + ')']);
    if (hasStderr) entries.push(['  stderr', r.stderr.trim().substring(0, 200)]);
    if (!exitOk) issue('ERROR', 'telemetry-session.js dry-run failed');
  } else {
    entries.push(['telemetry-session.js', 'MISSING']);
  }

  section('Stop Hook Dry-Run', entries);
}

// ── 6. Update Status ────────────────────────────────────────────────────────
function checkUpdateStatus() {
  const entries = [];

  const cache = readJSON(path.join(homeDir, '.ink-update-check.json'));
  if (cache) {
    entries.push(['Last check', ago(Date.now() - cache.timestamp)]);
    entries.push(['Local version', cache.localVersion || '?']);
    entries.push(['Latest version', cache.latestVersion || '?']);
    entries.push(['Update available', cache.updateAvailable ? 'YES' : 'no']);
    if (cache.updateAvailable) issue('WARN', 'Update available: v' + cache.latestVersion);
  } else {
    entries.push(['Update cache', 'none (never checked or cache expired)']);
  }

  const notify = readJSON(path.join(homeDir, '.ink-update-notify.json'));
  if (notify) {
    entries.push(['Last notification', notify.status + ' v' + notify.version + ' (' + ago(Date.now() - notify.timestamp) + ')']);
  }

  section('Update Status', entries);
}

// ── 7. MCP Configuration ────────────────────────────────────────────────────
function checkMCP() {
  const entries = [];
  const mcp = readJSON(path.join(projectDir, '.mcp.json'));

  if (!mcp) {
    entries.push(['.mcp.json', 'MISSING or invalid']);
    issue('WARN', '.mcp.json missing — MCP servers not configured');
    section('MCP Configuration', entries);
    return;
  }

  const servers = mcp.mcpServers || {};
  entries.push(['Servers configured', Object.keys(servers).length.toString()]);

  for (const [name, config] of Object.entries(servers)) {
    const type = config.type || config.transport || 'unknown';
    let url = config.url || (config.args && config.args.join(' ')) || '';
    // Redact API keys and tokens from URLs
    url = url.replace(/[?&](api_key|token|key|secret)=[^&\s]+/gi, '?$1=[REDACTED]');
    entries.push([name, type + (url ? ' → ' + url.substring(0, 60) : '')]);
  }

  section('MCP Configuration', entries);
}

// ── 8. Recent Errors ────────────────────────────────────────────────────────
function checkRecentErrors() {
  const entries = [];

  // ink-tools-errors.jsonl
  const errorsFile = path.join(planningDir, 'ink-tools-errors.jsonl');
  if (fileExists(errorsFile)) {
    try {
      const lines = fs.readFileSync(errorsFile, 'utf8').split('\n').filter(Boolean);
      const recent = lines.slice(-10).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);

      entries.push(['ink-tools errors', lines.length + ' total, showing last ' + recent.length]);
      for (const err of recent) {
        const ts = err.timestamp ? err.timestamp.substring(0, 19) : '?';
        entries.push(['  ' + ts, (err.command || '?') + ' → ' + (err.error || '').substring(0, 100)]);
      }
    } catch {
      entries.push(['ink-tools errors', 'cannot read']);
    }
  } else {
    entries.push(['ink-tools errors', 'none (no error log file)']);
  }

  // Recent transcript hook errors (check last 3 transcripts)
  const transcriptsDir = path.join(homeDir, '.claude', 'projects');
  // Find project-specific transcript directory
  const encodedCwd = projectDir.replace(/\//g, '-').replace(/ /g, '-');
  const projectTranscriptsDir = path.join(transcriptsDir, encodedCwd);

  if (fileExists(projectTranscriptsDir)) {
    try {
      const jsonlFiles = fs.readdirSync(projectTranscriptsDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => ({
          name: f,
          mtime: fs.statSync(path.join(projectTranscriptsDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 3);

      entries.push(['Recent transcripts', jsonlFiles.length + ' found (checking last 3 for hook errors)']);

      let hookErrors = 0;
      for (const file of jsonlFiles) {
        const content = readText(path.join(projectTranscriptsDir, file.name));
        if (!content) continue;

        // Search for hook error patterns — count occurrences
        const errorCounts = [
          { label: 'Stop hook error', pat: /Stop hook error/gi },
          { label: 'WORKFLOW VIOLATION', pat: /WORKFLOW VIOLATION/gi },
          { label: 'STATE VIOLATION', pat: /STATE VIOLATION/gi },
          { label: 'stdin parse failed', pat: /stdin parse failed/gi },
          { label: 'PreToolUse denied', pat: /Hook PreToolUse[^\n]*denied/gi },
        ];

        const fileErrors = [];
        for (const { label, pat } of errorCounts) {
          const matches = content.match(pat);
          if (matches) fileErrors.push(label + ' (x' + matches.length + ')');
        }

        if (fileErrors.length > 0) {
          entries.push(['  ' + file.name.substring(0, 12) + '...', fileErrors.join(', ')]);
          hookErrors += fileErrors.length;
        }
      }

      if (hookErrors === 0) {
        entries.push(['Hook errors in transcripts', 'none found']);
      } else {
        entries.push(['Hook errors in transcripts', hookErrors + ' found']);
        issue('WARN', hookErrors + ' hook errors found in recent transcripts');
      }
    } catch (e) {
      entries.push(['Transcripts', 'cannot read: ' + e.message]);
    }
  } else {
    entries.push(['Transcripts dir', 'not found at ' + projectTranscriptsDir]);
  }

  section('Recent Errors', entries);
}

// ── 9. State Summary ────────────────────────────────────────────────────────
function checkState() {
  const entries = [];

  const state = readText(path.join(planningDir, 'STATE.md'));
  if (!state) {
    entries.push(['STATE.md', 'not found']);
    section('Current State', entries);
    return;
  }

  // Extract key fields
  const fieldPatterns = [
    ['CurrentTicket', /CurrentTicket[:\s|]+([^\s|]+)/],
    ['Status', /^\|\s*Status\s*\|\s*([^|]+)/m],
    ['Current Phase', /Current\s*Phase[:\s|]+([^\n|]+)/],
    ['Current Plan', /Current\s*Plan[:\s|]+([^\n|]+)/],
  ];

  for (const [label, regex] of fieldPatterns) {
    const match = state.match(regex);
    entries.push([label, match ? match[1].trim() : '(not set)']);
  }

  section('Current State', entries);
}

// ── Run all checks ──────────────────────────────────────────────────────────
checkEnvironment();
checkInstallation();
checkHooks();
checkHookFiles();
checkStopHooks();
checkUpdateStatus();
checkMCP();
checkRecentErrors();
checkState();

// ── Output ──────────────────────────────────────────────────────────────────
if (JSON_MODE) {
  const report = { timestamp: new Date().toISOString(), sections, issues };
  process.stdout.write(JSON.stringify(report, null, 2));
} else {
  const LINE = '─'.repeat(60);
  const version = readText(path.join(claudeDir, 'INK_VERSION')) || '?';

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         INK DIAGNOSTIC REPORT  v' + version.padEnd(27) + '║');
  console.log('║         ' + new Date().toISOString().padEnd(49) + '║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  for (const sec of sections) {
    console.log('');
    console.log('┌' + LINE + '┐');
    console.log('│ ' + sec.title.padEnd(58) + ' │');
    console.log('└' + LINE + '┘');
    for (const [key, value] of sec.entries) {
      const k = key.length > 28 ? key.substring(0, 27) + '…' : key;
      const v = String(value);
      if (v.length > 60) {
        console.log('  ' + k.padEnd(30) + v.substring(0, 60));
        // Wrap long values
        for (let i = 60; i < v.length; i += 60) {
          console.log('  ' + ''.padEnd(30) + v.substring(i, i + 60));
        }
      } else {
        console.log('  ' + k.padEnd(30) + v);
      }
    }
  }

  if (issues.length > 0) {
    console.log('');
    console.log('┌' + LINE + '┐');
    console.log('│ ⚠ ISSUES FOUND (' + issues.length + ')'.padEnd(55) + '│');
    console.log('└' + LINE + '┘');
    for (const iss of issues) {
      const icon = iss.severity === 'ERROR' ? '✗' : '!';
      console.log('  [' + iss.severity + '] ' + icon + ' ' + iss.msg);
    }
  } else {
    console.log('');
    console.log('  ✓ No issues found — installation looks healthy');
  }

  console.log('');
  console.log(LINE);
  console.log('Share this report with the Ink team for troubleshooting.');
  console.log(LINE);
  console.log('');
}
