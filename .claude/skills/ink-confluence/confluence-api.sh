#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# confluence-api.sh — Centralized Confluence REST API helper for ink:confluence skill
# Usage: bash .claude/skills/ink-confluence/confluence-api.sh <subcommand> [args...]
#
# Uses Confluence REST API v2 (pages, folders) + v1 (CQL search).
# Credentials: per-user OAuth 2.0 tokens via Atlassian OAuth (3LO).
# =============================================================================

CREDS_URL="https://ai-rag-chat-ui.aws-dev.inkcloud.io/api/confluence/credentials"

# shellcheck source=../atlassian-auth.sh
source "$(dirname "${BASH_SOURCE[0]}")/../atlassian-auth.sh"

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_fetch_creds() {
  # Guard: only fetch once per script invocation
  if [ -n "${_CREDS_LOADED:-}" ]; then return 0; fi

  local email
  # Check env var first (supports headless/container usage with API key)
  email="${INK_CLAUDE_USER_EMAIL:-}"
  if [ -z "$email" ]; then
    email=$(jq -r '.oauthAccount.emailAddress' ~/.claude.json 2>/dev/null || \
            python3 -c "import json; print(json.load(open('$HOME/.claude.json'))['oauthAccount']['emailAddress'])" 2>/dev/null || \
            echo "")
  fi

  if [ -z "$email" ] || [ "$email" = "null" ]; then
    echo "ERROR: Could not read email from ~/.claude.json" >&2
    exit 1
  fi

  local creds
  creds=$(_wait_for_atlassian_oauth "$email" "$CREDS_URL")

  CONF_ACCESS_TOKEN=$(echo "$creds" | jq -r '.accessToken // empty')
  CONF_CLOUD_ID=$(echo "$creds" | jq -r '.cloudId // empty')

  if [ -z "$CONF_ACCESS_TOKEN" ] || [ "$CONF_ACCESS_TOKEN" = "null" ] || \
     [ -z "$CONF_CLOUD_ID" ] || [ "$CONF_CLOUD_ID" = "null" ]; then
    echo "ERROR: Confluence credentials not found" >&2
    exit 1
  fi

  CONF_BASE="https://api.atlassian.com/ex/confluence/${CONF_CLOUD_ID}"
  CONF_V2="${CONF_BASE}/wiki/api/v2"
  CONF_V1="${CONF_BASE}/wiki/rest/api"
  CONF_BROWSE="https://inkinnovation.atlassian.net/wiki"

  _CREDS_LOADED=1
}

_auth_header() {
  echo "Bearer ${CONF_ACCESS_TOKEN}"
}

_conf_get() {
  local url="$1"
  local output="$2"
  curl -s \
    -H "Authorization: $(_auth_header)" \
    -H "Accept: application/json" \
    "$url" \
    -o "$output"
}

_conf_post() {
  local url="$1"
  local data="$2"
  curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$data" \
    "$url"
}

_conf_put() {
  local url="$1"
  local data="$2"
  curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: $(_auth_header)" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$data" \
    "$url"
}

_conf_delete() {
  local url="$1"
  curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: $(_auth_header)" \
    "$url"
}

_parse_response() {
  local raw="$1"
  echo "$raw" | sed '$d'
}

_get_status() {
  local raw="$1"
  echo "$raw" | tail -1
}

# Resolve space key → space ID (v2 requires IDs)
_resolve_space_id() {
  local space_key="$1"
  _conf_get "${CONF_V2}/spaces?keys=${space_key}&limit=1" /tmp/confluence-space-resolve.json
  local space_id
  space_id=$(jq -r '.results[0].id // empty' /tmp/confluence-space-resolve.json 2>/dev/null)
  rm -f /tmp/confluence-space-resolve.json
  if [ -z "$space_id" ]; then
    echo "ERROR: Could not resolve space key '${space_key}'" >&2
    return 1
  fi
  echo "$space_id"
}

# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

cmd_check_creds() {
  _fetch_creds
  echo "Credentials OK (OAuth) — cloud: ${CONF_CLOUD_ID}"
}

cmd_fetch_page() {
  local page_id="$1"
  _fetch_creds
  _conf_get \
    "${CONF_V2}/pages/${page_id}?body-format=storage" \
    "/tmp/confluence-page-${page_id}.json"
  echo "Page ${page_id} fetched. Size: $(wc -c < "/tmp/confluence-page-${page_id}.json") bytes"
}

cmd_fetch_children() {
  local parent_id="$1"
  _fetch_creds
  _conf_get \
    "${CONF_V2}/pages/${parent_id}/direct-children?limit=50" \
    "/tmp/confluence-children-${parent_id}.json"
  local count
  count=$(jq '.results | length' "/tmp/confluence-children-${parent_id}.json" 2>/dev/null || echo "0")
  echo "Children of ${parent_id}: ${count} pages found"
}

cmd_check_exists() {
  local title="$1"
  local space="$2"
  _fetch_creds
  local encoded_cql
  encoded_cql=$(python3 -c "import urllib.parse; print(urllib.parse.quote('space=\"${space}\" AND title=\"${title}\" AND type=page'))")
  _conf_get \
    "${CONF_V1}/content/search?cql=${encoded_cql}&limit=5" \
    /tmp/confluence-search.json
  local count
  count=$(jq '.results | length' /tmp/confluence-search.json 2>/dev/null || echo "0")
  echo "Search for '${title}' in ${space}: ${count} results"
}

cmd_search() {
  local query="$1"
  local space="$2"
  _fetch_creds
  local encoded_cql
  encoded_cql=$(python3 -c "import urllib.parse; print(urllib.parse.quote('space=\"${space}\" AND text~\"${query}\"'))")
  _conf_get \
    "${CONF_V1}/content/search?cql=${encoded_cql}&limit=25" \
    /tmp/confluence-search.json
  local count
  count=$(jq '.results | length' /tmp/confluence-search.json 2>/dev/null || echo "0")
  echo "Search for '${query}' in ${space}: ${count} results"
}

cmd_create_page() {
  local title="$1"
  local parent_id="$2"
  local space="$3"
  local content_file="$4"
  _fetch_creds

  # Resolve space key to space ID
  local space_id
  space_id=$(_resolve_space_id "$space")

  local content
  content=$(cat "$content_file")

  local payload
  payload=$(python3 -c "
import json, sys
content = sys.stdin.read()
print(json.dumps({
    'spaceId': '''${space_id}''',
    'title': '''${title}''',
    'parentId': '''${parent_id}''',
    'status': 'current',
    'body': {'representation': 'storage', 'value': content}
}))
" <<< "$content")

  local raw
  raw=$(_conf_post "${CONF_V2}/pages" "$payload")
  local status body
  status=$(_get_status "$raw")
  body=$(_parse_response "$raw")

  if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    local page_id page_url
    page_id=$(echo "$body" | jq -r '.id')
    page_url=$(echo "$body" | jq -r '._links.webui // empty')
    echo "{\"id\": \"${page_id}\", \"url\": \"${CONF_BROWSE}${page_url}\", \"action\": \"created\", \"status\": ${status}}"
  else
    echo "ERROR ${status}: ${body}" >&2
    exit 1
  fi
}

cmd_update_page() {
  local page_id="$1"
  local content_file="$2"
  local title="${3:-}"
  local parent_id="${4:-}"
  _fetch_creds

  # Fetch current version for auto-bump
  _conf_get \
    "${CONF_V2}/pages/${page_id}" \
    "/tmp/confluence-page-${page_id}-ver.json"
  local cur_ver cur_title
  cur_ver=$(jq '.version.number' "/tmp/confluence-page-${page_id}-ver.json")
  cur_title=$(jq -r '.title' "/tmp/confluence-page-${page_id}-ver.json")
  local new_ver=$((cur_ver + 1))
  local use_title="${title:-$cur_title}"

  local content
  content=$(cat "$content_file")

  local payload
  payload=$(python3 -c "
import json, sys
content = sys.stdin.read()
obj = {
    'id': '''${page_id}''',
    'version': {'number': ${new_ver}},
    'status': 'current',
    'title': '''${use_title}''',
    'body': {'representation': 'storage', 'value': content}
}
parent_id = '''${parent_id}'''
if parent_id:
    obj['parentId'] = parent_id
print(json.dumps(obj))
" <<< "$content")

  local raw
  raw=$(_conf_put "${CONF_V2}/pages/${page_id}" "$payload")
  local status body
  status=$(_get_status "$raw")
  body=$(_parse_response "$raw")

  if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    local page_url
    page_url=$(echo "$body" | jq -r '._links.webui // empty')
    echo "{\"id\": \"${page_id}\", \"url\": \"${CONF_BROWSE}${page_url}\", \"action\": \"updated\", \"version\": ${new_ver}, \"status\": ${status}}"
  else
    echo "ERROR ${status}: ${body}" >&2
    exit 1
  fi

  rm -f "/tmp/confluence-page-${page_id}-ver.json"
}

cmd_write_page() {
  local title="$1"
  local parent_id="$2"
  local space="$3"
  local content_file="$4"
  _fetch_creds

  # Check if page exists via CQL search
  cmd_check_exists "$title" "$space" > /dev/null
  local existing
  existing=$(jq '.results | length' /tmp/confluence-search.json 2>/dev/null || echo "0")

  if [ "$existing" -gt 0 ]; then
    local page_id
    page_id=$(jq -r '.results[0].id' /tmp/confluence-search.json)
    cmd_update_page "$page_id" "$content_file" "$title" "$parent_id"
  else
    cmd_create_page "$title" "$parent_id" "$space" "$content_file"
  fi
}

cmd_create_folder() {
  local title="$1"
  local parent_id="$2"
  local space_id="$3"
  _fetch_creds

  local payload
  payload=$(python3 -c "
import json
print(json.dumps({
    'title': '''${title}''',
    'spaceId': '''${space_id}''',
    'parentId': '''${parent_id}'''
}))
")

  local raw
  raw=$(_conf_post "${CONF_V2}/folders" "$payload")
  local status body
  status=$(_get_status "$raw")
  body=$(_parse_response "$raw")

  if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    local folder_id
    folder_id=$(echo "$body" | jq -r '.id')
    echo "{\"id\": \"${folder_id}\", \"title\": \"${title}\", \"action\": \"created\", \"status\": ${status}}"
  else
    echo "ERROR ${status}: ${body}" >&2
    exit 1
  fi
}

cmd_list_folder_children() {
  local folder_id="$1"
  _fetch_creds

  # Try v2 folders API first
  _conf_get \
    "${CONF_V2}/folders/${folder_id}/children?limit=50" \
    "/tmp/confluence-folder-children-${folder_id}.json"

  local count
  count=$(jq '.results | length' "/tmp/confluence-folder-children-${folder_id}.json" 2>/dev/null || echo "0")

  # Fallback to direct-children if folders endpoint returns 0
  if [ "$count" = "0" ]; then
    _conf_get \
      "${CONF_V2}/pages/${folder_id}/direct-children?limit=50" \
      "/tmp/confluence-folder-children-${folder_id}.json"
    count=$(jq '.results | length' "/tmp/confluence-folder-children-${folder_id}.json" 2>/dev/null || echo "0")
  fi

  echo "Folder ${folder_id} children: ${count} items"
}

cmd_get_or_create_folder() {
  local title="$1"
  local parent_id="$2"
  local space_id="$3"
  _fetch_creds

  # Strategy 1: List folder children
  cmd_list_folder_children "$parent_id" > /dev/null

  local match
  match=$(jq -r --arg t "$title" \
    '.results[] | select(.title | ascii_downcase == ($t | ascii_downcase)) | .id' \
    "/tmp/confluence-folder-children-${parent_id}.json" 2>/dev/null | head -1)

  if [ -n "$match" ]; then
    echo "{\"id\": \"${match}\", \"title\": \"${title}\", \"action\": \"found\"}"
    return 0
  fi

  # Strategy 2: CQL search
  cmd_check_exists "$title" "PRODUCTK" > /dev/null
  match=$(jq -r --arg t "$title" \
    '.results[] | select(.title | ascii_downcase == ($t | ascii_downcase)) | .id' \
    /tmp/confluence-search.json 2>/dev/null | head -1)

  if [ -n "$match" ]; then
    echo "{\"id\": \"${match}\", \"title\": \"${title}\", \"action\": \"found\"}"
    return 0
  fi

  # Not found — try to create
  local create_output
  create_output=$(cmd_create_folder "$title" "$parent_id" "$space_id" 2>&1) || true

  if echo "$create_output" | grep -q '"action": "created"'; then
    echo "$create_output"
    return 0
  fi

  # If create failed with "folder exists", search via CQL
  if echo "$create_output" | grep -qi "folder exists"; then
    local encoded_cql
    encoded_cql=$(python3 -c "import urllib.parse; print(urllib.parse.quote('title=\"${title}\" AND type=folder'))")
    _conf_get \
      "${CONF_V1}/content/search?cql=${encoded_cql}&limit=5" \
      /tmp/confluence-folder-search.json
    match=$(jq -r '.results[0].id // empty' /tmp/confluence-folder-search.json 2>/dev/null)
    rm -f /tmp/confluence-folder-search.json
    if [ -n "$match" ]; then
      echo "{\"id\": \"${match}\", \"title\": \"${title}\", \"action\": \"found\"}"
      return 0
    fi

    # Last resort: search as page
    cmd_check_exists "$title" "PRODUCTK" > /dev/null
    match=$(jq -r '.results[0].id // empty' /tmp/confluence-search.json 2>/dev/null)
    if [ -n "$match" ]; then
      echo "{\"id\": \"${match}\", \"title\": \"${title}\", \"action\": \"found\"}"
      return 0
    fi
  fi

  echo "$create_output" >&2
  exit 1
}

cmd_delete_page() {
  local page_id="$1"
  _fetch_creds

  local status
  status=$(_conf_delete "${CONF_V2}/pages/${page_id}")

  if [ "$status" = "204" ] || [ "$status" = "200" ]; then
    echo "{\"id\": \"${page_id}\", \"action\": \"deleted\", \"status\": ${status}}"
  else
    echo "ERROR ${status}: Could not delete page ${page_id}" >&2
    exit 1
  fi
}

cmd_cleanup() {
  rm -f /tmp/confluence-page-*.json /tmp/confluence-children-*.json
  rm -f /tmp/confluence-search.json /tmp/confluence-folder-children-*.json
  echo "Temp files cleaned up."
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

subcommand="${1:-}"
shift || true

case "$subcommand" in
  check-creds)           cmd_check_creds ;;
  fetch-page)            cmd_fetch_page "$1" ;;
  fetch-children)        cmd_fetch_children "$1" ;;
  check-exists)          cmd_check_exists "$1" "$2" ;;
  search)                cmd_search "$1" "$2" ;;
  create-page)           cmd_create_page "$1" "$2" "$3" "$4" ;;
  update-page)           cmd_update_page "$1" "$2" "${3:-}" "${4:-}" ;;
  write-page)            cmd_write_page "$1" "$2" "$3" "$4" ;;
  create-folder)         cmd_create_folder "$1" "$2" "$3" ;;
  list-folder-children)  cmd_list_folder_children "$1" ;;
  get-or-create-folder)  cmd_get_or_create_folder "$1" "$2" "$3" ;;
  delete-page)           cmd_delete_page "$1" ;;
  cleanup)               cmd_cleanup ;;
  *)
    echo "Usage: confluence-api.sh <subcommand> [args...]"
    echo ""
    echo "Subcommands:"
    echo "  check-creds                                            Validate Confluence credentials"
    echo "  fetch-page         <PAGE-ID>                           Fetch page to /tmp/confluence-page-{id}.json"
    echo "  fetch-children     <PARENT-ID>                         List child pages to /tmp/confluence-children-{id}.json"
    echo "  check-exists       <TITLE> <SPACE-KEY>                 Find page by exact title (CQL)"
    echo "  search             <QUERY> <SPACE-KEY>                 CQL search"
    echo "  create-page        <TITLE> <PARENT-ID> <SPACE> <FILE>  Create new page from HTML file"
    echo "  update-page        <PAGE-ID> <FILE> [TITLE] [PARENT]   Update page (auto version bump)"
    echo "  write-page         <TITLE> <PARENT-ID> <SPACE> <FILE>  Smart create-or-update"
    echo "  create-folder      <TITLE> <PARENT-ID> <SPACE-ID>      Create folder (v2 API)"
    echo "  list-folder-children <FOLDER-ID>                       List folder children"
    echo "  get-or-create-folder <TITLE> <PARENT-ID> <SPACE-ID>    Find or create folder"
    echo "  delete-page        <PAGE-ID>                           Delete a page"
    echo "  cleanup                                                Remove temp files"
    exit 1
    ;;
esac
