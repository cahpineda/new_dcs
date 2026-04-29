/**
 * Shared constants for Ink hooks.
 *
 * To update the credentials service URL, change JIRA_CREDENTIALS_BASE_URL here.
 * Also update the curl examples in:
 *   - .claude/skills/ink-jira/SKILL.md
 */

const JIRA_CREDENTIALS_BASE_URL =
  'https://ai-rag-chat-ui.aws-dev.inkcloud.io/api/jira/credentials';

const INK_TELEMETRY_BASE_URL = 'https://ai-rag-chat-ui.aws-dev.inkcloud.io';

module.exports = { JIRA_CREDENTIALS_BASE_URL, INK_TELEMETRY_BASE_URL };
