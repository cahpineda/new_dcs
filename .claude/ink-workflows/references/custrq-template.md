# Customer Request — Template Reference

## Template Source
Live template at: https://inkinnovation.atlassian.net/wiki/spaces/PRODUCTK/pages/1753481219/14+-+Customer+Request+Forms
Always fetch before generating to check for updates.

## Document Structure

1. Cover: document title (feature name), subtitle "Customer Request"
2. Version Control table: 1 row only (1.0 — version, date, "First Draft/Customer Questionnaire", author)
3. Basic Information: Customer, Requestor Name, Date Submitted (no contact email, phone, or role)
4. Feature Request Details
   a. Feature Name
   b. What problem does this feature solve?
   c. Who will use this feature? (select from roles list)
   d. Feature Description
   e. How important is this feature to the customer? (Critical / High / Medium / Low)
   f. When do you need this feature? (Urgently within 30 days / Soon within 3 months / Future within 6-12 months / No specific timeline)
   g. Describe the ideal workflow for this feature (numbered steps)
   h. Which existing system(s) should this feature integrate with? (select from systems list)
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

## Required Fields

These fields must be collected before generating the document:
- Customer name (the airline or company — must not be blank or "TBC")
- Feature name or title
- What problem does this feature solve (including the business impact)
- Who will use this feature (at least one role selected from current list)
- Feature description
- Importance level
- Timeline
- Ideal workflow (at least three steps)
- At least one example scenario
- At least two user stories

Optional but should be asked about:
- Requestor name (no role or title required)
- The name of the person who should appear as document author
- System integrations (from current systems list)
- External links to complementary information
- Mockup or sketch description
- Any other helpful information

## Roles List

ALL_ROLES = ["Check-in staff", "Gate agents", "Supervisors/Managers", "Baggage handlers", "Operations control", "Cabin crew", "Pilots", "Passengers", "Other"]

## Systems List

ALL_SYSTEMS = ["aura", "zero", "cupps.io", "Ink Cloud", "Microservices", "Lounge", "Kiosk", "Baggage Drop", "Biometrics", "Other"]

## Importance Options

- Critical: Operation cannot function properly without it
- High: Creates significant operational challenges without it
- Medium: Would improve efficiency but workarounds exist
- Low: Nice to have

## Timeline Options

- Urgently: Within next 30 days
- Soon: Within next 3 months
- Future: Within next 6-12 months
- No specific timeline
