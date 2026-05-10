# LinkU — Senior SWE Recommendations

Prioritised ideas to add or improve, based on the current codebase (student–mentor platform, bookings, messaging, video calls, channels/feed, admin).

---

## 1. Reliability & production readiness

| Area | Recommendation | Why |
|------|----------------|------|
| **Realtime** | Implement a production realtime adapter (e.g. Pusher or Ably) for chat and notifications if you ship realtime. | Reduces polling load and improves UX responsiveness. |
| **API rate limiting** | Add middleware (e.g. `@upstash/ratelimit` or Vercel KV) on auth’d and public routes. | Prevents abuse, DoS, and keeps infra usage predictable. |
| **Payment idempotency (optional)** | If payment flow is enabled, use idempotency keys for checkout and critical webhook-side writes. | Avoids duplicate charges or duplicate bookings on retries. |
| **Call reliability** | Persist call invites (e.g. `CallInvite` with `channelName`, `inviterId`, `inviteeId`, `status`, `expiresAt`) and surface “missed call” in notifications. | Users see missed calls and can call back; supports moderation. |

---

## 2. Security & compliance

| Area | Recommendation | Why |
|------|----------------|------|
| **Report workflow** | Add a `Report` model (reporter, reported user/post/booking, reason, status, resolvedAt, resolvedBy) and wire `/api/admin/reported-accounts` to it. Add “Report” in UI (profile, post, message). | Completes the moderation path and supports safer operations. |
| **Audit logging** | Log sensitive actions (login, role change, mentor approve/reject, user deactivate, payout, report resolve) to a table or external log. | Accountability and compliance; easier incident review. |
| **Input & output** | Keep using Zod; add max lengths and sanitisation for rich text / `body`/`bio` where needed; avoid raw HTML render. | Reduces XSS and abuse; keeps DB and APIs predictable. |
| **CORS / CSP** | If you add more public or embeddable endpoints, lock CORS and consider a strict CSP. | Limits cross-origin abuse and script injection. |

---

## 3. Testing

| Area | Recommendation | Why |
|------|----------------|------|
| **Unit** | Core domain: matching scoring, booking collision, and chat-access rules (plus webhook payload handling if payments are enabled). | Prevents regressions in critical paths and permissions. |
| **API** | Integration tests for critical paths: onboarding, discover, booking create, message send, token/call invite. | Catches auth and DB/API contract breakage. |
| **E2E** | One happy path (e.g. sign up → discover → request connection → send message → leave). Optional: call flow with Agora mock or test project. | Validates full user journey before release. |

Start with **matching**, **booking**, and **chat-access** plus one E2E path; add payment tests only when that flow is enabled.

---

## 4. Product & UX

| Area | Recommendation | Why |
|------|----------------|------|
| **Notifications** | Add `Notification` model and real-time or polling for: new connection request, connection accepted, new message, booking reminder, call invite, review received. Wire `/notifications` to real data and “mark read”. | Current page is static; real notifications increase engagement and trust. |
| **Search** | If not already there: full-text or filtered search on mentors (major, rate, availability), channels, and maybe posts. | Makes discovery and content findable. |
| **Booking UX** | Calendar-style view for mentor slots; optional “request different time”; clear states (pending payment, confirmed, completed, cancelled). | Reduces no-shows and support. |
| **Video calls** | Optional: call history (who, when, duration) for mentors/students; link from booking to “Start call” so the call is in context. | Aligns calls with paid sessions and accountability. |
| **Offline / errors** | Global error boundary and “Something went wrong” with retry; optional service worker for basic offline copy. | Better experience on flaky networks. |

---

## 5. Performance & scale

| Area | Recommendation | Why |
|------|----------------|------|
| **DB** | Add indexes for hot queries (e.g. messages by thread, bookings by mentor+time, notifications by user+createdAt). Use `EXPLAIN` on slow routes. | Keeps latency low as data grows. |
| **Caching** | Cache mentor list or discover results (short TTL) and invalidate on profile/approval change. | Cuts repeated work for popular pages. |
| **Images** | Use Next.js `Image` and consider a CDN or image API for S3 media (resize, format). | Faster loads and better Core Web Vitals. |
| **Bundling** | Lazy-load Agora (and other heavy libs) only on call routes. | Faster initial load for non-call users. |

---

## 6. Observability & ops

| Area | Recommendation | Why |
|------|----------------|------|
| **Structured logging** | Log request id, user id, route, and errors in a consistent format (e.g. JSON). | Easier debugging and log aggregation. |
| **Health checks** | `GET /api/health` that checks DB (and optionally other enabled dependencies). | Deployment and monitoring know when the app is unhealthy. |
| **Error tracking** | Send front-end and API errors to Sentry (or similar). | Surfaces real user issues and stack traces. |
| **Metrics** | Key counters: sign-ups, bookings created, messages sent, calls started; optional: latency percentiles for critical APIs. | Product and performance visibility. |

---

## 7. Tech debt & consistency

| Area | Recommendation | Why |
|------|----------------|------|
| **Env & config** | Single validated config (e.g. Zod) built from `process.env` and used everywhere. | Fewer “missing env” bugs and one place to document variables. |
| **API responses** | Standard envelope (e.g. `{ data, error, meta }`) and consistent status codes. | Simpler client handling and error UX. |
| **Realtime** | When you choose a realtime provider, isolate it behind a small service in `/services` for chat/typing/notifications. | Keeps integration swap-friendly and architecture clear. |

---

## Suggested order of implementation

1. **Report model + admin workflow** — unblocks moderation.
2. **Notification model + real notifications** — high impact on engagement.
3. **Rate limiting + health check** — cheap and important for production.
4. **Tests** — start with matching, booking, chat-access, then one E2E.
5. **Realtime for chat/notifications** — then call-invite and “missed call” if needed.
6. **Audit logging and error tracking** — before or right after launch.

If you want to go deep on one area (e.g. schema for reports/notifications, or a concrete rate-limit middleware), say which and we can sketch it in code.
