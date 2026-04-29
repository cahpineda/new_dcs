---
name: ink:custrq
description: Create a Customer Request document by gathering requirements conversationally
argument-hint: "[initial product or feature description]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - WebSearch
---

<objective>
Gather enough information from the user to produce a complete Ink Innovation Customer Request document, following the standard template. Ask no more than three questions per turn. Use British spelling throughout. Do not use em dashes or graphical icons. Bullet points and numbered lists are permitted. Do not use horizontal lines to separate sections in the final output.

IMPORTANT: Before generating any document, always fetch the current template from https://inkinnovation.atlassian.net/wiki/spaces/PRODUCTK/pages/1753481219 using the Confluence REST API to check for updates. The template may change over time. Use the fetched template as the authoritative source for section order, field names, roles list, and systems list.
</objective>

<template_structure>
The final document must follow the current template exactly as published at:
https://inkinnovation.atlassian.net/wiki/spaces/PRODUCTK/pages/1753481219/14+-+Customer+Request+Forms

As of the last fetch, the structure is, check the above linke to ensure template matches:

1. Cover: document title (feature name), subtitle "Customer Request"
2. Version Control table: 1 row only (1.0 — version, date, "First Draft/Customer Questionnaire", author)
3. Basic Information: Customer, Requestor Name, Date Submitted (no contact email, phone, or role)
4. Feature Request Details
   a. Feature Name
   b. What problem does this feature solve?
   c. Who will use this feature? (select from: Check-in staff, Gate agents, Supervisors/Managers, Baggage handlers, Operations control, Cabin crew, Pilots, Passengers, Other)
   d. Feature Description
   e. How important is this feature to the customer? (Critical / High / Medium / Low)
   f. When do you need this feature? (Urgently within 30 days / Soon within 3 months / Future within 6–12 months / No specific timeline)
   g. Describe the ideal workflow for this feature (numbered steps)
   h. Which existing system(s) should this feature integrate with? (select from: aura, zero, cupps.io, Ink Cloud, Microservices, Lounge, Kiosk, Baggage Drop, Biometrics, Other)
   i. Example scenario
   j. Rough sketch or mockup (optional)
   k. Any other information that would be helpful
   l. External links to complementary information (optional)
5. Product Proposed Solution (Ink-side placeholder — to be completed by Product Manager)
   - Feature Name
   - Business Context (Origin, Project Association, Industry Alignment, Dependencies)
   - Product Description
   - User Stories
   - Acceptance Criteria
   (Note: T-Shirt Sizing, Detailed Sizing, Sign-Off by Customer, and For Ink Use Only sections have been removed from the current template)
6. Copyright notice: ©2026, Ink Innovation S.L. All rights reserved.
</template_structure>

<required_fields>
These fields must be collected before generating the document:
- Customer name (the airline or company this request is from — must not be blank or "TBC")
- Feature name or title
- What problem does this feature solve (including the business impact)
- Who will use this feature (at least one role selected from current list)
- Feature description
- Importance level
- Timeline
- Ideal workflow (at least three steps)
- At least one example scenario
- At least two user stories

These fields are optional but should be asked about:
- Requestor name (no role or title required)
- The name of the person who should appear as document author (for the Version Control table)
- System integrations (from current systems list)
- External links to complementary information
- Mockup or sketch description
- Any other helpful information
</required_fields>

<step name="resolve-iata-code">
Whenever a customer name is provided (during collection or at generation time), check whether it looks like an IATA airline designator code — that is, it consists of only 2 or 3 letters (e.g. "RX", "EK", "BA", "UAL").

If it matches that pattern:
1. Use WebSearch to search for: `IATA airline designator code "[CODE]" airline name`
2. From the results, extract the full airline name (e.g. "RX" → "Riyadh Air").
3. Replace the customer value with the full airline name everywhere: in the document body, the Confluence page Customer field, and the folder name.
4. If the search returns no confident match (ambiguous or no results), keep the original code and add a note: "Customer code [CODE] could not be resolved to a full airline name — please verify."

Do not apply this check to names that already look like full names (contain a space, or more than 3 characters).
</step>


<process>

<step name="validate">
1. Validate Confluence credentials:
   ```bash
   bash .claude/skills/ink-confluence/confluence-api.sh check-creds
   ```
   If ERROR: stop and report credentials issue.
2. Proceed to workflow.
</step>

<step name="execute">
Load and execute @.claude/ink-workflows/workflows/custrq.md with `$ARGUMENTS` as input.
</step>

</process>
