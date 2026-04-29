#!/usr/bin/env bash
# =============================================================================
# atlassian-auth.sh — Shared Atlassian OAuth helpers
# Source this file from jira-api.sh and confluence-api.sh
# =============================================================================

_open_browser() {
  local url="$1"
  case "$(uname -s 2>/dev/null)" in
    Darwin)  open "$url" ;;
    Linux)
      if command -v xdg-open &>/dev/null; then xdg-open "$url"
      elif command -v wslview &>/dev/null; then wslview "$url"
      elif command -v powershell.exe &>/dev/null; then powershell.exe -NoProfile -Command "Start-Process '$url'"
      else echo "Open this URL in your browser: $url" >&2; fi ;;
    MINGW*|MSYS*|CYGWIN*)
      if command -v powershell.exe &>/dev/null; then
        powershell.exe -NoProfile -Command "Start-Process '$url'" 2>/dev/null
      else
        local escaped_url="${url//&/^&}"
        cmd.exe /c start "" "$escaped_url" 2>/dev/null
      fi || echo "Open this URL in your browser: $url" >&2 ;;
    *)
      if [ "$OS" = "Windows_NT" ] && command -v powershell.exe &>/dev/null; then
        powershell.exe -NoProfile -Command "Start-Process '$url'" 2>/dev/null
      else
        echo "Open this URL in your browser: $url" >&2
      fi ;;
  esac
}

# _wait_for_atlassian_oauth <email> <creds_url>
# Polls <creds_url>?email=<email> until status != oauth_required (max 120s).
# Prints the final creds JSON to stdout. Exits 1 on timeout.
_wait_for_atlassian_oauth() {
  local email="$1"
  local creds_url="$2"

  local creds
  creds=$(curl -s "${creds_url}?email=${email}")

  local status
  status=$(echo "$creds" | jq -r '.status // empty')

  if [ "$status" = "oauth_required" ]; then
    local auth_url
    auth_url=$(echo "$creds" | jq -r '.authUrl')
    echo "" >&2
    echo "╔══════════════════════════════════════════════════════════════╗" >&2
    echo "║  Atlassian authorization required                            ║" >&2
    echo "║  Click the link below or copy it to your browser.            ║" >&2
    echo "║  Waiting up to 120 seconds for authorization to complete.    ║" >&2
    echo "╚══════════════════════════════════════════════════════════════╝" >&2
    echo "" >&2
    # Print as ANSI hyperlink (clickable in terminals that support OSC 8)
    printf '\e]8;;%s\e\\>>> Click here to authorize Atlassian <<<\e]8;;\e\\\n' "$auth_url" >&2
    echo "" >&2
    # Always print the raw URL so the user can copy-paste if the link isn't clickable
    echo "  URL: $auth_url" >&2
    echo "" >&2

    _open_browser "$auth_url"

    local attempts=0
    while [ $attempts -lt 60 ]; do
      sleep 2
      attempts=$((attempts + 1))
      creds=$(curl -s "${creds_url}?email=${email}")
      status=$(echo "$creds" | jq -r '.status // empty')
      if [ "$status" != "oauth_required" ]; then
        echo "Authorization successful!" >&2
        break
      fi
      if [ $((attempts % 5)) -eq 0 ]; then
        echo "  Still waiting for authorization... ($((attempts * 2))s elapsed)" >&2
      fi
    done

    if [ "$status" = "oauth_required" ]; then
      echo "ERROR: Authorization timed out. Please try again." >&2
      exit 1
    fi
  fi

  echo "$creds"
}
