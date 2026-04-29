---
name: ink:onboard
description: Interactive developer onboarding — guided first-time setup
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
---

<objective>
Walk a new developer through a friendly, practical guided tour of Ink Dev Helper.
Detects current project state silently and adapts the flow.
Safe to re-run anytime — idempotent.
No agent delegation, no MCP tools, no nested workflows.

KEY PRINCIPLE: No internals exposed. Never mention hooks, STATE.md, ink-tools.js,
enforce-ticket, telemetry, memory chapters, .planning directory, config.json, or
any implementation detail. The developer learns how to USE Ink, not how it works
under the hood. All state detection and setup happens silently.

UX PRINCIPLE: Simple, plain language. No jargon. Short screens. Interactive pacing.
The audience may not be deeply technical — write like you're explaining to a
smart colleague who's never used this tool before.
</objective>

<process>

<step name="silent_detect_and_welcome">
## Step 1: Welcome

**Silent setup (do NOT show any of this to the user):**

1. Run state detection silently:
```bash
node bin/ink-tools.js init go 2>/dev/null
```
2. Parse the JSON output. Note:
   - Whether `current_ticket` is set (and its value)
   - Whether `project_exists` is true
   - Whether `.planning/ROADMAP.md` exists

3. Display this banner:

```
╔═══════════════════════════════════════╗
║  Welcome to Ink Dev Helper            ║
╚═══════════════════════════════════════╝
```

**If ticket is already set:**

Display:
```
Welcome back! Let me show you the basics.
This'll take about 2 minutes.
```

**If no ticket set:**

Display:
```
I'll give you a quick tour of how this works.
It'll take about 2 minutes.

One thing to know: every session is tied to a Jira ticket.
When you start Claude, just type your ticket number
(like ACA-1234) and you're ready to go.
```

- DEMO-123 is only used as a reference in the onboarding narration.
  Do NOT modify STATE.md or set any ticket.

Continue to Step 2 immediately. No AskUserQuestion.
</step>

<step name="how_to_start">
## Step 2: How to Start

Display:

```
Step 1 of 5

When you open Claude, just do two things:

  1. Type your Jira ticket number
  2. Say what you want to do

Example:
  ┌──────────────────────────────────────┐
  │  You:  ACA-1234                      │
  │  You:  /ink:go add a login page      │
  └──────────────────────────────────────┘

That's it — Ink Dev takes it from there.
```

**Now use AskUserQuestion** with these options:
- "Next" — continue to Step 3
- "Skip — show me the commands" — jump to Step 6
</step>

<step name="plan_build">
## Step 3: What Happens Next

Display:

```
Step 2 of 5

Ink Dev reads your code, makes a plan, and shows
it to you before doing anything.

  ┌──────────────────────────────────────┐
  │  Plan: Login Page                    │
  │    1. Create login form              │
  │    2. Connect to auth service        │
  │    3. Add tests                      │
  └──────────────────────────────────────┘

You're always in control:

  /ink:go go ahead          Approve and start building
  /ink:go change task 2...  Ask for changes to the plan

Once approved, it builds each piece and saves
its work as it goes.
```

**Now use AskUserQuestion** with these options:
- "Next" — continue to Step 4
- "Skip — show me the commands" — jump to Step 6
</step>

<step name="testing_and_validation">
## Step 4: Testing & Validation

Display:

```
Step 3 of 5

After building, Ink Dev checks its own work:

  ┌──────────────────────────────────────┐
  │  Running tests...                    │
  │  ✗ 1 test failed                     │
  │  Auto-fixing...                      │
  │  ✓ All tests passing                 │
  └──────────────────────────────────────┘

If something breaks, it fixes it automatically.

You can also verify anytime with:

  /ink:verify       Check that everything works
  /ink:code-review  Review the code changes
```

**Now use AskUserQuestion** with these options:
- "Next" — continue to Step 5
- "Skip — show me the commands" — jump to Step 6
</step>

<step name="memory_and_knowledge">
## Step 5: It Remembers

Display:

```
Step 4 of 5

You can close Claude anytime. When you come back,
Ink Dev remembers what you were working on.

No need to re-explain anything.

It also knows your company's rules and guidelines,
so the code it writes follows your team's standards
automatically.
```

**Now use AskUserQuestion** with these options:
- "Next" — continue to Step 6
- "Skip — show me the commands" — jump to Step 6
</step>

<step name="commands_and_next">
## Step 6: Commands + NotebookLM + Final

Display:

```
Step 5 of 5

Here's what you'll use most:

  /ink:go [what you need]    The main command — does it all
  /ink:fix [problem]         Fix a bug
  /ink:new [feature]         Build something new
  /ink:verify                Check everything works
  /ink:code-review           Review your changes
  /ink:status                See where things stand
  /ink:jira [ticket]         Pull Jira details
  /ink:help                  Full command reference

You can always just type /ink:go and describe what
you need in plain language. It figures out the rest.
```

**Now use AskUserQuestion** with this question:

Question: "One last thing — do you use Google NotebookLM? You can connect your personal notebooks so Ink can answer questions from your docs without loading files into context."

Options:
- "Yes, connect NotebookLM"
- "No, I'm done"

---

**If "No, I'm done":** skip the NotebookLM setup and go directly to the final banner below.

**If "Yes, connect NotebookLM":**

1. **Check if already configured** (silently):
   ```bash
   node bin/ink-tools.js mcp check notebooklm 2>/dev/null
   ```
   If the result has `"configured": true` → display `✓ NotebookLM is already configured.` and skip to final banner.

2. **Read `.mcp.json` silently, add the notebooklm entry, write back:**
   - Read `.mcp.json`
   - Add inside `mcpServers`:
     ```json
     "notebooklm": {
       "type": "stdio",
       "command": "npx",
       "args": ["-y", "notebooklm-mcp@latest"],
       "description": "Personal NotebookLM RAG"
     }
     ```
   - Write updated JSON back to `.mcp.json`

3. Display:
   ```
   ✓ NotebookLM connected.

   After restarting Claude Code, use:
     /ink:notebook [your question]

   The first query will open a browser to log in with Google.
   Upload your docs at notebooklm.google.com first.
   ```

---

**Final banner (always shown):**

```
╔═══════════════════════════════════════╗
║  You're all set!                      ║
╚═══════════════════════════════════════╝
```

**Context-dependent next step (use state detected silently in Step 1):**

**If no PROJECT.md (new project):**

Display:
```
Just type /ink:go and it'll help you set things up.
```

**If PROJECT.md exists but no ticket:**

Display:
```
Type your ticket number, then /ink:go to get started.
```

**If PROJECT.md exists AND ticket is set:**

Display:
```
Type /ink:go to get started.
```

**Always end with:**

```
Tip: /ink:help has the full command reference.
```
</step>

</process>
