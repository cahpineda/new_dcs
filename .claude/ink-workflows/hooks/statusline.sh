#!/bin/bash

# Statusline Hook Shell Wrapper
# Executes statusline.js with proper path resolution

exec node "$(dirname "$0")/statusline.js" 2>/dev/null
