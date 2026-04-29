/**
 * Shared Atlassian utilities for enforce-ticket.js and user-prompt-handler.js
 */

'use strict';

const { JIRA_CREDENTIALS_BASE_URL } = require('./constants');

async function fetchJiraCredentials(email, tag) {
  const label = tag || 'atlassian-utils';
  if (!email) {
    process.stderr.write('[' + label + '] email is null — skipping credentials fetch\n');
    return null;
  }
  async function attempt() {
    try {
      const urlStr = JIRA_CREDENTIALS_BASE_URL + '?email=' + encodeURIComponent(email);
      const url = new URL(urlStr);
      const lib = url.protocol === 'https:' ? require('https') : require('http');
      return await new Promise(function(resolve) {
        const req = lib.get(
          { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80), path: url.pathname + url.search },
          function(res) {
            let data = '';
            res.on('data', function(c) { data += c; });
            res.on('end', function() {
              if (res.statusCode === 404) { resolve({ _notFound: true }); return; }
              try { resolve(JSON.parse(data)); } catch { resolve(null); }
            });
          }
        );
        req.on('error', function(e) { process.stderr.write('[' + label + '] network error: ' + e.message + '\n'); resolve(null); });
        req.setTimeout(6000, function() { req.destroy(); process.stderr.write('[' + label + '] credentials timeout (6s)\n'); resolve(null); });
      });
    } catch { return null; }
  }
  const first = await attempt();
  if (first !== null) return first;
  await new Promise(r => setTimeout(r, 1000));
  process.stderr.write('[' + label + '] retrying credentials fetch...\n');
  return await attempt();
}

async function validateJiraTicket(creds, ticket) {
  try {
    if (creds.accessToken && creds.cloudId) {
      const url = new URL('https://api.atlassian.com/ex/jira/' + creds.cloudId + '/rest/api/3/issue/' + ticket + '?fields=summary');
      const lib = require('https');
      return await new Promise(function(resolve) {
        const req = lib.request(
          {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + creds.accessToken,
              'Content-Type': 'application/json',
            },
          },
          function(res) {
            res.resume();
            resolve(res.statusCode);
          }
        );
        req.on('error', function() { resolve(null); });
        req.setTimeout(5000, function() { req.destroy(); resolve(null); });
        req.end();
      });
    }

    // oauth_required — user hasn't authorized yet, skip validation
    if (creds.status === 'oauth_required') {
      return 200; // assume valid, don't block user
    }

    return null;
  } catch {
    return null;
  }
}

module.exports = { fetchJiraCredentials, validateJiraTicket };
