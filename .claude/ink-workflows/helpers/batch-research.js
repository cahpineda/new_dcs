#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    requestsFile: '',
    model: 'claude-sonnet-4-6',
    maxTokens: 8000,
    pollInterval: 30000,
    outputFile: ''
  };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--requests' && argv[i + 1]) { args.requestsFile = argv[i + 1]; i += 2; }
    else if (a === '--model' && argv[i + 1]) { args.model = argv[i + 1]; i += 2; }
    else if (a === '--max-tokens' && argv[i + 1]) { args.maxTokens = parseInt(argv[i + 1], 10); i += 2; }
    else if (a === '--poll-interval' && argv[i + 1]) { args.pollInterval = parseInt(argv[i + 1], 10); i += 2; }
    else if (a === '--output' && argv[i + 1]) { args.outputFile = argv[i + 1]; i += 2; }
    else { i++; }
  }
  return args;
}

function apiRequest(method, urlPath, apiKey, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'output-300k-2026-03-24',
      'content-type': 'application/json'
    };
    if (bodyStr) {
      headers['content-length'] = Buffer.byteLength(bodyStr);
    }
    const options = {
      hostname: 'api.anthropic.com',
      path: urlPath,
      method,
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
    if (bodyStr) { req.write(bodyStr); }
    req.end();
  });
}

function fetchUrl(url, apiKey) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          process.stderr.write('Results fetch error ' + res.statusCode + ': ' + data + '\n');
          process.exit(1);
        }
        resolve(data);
      });
    }).on('error', (err) => {
      process.stderr.write('Network error: ' + err.message + '\n');
      process.exit(1);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    if (args.requestsFile) {
      const requestsPath = path.resolve(args.requestsFile);
      if (fs.existsSync(requestsPath)) {
        const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
        const batchRequests = requests.map((r) => ({
          custom_id: r.id,
          params: {
            model: r.model || args.model,
            max_tokens: r.maxTokens || args.maxTokens,
            messages: [{ role: 'user', content: r.prompt }]
          }
        }));

        process.stderr.write('[' + timestamp() + '] Submitting batch of ' + batchRequests.length + ' requests...\n');
        const batch = await apiRequest('POST', '/v1/messages/batches', apiKey, { requests: batchRequests });
        process.stderr.write('[' + timestamp() + '] Batch submitted: ' + batch.id + '\n');
        process.stderr.write('[' + timestamp() + '] Polling every ' + (args.pollInterval / 1000) + 's...\n');

        let completed = false;
        let finalBatch = null;
        while (completed === false) {
          await sleep(args.pollInterval);
          const status = await apiRequest('GET', '/v1/messages/batches/' + batch.id, apiKey, null);
          const c = status.request_counts;
          process.stderr.write('[' + timestamp() + '] ' + status.processing_status +
            ' | Processing: ' + c.processing +
            ' | Succeeded: ' + c.succeeded +
            ' | Errored: ' + c.errored + '\n');
          if (status.processing_status === 'ended') {
            completed = true;
            finalBatch = status;
          }
        }

        process.stderr.write('[' + timestamp() + '] Fetching results from ' + finalBatch.results_url + '\n');
        const jsonl = await fetchUrl(finalBatch.results_url, apiKey);
        const lines = jsonl.split('\n').filter((l) => l.trim());
        const results = lines.map((line) => {
          const r = JSON.parse(line);
          if (r.result.type === 'succeeded') {
            const content = r.result.message.content;
            const text = content.map((b) => (b.type === 'text' ? b.text : '')).join('');
            return {
              id: r.custom_id,
              status: 'succeeded',
              text,
              tokens: r.result.message.usage.output_tokens
            };
          } else {
            return {
              id: r.custom_id,
              status: r.result.type,
              text: '',
              tokens: 0,
              error: r.result.error ? r.result.error.error.message : 'unknown'
            };
          }
        });

        const output = JSON.stringify(results, null, 2);
        if (args.outputFile) {
          fs.writeFileSync(args.outputFile, output, 'utf8');
          process.stderr.write('[' + timestamp() + '] Results written to ' + args.outputFile + '\n');
        } else {
          process.stdout.write(output + '\n');
        }
        process.exit(0);
      } else {
        process.stderr.write('Error: requests file not found: ' + requestsPath + '\n');
        process.exit(1);
      }
    } else {
      process.stderr.write('Usage: node batch-research.js --requests <json-file> [--model <id>] [--max-tokens <n>] [--poll-interval <ms>] [--output <json-file>]\n');
      process.stderr.write('  requests JSON format: [{"id": "...", "prompt": "..."}]\n');
      process.exit(1);
    }
  } else {
    process.stderr.write('Error: ANTHROPIC_API_KEY env var is required\n');
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write('Fatal error: ' + err.message + '\n');
  process.exit(1);
});
