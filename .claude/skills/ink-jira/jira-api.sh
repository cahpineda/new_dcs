#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# jira-api.sh — Centralized Jira REST API helper for ink:jira skill
# Usage: bash .claude/skills/ink-jira/jira-api.sh <subcommand> [args...]
#
# Credentials: per-user OAuth 2.0 tokens via Atlassian OAuth (3LO).
# The credential service returns { accessToken, cloudId } or
# { status: "oauth_required", authUrl } if the user hasn't authorized yet.
# =============================================================================

CREDS_URL="https://ai-rag-chat-ui.aws-dev.inkcloud.io/api/jira/credentials"

# shellcheck source=../atlassian-auth.sh
source "$(dirname "${BASH_SOURCE[0]}")/../atlassian-auth.sh"

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_fetch_creds() {
  local email
  # Check env var first (supports headless/container usage with API key)
  email="${INK_CLAUDE_USER_EMAIL:-}"
  if [ -z "$email" ]; then
    email=$(jq -r '.oauthAccount.emailAddress' ~/.claude.json 2>/dev/null || \
            python3 -c "import json; print(json.load(open('$HOME/.claude.json'))['oauthAccount']['emailAddress'])" 2>/dev/null || \
            echo "")
  fi

  if [ -z "$email" ] || [ "$email" = "null" ]; then
    echo "ERROR: Could not determine your email from ~/.claude.json." >&2
    echo "Make sure you are logged in to Claude Code (claude.ai/code) before using Jira features." >&2
    exit 1
  fi

  local creds
  creds=$(_wait_for_atlassian_oauth "$email" "$CREDS_URL")

  JIRA_ACCESS_TOKEN=$(echo "$creds" | jq -r '.accessToken // empty')
  JIRA_CLOUD_ID=$(echo "$creds" | jq -r '.cloudId // empty')

  if [ -z "$JIRA_ACCESS_TOKEN" ] || [ "$JIRA_ACCESS_TOKEN" = "null" ] || \
     [ -z "$JIRA_CLOUD_ID" ] || [ "$JIRA_CLOUD_ID" = "null" ]; then
    echo "ERROR: Jira credentials not found" >&2
    exit 1
  fi

  JIRA_BASE="https://api.atlassian.com/ex/jira/${JIRA_CLOUD_ID}/rest/api/3"
  JIRA_BROWSE="https://inkinnovation.atlassian.net/browse"
}

_auth_header() {
  echo "Bearer ${JIRA_ACCESS_TOKEN}"
}

_jira_get() {
  local url="$1"
  local output="$2"
  curl -s \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    "$url" \
    -o "$output"
}

_jira_put() {
  local url="$1"
  local data="$2"
  curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    -d "$data" \
    "$url"
}

# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

cmd_check_creds() {
  _fetch_creds
  echo "Credentials OK (OAuth) — cloud: ${JIRA_CLOUD_ID}"
}

cmd_add_label() {
  local issue_key="$1"
  _fetch_creds
  local status
  status=$(_jira_put \
    "${JIRA_BASE}/issue/${issue_key}" \
    '{"update": {"labels": [{"add": "ink-monitor"}]}}')
  echo "ink-monitor label: HTTP ${status}"
}

cmd_fetch_issue() {
  local issue_key="$1"
  _fetch_creds
  _jira_get \
    "${JIRA_BASE}/issue/${issue_key}?fields=*all&expand=renderedFields,changelog" \
    /tmp/jira-issue-raw.json

  # Split into smaller files so the Read tool doesn't hit the 25K token limit
  python3 -c "
import json
d = json.load(open('/tmp/jira-issue-raw.json'))
changelog = d.pop('changelog', {})
rendered = d.pop('renderedFields', {})
# Trim changelog to last 20 entries to avoid token limits
if 'histories' in changelog:
    changelog['histories'] = changelog['histories'][-20:]
json.dump(d, open('/tmp/jira-issue.json', 'w'))
json.dump(changelog, open('/tmp/jira-issue-changelog.json', 'w'))
json.dump(rendered, open('/tmp/jira-issue-rendered.json', 'w'))
"
  rm -f /tmp/jira-issue-raw.json

  echo "HTTP fetch done. Split into:"
  echo "  /tmp/jira-issue.json (fields): $(wc -c < /tmp/jira-issue.json) bytes"
  echo "  /tmp/jira-issue-changelog.json: $(wc -c < /tmp/jira-issue-changelog.json) bytes"
  echo "  /tmp/jira-issue-rendered.json: $(wc -c < /tmp/jira-issue-rendered.json) bytes"
}

cmd_fetch_child() {
  local issue_key="$1"
  _fetch_creds
  _jira_get \
    "${JIRA_BASE}/issue/${issue_key}?fields=summary,status,assignee,description,subtasks,issuetype,priority" \
    "/tmp/jira-subtask-${issue_key}.json"
  echo "Subtask fetched: /tmp/jira-subtask-${issue_key}.json ($(wc -c < "/tmp/jira-subtask-${issue_key}.json") bytes)"
}

cmd_fetch_link() {
  local issue_key="$1"
  _fetch_creds
  _jira_get \
    "${JIRA_BASE}/issue/${issue_key}?fields=summary,status,issuetype,priority,assignee" \
    "/tmp/jira-link-${issue_key}.json"
  echo "Link fetched: /tmp/jira-link-${issue_key}.json ($(wc -c < "/tmp/jira-link-${issue_key}.json") bytes)"
}

cmd_fetch_epic() {
  local epic_key="$1"
  _fetch_creds
  local jql
  jql=$(python3 -c "import urllib.parse; print(urllib.parse.quote('\"Epic Link\" = ${epic_key} OR parent = ${epic_key}'))")
  _jira_get \
    "${JIRA_BASE}/search?jql=${jql}&maxResults=30" \
    /tmp/jira-epic-issues.json
  echo "Epic issues fetched: /tmp/jira-epic-issues.json"
}

cmd_fetch_parent() {
  local issue_key="$1"
  _fetch_creds
  _jira_get \
    "${JIRA_BASE}/issue/${issue_key}?fields=summary,status,assignee,description,subtasks,issuetype,priority,parent" \
    "/tmp/jira-parent-${issue_key}.json"
  echo "Parent fetched: /tmp/jira-parent-${issue_key}.json ($(wc -c < "/tmp/jira-parent-${issue_key}.json") bytes)"
}

cmd_search_project() {
  local query="$1"
  _fetch_creds
  local encoded_query
  encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''${query}'''))")
  _jira_get \
    "${JIRA_BASE}/project/search?query=${encoded_query}&maxResults=10" \
    /tmp/jira-projects.json
  local count
  count=$(python3 -c "import json; print(len(json.load(open('/tmp/jira-projects.json')).get('values', [])))" || echo "0")
  echo "Project search '${query}': ${count} results"
}

cmd_create_issue() {
  # Usage: create-issue --project KEY --type TYPE --summary "..." --description-file FILE [--parent KEY] [--priority NAME] [--epic-name "..."] [--assignee ACCOUNT_ID_OR_EMAIL]
  _fetch_creds
  local project="" issue_type="" summary="" desc_file="" parent="" priority="" epic_name="" assignee=""

  while [ $# -gt 0 ]; do
    case "$1" in
      --project)   project="$2"; shift 2 ;;
      --type)      issue_type="$2"; shift 2 ;;
      --summary)   summary="$2"; shift 2 ;;
      --description-file) desc_file="$2"; shift 2 ;;
      --parent)    parent="$2"; shift 2 ;;
      --priority)  priority="$2"; shift 2 ;;
      --epic-name) epic_name="$2"; shift 2 ;;
      --assignee)  assignee="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  if [ -z "$project" ] || [ -z "$issue_type" ] || [ -z "$summary" ]; then
    echo "ERROR: --project, --type, and --summary are required" >&2
    exit 1
  fi

  # Build payload with python3 to handle escaping safely
  local payload
  payload=$(python3 -c "
import json, sys
fields = {
    'project': {'key': '''${project}'''},
    'summary': '''${summary}''',
    'issuetype': {'name': '''${issue_type}'''},
}
desc_file = '''${desc_file}'''
if desc_file:
    with open(desc_file) as f:
        fields['description'] = json.load(f)
parent = '''${parent}'''
if parent:
    fields['parent'] = {'key': parent}
priority = '''${priority}'''
if priority:
    fields['priority'] = {'name': priority}
epic_name = '''${epic_name}'''
if epic_name:
    fields['customfield_10011'] = epic_name
assignee = '''${assignee}'''
if assignee:
    if '@' in assignee:
        import subprocess, urllib.parse
        search_url = '''${JIRA_BASE}''' + '/user/search?query=' + urllib.parse.quote(assignee)
        token = '''${JIRA_ACCESS_TOKEN}'''
        result = subprocess.check_output(['curl', '-s', '-H', 'Authorization: Bearer ' + token, '-H', 'Content-Type: application/json', search_url]).decode()
        users = json.loads(result)
        if users and len(users) > 0:
            fields['assignee'] = {'accountId': users[0]['accountId']}
    else:
        fields['assignee'] = {'accountId': assignee}
print(json.dumps({'fields': fields}))
")

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "${JIRA_BASE}/issue")

  local status body
  status=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    local issue_key
    issue_key=$(echo "$body" | python3 -c "import json,sys; print(json.load(sys.stdin).get('key',''))")
    echo "{\"key\": \"${issue_key}\", \"url\": \"${JIRA_BROWSE}/${issue_key}\", \"status\": ${status}}"
  else
    # If parent field failed, retry with customfield_10014 (Epic Link)
    if [ -n "$parent" ] && echo "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('errors',{}).get('parent') else 1)" > /dev/null 2>&1; then
      payload=$(echo "$payload" | python3 -c "
import json, sys
d = json.load(sys.stdin)
parent_key = d['fields'].pop('parent', {}).get('key', '')
if parent_key:
    d['fields']['customfield_10014'] = parent_key
print(json.dumps(d))
")
      response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: $(_auth_header)" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "${JIRA_BASE}/issue")
      status=$(echo "$response" | tail -1)
      body=$(echo "$response" | sed '$d')
      if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        local issue_key
        issue_key=$(echo "$body" | python3 -c "import json,sys; print(json.load(sys.stdin).get('key',''))")
        echo "{\"key\": \"${issue_key}\", \"url\": \"${JIRA_BROWSE}/${issue_key}\", \"status\": ${status}}"
      else
        echo "ERROR ${status}: ${body}" >&2
        exit 1
      fi
    # If issue type is invalid, fetch valid types and report them
    elif echo "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('errors',{}).get('issuetype') else 1)" > /dev/null 2>&1; then
      local valid_types
      valid_types=$(cmd_get_issue_types "$project" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
      echo "ERROR ${status}: Invalid issue type '${issue_type}'. Valid types for ${project}: ${valid_types}" >&2
      exit 1
    else
      echo "ERROR ${status}: ${body}" >&2
      exit 1
    fi
  fi
}

cmd_build_adf() {
  local input_file="$1"
  local output_file="$2"
  local script_dir
  script_dir="$(cd "$(dirname "$0")" && pwd)"
  python3 "${script_dir}/jira-adf-builder.py" "$input_file" "$output_file"
}

cmd_cleanup() {
  rm -f /tmp/jira-issue.json /tmp/jira-issue-changelog.json /tmp/jira-issue-rendered.json
  rm -f /tmp/jira-subtask-*.json /tmp/jira-link-*.json /tmp/jira-epic-issues.json /tmp/jira-parent-*.json
  rm -f /tmp/jira-projects.json /tmp/jira-adf-*.json /tmp/jira-transitions.json
  echo "Temp files cleaned up."
}

cmd_get_issue_types() {
  local project_key="$1"
  _fetch_creds
  _jira_get \
    "${JIRA_BASE}/issue/createmeta?projectKeys=${project_key}&expand=projects.issuetypes" \
    /tmp/jira-issue-types.json
  python3 -c "
import json
data = json.load(open('/tmp/jira-issue-types.json'))
for p in data.get('projects', []):
    for it in p.get('issuetypes', []):
        if it.get('subtask'):
            continue
        print(it['name'])
"
}

cmd_get_transitions() {
  local issue_key="$1"
  _fetch_creds
  curl -s \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    "${JIRA_BASE}/issue/${issue_key}/transitions" \
    -o /tmp/jira-transitions.json
  python3 -c "
import json
data = json.load(open('/tmp/jira-transitions.json'))
for t in data.get('transitions', []):
    print(t['id'] + ' | ' + t['name'] + ' | -> ' + t.get('to',{}).get('name',''))
"
}

cmd_transition_issue() {
  local issue_key="$1"
  local transition_id="$2"
  _fetch_creds
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    -d "{\"transition\": {\"id\": \"${transition_id}\"}}" \
    "${JIRA_BASE}/issue/${issue_key}/transitions")
  echo "Transition: HTTP ${status}"
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

subcommand="${1:-}"
shift || true

case "$subcommand" in
  check-creds)     cmd_check_creds ;;
  add-label)       cmd_add_label "$1" ;;
  fetch-issue)     cmd_fetch_issue "$1" ;;
  fetch-child)     cmd_fetch_child "$1" ;;
  fetch-link)      cmd_fetch_link "$1" ;;
  fetch-epic)      cmd_fetch_epic "$1" ;;
  fetch-parent)    cmd_fetch_parent "$1" ;;
  search-project)  cmd_search_project "$1" ;;
  create-issue)    cmd_create_issue "$@" ;;
  build-adf)       cmd_build_adf "$1" "$2" ;;
  cleanup)         cmd_cleanup ;;
  get-issue-types)  cmd_get_issue_types "$1" ;;
  get-transitions)  cmd_get_transitions "$1" ;;
  transition-issue) cmd_transition_issue "$1" "$2" ;;
  *)
    echo "Usage: jira-api.sh <subcommand> [args...]"
    echo ""
    echo "Subcommands:"
    echo "  check-creds                Validate Jira credentials"
    echo "  add-label    <ISSUE-KEY>   Add ink-monitor label"
    echo "  fetch-issue  <ISSUE-KEY>   Fetch full issue to /tmp/jira-issue.json"
    echo "  fetch-child  <ISSUE-KEY>   Fetch subtask to /tmp/jira-subtask-<KEY>.json"
    echo "  fetch-link   <LINK-KEY>    Fetch linked issue to /tmp/jira-link-<KEY>.json"
    echo "  fetch-epic   <EPIC-KEY>    Fetch epic issues to /tmp/jira-epic-issues.json"
    echo "  fetch-parent <ISSUE-KEY>   Fetch parent to /tmp/jira-parent-<KEY>.json"
    echo "  search-project <QUERY>     Search projects to /tmp/jira-projects.json"
    echo "  create-issue [opts]        Create issue (--project --type --summary --description-file [--parent] [--priority] [--epic-name] [--assignee])"
    echo "  build-adf    <IN> <OUT>    Convert simplified JSON to ADF format"
    echo "  get-issue-types <PROJECT>   List valid issue types (non-subtask)"
    echo "  get-transitions <KEY>       List available transitions"
    echo "  transition-issue <KEY> <ID> Transition issue to new status"
    exit 1
    ;;
esac
