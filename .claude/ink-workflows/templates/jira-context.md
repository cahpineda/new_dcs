
# Template: Jira Context

Template for `.planning/jira/JIRA-CONTEXT.md` - complete context of the active Jira ticket. Single file, overwritten on every ticket change.

**Purpose:** This file contains ALL the context needed to work on a Jira task without needing to query Jira again.

---

## File Structure

```markdown
---
requested_issue_key: [ISSUE-KEY]
hierarchy_mode: [none|up|down|all]
generated: [DATE]
---

> **TASK SCOPE — IMPLEMENT ONLY:** `[ISSUE-KEY]` (REQUESTED). All other issues in this file (parent hierarchy, related issues, same-epic issues) are **reference context only** — they explain the WHY and HOW, but must NOT be planned or implemented.

# [ISSUE-KEY]: [Summary] (REQUESTED)

**Type:** [Issue Type]
**Status:** [Status]
**Priority:** [Priority]
**Assignee:** [Assignee Name] ([Assignee Email])
**Reporter:** [Reporter Name] ([Reporter Email])
**Created:** [Created Date]
**Updated:** [Updated Date]
**Resolved:** [Resolution Date] (if applicable)

---

## Description

[Complete issue description - use rendered content if available]

---

## Hierarchy

> Only included when `--up` or `--all` flag is used.

The complete hierarchy from Epic to this issue. Can include multiple levels: Epic → Feature → Story → Task → Issue

### Epic: [EPIC-KEY]

**Summary:** [Epic Summary]
**Status:** [Epic Status]
**Description:** [Epic Description]

**Epic Objectives:**
- [Objective 1]
- [Objective 2]

### Feature: [FEATURE-KEY] (if exists)

**Summary:** [Feature Summary]
**Status:** [Feature Status]
**Type:** [Feature Type] (e.g., Feature, Story)

**Description:** [Feature Description]

### Parent: [PARENT-KEY] (if exists, and different from Feature)

**Summary:** [Parent Summary]
**Status:** [Parent Status]
**Type:** [Parent Type]

**Description:** [Parent Description]

**Note:** If there are multiple parent levels (e.g., Epic → Feature → Story → Task), list them all in order from most general to most specific.

### [ISSUE-KEY] (REQUESTED)

**Summary:** [Summary]
**Status:** [Status]
**Type:** [Issue Type]
**Priority:** [Priority]

**Description:** [Description]

**Labels:** [Labels]
**Components:** [Components]
**Fix Versions:** [Fix Versions]

---

## Related Issues

> Only included when `--down` or `--all` flag is used.

### Subtasks

> Subtask details included when `--down` or `--all` flag is used. Max recursion depth: 3 levels.

| Key | Summary | Status | Assignee |
|-----|---------|--------|----------|
| [SUB-1] | [Summary] | [Status] | [Assignee] |
| [SUB-2] | [Summary] | [Status] | [Assignee] |

**Subtask Details:** (for each subtask: key, status, description, assignee)

### Links

**Related:**
- **[LINK-KEY]**: [Summary] - [Link type: relates to/blocks/etc.]
- **[LINK-KEY]**: [Summary] - [Link type]

**Blocking:**
- **[BLOCK-KEY]**: [Summary] - blocks this issue
- **[BLOCK-KEY]**: [Summary] - this issue blocks

### Other Issues from Same Epic

> Only included when `--all` flag is used. Max 30 issues.

| Key | Summary | Status | Type |
|-----|---------|--------|------|
| [ISSUE-1] | [Summary] | [Status] | [Type] |
| [ISSUE-2] | [Summary] | [Status] | [Type] |

---

## Important History

### [Date] - Status Change

**From:** [Previous Status] → **To:** [New Status]
**By:** [User]
**Comment:** [Comment if exists]

---

### [Date] - Assignment

**Assigned to:** [New Assignee]
**By:** [User]

---

### [Date] - [Other Important Change]

[Change description]

---

## Raw Fields

All standard and custom fields from the Jira API response. Custom fields are shown with their field ID.

| Field | Value |
|-------|-------|
| [field_name or customfield_XXXXX] | [value] |

---

## Development Context

### What needs to be done?

[Executive summary of the task based on description and history]

### Why is it important?

[Epic context and business objectives]

### What to consider?

- [Technical consideration 1]
- [Technical consideration 2]
- [Dependencies with other issues]

### What is NOT included?

- [Explicitly excluded scope]
- [Features out of scope]

---

## Technical Information

**Relevant labels:** [Labels]
**Affected components:** [Components]
**Versions:** [Fix Versions]

**Useful links:**
- [Jira Issue](https://inkinnovation.atlassian.net/browse/[ISSUE-KEY])
- [Epic](https://inkinnovation.atlassian.net/browse/[EPIC-KEY]) (if applicable)

---

*Generated on: [Generation Date] | Issue Key: [ISSUE-KEY] | Last updated: [Updated Date]*

```

---

## Usage Guidelines

**Performance limits:** Subtask recursion: max 3 levels. Same epic: max 30. No comment fetching. Attachments: names/sizes only.

### "Hierarchy" Section

> Only include when `--up` or `--all` flag is used.

**Include:**
- Complete epic (if exists)
- All intermediate levels (Feature, Story, Task, etc. - if they exist)
- Complete parent chain (all levels between Epic and Issue)
- Complete main issue with `(REQUESTED)` marker

**Order:** Epic → Feature → Parent → Main Issue (from most general to most specific)

**Important:** The hierarchy can have multiple levels. For example:
- Epic → Feature → Story → Task → Issue
- Epic → Feature → Issue
- Epic → Issue

Always show ALL levels in the chain, not just the immediate parent.

**Purpose:** Understand the complete context of why this task exists.

### "Related Issues" Section

> Only include when `--down` or `--all` flag is used.

**Subtasks:** List all (max 3 levels). Include status, assignee, brief description.

**Links:** Group by type. Prioritize: blocks, is blocked by, duplicates.

**Same Epic:** Only when `--all`. Max 30 issues.

### "Important History" Section

Include: status changes, assignment changes, priority changes, version changes. Format: chronological, most recent first.

### "Raw Fields" Section

Dump ALL non-null fields from the Jira API response as a flat key-value table. Show field IDs as-is for custom fields (`customfield_XXXXX`). Purpose: complete field visibility for custom workflows.

### "Development Context" Section

**This is the most important section** - must be clear and actionable.

**Include:**
- Executive summary of WHAT to do
- WHY it's important (epic context)
- What to CONSIDER (technical, dependencies)
- What NOT to include (explicit scope)

**Purpose:** This section will be read by `/ink:go` or `/ink:debug` to quickly understand what to do.

---

## Complete Example

```markdown
---
requested_issue_key: ACA-2601
hierarchy_mode: all
generated: 2026-01-27
---

> **TASK SCOPE — IMPLEMENT ONLY:** `ACA-2601` (REQUESTED). All other issues in this file (parent hierarchy, related issues, same-epic issues) are **reference context only** — they explain the WHY and HOW, but must NOT be planned or implemented.

# ACA-2601: Implement OAuth2 authentication (REQUESTED)

**Type:** Story
**Status:** In Progress
**Priority:** High
**Assignee:** Carlos Hurtado (carlos.hurtado@inkaviation.com)
**Reporter:** Juan Pérez (juan.perez@inkaviation.com)
**Created:** 2026-01-15
**Updated:** 2026-01-27

---

## Description

Implement OAuth2 authentication to allow external users to authenticate using their Google or Microsoft accounts.

**Acceptance Criteria:**
- User can log in with Google
- User can log in with Microsoft
- JWT token is generated correctly
- Session persists for 7 days

---

## Hierarchy

The complete hierarchy from Epic to this issue: Epic → Feature → Issue

### Epic: ACA-2500

**Summary:** Authentication and Authorization
**Status:** In Progress
**Description:** Implement complete authentication and authorization system for the platform.

**Epic Objectives:**
- Allow authentication with multiple providers
- Implement RBAC (Role-Based Access Control)
- Secure all API routes

### Feature: ACA-2550

**Summary:** OAuth2 Integration
**Status:** In Progress
**Type:** Feature

**Description:** Integrate OAuth2 authentication providers (Google, Microsoft) to allow external users to authenticate with their corporate accounts.

### ACA-2601 (REQUESTED)

**Summary:** Implement OAuth2 authentication
**Status:** In Progress
**Type:** Story
**Priority:** High

**Labels:** `authentication`, `oauth2`, `security`
**Components:** `auth`, `api`

---

## Related Issues

### Subtasks

| Key | Summary | Status | Assignee |
|-----|---------|--------|----------|
| ACA-2602 | Configure Google OAuth | Done | Carlos |
| ACA-2603 | Configure Microsoft OAuth | In Progress | Carlos |
| ACA-2604 | Implement callback handler | To Do | - |

### Links

**Blocking:**
- **ACA-2599**: Configure environment variables - this issue blocks ACA-2601

### Other Issues from Same Epic

| Key | Summary | Status | Type |
|-----|---------|--------|------|
| ACA-2610 | Implement RBAC | To Do | Story |
| ACA-2620 | Secure API routes | To Do | Story |

---

## Important History

### 2026-01-27 - Status Change

**From:** To Do → **To:** In Progress
**By:** Carlos Hurtado

### 2026-01-20 - Assignment

**Assigned to:** Carlos Hurtado
**By:** Juan Pérez

---

## Raw Fields

| Field | Value |
|-------|-------|
| key | ACA-2601 |
| issuetype | Story |
| status | In Progress |
| priority | High |
| assignee | Carlos Hurtado |
| reporter | Juan Pérez |
| labels | authentication, oauth2, security |
| components | auth, api |
| customfield_10011 | ACA-2500 |
| customfield_10014 | ACA-2550 |
| customfield_10016 | 5 |

---

## Development Context

### What needs to be done?

Implement OAuth2 authentication with Google and Microsoft. Users log in with corporate accounts and receive a JWT token valid for 7 days.

### Why is it important?

Part of the authentication epic — critical for external user access.

### What to consider?

- ACA-2602 (Google OAuth) completed; ACA-2603 (Microsoft) in progress
- Callback handler must support both providers
- Tokens expire after 7 days

### What is NOT included?

- Authorization/RBAC, refresh tokens, multiple sessions

---

## Technical Information

**Relevant labels:** `authentication`, `oauth2`, `security`
**Affected components:** `auth`, `api`

**Useful links:**
- [Jira Issue](https://inkinnovation.atlassian.net/browse/ACA-2601)
- [Epic](https://inkinnovation.atlassian.net/browse/ACA-2500)

```

---

## Reminders

1. **Completeness:** The file must contain ALL necessary context
2. **Clarity:** The "Development Context" section must be clear and actionable
3. **Relevance:** Include only relevant information, not everything
4. **Structure:** Follow the template structure for consistency
5. **Links:** Include links to Jira for quick reference
6. **Flags:** Hierarchy and Related Issues sections are conditional — only include when the appropriate flag was used
