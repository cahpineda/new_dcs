#!/usr/bin/env bash
exec node "$(dirname "$0")/enforce-dedicated-commands.js" 2>/dev/null
