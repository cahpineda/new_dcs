---
name: ink:check-todos
description: List pending todos and optionally select one to work on
arguments:
  - name: filter
    description: Filter by priority (high, medium, low) or category
    required: false
---

# Check Todos

Review pending todos and select one to work on.

<objective>
Display all pending todos from `.planning/todos/pending/`, allow filtering, and optionally start working on one.
</objective>

<execution_flow>

## Step 1: Scan Todos Directory

```bash
TODO_DIR=".planning/todos/pending"
if [ ! -d "$TODO_DIR" ]; then
  echo "No todos directory found. Use /ink:add-todo to create your first todo."
  exit 0
fi

TODO_COUNT=$(ls -1 "$TODO_DIR"/*.md 2>/dev/null | wc -l)
```

## Step 2: Parse Todo Files

For each `*.md` file in `.planning/todos/pending/`:
- Extract YAML frontmatter (id, description, priority, category, created)
- Build list for display

## Step 3: Apply Filters (if provided)

If `{{filter}}` is provided:
- Filter by priority: `high`, `medium`, `low`
- Filter by category: `feature`, `bug`, `refactor`, `docs`, `research`, `chore`

## Step 4: Display Todos

**If no todos:**
```
No pending todos.

Use /ink:add-todo "description" to capture ideas for later.
```

**If todos exist:**
```
## Pending Todos (${TODO_COUNT})

### High Priority
| ID | Description | Category | Created |
|----|-------------|----------|---------|
| TODO-XXXXXXXX | [desc] | [cat] | [date] |

### Medium Priority
| ID | Description | Category | Created |
|----|-------------|----------|---------|
| TODO-XXXXXXXX | [desc] | [cat] | [date] |

### Low Priority
| ID | Description | Category | Created |
|----|-------------|----------|---------|
| TODO-XXXXXXXX | [desc] | [cat] | [date] |

---
Options:
1. Work on a todo: Tell me which ID to start
2. Add new todo: /ink:add-todo "description"
3. Filter: /ink:check-todos high
```

## Step 5: Handle Selection (if user selects a todo)

When user selects a todo ID:

1. **Read todo file** for full context
2. **Display details:**
   ```
   ## TODO-XXXXXXXX: [description]

   Priority: [priority]
   Category: [category]
   Created: [date]

   ### Context
   [context from todo file]

   ### Acceptance Criteria
   - [ ] [criterion 1]
   - [ ] [criterion 2]

   ---
   Ready to start? This will:
   1. Move todo to `.planning/todos/in-progress/`
   2. Start execution via /ink:go
   ```

3. **On confirmation:**
   - Move file to `.planning/todos/in-progress/`
   - Route to appropriate workflow:
     - All tasks → `/ink:go`

## Step 6: Complete Todo (after execution)

When work is done:

1. Move file to `.planning/todos/completed/`
2. Update frontmatter:
   ```yaml
   status: completed
   completed: [timestamp]
   commits: [list of commit hashes]
   ```

</execution_flow>

<todo_lifecycle>

```
.planning/todos/
├── pending/        # New todos waiting for attention
├── in-progress/    # Currently being worked on
└── completed/      # Done (archived for reference)
```

**State transitions:**
- `pending` → `in-progress` (user selects to work on)
- `in-progress` → `completed` (work finished)
- `in-progress` → `pending` (work paused/deferred)

</todo_lifecycle>

<success_criteria>
- All pending todos displayed with correct sorting
- Filters work correctly
- Selection starts appropriate workflow
- Completed todos archived properly
</success_criteria>
