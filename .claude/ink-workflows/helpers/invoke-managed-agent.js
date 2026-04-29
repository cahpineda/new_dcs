#!/usr/bin/env node
// Prototype — requires pre-created Agent ID via POST /v1/agents
'use strict';

const https = require('https');

function parseArgs(argv) {
  const args = { agentId: '', sessionId: '', message: '', showEvents: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--agent-id' && argv[i + 1]) { args.agentId = argv[i + 1]; i += 2; }
    else if (a === '--session-id' && argv[i + 1]) { args.sessionId = argv[i + 1]; i += 2; }
    else if (a === '--message' && argv[i + 1]) { args.message = argv[i + 1]; i += 2; }
    else if (a === '--show-events') { args.showEvents = true; i++; }
    else { i++; }
  }
  return args;
}

function makeHeaders(apiKey) {
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'managed-agents-2026-04-01',
    'content-type': 'application/json'
  };
}

function post(apiKey, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const headers = makeHeaders(apiKey);
    headers['content-length'] = Buffer.byteLength(bodyStr);
    const options = {
      hostname: 'api.anthropic.com',
      path,
      method: 'POST',
      headers
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          process.stderr.write('API error ' + res.statusCode + ': ' + data + '\n');
          process.exit(1);
        }
        try { resolve(JSON.parse(data)); } catch (_) { resolve(data); }
      });
    });
    req.on('error', (err) => {
      process.stderr.write('Network error: ' + err.message + '\n');
      process.exit(1);
    });
    req.write(bodyStr);
    req.end();
  });
}

function streamSession(apiKey, sessionId, showEvents) {
  return new Promise((resolve, reject) => {
    const headers = makeHeaders(apiKey);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/sessions/' + sessionId + '/stream',
      method: 'GET',
      headers
    };
    https.get(options, (res) => {
      let buffer = '';
      if (res.statusCode >= 400) {
        let errBody = '';
        res.on('data', (c) => { errBody += c; });
        res.on('end', () => {
          process.stderr.write('Stream error ' + res.statusCode + ': ' + errBody + '\n');
          process.exit(1);
        });
        return;
      }
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            const json = line.slice(6);
            try {
              const evt = JSON.parse(json);
              if (showEvents) {
                process.stderr.write('[EVENT] ' + JSON.stringify(evt) + '\n');
              }
              if (evt.type === 'agent.message' && evt.content) {
                for (let j = 0; j < evt.content.length; j++) {
                  if (evt.content[j].type === 'text') {
                    process.stdout.write(evt.content[j].text);
                  }
                }
              }
              if (evt.type === 'session.status_idle') {
                process.stdout.write('\n');
                resolve();
              }
            } catch (_) {}
          }
        }
      });
      res.on('end', resolve);
    }).on('error', (err) => {
      process.stderr.write('Network error: ' + err.message + '\n');
      process.exit(1);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    if (args.agentId) {
      if (args.message) {
        let sessionId = args.sessionId;
        if (sessionId) {
          process.stderr.write('Reusing session: ' + sessionId + '\n');
        } else {
          const session = await post(apiKey, '/v1/sessions', {
            agent: { type: 'agent', id: args.agentId }
          });
          sessionId = session.id;
          process.stderr.write('Created session: ' + sessionId + '\n');
        }
        await post(apiKey, '/v1/sessions/' + sessionId + '/events', {
          events: [{ type: 'user.message', content: [{ type: 'text', text: args.message }] }]
        });
        await streamSession(apiKey, sessionId, args.showEvents);
      } else {
        process.stderr.write('Error: --message is required\n');
        process.stderr.write('Usage: node invoke-managed-agent.js --agent-id <id> --message "<text>" [--session-id <id>] [--show-events]\n');
        process.exit(1);
      }
    } else {
      process.stderr.write('Error: --agent-id is required\n');
      process.stderr.write('Usage: node invoke-managed-agent.js --agent-id <id> --message "<text>" [--session-id <id>] [--show-events]\n');
      process.exit(1);
    }
  } else {
    process.stderr.write('Error: ANTHROPIC_API_KEY environment variable is not set\n');
    process.exit(1);
  }
}

main();
