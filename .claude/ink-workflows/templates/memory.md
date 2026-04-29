# Memory.md Template

Template for `memory.md` in project root - High-level architecture overview for Cursor @memory.md reference.

---

## File Template

```markdown
# {project_name}

**Last updated:** {date}
**Architecture:** {architecture_pattern}
**Stack:** {primary_stack}

## Quick Overview

{project_description}

## Core Architecture

### Layers

{architecture_layers}

### Key Components

{key_components}

### Data Flow

{data_flow_summary}

## Technology Stack

**Runtime:** {runtime}
**Framework:** {framework}
**Database:** {database}
**Key Dependencies:** {key_dependencies}

## Directory Structure

```
{directory_layout}
```

## Key Files Reference

### Entry Points
{entry_points}

### Core Modules
{core_modules}

### Configuration
{configuration_files}

## Design Decisions

{design_decisions}

## Known Concerns

{known_concerns}

## Development Notes

### Testing
{testing_summary}

### Conventions
{conventions_summary}

### External Integrations
{integrations_summary}

---

**For detailed information, see:**
- Architecture: `.planning/codebase/ARCHITECTURE.md`
- Full stack: `.planning/codebase/STACK.md`
- Code conventions: `.planning/codebase/CONVENTIONS.md`
- Testing practices: `.planning/codebase/TESTING.md`
- Technical concerns: `.planning/codebase/CONCERNS.md`
```

---

## Template Variables

This template should be filled using data from the codebase analysis documents:

| Variable | Source |
|----------|--------|
| `{project_name}` | PROJECT.md or package.json name |
| `{date}` | Current date (YYYY-MM-DD) |
| `{architecture_pattern}` | ARCHITECTURE.md → Pattern Overview |
| `{primary_stack}` | STACK.md → Languages (first listed) |
| `{project_description}` | PROJECT.md or ARCHITECTURE.md summary |
| `{architecture_layers}` | ARCHITECTURE.md → Layers (bullet list) |
| `{key_components}` | ARCHITECTURE.md → Key Abstractions |
| `{data_flow_summary}` | ARCHITECTURE.md → Data Flow (condensed) |
| `{runtime}` | STACK.md → Runtime |
| `{framework}` | STACK.md → Frameworks (primary) |
| `{database}` | INTEGRATIONS.md or STACK.md → Database |
| `{key_dependencies}` | STACK.md → Dependencies (top 3-5) |
| `{directory_layout}` | STRUCTURE.md → Directory Layout (formatted as tree) |
| `{entry_points}` | ARCHITECTURE.md → Entry Points |
| `{core_modules}` | STRUCTURE.md → Key Locations |
| `{configuration_files}` | STACK.md → Configuration |
| `{design_decisions}` | ARCHITECTURE.md → Key Decisions (if exists) |
| `{known_concerns}` | CONCERNS.md → Top 3-5 concerns |
| `{testing_summary}` | TESTING.md → Framework + Coverage |
| `{conventions_summary}` | CONVENTIONS.md → Code Style summary |
| `{integrations_summary}` | INTEGRATIONS.md → External APIs/Services |

## Filling Guidelines

1. **Keep it concise:** memory.md should be ~100-150 lines max
2. **Focus on navigation:** Help Claude find the right files quickly
3. **Include file paths:** Always use backtick formatting for paths
4. **Link to details:** Reference the full .planning/codebase/ docs
5. **Use bullet points:** Easy scanning
6. **Omit empty sections:** If no database, don't include Database: (none)

## Example Output

```markdown
# My SaaS App

**Last updated:** 2026-01-25
**Architecture:** Layered monolith with service layer
**Stack:** TypeScript + React + Node.js

## Quick Overview

Web application for project management with real-time collaboration.
RESTful API backend with React SPA frontend.

## Core Architecture

### Layers

- **API Layer:** Express routes with OpenAPI spec (`src/api/routes/*.ts`)
- **Service Layer:** Business logic (`src/services/*.ts`)
- **Data Layer:** Prisma ORM with PostgreSQL (`src/db/`)
- **Frontend:** React components with Zustand state (`src/components/`)

### Key Components

- `UserService` - User management and authentication
- `ProjectService` - Project CRUD and permissions
- `NotificationService` - Real-time updates via WebSocket

### Data Flow

Request → Route → Validation → Service → Database → Response

## Technology Stack

**Runtime:** Node.js 20
**Framework:** Express + React 18
**Database:** PostgreSQL 15 + Redis
**Key Dependencies:** Prisma, Zod, Socket.io, Zustand

## Directory Structure

```
src/
├── api/          # REST endpoints
├── services/     # Business logic
├── db/           # Database + migrations
├── components/   # React UI
└── lib/          # Shared utilities
```

## Key Files Reference

### Entry Points
- `src/server.ts` - API server
- `src/app.tsx` - React app

### Core Modules
- `src/services/user.ts` - Authentication
- `src/services/project.ts` - Project management
- `src/api/routes/v1/` - API routes

### Configuration
- `.env.example` - Environment template
- `prisma/schema.prisma` - Database schema

## Design Decisions

- **Stateless JWT auth** - Enables horizontal scaling
- **Optimistic updates** - Better UX for real-time features
- **Server-side validation** - Zod schemas at API boundary

## Known Concerns

- Missing error handling in `src/api/webhooks/stripe.ts`
- TODO: Implement rate limiting (see `src/api/middleware/`)
- Large component: `src/components/Dashboard.tsx` (300+ lines)

## Development Notes

### Testing
- Framework: Vitest + React Testing Library
- Coverage: 75% overall, 100% for services/

### Conventions
- File naming: kebab-case.ts, PascalCase.tsx
- Formatting: Prettier with 2-space indent
- Commits: Conventional Commits format

### External Integrations
- Stripe - Payment processing
- SendGrid - Email delivery
- Sentry - Error tracking

---

**For detailed information, see:**
- Architecture: `.planning/codebase/ARCHITECTURE.md`
- Full stack: `.planning/codebase/STACK.md`
- Code conventions: `.planning/codebase/CONVENTIONS.md`
- Testing practices: `.planning/codebase/TESTING.md`
- Technical concerns: `.planning/codebase/CONCERNS.md`
```
