#!/bin/bash

# PreToolUse Hook Shell Wrapper
# Enforces ink-tools.js usage for .planning/ operations

exec node "$(dirname "$0")/enforce-ink-tools.js" 2>/dev/null
