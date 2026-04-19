# LinkU

[![CI](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml/badge.svg)](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Production-grade **student ↔ mentor** marketplace and campus network: bookings, Stripe payments, messaging, channels/feed, and optional **LinkU-AI** admissions tooling. Built with the **Next.js App Router**, **TypeScript**, **Prisma**, **PostgreSQL**, **Clerk**, **Stripe**, and **S3**.

**Suggested GitHub metadata:** description *“Next.js student–mentor platform: bookings, messaging, Clerk, Stripe, Prisma”* and topics `nextjs`, `typescript`, `prisma`, `clerk`, `stripe`, `tailwindcss`, `postgresql`.

## Quality checks

- **CI:** GitHub Actions runs `prisma validate`, ESLint (zero warnings), TypeScript, Vitest, and `next build` without production secrets (Clerk keys unset for build; see `lib/clerk-publishable-key.ts`).
- **Local:** `npm run ci` then `npm run build` (use real Clerk keys in `.env.local` for a full auth build, or leave Clerk unset for the same path CI uses).

## Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- PostgreSQL + Prisma ORM
- Clerk authentication
- Stripe Checkout + webhooks
- S3 presigned uploads
- Vercel deployment target

**For AI and detailed conventions:** see [TECH_STACK.md](./TECH_STACK.md) for the full stack, libraries, and coding conventions used in this repo.

**Contributing & security:** [CONTRIBUTING.md](./CONTRIBUTING.md) · [SECURITY.md](./SECURITY.md)

## Folder structure (overview)

The tree below is representative; the canonical route map lives under [`app/`](./app/) and [`app/api/`](./app/api/) (including LinkU-AI, channels, feed, calls, and uploads).

## Folder Structure

```txt
.
├── app
│   ├── admin/page.tsx
│   ├── api
│   │   ├── admin
│   │   │   ├── mentors/approve/route.ts
│   │   │   ├── reported-accounts/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   └── users/remove/route.ts
│   │   ├── auth/onboarding/route.ts
│   │   ├── bookings
│   │   │   ├── [id]/status/route.ts
│   │   │   └── route.ts
│   │   ├── connections
│   │   │   ├── respond/route.ts
│   │   │   └── route.ts
│   │   ├── mentors/discover/route.ts
│   │   ├── mentors/[mentorUserId]/route.ts
│   │   ├── mentors/route.ts
│   │   ├── messages/route.ts
│   │   ├── messages/threads/route.ts
│   │   ├── profile/route.ts
│   │   ├── reviews/route.ts
│   │   ├── stripe/webhook/route.ts
│   │   ├── students/discover/route.ts
│   │   └── uploads/presign/route.ts
│   ├── booking/page.tsx
│   ├── dashboard/page.tsx
│   ├── mentors/page.tsx
│   ├── messages/page.tsx
│   ├── networking/page.tsx
│   ├── profile/page.tsx
│   ├── reviews/page.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── dashboard/stat-card.tsx
│   ├── layout/top-nav.tsx
│   ├── mentor/mentor-card.tsx
│   ├── messages/chat-window.tsx
│   ├── networking/networking-client.tsx
│   ├── reviews/reviews-client.tsx
│   └── ui/button.tsx
├── lib
│   ├── auth.ts
│   ├── http.ts
│   ├── prisma.ts
│   ├── sanitize.ts
│   └── validation.ts
├── prisma/schema.prisma
├── services
│   ├── booking.ts
│   ├── chat-access.ts
│   ├── matching.ts
│   ├── realtime.ts
│   ├── review.ts
│   ├── stripe.ts
│   └── upload.ts
└── proxy.ts
```

## Prisma Models

The schema includes required models with indexes and relational constraints:

- `User`
- `StudentProfile`
- `MentorProfile`
- `Booking`
- `Review`
- `Connection`
- `Message`
- `Transaction`

Highlights:

- Strong role enum (`STUDENT`, `MENTOR`, `ADMIN`)
- Mentor verification status (`PENDING`, `APPROVED`, `REJECTED`)
- Booking state machine (`UPCOMING`, `COMPLETED`, `CANCELED`)
- Unique anti-double-booking constraint on mentor timeslots
- Connection uniqueness and messaging context relations

## Core API Routes

- `POST /api/auth/onboarding`: role selection + profile onboarding
- `GET /api/mentors/discover`: top mentor recommendations (matching engine)
- `GET /api/mentors`: approved mentor list for booking selector
- `GET /api/mentors/[mentorUserId]`: mentor detail and open slots
- `POST /api/bookings`: create booking + Stripe Checkout session
- `GET /api/bookings`: current user booking list
- `PATCH /api/bookings/[id]/status`: complete/cancel booking
- `GET|POST /api/reviews`: list review state and submit review
- `GET|POST /api/connections`: list/create student connection requests
- `PATCH /api/connections/respond`: accept/decline request
- `GET|POST /api/messages`: context-guarded chat history/send message
- `GET /api/messages/threads`: list permitted chat threads
- `GET /api/profile`: current user and role profile
- `POST /api/stripe/webhook`: Stripe webhook validation and transaction persistence
- `POST /api/uploads/presign`: secure S3 presigned upload URL generation
- `PATCH /api/admin/mentors/approve`: mentor verification approval
- `PATCH /api/admin/users/remove`: deactivate user
- `GET /api/admin/transactions`: transaction monitoring
- `GET /api/admin/reported-accounts`: moderation queue placeholder

## Security Implemented

- Clerk auth gates via `proxy.ts` (protects app and API routes)
- Role-aware access guards in route handlers
- Stripe webhook signature validation
- Booking collision check before session creation
- Messaging permission checks (`connected students` or `booked student+mentor`)
- Basic input validation with Zod and lightweight sanitization
- API route boundaries split by domain

## Matching Engine

Implemented in `services/matching.ts` with weighted scoring:

- Same intended major: +35
- Same country: +20
- Similar GPA range: +20
- Overlapping target universities: up to +25

Returns top 5 mentors.

## Setup Instructions

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Start PostgreSQL and set `DATABASE_URL` (optional: `docker compose up -d` from the repo root uses the credentials in [`.env.example`](./.env.example)).

4. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start development server:

   ```bash
   npm run dev
   ```

6. Configure Stripe webhook locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## Build Order (Phase Plan)

Implemented architecture follows this phase sequence:

1. Database schema
2. Authentication
3. Profiles
4. Mentor discovery
5. Booking + Stripe
6. Reviews
7. Student networking
8. Chat
9. Admin panel

## Production Notes

- Replace placeholder realtime adapter in `services/realtime.ts` with Pusher/Ably/WebSocket gateway.
- Add an explicit report model/workflow to back `reported-accounts`.
- Add dedicated audit logging and API rate-limiting middleware.
- Extend automated tests (integration + E2E) beyond the current Vitest unit suite; see [PRODUCTION.md](./PRODUCTION.md).
