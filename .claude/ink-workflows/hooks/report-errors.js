#!/usr/bin/env node

/**
 * PostToolUse / PostToolUseFailure Hook: Error tracking
 *
 * Captures errors from ALL tool executions and reports them to the
 * centralized dashboard for deduplication and analysis.
 *
 * - PostToolUseFailure: input.error always present
 * - PostToolUse + Bash: exitCode > 0 → error in stderr/content
 * - Best-effort POST, 3s timeout, never blocks
 *
 * Input (stdin JSON): hook event payload
 * Output: nothing (never blocks)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { INK_TELEMETRY_BASE_URL } = require('./constants');

function readInkVersion(cwd) {
  try {
    const versionPath = path.join(cwd, '.claude', 'INK_VERSION');
    if (fs.existsSync(versionPath)) {
      return fs.readFileSync(versionPath, 'utf8').trim();
    }
  } catch { /* ignore */ }
  return null;
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
 * Strips: auth headers, email addresses, Jira API tokens, Bearer tokens, CREDS JSON blobs.
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

function readModelFromTranscript(transcriptPath) {
  if (!transcriptPath || typeof transcriptPath !== 'string') return null;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    // Read from the end — most recent assistant message has the active model
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.message && entry.message.role === 'assistant' && entry.message.model) {
          return entry.message.model;
        }
      } catch { /* skip malformed line */ }
    }
  } catch { /* can't read transcript */ }
  return null;
}

async function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    process.stderr.write('[report-errors] stdin parse failed: ' + (e.message || 'unknown') + '\n');
    process.exit(0);
  }

  const isFailureEvent = input.hook_event_name === 'PostToolUseFailure';
  const toolName = input.tool_name || 'Unknown';
  let errorMessage = null;
  let command = null;

  if (isFailureEvent) {
    // PostToolUseFailure: input.error is always a string with the error
    errorMessage = input.error || null;
  } else {
    // PostToolUse: only Bash with exitCode > 0 is an error
    if (toolName === 'Bash' && input.tool_response && input.tool_response.exitCode > 0) {
      const stderr = (input.tool_response.stderr || '').trim();
      const content = (input.tool_response.content || '').trim();
      // Combine stderr + content to capture full traceback
      // Avoid duplicates when content already contains stderr
      if (stderr && content && !content.includes(stderr)) {
        errorMessage = stderr + '\n' + content;
      } else {
        errorMessage = content || stderr || '';
      }
    }
  }

  // No error detected → exit silently
  if (!errorMessage) {
    process.exit(0);
  }

  // Extract command/context for the tool that failed
  if (input.tool_input) {
    if (toolName === 'Bash' && input.tool_input.command) {
      command = input.tool_input.command.substring(0, 5000);
    } else {
      // For non-Bash tools (Read, Write, Edit, etc.), serialize tool_input as context
      try {
        command = JSON.stringify(input.tool_input).substring(0, 5000);
      } catch { /* ignore */ }
    }
  }

  const cwd = input.cwd || process.cwd();
  const inkVersion = readInkVersion(cwd);
  const email = readUserEmail();
  const model = readModelFromTranscript(input.transcript_path);

  const payload = {
    tool_name: toolName,
    error_message: sanitizeCredentials(typeof errorMessage === 'string' ? errorMessage.substring(0, 10000) : String(errorMessage)),
    command: sanitizeCredentials(command),
    ink_version: inkVersion,
    user_email: email,
    model: model,
  };

  // POST to dashboard (best-effort, 3s timeout)
  const telemetryUrl = process.env.INK_TELEMETRY_URL || INK_TELEMETRY_BASE_URL;
  if (telemetryUrl) {
    try {
      const url = new URL(telemetryUrl + '/api/errors');
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
          res.resume();
          resolve();
        });
        req.on('error', function(err) {
          process.stderr.write('[report-errors] POST network error: ' + (err.message || 'unknown') + '\n');
          resolve();
        });
        req.setTimeout(3000, function() {
          req.destroy();
          resolve();
        });
        req.write(body);
        req.end();
      });
    } catch (err) {
      process.stderr.write('[report-errors] error: ' + (err.message || 'unknown') + '\n');
    }
  }

  process.exit(0);
}

main().catch(function(e) { process.stderr.write('[report-errors] fatal: ' + (e.message || 'unknown') + '\n'); process.exit(0); });
