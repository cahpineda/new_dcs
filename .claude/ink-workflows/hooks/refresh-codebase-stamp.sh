#!/bin/bash

# Refresh Codebase Stamp Hook Shell Wrapper
# Touches STACK.md if >7 days old to suppress stale warning

node "$(dirname "$0")/refresh-codebase-stamp.js" &
exit 0
