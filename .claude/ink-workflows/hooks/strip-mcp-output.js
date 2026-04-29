#!/usr/bin/env node
/**
 * PostToolUse hook — strips verbose MCP tool outputs before they enter the context window.
 * Applies Output Stripping (Strategy 9) and TOON encoding (Strategy 10).
 *
 * Targets:
 *   - mcp__context7__query-docs         → strip markdown headers/dividers, truncate to 8KB
 *   - mcp__notebooklm__ask_question     → strip duplicate blockquotes, keep answer + key citations
 *   - mcp__ink-kb-mcp__rag_query_simple → keep only text field, drop chunk metadata
 *   - mcp__project2context__*           → TOON-encode arrays of uniform flat records (>5 items)
 */

'use strict';

const MAX_BYTES = 8192;

function readStdin() {
  try {
    return JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
  } catch {
    process.exit(0);
  }
}

function exit0() {
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

// --- Content extraction ---

function extractText(toolResponse) {
  if (!toolResponse) return null;
  // MCP content array format: { content: [{ type: 'text', text: '...' }] }
  if (Array.isArray(toolResponse.content)) {
    return toolResponse.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');
  }
  // Bash-style format
  if (typeof toolResponse.stdout === 'string') return toolResponse.stdout;
  // Plain object — serialize
  if (typeof toolResponse === 'object') return JSON.stringify(toolResponse);
  return String(toolResponse);
}

function rebuildResponse(toolResponse, newText) {
  if (Array.isArray(toolResponse.content)) {
    return { ...toolResponse, content: [{ type: 'text', text: newText }] };
  }
  if (typeof toolResponse.stdout === 'string') {
    return { ...toolResponse, stdout: newText };
  }
  return { content: [{ type: 'text', text: newText }] };
}

// --- Stripping helpers ---

function stripMarkdownNoise(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')         // HTML comments
    .replace(/<[^>]+>/g, '')                  // HTML tags
    .replace(/^#{1,6}\s+/gm, '')             // markdown headers
    .replace(/^\s*[-*]{3,}\s*$/gm, '')        // horizontal rules
    .replace(/\n{3,}/g, '\n\n')              // collapse blank lines
    .trim();
}

function truncate(text, maxBytes) {
  const buf = Buffer.from(text, 'utf8');
  if (buf.length <= maxBytes) return text;
  const truncated = buf.slice(0, maxBytes).toString('utf8');
  return truncated + `\n\n[truncated — original was ${buf.length} bytes, limit ${maxBytes}]`;
}

// --- TOON encoding ---

function tryTOON(response) {
  let arr = null;
  if (Array.isArray(response)) {
    arr = response;
  } else if (response && Array.isArray(response.content)) {
    // try to parse the text content as JSON array
    try {
      const parsed = JSON.parse(
        response.content.filter(c => c.type === 'text').map(c => c.text).join('')
      );
      if (Array.isArray(parsed)) arr = parsed;
    } catch { return null; }
  } else if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) arr = parsed;
    } catch { return null; }
  }

  if (!arr || arr.length <= 5) return null;

  // All items must be plain objects with the same keys
  const first = arr[0];
  if (typeof first !== 'object' || first === null || Array.isArray(first)) return null;
  const fields = Object.keys(first);
  const allFlat = arr.every(item =>
    typeof item === 'object' && item !== null &&
    !Array.isArray(item) &&
    fields.every(f => f in item && typeof item[f] !== 'object')
  );
  if (!allFlat) return null;

  const rows = arr.map(item =>
    fields.map(f => {
      const v = String(item[f] ?? '');
      return v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(',')
  );

  return `FIELDS: ${fields.join(',')}\n${rows.join('\n')}`;
}

// --- Per-tool transformations ---

function transformContext7(text) {
  return truncate(stripMarkdownNoise(text), MAX_BYTES);
}

function transformNotebooklm(text) {
  // Remove duplicate blockquotes (lines starting with > that repeat)
  const seen = new Set();
  const lines = text.split('\n').filter(line => {
    if (!line.startsWith('>')) return true;
    if (seen.has(line)) return false;
    seen.add(line);
    return true;
  });
  return truncate(lines.join('\n').trim(), MAX_BYTES);
}

function transformInkKb(response) {
  // rag_query_simple returns { chunks: [{ text, metadata, score }] }
  let parsed = null;
  const raw = extractText(response);
  try { parsed = JSON.parse(raw); } catch { return raw; }

  if (parsed && Array.isArray(parsed.chunks)) {
    const texts = parsed.chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');
    return truncate(texts, MAX_BYTES);
  }
  return truncate(raw, MAX_BYTES);
}

function transformProject2context(toolName, response) {
  const toon = tryTOON(response);
  if (toon) return toon;
  // Fallback: strip and truncate
  return truncate(stripMarkdownNoise(extractText(response) || ''), MAX_BYTES);
}

// --- Main ---

const input = readStdin();
const toolName = input.tool_name || '';

if (!toolName.startsWith('mcp__')) exit0();

const response = input.tool_response;
let newText = null;

if (toolName === 'mcp__context7__query-docs') {
  newText = transformContext7(extractText(response) || '');
} else if (toolName === 'mcp__notebooklm__ask_question') {
  newText = transformNotebooklm(extractText(response) || '');
} else if (toolName === 'mcp__ink-kb-mcp__rag_query_simple') {
  newText = transformInkKb(response);
} else if (toolName.startsWith('mcp__project2context__')) {
  newText = transformProject2context(toolName, response);
} else {
  exit0();
}

const updatedResponse = rebuildResponse(response || {}, newText);

const originalSize = Buffer.byteLength(extractText(response) || '', 'utf8');
const newSize = Buffer.byteLength(newText, 'utf8');
if (originalSize !== newSize) {
  const logLine = `${new Date().toISOString()} [strip-mcp] ${toolName} ${originalSize}B → ${newSize}B (${Math.round((1 - newSize / originalSize) * 100)}% reduction)\n`;
  require('fs').appendFileSync(
    require('path').join(process.env.CLAUDE_PROJECT_DIR || '.', '.planning', 'strip-mcp-log.txt'),
    logLine
  );
}

process.stdout.write(JSON.stringify({
  continue: true,
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    updatedToolOutput: updatedResponse
  }
}));
