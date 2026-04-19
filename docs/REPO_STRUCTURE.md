# Repository Structure

This repository follows domain-oriented boundaries while keeping Next.js conventions intact.

```text
app/
  page.tsx, layout.tsx, globals.css
  api/                  # HTTP boundary (request/response)
  linku-ai/             # AI product surfaces
  feed/, channels/, messages/, booking/, mentors/ ...

components/
  ui/                   # low-level design primitives
  feed/, messages/, layout/, mentor/ ...

services/               # domain/business logic (framework-light)
lib/                    # cross-cutting infrastructure and shared utilities
prisma/                 # schema, migrations, seed
docs/                   # architecture, recommendations, readiness docs
```

## Naming Conventions

- Route handlers: `app/api/<domain>/route.ts`
- Domain logic: `services/<domain>.ts`
- Shared infrastructure: `lib/<concern>.ts`
- UI composition: `components/<domain>/*`

## Practical Separation of Concerns

- **UI:** rendering + interaction state in `components/*`
- **HTTP/API:** auth, parsing, and response in `app/api/*`
- **Domain logic:** deterministic business rules in `services/*`
- **Infra:** auth, env, db, sanitization, and response helpers in `lib/*`

## Recent improvements

- Runtime configuration centralized in `lib/env.ts`.
- Mentor matching upgraded with explainable, weighted scoring in `services/matching.ts`.
- Discovery endpoint now supports tunable ranking and optional score breakdown output.
