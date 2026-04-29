---
name: ink:playwright
description: Generate and run Playwright test specs for any feature or page. Uses a two-layer accuracy strategy — project2context (source code) + playwright-cli snapshot (real DOM) — to guarantee locators are correct before writing a single line of test. When tests fail, uses playwright-cli attach to debug interactively at the exact failure point.
argument-hint: "[what to test] [--repo repo-name] [--branch branch-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__project2context__list_repositories
  - mcp__project2context__search_files
  - mcp__project2context__query_functions
  - mcp__project2context__get_function_details
user-invocable: true
---

<objective>
Generate a ready-to-run Playwright spec for any feature or page with the highest possible locator accuracy.

**Two-layer accuracy strategy:**

Layer 1 — PROACTIVE (before writing the spec):
  project2context  →  semantic understanding, candidate IDs from source code
  playwright-cli snapshot  →  confirms real element types against live DOM
  Both must agree before writing any selector.

Layer 2 — REACTIVE (only if a test fails after Layer 1):
  playwright-cli attach  →  interactive inspection at the exact failure point
  Snapshot at pause  →  reveals what the DOM actually looks like mid-test
  One targeted fix per failure, max 2 attempts before escalating.

This combination eliminates the two most common failure causes:
- Wrong assumption about element type (button vs img vs div) → caught by snapshot
- Dynamic state mismatch (element not yet visible, modal in the way) → caught by attach
</objective>

<usage>
/playwright [what to test] [--repo repo-name] [--branch branch-name]

Examples:
  /playwright login page
  /playwright passenger check-in form --repo cloud
  /playwright seat selection --repo load_control --branch master
  /playwright forgot password flow
</usage>

<process>

<step name="parse_arguments">
Parse `$ARGUMENTS`:

- **Feature description:** everything before any `--` flag. Required.
- **--repo:** repository short name (e.g., `cloud`, `cloud_2`, `load_control`). Optional.
- **--branch:** branch name. Optional, defaults to repo's default branch.

If no feature description: stop and show usage.

Store as `$FEATURE`, `$REPO_HINT`, `$BRANCH`.
</step>

<step name="resolve_repository">
1. Call `list_repositories` to get all indexed repos.
2. If `$REPO_HINT` provided → match by name (partial, case-insensitive). If ambiguous, show list and ask.
3. If no hint → filter to PHP/JS/TS repos with web UI mentions. If multiple, ask the user to pick.
4. Resolve `$BRANCH` from argument or repo default.

Store as `$REPO_URL` and `$BRANCH`.
</step>

<step name="extract_locators_from_source">
**LAYER 1A — project2context: semantic extraction.**

Run all searches in parallel. The goal is candidate selectors + business understanding.

**A — Relevant files**
```
search_files(repo_url, branch, query="$FEATURE template html form", limit=5)
search_files(repo_url, branch, query="$FEATURE javascript function handler", limit=5)
```
Identify the 2–4 most relevant files. Prioritize view/template files over utility classes.

**B — Input fields** (search by exact IDs in templates)
```
search_files(repo_url, branch, query="input field id name placeholder $FEATURE", mode="content", limit=5)
```
Capture: `id`, `name`, `type`, `placeholder` / `aria-label` for each field.

**C — Submit element** ← NEVER skip or assume
```
search_files(repo_url, branch, query="btnSubmit btnLogin btn_action type image onclick", mode="content", limit=5)
```
Record every candidate: `id`, HTML element type (`button`/`img`/`input[type=image]`/`div`/`a`), label text.
If multiple found: note which is primary vs secondary (modal close, etc.).

**D — Success indicator**
```
search_files(repo_url, branch, query="redirect success home after $FEATURE location header", mode="content", limit=5)
get_function_details(repo_url, branch, function_name="[main submit handler from C]")
```
Look for `location.href`, `header("Location: ...")`, or a success element ID.

**E — Error indicator**
```
get_function_details(repo_url, branch, function_name="[main submit handler from C]")
search_files(repo_url, branch, query="error message invalid $FEATURE element id", mode="content", limit=5)
```
Capture the error element `id`/selector and the URL pattern that indicates failure.

At the end of this sub-step you have **candidate locators** — not confirmed yet.
</step>

<step name="confirm_locators_with_snapshot">
**LAYER 1B — playwright-cli snapshot: DOM reality check.**

This step validates every candidate selector from Layer 1A against the actual rendered page.
It closes the gap between source code and real DOM (responsive variants, dynamic IDs, hidden fields).

**Check playwright-cli is available:**
```bash
which playwright-cli 2>/dev/null || echo "unavailable"
```

**If available — run snapshot protocol:**

```bash
# 1. Open the target URL in a headed browser (background process)
playwright-cli open "$PAGE_URL" &
CLI_PID=$!
sleep 3

# 2. Capture the full DOM snapshot
playwright-cli snapshot > /tmp/pw-snapshot.txt 2>&1

# 3. Close the browser
kill $CLI_PID 2>/dev/null
```

Read `/tmp/pw-snapshot.txt`. For each candidate locator from Layer 1A:
- Find it in the snapshot output
- Confirm its actual element type (textbox / img / button / generic)
- Note the exact `[ref=eN]` if the ID selector isn't present
- Check for duplicates (same alt text on multiple elements → must use ID)

**If playwright-cli is unavailable — skip silently and continue.**
The spec will be generated using only project2context data. Layer 2 (reactive) still applies if the test fails.

**Produce the Locator Manifest** — publish before writing any test code:

```
## Locator Manifest — [FEATURE] ([REPO] / [BRANCH])

### Layer 1A: source candidates   |  Layer 1B: DOM confirmed
─────────────────────────────────────────────────────────────
INPUT FIELDS
  #username     text      → ✅ confirmed: textbox "Your Username"
  #password     password  → ✅ confirmed: textbox "Your Password"

SUBMIT ELEMENT
  #btnLogin               → ✅ confirmed: <img> (not <button>!)
                             ⚠ 3 elements share alt="Submit Form" — ID selector required

SUCCESS INDICATOR
  top.location.href=data.url  → URL pattern: /home\.php/

ERROR INDICATOR
  #error-message          → ✅ confirmed: generic element, populated on failure

SOURCE FILES
  view_template_custom/login_auth.js (lines 493–599)
  login.php
  includes/js/login.component.js
```

If any locator has Layer 1A candidate but NO Layer 1B confirmation, mark it:
```
  #some-btn   → ⚠ NOT FOUND in snapshot — verify manually or run Layer 2
```

Do NOT proceed if a critical locator (submit or a required input) has ⚠. Ask the user to confirm.
</step>

<step name="ensure_config">
```bash
ls playwright.config.ts 2>/dev/null || echo "missing"
```

**If missing:** create `playwright.config.ts` that:
- Loads `.env` via `fs.readFileSync` (no dotenv dependency needed)
- Sets `testDir: './tests'`, `testMatch: '**/*.spec.ts'`
- Uses `headless: true`, `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`
- Single chromium project

**If exists:** read it, verify `.env` loading is present, add if missing.
</step>

<step name="generate_spec">
Generate `tests/[feature-slug].spec.ts` using ONLY locators from the confirmed Locator Manifest.

**Rules:**
- Use `#id` selectors — most stable for legacy PHP/jQuery apps
- Use `getByLabel()` / `getByPlaceholder()` only when no `id` exists
- NEVER use `getByRole('button')` — always use the confirmed element type from the manifest
- Comment each locator with its source file + line number
- `beforeAll` asserts required env vars exist and throws if missing

```typescript
/**
 * [FEATURE] — Playwright spec
 * Locators: double-verified via project2context + playwright-cli snapshot
 * Repo: [REPO] / [BRANCH]
 * Key files: [from manifest]
 */

import { test, expect } from '@playwright/test';

const PAGE_URL   = process.env.[URL_VAR]  ?? '';
const VALID_USER = process.env.[USER_VAR] ?? '';
const VALID_PASS = process.env.[PASS_VAR] ?? '';

test.describe('[Feature]', () => {
  test.beforeAll(() => {
    if (!PAGE_URL || !VALID_USER || !VALID_PASS)
      throw new Error('Missing env vars: [list them]. Check .env');
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    // Wait for first confirmed input — [source file:line]
    await page.locator('[#first-input]').waitFor({ state: 'visible' });
  });

  test('TC-001: [happy path description]', async ({ page }) => {
    // [source file:line] — confirmed type: [type from manifest]
    await page.locator('#field1').fill(VALID_USER);
    await page.locator('#field2').fill(VALID_PASS);

    // [source file:line] — confirmed: <[element type]>, NOT <button>
    await page.locator('#submit-id').click();

    // [source file:line] — success: redirects to [url pattern]
    await expect(page).toHaveURL(/[url-pattern]/, { timeout: 15_000 });
  });

  test('TC-002: [failure path description]', async ({ page }) => {
    await page.locator('#field1').fill('invalid@test.com');
    await page.locator('#field2').fill('wrongpassword');
    await page.locator('#submit-id').click();

    // URL stays on this page
    await expect(page).toHaveURL(/[current-page-pattern]/, { timeout: 10_000 });

    // [source file:line] — error element confirmed in manifest
    await expect(page.locator('#error-element')).not.toBeEmpty();
  });
});
```
</step>

<step name="run_and_verify">
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/[feature-slug].spec.ts --reporter=list
```

**If all tests pass → done:**
```
✅ 2 passed

  ✓ TC-001: [description] (Xs)
  ✓ TC-002: [description] (Xs)

Run again:
  npx playwright test tests/[feature-slug].spec.ts
```

---

**If a test fails → LAYER 2: playwright-cli attach**

Layer 2 is the reactive fallback. It pauses the test at the failure point and lets you inspect
the exact DOM state — something neither project2context nor a static snapshot can show.

```bash
# 1. Re-run with CLI debug mode (background — will pause waiting for attach)
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/[feature-slug].spec.ts \
  --debug=cli --reporter=list &
TEST_PID=$!

# 2. Wait for the session name to appear in output (look for "tw-XXXXXX")
sleep 5
```

Read the output to extract the session name (format: `tw-XXXXXX`).

```bash
# 3. Attach and snapshot at the paused failure point
playwright-cli attach [SESSION_NAME]
playwright-cli snapshot > /tmp/pw-debug-snapshot.txt 2>&1
```

Read `/tmp/pw-debug-snapshot.txt`. This shows the EXACT DOM at the moment of failure.

**Diagnose by error type:**

| Error | What to look for in snapshot | Fix |
|---|---|---|
| Locator not found | Is the element present? What is its actual selector? | Update `locator('#old')` → `locator('#real')` |
| Timeout (navigation) | Did the URL change at all? Where did it land? | Update `toHaveURL(/pattern/)` |
| Element not visible | Is the element in DOM but hidden? Is a modal blocking? | Add `waitFor({state:'visible'})` or dismiss modal first |
| Strict mode violation | Snapshot shows multiple matches for the selector | Use more specific selector with `nth(0)` or parent context |

```bash
# 4. After identifying the fix — resume the test
playwright-cli resume

# 5. Stop the background test run
kill $TEST_PID 2>/dev/null
```

Apply **one targeted edit** to the spec. Update the Locator Manifest to reflect the correction.
Re-run the test.

**Max 2 Layer 2 attempts.** If still failing after 2: stop, show the snapshot output, and ask the user for guidance. Do NOT rewrite the whole spec — the issue is likely environmental, not a locator problem.
</step>

</process>

<accuracy_summary>
How the two layers work together:

```
project2context (Layer 1A)
  Purpose : understand semantics, find candidate IDs
  Strength: fast, covers all code paths, repo-wide
  Weakness: source ≠ rendered DOM (responsive variants, JS-generated elements)

playwright-cli snapshot (Layer 1B)
  Purpose : confirm candidates against live DOM before writing any test
  Strength: sees exactly what the browser sees — element type, duplicates, refs
  Weakness: needs the app running; can't explain WHY an element exists

playwright-cli attach (Layer 2)
  Purpose : debug failures at the exact pause point mid-test
  Strength: DOM state after N interactions — catches timing and dynamic issues
  Weakness: reactive only; can't prevent the first failure
```

Combined accuracy: Layer 1A + 1B eliminates ~95% of locator errors before the test runs.
Layer 2 covers the remaining ~5% (dynamic state, race conditions, environment-specific behavior).
</accuracy_summary>

<constraints>
- NEVER write locators from source code alone — always validate with snapshot when available
- NEVER use `getByRole('button')` without snapshot confirmation that the element is a `<button>`
- NEVER apply more than 2 Layer 2 fix attempts — escalate to user on the 3rd failure
- NEVER rewrite the whole spec in Layer 2 — make one targeted selector fix per attempt
- Do not create test files outside `tests/`
- If playwright-cli is unavailable, proceed with Layer 1A only and clearly state that Layer 1B was skipped
</constraints>

<error_handling>
**playwright-cli unavailable:** Proceed with project2context only. Note in manifest which locators lack DOM confirmation. Layer 2 still applies on failure.

**App unreachable (snapshot fails):** Check that PAGE_URL is accessible. If behind VPN or auth wall, note it and skip Layer 1B.

**No project2context results:** Report which search returned nothing. Ask user to continue best-effort or provide file path hints.

**Repo not found:** List available repos and ask user to pick.

**playwright not installed:** `npm install --save-dev @playwright/test && npx playwright install chromium`

**Missing env vars:** Point to `.env.example`. Show exact var names needed.
</error_handling>
