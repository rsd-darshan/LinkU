# Production Readiness Checklist

Use this checklist before deploying LinkU to production. For a full analysis (architecture, gaps, priorities), see [docs/PRODUCTION-READINESS-ANALYSIS.md](docs/PRODUCTION-READINESS-ANALYSIS.md).

## 1. Environment & secrets

- [ ] **Production env** – Use a dedicated `.env.production` or platform env vars (Vercel, etc.). Never commit real secrets.
- [ ] **Clerk** – Switch to production instance; set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`; add production domain to Clerk Dashboard allowed origins/redirect URLs.
- [ ] **Database** – Use a managed PostgreSQL provider (e.g. Neon or RDS) with a strong `DATABASE_URL`; run migrations in CI or deploy step.
- [ ] **Stripe (optional)** – Configure only if payment flow is enabled; set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- [ ] **S3** – Production bucket with correct CORS and IAM; restrict presign to allowed paths/sizes.
- [ ] **Agora** – Production app ID and certificate for video calls.
- [ ] **NEXT_PUBLIC_APP_URL** – Set to your production URL (e.g. `https://app.linku.com`).

## 2. Security

- [ ] **Auth** – Clerk middleware (`proxy.ts`) protects app and API routes; ensure production Clerk keys and domain allowlist are set.
- [ ] **API rate limiting** – Add rate limiting (e.g. `@upstash/ratelimit` or Vercel KV) on auth, booking, and message APIs to prevent abuse.
- [ ] **Input validation** – Keep using Zod on all API inputs; avoid raw `dangerouslySetInnerHTML`; sanitize user content (you have `lib/sanitize.ts`).
- [ ] **Headers** – Security headers are set in `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy). Verify in production.
- [ ] **Payment webhooks (optional)** – If Stripe is enabled, ensure webhook URL and secret are correct in production.

## 3. Reliability & errors

- [ ] **Error boundaries** – `app/error.tsx` and `app/global-error.tsx` are in place so React errors don’t white-screen; test by throwing in a page.
- [ ] **404** – `app/not-found.tsx` provides a custom 404.
- [ ] **API errors** – `lib/http.ts` centralizes error responses; avoid leaking stack traces or internal details in production.
- [ ] **Logging** – Add structured logging (e.g. Pino, Axiom, Vercel Logs) for API errors and critical actions; avoid plain stdout/stderr logs for sensitive data.

## 4. Monitoring & health

- [ ] **Health check** – `GET /api/health` is available for load balancers and uptime checks; optionally extend it to check DB connectivity.
- [ ] **Uptime** – Use a service (e.g. Better Uptime, Pingdom) to monitor the health endpoint and key pages.
- [ ] **Errors** – Use an error tracking service (e.g. Sentry) for unhandled exceptions and API failures.

## 5. Performance

- [ ] **Images** – Use Next.js `Image` and the configured `remotePatterns` for Clerk (and S3 if you add it) to avoid layout shift and optimize delivery.
- [ ] **Bundle** – `optimizePackageImports` is enabled; run `npm run build` and review bundle size if needed.
- [ ] **Core Web Vitals** – Measure LCP, INP/FID, CLS in production (e.g. Vercel Analytics, PageSpeed Insights).

## 6. Testing

- [ ] **Unit / integration** – Vitest covers matching, HTTP helpers, sanitization, and Clerk publishable-key detection; extend to booking and messaging guards (plus payment webhooks if enabled).
- [ ] **E2E** – Add a small E2E suite (e.g. Playwright) for sign-in, booking flow, and messaging.
- [ ] **Manual** – Test sign-up, onboarding, mentor discovery, booking, and video calls on staging (plus payments if enabled).

## 7. Data & compliance

- [ ] **Backups** – Automated daily backups for PostgreSQL; test restore once.
- [ ] **Privacy** – If you collect PII, document it and add a privacy policy; consider cookie/consent if required.
- [ ] **Reported accounts** – Implement the report workflow and moderation queue referenced in `api/admin/reported-accounts` (model + UI).

## 8. Realtime & infra

- [ ] **Realtime** – Implement `services/realtime.ts` with Pusher, Ably, or a WebSocket gateway if you need live updates beyond polling.
- [ ] **Audit logging** – Add an audit log (table or service) for admin actions, payment events, and sensitive operations.

## 9. Deployment

- [ ] **Build** – `npm run build` succeeds; fix any TypeScript or lint errors.
- [ ] **Migrations** – Run `prisma migrate deploy` (or your provider’s equivalent) in the deploy pipeline; never run `migrate dev` in production.
- [ ] **Start** – Use `npm run start` (or platform’s start command) for production; don’t use `next dev`.

## Quick reference

| Area        | What you have now                         | Before production                          |
|------------|--------------------------------------------|--------------------------------------------|
| Auth       | Clerk + proxy, role guards                 | Production Clerk keys + domain allowlist   |
| Errors     | error.tsx, global-error.tsx, not-found    | Test and optionally add Sentry             |
| Security   | Zod, sanitize, headers                    | Rate limiting, audit log                   |
| Health     | GET /api/health                            | Wire to LB / uptime monitor                |
| Testing    | Vitest (matching, HTTP helpers, Clerk env) | Add E2E (Playwright) for critical journeys |
