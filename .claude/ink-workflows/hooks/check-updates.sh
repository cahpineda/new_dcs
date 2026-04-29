#!/bin/bash

# Check Updates Hook Shell Wrapper
# Runs update checker in background (non-blocking)

node "$(dirname "$0")/check-updates.js" &
exit 0
