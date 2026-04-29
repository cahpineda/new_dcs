# Product Catalogue Style Guide

## Style Rules

The pages in the Product Catalogue follow a strict, consistent style. Every generated page MUST follow these rules:

**Always present:**
- Relevant Personas info banner at the top
- Intro description info banner (what the section covers, who it is for)
- Mermaid flowchart in the "How It Works" section — always `flowchart LR` direction
- Recommended Screenshot panel — a blue info panel titled "Recommended Screenshot" describing exactly what screenshot should be inserted, so a human can add it later
- British English spelling throughout
- No em dashes in prose (use commas, colons, or rephrase — em dashes are fine inside Mermaid diagrams)
- No emoji or decorative icons

## Section Overview Pages

Structure (e.g. "Check-in — DCS", "Boarding", "APIS — DCS"):
1. Relevant Personas banner
2. Intro description banner (plain text)
3. H2: What Is [Feature Name]?
4. H2: How It Works — Recommended Screenshot panel + Mermaid flowchart LR
5. H2: Key Capabilities — bullet list, each item: **Bold term** — description
6. H2: What's in This Section — table (Page | What it covers) listing planned or existing sub-pages

## Feature Detail Sub-Pages

Structure (e.g. "Multiple Check-in Modes", "Seat Availability and Assignment"):
1. Relevant Personas banner
2. Intro paragraph (no heading — plain paragraph immediately after the banner)
3. Business Value banner (blue info panel titled "Business Value")
4. H2: What You'll Need — table (Requirement | Details)
5. H2: How It Works — numbered steps (plain prose, no code blocks)
6. H2: Outcome — short paragraph describing the end state
7. H2: What Can Go Wrong — short paragraph on known failure modes or edge cases

## Confluence Storage Format

Mermaid diagrams:
```
<ac:structured-macro ac:name="code"><ac:parameter ac:name="breakoutMode">wide</ac:parameter><ac:parameter ac:name="breakoutWidth">760</ac:parameter><ac:parameter ac:name="language">mermaid</ac:parameter><ac:plain-text-body><![CDATA[...]]></ac:plain-text-body></ac:structured-macro>
```

Recommended Screenshot:
```
<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Recommended Screenshot</ac:parameter><ac:rich-text-body><p>[description]</p></ac:rich-text-body></ac:structured-macro>
```

Personas banner:
```
<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Relevant Personas</ac:parameter><ac:rich-text-body><p><strong>Persona A</strong> &nbsp;|&nbsp; <strong>Persona B</strong></p></ac:rich-text-body></ac:structured-macro>
```

Business Value / intro banner:
```
<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Business Value</ac:parameter><ac:rich-text-body><p>...</p></ac:rich-text-body></ac:structured-macro>
```

Bullet list items: `<ul><li><p><strong>Term</strong> &mdash; description</p></li></ul>`

All H2 headings: `<h2>...</h2>` — no H1 (the page title IS the H1)

## Available Personas

Use only from this list — add "Other" only if genuinely needed and define it:
- Check-in Agent
- Gate Agent
- Load Controller / Load Planner
- Airline Operations Controller
- Ground Handling Supervisor
- Airline Reservations Manager
- IT Administrator
- Cabin Crew
- Passenger
- Sales / Account Manager (use only on commercially-focused pages)

## Mermaid Flowchart Rules

- Always `flowchart LR` (left to right)
- Node labels: `[Plain text description]` for rectangular, `{Decision?}` for diamonds, `([Start/End])` for rounded
- Keep labels short — max 8 words per node
- Maximum 12 nodes — if complex, break into two diagrams
- Show happy path as main flow; branch off for error/exception paths
- Example:
  ```
  flowchart LR
      A[Passenger checks in] --> B[Agent scans travel document]
      B --> C{TIMATIC validation}
      C -->|Pass| D[Data stored]
      C -->|Fail| E[Agent alerted]
      D --> F[APIS transmitted]
  ```

## Content Guidance

**Recommended Screenshot descriptions — examples:**
- "Ink Cloud check-in screen showing a passenger record with the seat map open and the 'Assign Seat' button highlighted"
- "Gate boarding screen showing the real-time boarded count, the scan input field, and a passenger with a WCHR SSR flagged in red"

**Business Value banner:** 2-3 sentences max. Focus on operational or commercial benefit. Examples:
- "One platform covers every check-in channel a carrier operates today or plans to offer tomorrow. Adding a new channel is a configuration change, not a new system."
- "Agents never need to leave Ink Cloud to look up visa or entry requirements. TIMATIC validation happens automatically during check-in, cutting average check-in time for international passengers."

**Key Capabilities bullets:** Each bullet: `**Short capability name** — one or two sentences explaining what it does and why it matters. No sub-bullets. No numbers.`

**What You'll Need table:** 3-5 rows. Each row is a prerequisite — hardware, configuration, permission, or integration.

**What Can Go Wrong:** 2-4 sentences. Cover most common failure modes: misconfiguration, missing data, third-party dependency failure. Valuable for 1st/2nd level support.

## Style Guide

- Address the reader as a professional who understands airline operations but is not an engineer
- Explain "why this matters" in every capability description, not just "what it does"
- Use airline industry terminology correctly (PNR, SSR, APIS, TIMATIC, GDS, PSS, DCS, boarding pass, gate stop, manifest) without over-explaining standard terms
- Avoid: "the system uses", "the code implements", "the database stores" — instead: "agents can", "the platform", "Ink Cloud tracks"
- Quantify where possible: "supports 15+ government APIS formats", "processes seat changes in under two seconds" — only if from actual codebase evidence
- Sales-friendly framing for Key Capabilities: lead with the outcome, not the mechanism

## Example Invocations

```
/ink:productcat document the PNR editing capability in check-in
```
→ Feature sub-page under Check-in — DCS (ID: 1288912587)

```
/ink:productcat create an overview page for the Lounge module
```
→ Section overview page under Departure Control (ID: 1288916234)

```
/ink:productcat write up how the weight and balance calculation works
```
→ Feature sub-page under Load Control (ID: 1288781369)

```
/ink:productcat document the SITA Type-B messaging integration
```
→ Integration page under Integrations folder (ID: 1759838211)
