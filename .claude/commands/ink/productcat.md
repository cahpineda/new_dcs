---
name: ink:productcat
description: Generate and publish product catalogue pages to Confluence
argument-hint: "[feature or area to document, e.g. 'PNR editing', 'boarding control']"
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - mcp__project2context__query_functions
  - mcp__project2context__search_api_by_functionality
  - mcp__project2context__query_classes
  - mcp__project2context__trace_call_path
  - mcp__project2context__find_similar_code
  - mcp__project2context__query_repository_summary
---

<objective>
Generate production-quality product catalogue documentation that matches the style of the Ink Cloud Product Catalogue in Confluence, sourced from live codebase analysis via project2context.

Target audience: Chief Product Officer, Product Managers, 1st/2nd level support, Sales, Account Management.

Tone: Accessible and clear — explains what the product does and why it matters, not how the code works internally. No jargon without explanation. British English throughout.

Output: A fully formatted Confluence page (or pages) published to the correct location.
</objective>

<style_rules>
The pages in the Product Catalogue follow a strict, consistent style. Every generated page MUST follow these rules:

**Always present:**
- Relevant Personas info banner at the top
- Intro description info banner (what the section covers, who it is for)
- Mermaid flowchart in the "How It Works" section — always `flowchart LR` direction
- Recommended Screenshot panel — a blue info panel titled "Recommended Screenshot" describing exactly what screenshot should be inserted, so a human can add it later
- British English spelling throughout
- No em dashes in prose (use commas, colons, or rephrase — em dashes are fine inside Mermaid diagrams)
- No emoji or decorative icons

**Section overview pages** (e.g. "Check-in — DCS", "Boarding", "APIS — DCS"):
1. Relevant Personas banner
2. Intro description banner (plain text)
3. H2: What Is [Feature Name]?
4. H2: How It Works — Recommended Screenshot panel + Mermaid flowchart LR
5. H2: Key Capabilities — bullet list, each item: **Bold term** — description
6. H2: What's in This Section — table (Page | What it covers) listing planned or existing sub-pages

**Feature detail sub-pages** (e.g. "Multiple Check-in Modes", "Seat Availability and Assignment"):
1. Relevant Personas banner
2. Intro paragraph (no heading — plain paragraph immediately after the banner)
3. Business Value banner (blue info panel titled "Business Value")
4. H2: What You'll Need — table (Requirement | Details)
5. H2: How It Works — numbered steps (plain prose, no code blocks)
6. H2: Outcome — short paragraph describing the end state
7. H2: What Can Go Wrong — short paragraph on known failure modes or edge cases

**Confluence storage format specifics:**
- Mermaid diagrams: `<ac:structured-macro ac:name="code"><ac:parameter ac:name="breakoutMode">wide</ac:parameter><ac:parameter ac:name="breakoutWidth">760</ac:parameter><ac:parameter ac:name="language">mermaid</ac:parameter><ac:plain-text-body><![CDATA[...]]></ac:plain-text-body></ac:structured-macro>`
- Recommended Screenshot: `<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Recommended Screenshot</ac:parameter><ac:rich-text-body><p>[description of what to screenshot]</p></ac:rich-text-body></ac:structured-macro>`
- Personas: `<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Relevant Personas</ac:parameter><ac:rich-text-body><p><strong>Persona A</strong> &nbsp;|&nbsp; <strong>Persona B</strong></p></ac:rich-text-body></ac:structured-macro>`
- Business Value / intro: `<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Business Value</ac:parameter><ac:rich-text-body><p>...</p></ac:rich-text-body></ac:structured-macro>`
- Bullet list items: `<ul><li><p><strong>Term</strong> &mdash; description</p></li></ul>`
- All H2 headings: `<h2>...</h2>` — no H1 (the page title IS the H1)
</style_rules>

<confluence_config>
Space: PRODUCTK
Space ID (numeric, for v2 API): 1171423245

## Catalogue roots (two separate product catalogues)

**DCS in Ink Cloud catalogue:**
- Root folder: 1288916234

**Load Control catalogue:**
- Root folder: 1768325150

**Other locations:**
- Integrations folder (integration-specific pages): 1759838211
- Customer Requests: 1755316225

## Top-level section pages already in DCS in Ink Cloud (do NOT duplicate — add sub-pages to them):
- Departure Control — Overview: 1720090625
- Check-in — DCS: 1288912587
- Boarding: 1288812659
- Baggage: 1289158657
- APIS — DCS: 1288912331
- Flight: 1288812931
- Load Control (DCS section): 1288781369
- Passenger: 1288813408
- Messaging: 1288813340
- Services — DCS: 1288913361
- Crew: 1289010147
- General Features: 1288813170
- Glossary of Terms: 1720057857
</confluence_config>

<process>

<step name="validate">
1. If `$ARGUMENTS` is empty, stop and report: "Usage: /ink:productcat [feature or area to document]"
2. Validate Confluence credentials:
   ```bash
   bash .claude/skills/ink-confluence/confluence-api.sh check-creds
   ```
   If ERROR: stop and report credentials issue.
3. Proceed to workflow.
</step>

<step name="clarify-catalogue">
Before proceeding, determine which catalogue the request belongs to. Use the following rules:

**If the request clearly maps to one catalogue, proceed without asking:**
- Mentions "load control", "weight and balance", "loadsheet", "fuel", "deadload", "ULD", "W&B", or "AHM" → **Load Control catalogue** (root: 1768325150)
- Mentions "business rules" → **Business Rules section** (parent: 1288817278, under DCS root 1288916234)
- Mentions "preferences" → **Preferences section** (parent: 1288916254, under DCS root 1288916234)
- Mentions any DCS feature (check-in, boarding, baggage, APIS, flight, passenger, messaging, crew, services, general features) → **DCS in Ink Cloud catalogue** (root: 1288916234)
- Mentions "integration", a third-party system name, or an external service → **Integrations folder** (1759838211)

**If the request is ambiguous or could apply to more than one catalogue**, ask:

> Which catalogue would you like to update?
> 1. **DCS in Ink Cloud** — check-in, boarding, baggage, APIS, flight, passenger, messaging, crew, services, general features
> 2. **Business Rules in Ink Cloud** — system-wide carrier configuration rules (APIS rules, check-in rules, messaging rules, load control rules, etc.)
> 3. **Preferences in Ink Cloud** — carrier-level preference toggles and settings
> 4. **Load Control** — weight and balance, loadsheet, fuel planning, ULD, deadload

Wait for the user's answer before proceeding to the execute step.
</step>

<step name="execute">
Load and execute @.claude/ink-workflows/workflows/productcat.md with `$ARGUMENTS` as input.
</step>

</process>
