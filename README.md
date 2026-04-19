# LinkU — The OS for Student Guidance

[![CI](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml/badge.svg)](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Problem

Students making high-stakes education and career decisions are forced to navigate fragmented information, low-context advice, and transactional counseling. The result is slow decision cycles, poor-fit applications, and missed opportunities.

## Insight

Most existing platforms solve one slice only: content, courses, or networking. They do not connect trusted mentorship, execution workflows, and accountability loops in one system.

## Solution

LinkU combines:

- **Mentorship marketplace** for verified mentor discovery and paid sessions
- **Execution workflows** for booking, reviews, messaging, and follow-through
- **Campus social layer** through channels, feed, and peer knowledge sharing
- **Admissions intelligence (LinkU-AI)** for profile fit and application guidance

## Product Vision

LinkU is designed as a full operating layer for student guidance: a blend of professional graph, learning pathways, and mentor commerce. The long-term direction is to become the default destination where students decide, plan, and execute major academic moves with measurable outcomes.

## Features

- Verified mentor discovery with weighted match ranking
- Paid booking flow with Stripe Checkout + webhook reconciliation
- Messaging threads and student networking graph
- Feed/channels for community knowledge and Q&A loops
- Role-based admin controls for moderation and operations
- LinkU-AI workflows for application fit and admissions support

## System Design

Architecture and data-flow details live in [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md).

Quick view:

```text
Client (Next.js App Router)
  -> Route Handlers (/app/api/*)
      -> Service Layer (/services/*)
          -> Prisma ORM
              -> PostgreSQL
  -> External Systems: Clerk (auth), Stripe (payments), S3 (uploads)
```

Primary booking flow:

```text
Student -> Discover Mentor -> Create Booking Draft -> Stripe Checkout
   -> Stripe Webhook -> Transaction Upsert + Booking Confirmed -> Session Delivery
```

## Tech Stack

- **Next.js App Router + React + TypeScript**: fast iteration with type-safe full-stack boundaries
- **Prisma + PostgreSQL**: relational modeling for marketplace + social graph consistency
- **Clerk**: secure auth lifecycle and role-aware access control
- **Stripe**: trusted payment rails and webhook-driven financial state changes
- **S3 Presigned Uploads**: direct media upload path with minimal backend load
- **Tailwind CSS**: consistent UI system with high implementation speed
- **Vitest + GitHub Actions CI**: enforce reliability via test/type/lint/build gates

## Tradeoffs

- No distributed queue/event bus yet; synchronous route flow keeps complexity low in early stage.
- Realtime messaging is functional but not fully production-hardened for very high concurrency.
- Mentor matching is explainable and tunable, but intentionally simple compared to ML-heavy ranking systems.
- Coverage is strong for utilities and ranking logic, but integration/E2E tests should expand further.

## Future Roadmap

- **AI matching:** intent-aware recommendations using profile outcomes and interaction signals
- **Marketplace depth:** mentor bundles, subscriptions, escrow-like payout flows, retention analytics
- **Scaling:** async jobs, caching strategy, search index, observability + SLO-driven operations

## Demo

- Product walkthrough video: _coming soon_
- UI screenshots: _coming soon_

## Why I Built This

I wanted to build a system that treats student guidance like mission-critical infrastructure, not scattered advice. LinkU is intentionally built as a real product: opinionated architecture, operational workflows, and a path from prototype to scalable company.

## Repository Structure

A concise architecture-oriented map is available in [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md).

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Optional Stripe local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Quality Gate

Run the same checks as CI:

```bash
npm run ci && npm run build
```

## Environment

Use [`.env.example`](./.env.example) as the single source of required runtime keys. Sensitive keys are never committed; runtime configuration is centralized in `lib/env.ts`.
