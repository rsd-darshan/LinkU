# LinkU – Tech stack (for AI and developers)

This file describes the technologies and conventions used in the LinkU codebase so that AI assistants and new developers can stay consistent.

## Core

| Category   | Technology | Notes |
|-----------|------------|--------|
| Framework | **Next.js 16** (App Router) | React framework, file-based routing under `app/` |
| Language  | **TypeScript** | Strict typing, no `any` where avoidable |
| UI        | **React 19** | Client components use `"use client"` where needed |
| Styling   | **Tailwind CSS 3** | Utility-first; design tokens in `tailwind.config.ts` (e.g. `brand`, `rounded-input`, `card`, `text-body-sm`) |
| Database  | **PostgreSQL** | Via Prisma |
| ORM       | **Prisma** | Schema in `prisma/schema.prisma`; run `prisma generate` / `prisma migrate` |

## Auth and infra

| Category   | Technology | Notes |
|-----------|------------|--------|
| Auth      | **Clerk** | `@clerk/nextjs`; sign-in/sign-up and user context |
| Payments  | **Stripe (optional)** | Checkout/webhook module exists in codebase; enable only when payment flow is active |
| Storage   | **AWS S3** | Presigned uploads via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` |
| Realtime  | **Polling (current)** | Realtime adapter is not active yet |
| Video     | **Agora** | `agora-rtc-react`, `agora-token` for calls |

## Key libraries

- **Zod** – Schema validation (API and forms).
- **date-fns** – Date formatting and manipulation.
- **lucide-react** – Icons (prefer over custom SVGs when consistent).
- **recharts** – Charts and data viz.
- **clsx** – Conditional class names.

## Conventions

- **Forms**: Shared form tokens in components (e.g. `form.input`, `form.btnPrimary`) for consistency; semantic labels and `aria-*` where helpful.
- **API routes**: Under `app/api/`; use Zod for body/query validation; return JSON and appropriate status codes.
- **Data fetching**: Server components and server actions where possible; `fetch` in client components for mutations or client-only data.
- **State**: Local `useState` first; lift only when needed; no global client state for purely UI.
- **Styling**: Prefer Tailwind tokens (`rounded-input`, `card`, `text-body-sm`, `brand-*`); avoid one-off magic numbers; use `focus-ring` for focus styles (see `app/globals.css`).

## Folder layout (high level)

- `app/` – Routes, layouts, API routes.
- `components/` – Reusable UI (layout, feature components).
- `lib/` – Shared utilities (auth, db, validation).
- `prisma/` – Schema and migrations.
- `services/` – Business logic (booking, matching, upload, and optional payment module).

## Commands

- `npm run dev` – Development server.
- `npm run build` / `npm run start` – Production build and start.
- `npm run prisma:generate` – Regenerate Prisma client.
- `npm run prisma:migrate` – Run migrations.
- `npm run lint` – ESLint.
