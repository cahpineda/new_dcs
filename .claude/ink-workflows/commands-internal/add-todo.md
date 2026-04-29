---
name: ink:add-todo
description: Capture an idea or task as a todo for later execution
arguments:
  - name: description
    description: Brief description of the todo item
    required: true
  - name: priority
    description: Priority level (high, medium, low)
    required: false
    default: medium
---

# Add Todo

Capture ideas, tasks, and future work items without interrupting current flow.

<objective>
Quickly record a todo item to `.planning/todos/` for later review and execution.
</objective>

<execution_flow>

## Step 1: Parse Input

Extract from user input:
- **Description:** What needs to be done
- **Priority:** high / medium / low (default: medium)
- **Context:** Current conversation context (if relevant)

## Step 2: Generate Todo ID

```bash
mkdir -p .planning/todos/pending
TODO_ID="TODO-$(date +%Y%m%d-%H%M%S)"
TODO_FILE=".planning/todos/pending/${TODO_ID}.md"
```

## Step 3: Infer Metadata

From description, infer:
- **Category:** feature / bug / refactor / docs / research / chore
- **Scope:** Which area of codebase (if determinable)
- **Phase:** Related phase (if in active milestone)

## Step 4: Create Todo File

Write to `${TODO_FILE}`:

```markdown
---
id: ${TODO_ID}
description: "{{description}}"
priority: {{priority}}
category: [inferred]
scope: [inferred or "general"]
phase: [current phase or null]
created: [timestamp]
status: pending
---

# ${TODO_ID}: {{description}}

## Context

[Capture relevant context from current conversation]

## Notes

[Any additional details inferred from description]

## Acceptance Criteria

- [ ] [inferred criterion 1]
- [ ] [inferred criterion 2]
```

## Step 5: Confirm

```
Todo captured.

ID: ${TODO_ID}
Priority: {{priority}}
Category: [category]

To view all todos: /ink:check-todos
To work on this: /ink:check-todos → select ${TODO_ID}
```

</execution_flow>

<priority_guidelines>

| Priority | When to Use |
|----------|-------------|
| **high** | Blocking issue, security concern, user-reported bug |
| **medium** | Enhancement, non-blocking improvement, tech debt |
| **low** | Nice-to-have, future idea, exploration |

</priority_guidelines>

<success_criteria>
- Todo file created in `.planning/todos/pending/`
- Metadata correctly inferred
- Context preserved from conversation
- Confirmation shown to user
</success_criteria>
