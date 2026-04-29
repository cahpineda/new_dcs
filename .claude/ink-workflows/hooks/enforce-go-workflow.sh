#!/bin/bash

# UserPromptSubmit Hook Shell Wrapper
# Enforces /ink:go 5-step workflow execution

exec node "$(dirname "$0")/enforce-go-workflow.js" 2>/dev/null
