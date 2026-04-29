---
name: ink:set-profile
description: Change active model profile (quality/balanced/budget)
---

# Set Model Profile

Change the active model profile for agent spawning.

## Usage

```
/ink:set-profile [profile]
```

Where `profile` is one of: `quality`, `balanced`, `budget`

## Profiles

| Profile | Research | Planning | Execution | Verification | Cost |
|---------|----------|----------|-----------|--------------|------|
| quality | sonnet | opus | opus | sonnet | $$$ |
| balanced | sonnet | opus | sonnet | sonnet | $$ |
| budget | sonnet | sonnet | sonnet | sonnet | $ |

### Profile Descriptions

- **quality**: Maximum quality, higher cost. Use for critical features, complex architecture, production releases.
- **balanced**: Balance of quality and cost (default). Good for most development work.
- **budget**: Minimize cost, acceptable quality. Use for routine tasks, simple changes, exploration.

## Execution

1. Read `.planning/config.json`
2. Validate profile name is one of: quality, balanced, budget
3. Update `modelProfile` field
4. Write config.json back
5. Confirm change to user

## Example

User: `/ink:set-profile budget`

Response:
```
Model profile changed: balanced -> budget

New settings:
- Research: sonnet
- Planning: sonnet
- Execution: sonnet
- Verification: sonnet

Lower cost, acceptable quality. Use for routine tasks.
```

## Notes

- If config.json doesn't exist, create it from template
- Changes take effect on next agent spawn
- Current session's active agents are not affected
- Template location: `.claude/ink-workflows/templates/config.json`
