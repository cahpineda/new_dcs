#!/bin/bash

# Stop Hook Shell Wrapper
# Audits /ink:go workflow compliance

exec node "$(dirname "$0")/audit-go-workflow.js" 2>/dev/null
