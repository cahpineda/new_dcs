# Platform Resolver

## Variable Resolution

The `{{PLATFORM_DIR}}` variable is resolved by each platform's command entry point:

| Platform | Entry Point | PLATFORM_DIR Value |
|----------|-------------|-------------------|
| Claude Code | .claude/commands/ink/*.md | .claude |
| Cursor | .cursor/commands/*.md | .cursor |
| OpenCode | .opencode/prompts/*.md | .opencode |
| Antigravity | .agent/workflows/*.md | .agent |

## How It Works

1. User invokes platform-specific command (e.g., /ink:go)
2. Command entry point sets PLATFORM_DIR before loading workflow
3. Workflow uses {{PLATFORM_DIR}} in @ references
4. Path resolves through platform's symlink to .claude/

## Path Resolution Example

User on Claude Code runs `/ink:go`:
1. .claude/commands/ink/go.md loads
2. Sets PLATFORM_DIR = ".claude"
3. References @.claude/ink-workflows/workflows/go.md
4. Resolves to @.claude/ink-workflows/workflows/go.md
5. Symlink: .claude/ink-workflows -> ../.claude/ink-workflows
6. Actual file: .claude/ink-workflows/workflows/go.md

## Benefits

- Single source of truth for all platforms
- No file duplication
- Platform-specific customizations only in entry points
- Consistent behavior across all AI coding platforms

## Implementation Notes

The actual variable substitution is handled by platform command wrappers.
Each platform's entry point must:
1. Define PLATFORM_DIR as a context variable
2. Pass it to all @ reference resolution
3. Ensure symlinks are correctly configured

See individual platform plans (17-02, 17-03) for setup details.
