#!/usr/bin/env node
'use strict';

const https = require('https');

function parseArgs(argv) {
  const args = { model: 'claude-opus-4-6', budget: 10000, adaptive: false, system: '', showThinking: false, prompt: '' };
  const rest = [];
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--model' && argv[i + 1]) { args.model = argv[i + 1]; i += 2; }
    else if (a === '--budget' && argv[i + 1]) { args.budget = parseInt(argv[i + 1], 10); i += 2; }
    else if (a === '--adaptive') { args.adaptive = true; i++; }
    else if (a === '--system' && argv[i + 1]) { args.system = argv[i + 1]; i += 2; }
    else if (a === '--show-thinking') { args.showThinking = true; i++; }
    else { rest.push(a); i++; }
  }
  args.prompt = rest.join(' ');
  return args;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { resolve(data.trim()); });
    setTimeout(() => { resolve(''); }, 100);
  });
}

function callAnthropicStream(args) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      runStream(apiKey, args, resolve, reject);
    } else {
      process.stderr.write('Error: ANTHROPIC_API_KEY environment variable is not set\n');
      process.exit(1);
    }
  });
}

function runStream(apiKey, args, resolve, reject) {
  const thinking = args.adaptive
    ? { type: 'adaptive' }
    : { type: 'enabled', budget_tokens: args.budget };

  const messages = [{ role: 'user', content: args.prompt }];

  const body = JSON.stringify({
    model: args.model,
    max_tokens: args.budget + 4096,
    thinking,
    messages,
    stream: true,
    ...(args.system ? { system: args.system } : {})
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    let buffer = '';

    if (res.statusCode >= 400) {
      let errBody = '';
      res.on('data', (c) => { errBody += c; });
      res.on('end', () => {
        process.stderr.write('API error ' + res.statusCode + ': ' + errBody + '\n');
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
          if (json === '[DONE]') { return; }
          try {
            const evt = JSON.parse(json);
            if (evt.type === 'content_block_delta') {
              if (evt.delta && evt.delta.type === 'text_delta') {
                process.stdout.write(evt.delta.text);
              } else if (evt.delta && evt.delta.type === 'thinking_delta' && args.showThinking) {
                process.stderr.write('[THINK] ' + evt.delta.thinking);
              }
            }
          } catch (_) {}
        }
      }
    });

    res.on('end', () => {
      process.stdout.write('\n');
      resolve();
    });
  });

  req.on('error', (err) => {
    process.stderr.write('Network error: ' + err.message + '\n');
    process.exit(1);
  });

  req.write(body);
  req.end();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.prompt) {
    callAnthropicStream(args);
  } else {
    const stdin = await readStdin();
    if (stdin) {
      args.prompt = stdin;
      callAnthropicStream(args);
    } else {
      process.stderr.write('Usage: node spawn-thinking-agent.js [--model <id>] [--budget <n>] [--adaptive] [--system <text>] [--show-thinking] "<prompt>"\n');
      process.exit(1);
    }
  }
}

main();
