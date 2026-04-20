# System Design

## Architecture

```text
                        +-----------------------+
                        |       Next.js App     |
                        |   (App Router, UI)    |
                        +-----------+-----------+
                                    |
                                    v
                        +-----------------------+
                        |   API Route Handlers  |
                        |      /app/api/*       |
                        +-----------+-----------+
                                    |
                      +-------------+-------------+
                      |                           |
                      v                           v
          +-----------------------+    +-----------------------+
          |   Domain Services     |    |   Shared Libraries    |
          |    /services/*        |    | /lib (auth/http/env)  |
          +-----------+-----------+    +-----------+-----------+
                      |                            |
                      +-------------+--------------+
                                    |
                                    v
                           +------------------+
                           |  Prisma + PGSQL  |
                           +------------------+
                                    |
          +-------------------------+--------------------------+
          |                         |                          |
          v                         v                          v
   +-------------+          +-----------------------+  +----------------+
   |    Clerk    |          | Payments (optional)   |  |       S3       |
   | Auth + RBAC |          | Stripe-ready module   |  | Presigned Media|
   +-------------+          +-----------------------+  +----------------+
```

## Key Flows

### 1) Mentor discovery and ranking

1. Student opens discovery view.
2. API fetches verified mentors with optional filters.
3. `services/matching.ts` computes weighted scores by major, country, GPA proximity, university overlap, verification signal, and rating quality.
4. API returns ranked mentors (optionally with score breakdown for explainability).

### 2) Booking lifecycle

1. Student selects mentor and time slot.
2. API validates slot availability and creates a draft booking.
3. Optional payment module can create a checkout session when enabled.
4. Booking status transitions are persisted and visible in booking views.

### 3) Messaging access guard

1. User requests thread/messages.
2. Access checks enforce allowed relationship context (booking or accepted connection).
3. Only authorized message history is returned.

## Data Flow

- **Write path:** UI -> API route -> service function -> Prisma transaction/mutation.
- **Read path:** UI -> API route -> Prisma query -> normalized response DTO.
- **External callback path (optional):** Stripe webhook -> signature verification -> idempotent upsert.

## Scaling Approach

- Start with synchronous, explicit service boundaries for fast delivery.
- Introduce cache and pagination on high-read endpoints (`feed`, `discover`, thread lists).
- Move long-running/non-critical operations (notifications, AI enrichment, analytics backfills) to async workers.
- Add observability (request tracing, DB query metrics, webhook retries) before aggressive optimization.

## Mentor Matching Logic (Current)

The matching engine is intentionally explainable and tunable:

- major similarity
- country similarity
- GPA proximity score (continuous bands)
- target/accepted university overlap cap
- mentor trust signals (verification badge + rating quality)

Weights can be tuned via environment variables:

- `MATCH_WEIGHT_MAJOR`
- `MATCH_WEIGHT_COUNTRY`
- `MATCH_WEIGHT_GPA`
- `MATCH_WEIGHT_UNIVERSITY_CAP`
- `MATCH_WEIGHT_VERIFIED_BADGE`
- `MATCH_WEIGHT_RATING`

This keeps ranking transparent today while leaving room for future ML-assisted ranking.
