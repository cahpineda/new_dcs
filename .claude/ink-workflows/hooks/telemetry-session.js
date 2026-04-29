#!/usr/bin/env node

/**
 * Stop Hook: Session telemetry — tokens, active time, Jira ticket, user intents, images
 *
 * Fires on every Stop event. Never blocks.
 * Parses transcript JSONL, sums token usage, calculates real AI active time,
 * extracts user intents and image count, and POSTs to INK_TELEMETRY_URL if configured.
 * Sends telemetry regardless of ticket presence to avoid gaps in tracking.
 *
 * Input (stdin JSON): { "transcript_path": "...", "stop_hook_active": bool, "cwd": "..." }
 * Output: nothing (always allows stop)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { INK_TELEMETRY_BASE_URL } = require('./constants');

function readCurrentTicket(cwd) {
  try {
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) return null;
    const content = fs.readFileSync(statePath, 'utf8');
    const match = content.match(/CurrentTicket[:\s|]+([A-Z]+-\d+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function readInkVersion() {
  try {
    const versionPath = path.join(__dirname, '../../INK_VERSION');
    return fs.readFileSync(versionPath, 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function readUserEmail() {
  try {
    const claudeJson = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
    return claudeJson && claudeJson.oauthAccount && claudeJson.oauthAccount.emailAddress
      ? claudeJson.oauthAccount.emailAddress
      : null;
  } catch {
    return null;
  }
}

/**
 * Sanitize credentials from text before sending to telemetry.
 */
function sanitizeCredentials(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/gi, 'Authorization: Basic [REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [REDACTED]')
    .replace(/"jiraApiToken"\s*:\s*"[^"]+"/g, '"jiraApiToken":"[REDACTED]"')
    .replace(/"jiraUsername"\s*:\s*"[^"]+"/g, '"jiraUsername":"[REDACTED]"')
    .replace(/"accessToken"\s*:\s*"[^"]+"/g, '"accessToken":"[REDACTED]"')
    .replace(/CREDS[=:]\s*\{[^}]+\}/g, 'CREDS=[REDACTED]')
    .replace(/[A-Za-z0-9._%+\-]+@inkaviation\.com/g, '[REDACTED]@inkaviation.com')
    .replace(/ATATT[A-Za-z0-9_\-+/=]+/g, '[REDACTED_TOKEN]');
}

function isToolResultMessage(msg) {
  if (!msg || msg.role !== 'user') return false;
  const content = msg.content;
  if (!Array.isArray(content)) return false;
  return content.some(function(c) { return c.type === 'tool_result'; });
}

function parseTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d.getTime();
}

async function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[telemetry] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  // Allow re-fires after audit block — server deduplicates via atomic upsert

  const cwd = input.cwd || path.resolve(__dirname, '..', '..', '..');
  const ticket = readCurrentTicket(cwd);

  // Read transcript JSONL
  const transcriptPath = input.transcript_path;
  let entries = [];
  if (transcriptPath && typeof transcriptPath === 'string') {
    try {
      const rawLines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
      entries = rawLines.map(function(line) {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
    } catch {
      // Can't read transcript — continue with empty entries, still allow stop
    }
  }

  // Extract session metadata — skip non-message entries (e.g. file-history-snapshot)
  // that appear at the start of the transcript and lack sessionId/gitBranch
  var metaEntry = null;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].sessionId) { metaEntry = entries[i]; break; }
  }
  const first = metaEntry || entries[0] || {};
  const last = entries[entries.length - 1] || {};
  const sessionId = first.sessionId || input.session_id || null;
  const sessionStart = first.timestamp || null;
  const sessionEnd = last.timestamp || null;
  const gitBranch = first.gitBranch || null;
  const transcriptCwd = first.cwd || cwd;
  // Prefer git remote origin URL (like post-commit does) over folder name
  let repository = path.basename(transcriptCwd);
  try {
    const remote = execSync('git config --get remote.origin.url', {
      cwd: transcriptCwd,
      timeout: 3000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString().trim();
    if (remote) repository = remote;
  } catch { /* no git remote — keep folder name as fallback */ }

  // Sum token usage from assistant messages (isSidechain=false only)
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheCreationTokens = 0;
  let cacheReadTokens = 0;
  let model = null;

  for (const entry of entries) {
    if (entry.isSidechain === true) continue;
    const msg = entry.message;
    if (!msg || msg.role !== 'assistant') continue;
    const usage = msg.usage;
    if (!usage) continue;
    inputTokens += usage.input_tokens || 0;
    outputTokens += usage.output_tokens || 0;
    cacheCreationTokens += usage.cache_creation_input_tokens || 0;
    cacheReadTokens += usage.cache_read_input_tokens || 0;
    if (!model && msg.model) model = msg.model;
  }

  // ── Intent noise filters (skip system-injected / non-human messages) ──
  const NOISE_PREFIXES = [
    'Base directory for this skill:',
    'Stop hook feedback:',
    'INFO:', 'DEBUG:', 'WARNING:', 'ERROR:',
    'This session is being continued',
  ];
  const NOISE_PATTERNS = [
    /^<local-command/,
    /^\d{4}-\d{2}-\d{2}T\d{2}/,
    /^[a-f0-9]{16,}\s+toolu_/,
    /^\/private\/tmp\//,
    /toolu_[A-Za-z0-9]{10,}/,
  ];

  function isNoise(text) {
    if (NOISE_PREFIXES.some(function(p) { return text.startsWith(p); })) return true;
    if (NOISE_PATTERNS.some(function(r) { return r.test(text); })) return true;
    return false;
  }

  // Extract user intents (with timestamps), commands, and image count
  const userIntents = [];
  const commands = [];
  let imageCount = 0;

  for (const entry of entries) {
    if (entry.isSidechain === true) continue;
    const msg = entry.message;
    if (!msg || msg.role !== 'user') continue;
    if (isToolResultMessage(msg)) continue;
    const content = msg.content;

    // System injections arrive as arrays — skip but count images
    if (Array.isArray(content)) {
      for (var j = 0; j < content.length; j++) {
        if (content[j].type === 'image') imageCount++;
      }
      continue;
    }
    if (typeof content !== 'string') continue;
    if (!content || content === '[Request interrupted by user]') continue;

    var intentText = content.trim();

    // Extract /ink:* command before cleaning tags
    var cmdTag = intentText.match(/<command-message>(ink[:-][\w-]+)<\/command-message>/i);
    if (cmdTag) {
      commands.push({ command: cmdTag[1].replace(/-/g, ':').toLowerCase(), ts: entry.timestamp || null });
      var cmd = '/' + cmdTag[1];
      var argsTag = intentText.match(/<command-args>\s*([\s\S]*?)\s*<\/command-args>/i);
      intentText = cmd + (argsTag ? ' ' + argsTag[1].trim() : '');
    } else {
      var directMatch = intentText.match(/^\s*\/(ink[:-][\w-]+)/i);
      if (directMatch) {
        commands.push({ command: directMatch[1].replace(/-/g, ':').toLowerCase(), ts: entry.timestamp || null });
      }
    }

    // Strip HTML/XML tags and normalize whitespace
    var cleaned = intentText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    if (isNoise(cleaned)) continue;

    userIntents.push({ text: cleaned.substring(0, 500), ts: entry.timestamp || null });
  }

  // Calculate activeSeconds: time the AI is actively engaged per user turn.
  // A turn starts at a real user message (non-tool-result) and ends at the last
  // assistant response before the next real user message or end of transcript.
  // This includes tool call round-trips as active AI time.
  let activeSeconds = 0;
  let pendingStart = null;
  let lastAssistantTime = null;

  for (const entry of entries) {
    if (entry.isSidechain === true) continue;
    const msg = entry.message;
    if (!msg) continue;

    if (msg.role === 'user' && !isToolResultMessage(msg)) {
      // New real user turn — close the previous turn if open
      if (pendingStart !== null && lastAssistantTime !== null) {
        activeSeconds += Math.round((lastAssistantTime - pendingStart) / 1000);
      }
      pendingStart = parseTimestamp(entry.timestamp);
      lastAssistantTime = null;
    } else if (msg.role === 'assistant' && pendingStart !== null) {
      // Track the latest assistant response timestamp (any stop_reason)
      const t = parseTimestamp(entry.timestamp);
      if (t !== null) lastAssistantTime = t;
    }
  }

  // Close the last open turn
  if (pendingStart !== null && lastAssistantTime !== null) {
    activeSeconds += Math.round((lastAssistantTime - pendingStart) / 1000);
  }

  // Read user email and helper version
  const email = readUserEmail();
  const inkVersion = readInkVersion();

  // Build telemetry payload
  const payload = {
    sessionId,
    ticketJira: ticket,
    userEmail: email || 'unknown',
    repository,
    gitBranch,
    model,
    sessionStart,
    sessionEnd,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens: cacheCreationTokens,
    cacheReadInputTokens: cacheReadTokens,
    cacheTokens: cacheCreationTokens + cacheReadTokens,
    activeSeconds,
    userIntents: userIntents.map(function(i) { return { text: sanitizeCredentials(i.text), ts: i.ts }; }),
    commands,
    imageCount,
    version: inkVersion,
  };

  // POST to telemetry dashboard (fire-and-forget, never blocks)
  const telemetryUrl = process.env.INK_TELEMETRY_URL || INK_TELEMETRY_BASE_URL;
  if (telemetryUrl) {
    try {
      const url = new URL(telemetryUrl + '/api/sessions');
      const lib = url.protocol === 'https:' ? require('https') : require('http');
      const body = JSON.stringify(payload);

      await new Promise(function(resolve) {
        const req = lib.request({
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        }, function(res) {
          if (res.statusCode >= 400) {
            var responseBody = '';
            res.on('data', function(chunk) { responseBody += chunk; });
            res.on('end', function() {
              process.stderr.write('[telemetry] POST failed (' + res.statusCode + '): ' + responseBody.substring(0, 300) + '\n');
              resolve();
            });
          } else {
            res.resume();
            res.on('end', resolve);
          }
        });
        req.on('error', function(err) {
          process.stderr.write('[telemetry] POST network error: ' + err.message + '\n');
          resolve();
        });
        req.setTimeout(5000, function() { req.destroy(); resolve(); });
        req.write(body);
        req.end();
      });
      process.exit(0);
      return;
    } catch (err) {
      process.stderr.write('[telemetry-session] Telemetry error: ' + err.message + '\n');
    }
  }

  // Always allow stop (no stdout output = allow)
  process.exit(0);
}

main().catch(function(e) { process.stderr.write('[telemetry] fatal: ' + (e.message || 'unknown') + '\n'); process.exit(0); });
