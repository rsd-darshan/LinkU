# LinkU: End-to-End Analysis & Production Readiness

## 1. Application Overview

### Purpose
LinkU is a **two-sided student platform** that connects:
- **Students** with **mentors** (book paid sessions, get advice, video calls)
- **Students** with **peers** (connections, channels, feed, messaging)
- **Students** with **admissions intelligence** (LinkU-AI: profile, applications, essay analysis, fit scoring, comparison)

### Target Users
| User type | Primary goals |
|-----------|----------------|
| **Students** | Find mentors, book sessions, build profile, manage applications, compare fit, network with peers, consume feed |
| **Mentors** | Get discovered, manage availability, earn via sessions, receive reviews |
| **Admins** | Approve mentors, manage users, moderate content, manage LinkU-AI data (raw data, statistics, outcomes) |

### Core Value Proposition
- **Mentorship**: Matching engine (major, country, GPA, target schools) + booking workflow + Agora video.
- **Community**: Channels, feed (for-you ranking), posts, comments, upvotes, sharing; connections and DMs.
- **Admissions (LinkU-AI)**: Global profile, university applications and supplements, essay analysis (OpenRouter), fit bands, peer comparison, outcome self-report for future ML.

### Current Architecture (High Level)
- **Frontend**: Next.js 16 App Router, React 19, Tailwind, design tokens in `globals.css` + `tailwind.config.ts`, shared components (`card-app`, `focus-ring`, `StateMessage`).
- **Auth**: Clerk; DB user sync via `getCurrentDbUser()`; role in metadata. **Route protection**: `proxy.ts` (Clerk middleware) protects all app routes (/, dashboard, profile, channels, messages, admin, booking, mentors, linku-ai, networking, notifications, reviews, feed, search, post); admin routes redirect non-admins to dashboard.
- **Backend**: API routes under `app/api/`, Prisma + PostgreSQL, Zod validation in many (not all) routes, `lib/http.ts` for consistent responses and `handleApiError()`.
- **Services**: `booking`, `chat-access`, `matching`, `review`, `upload`, optional `stripe` module, `realtime` (placeholder), feed-ranking, LinkU-AI (comparison engine, data pipeline, OpenRouter).

---

## 2. Gaps & Recommended Improvements

### 2.1 Missing or Weak Features
- **Route protection**: All authenticated app routes should be behind middleware so unauthenticated users are redirected once, not per-page.
- **Reported accounts**: Referenced in PRODUCTION.md and admin API; no Report model or full workflow.
- **Realtime**: `services/realtime.ts` is placeholder; messaging/notifications rely on polling.
- **Audit logging**: No audit log for admin actions, payments, or sensitive ops.
- **Rate limiting**: No API rate limiting (auth, booking, messages, uploads).
- **LinkU-AI**: Cron and outcomes are admin-only; student self-report exists. No in-app “results” dashboard for students.

### 2.2 Frontend (UI/UX, Responsiveness, A11y, Performance, Consistency)
- **Strengths**: Design tokens, `StateMessage`, focus rings, reduced motion, semantic headings, some `aria-*`.
- **Gaps**:
  - **Loading**: Many pages have `loading.tsx` (skeleton or spinner); some client components show `loading` state inconsistently (e.g. no skeleton for lists).
  - **Error feedback**: API errors often surface as inline text; no global toast or notification system for success/error.
  - **Empty states**: Not all lists have explicit empty-state copy or CTAs.
  - **Responsiveness**: Layout is responsive (e.g. sidebar hidden on small screens); some forms/tables could be tuned for mobile.
  - **Accessibility**: Landmarks and labels vary; not all forms have `aria-describedby` or live regions for dynamic errors.
  - **Consistency**: Mix of `rounded-input`, `rounded-card`; some buttons use `min-h-[44px]`, others don’t. Standardizing primary/secondary/danger button variants would help.

### 2.3 Backend (Structure, DB, API, Security)
- **Strengths**: Prisma schema with indexes and relations, Zod where used, central `handleApiError`, sanitization for text.
- **Gaps**:
  - **Validation**: Some routes parse body without Zod (e.g. type assertion only); every mutation should use a schema.
  - **Idempotency**: No idempotency keys for booking or payments.
  - **DB**: No soft deletes; no `Report` model; `User` has no `fullName` (lives on Student/Mentor profile only).
  - **API**: No versioning; no request ID or correlation ID for tracing; error responses don’t always use a consistent `{ error: string, code?: string }` shape.
  - **Security**: No CSRF beyond SameSite cookies; no rate limiting; S3 presign doesn’t restrict key prefix by user (key includes `users/${userId}` — good).

### 2.4 Scalability & Maintainability
- **Services**: Domain logic in `services/` and `lib/linku-ai/` is good; some API routes are large (e.g. compare) and could delegate to a service.
- **Code organization**: Shared types live in `lib/validation.ts` and `lib/linku-ai/schemas.ts`; a single `lib/api-types.ts` or per-domain types could reduce duplication.
- **Config**: Feature flags and env-based toggles are minimal; no central config module.

### 2.5 Validation, Errors, Loading, Edge Cases, User Feedback
- **Validation**: Zod used in many APIs; ensure all POST/PATCH bodies and critical query params use schemas; return 400 with clear messages.
- **Error handling**: `handleApiError` maps Zod/Unauthorized/Forbidden to HTTP responses; 500 doesn’t expose stack in production (only logs in dev). Add request ID and structured logging.
- **Loading states**: Client components use local `loading`/`saving`; no global pending indicator for navigations.
- **Edge cases**: Booking checks mentor availability and slot; compare handles missing profile/essay. More defensive checks (e.g. duplicate connection request) would help.
- **User feedback**: Success messages are inline (“Saved.”, “Result recorded.”); no toasts or persistent notification area.

### 2.6 Production Readiness
- **Env**: `.env.example` exists with placeholders; document required vs optional and which keys are needed for which features.
- **Health**: `GET /api/health` runs `SELECT 1` and returns 503 if DB fails — good; add optional dependency checks for “degraded” state.
- **Logging**: No structured logger; `console.error` in dev only in `handleApiError`. Add Pino/Axiom and log errors with request context.
- **Monitoring**: No Sentry or APM; add error tracking and optional performance hooks.
- **Deployment**: Build and start commands are standard; add note for `prisma migrate deploy` in CI/CD and never `migrate dev` in production.

---

## 3. Implementation Priorities

### P0 (Security & Correctness)
1. **Middleware**: Protect all app routes that require auth in `proxy.ts` (booking, mentors, linku-ai, networking, notifications, reviews, feed, search) so unauthenticated users are redirected in one place. (Done.)
2. **API validation**: Ensure every mutation uses Zod (or shared schema); return consistent 400 messages.
3. **Error handling**: Never expose stack or internal details in production; add request-scoped logging for 5xx.

### P1 (Robustness & UX)
4. **Central API error handling**: Optional wrapper or helper that logs, attaches request ID, and returns a consistent JSON shape.
5. **Loading and empty states**: Use `StateMessage` (or a shared skeleton) everywhere lists can be empty or loading; consistent button disabled states during submit.
6. **Health check**: Extend with optional checks (DB + feature-flagged dependencies) and return 503 when critical deps are down.

### P2 (Scale & Ops)
7. **Rate limiting**: Add to auth, booking, messages, uploads (e.g. Upstash).
8. **Structured logging**: Replace ad-hoc console with a logger that includes request ID and level.
9. **Report flow**: Add Report model and admin queue if moderation is required for launch.

### P3 (Polish)
10. **Toasts / notifications**: Global success/error feedback for key actions.
11. **Audit log**: Table or service for admin and payment events.
12. **Realtime**: Replace placeholder for messaging/notifications if product requires it.

---

## 4. Refactoring Suggestions

- **Middleware**: This project uses `proxy.ts` (Next.js convention); protected-route list is expanded to cover all app routes.
- **API response shape**: Standardize on `{ data?: T, error?: string, code?: string }` for JSON responses where useful; keep `ok(data)` for success and `{ error }` for errors.
- **Buttons**: Extract `<Button variant="primary" | "secondary" | "danger">` with consistent size and focus.
- **Forms**: Shared `<FormField error="">` and label/input grouping for accessibility and consistency.
- **LinkU-AI**: Compare route could call a `compareService()` in `lib/linku-ai/` to keep the route thin.

---

## 5. Summary Table

| Area | Status | Action |
|------|--------|--------|
| Auth & route protection | Partial | Protect all app routes in middleware |
| API validation | Good coverage | Add Zod to any remaining mutations |
| Error handling | Centralized | Add logging + request ID; no stack in prod |
| Loading / empty states | Mixed | Standardize with StateMessage/skeletons |
| Security headers | Set | Keep; add rate limiting |
| Health check | DB only | Optional dependency checks; 503 on failure |
| Logging / monitoring | Minimal | Structured logs + Sentry (or similar) |
| Env & deployment | Documented | Env.example + deploy notes |
| Realtime / audit / report | Missing | P2/P3 as needed |

This document should be updated as items are implemented and re-prioritized.
