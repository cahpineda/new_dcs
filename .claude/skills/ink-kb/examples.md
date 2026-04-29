# ink:kb Examples

## Automatic Folder Selection

The skill automatically detects and selects the most appropriate folder based on your query.

### Example A: Auto-selected "policies"

**Query:**
```
/ink:kb What validation rules are required for the email field?
```

**What happens:**
1. Skill detects keywords: "validation", "rules"
2. Auto-selects folder: "policies"
3. Executes query in policies folder

**Response:**
```
[Auto-selected folder: policies]

## Knowledge Base Result

**Query:** What validation rules are required for the email field?
**Folder:** policies

### Answer
[validation rules from policies folder]
```

---

### Example B: Auto-selected "confluence"

**Query:**
```
/ink:kb How to set up local development environment?
```

**What happens:**
1. Skill detects keywords: "how to", "documentation"
2. Auto-selects folder: "confluence"
3. Executes query in confluence folder

**Response:**
```
[Auto-selected folder: confluence]

## Knowledge Base Result

**Query:** How to set up local development environment?
**Folder:** confluence

### Answer
[setup guide from confluence folder]
```

---

### Example C: Fallback to "test-drive"

**Query:**
```
/ink:kb Tell me about airplanes
```

**What happens:**
1. Query doesn't match any specific folder intent
2. Auto-selects fallback folder: "test-drive"
3. Executes query in test-drive folder

**Response:**
```
[Auto-selected folder: test-drive]

## Knowledge Base Result

**Query:** Tell me about airplanes
**Folder:** test-drive

### Answer
[experimental response from test-drive folder]
```

---

## Explicit Folder Selection

You can explicitly specify a folder in your query:

### Example D: Explicit "policies" folder

**Query:**
```
/ink:kb policies: user authentication workflow
```

**What happens:**
1. Skill detects explicit folder reference: "policies"
2. Uses specified folder directly
3. Removes folder prefix from query

---

### Example E: Explicit "confluence" folder

**Query:**
```
/ink:kb confluence documentation about API integration
```

**What happens:**
1. Skill detects "confluence" keyword
2. Uses confluence folder
3. Searches for API integration docs

---

## Example 1: Data Validation Rules

**Query:**
```
/ink:kb What validation rules are required for the email field in users?
```

**Expected Response:**
```
## Knowledge Base Result

**Query:** What validation rules are required for the email field in users?

### Answer

The email field requires:
- Valid format according to RFC 5322
- Uniqueness in the system
- Maximum length of 255 characters
- Domain with valid MX record
- Normalization to lowercase before storage

### Sources
- User_Validation_Rules.md
- INK_Data_Standards.pdf

**Chunks analyzed:** 3
```

---

## Example 2: Process Workflows

**Query:**
```
/ink:kb What is the document approval workflow?
```

**Expected Response:**
```
## Knowledge Base Result

**Query:** What is the document approval workflow?

### Answer

The approval workflow consists of 3 phases:

**Phase 1: Creation**
- User creates document in DRAFT state
- Can edit multiple times
- Submits for review → state PENDING_REVIEW

**Phase 2: Review**
- Reviewer approves/rejects (48h maximum)
- Can request changes
- If approved → proceeds to Phase 3

**Phase 3: Final Approval**
- Final approver reviews (72h maximum)
- If approved → state FINALIZED
- If rejected → returns to Phase 1

Possible states: DRAFT, PENDING_REVIEW, APPROVED, REJECTED, FINALIZED

### Sources
- INK_Workflows.md
- Document_States.pdf

**Chunks analyzed:** 5
```

---

## Example 3: Policies

**Query:**
```
/ink:kb personal data retention policy
```

**Expected Response:**
```
## Knowledge Base Result

**Query:** personal data retention policy

### Answer

Personal data retention policy at INK:

**By data type:**
- Active user data: Retained while account is active
- Inactive user data: 2 years after last activity
- Transaction data: 7 years (tax requirement)
- Audit logs: 5 years
- Marketing data: Until consent revocation

**Compliance:**
Complies with GDPR and applicable local regulations. Users can request data deletion at any time.

### Sources
- Data_Retention_Policy.md
- GDPR_Compliance_INK.pdf

**Chunks analyzed:** 4
```

---

## Example 4: Integration Requirements

**Query:**
```
/ink:kb requirements for payment API integration
```

**Expected Response:**
```
## Knowledge Base Result

**Query:** requirements for payment API integration

### Answer

Requirements for INK payment API integration:

**Authentication:**
- API Key obtained from admin panel
- Header: Authorization: Bearer {API_KEY}
- Webhook secret to verify signatures

**Main endpoints:**
- POST /payments/intents - Create payment intent
- POST /payments/confirm - Confirm payment
- POST /webhooks/payment - Receive notifications

**Required configuration:**
- Webhook URL configured in admin panel
- Event handling: payment.succeeded, payment.failed
- 30 seconds timeout for requests

**Testing:**
- Use test API Key in sandbox environment
- Sandbox URL: https://api-sandbox.ink.com

### Sources
- INK_Payments_API.md
- Payment_Integration_Guide.pdf

**Chunks analyzed:** 6
```

---

## Query Patterns

### Effective Query Examples

**Validation queries:**
- "validation rules for users"
- "password requirements"
- "allowed format for phone numbers"

**Process queries:**
- "payment approval workflow"
- "onboarding process steps"
- "order lifecycle"

**Policy queries:**
- "API security policy"
- "encryption standards"
- "authentication requirements"

**Integration queries:**
- "how to integrate with notification system"
- "available endpoints for partners"
- "webhook requirements"

### Tips

✅ **Good:**
- Specific with context
- Use concrete entity names
- Ask directly what you need

❌ **Avoid:**
- Single words without context
- Too broad questions
- Generic terms

---

## Folder Selection Reference

Quick reference for automatic folder selection:

| Your Query Mentions | Auto-Selected Folder | Example Query |
|---------------------|----------------------|---------------|
| validation, rules, policy, workflow, standards, requirements | **policies** | "validation rules for users" |
| confluence, documentation, guide, how to, wiki | **confluence** | "confluence docs about deployment" |
| Generic or exploratory questions | **test-drive** | "general information about X" |

**Pro Tip:** You can always explicitly specify a folder by including it in your query:
- `/ink:kb policies: [your query]`
- `/ink:kb confluence [your query]`
- `/ink:kb test-drive: [your query]`
