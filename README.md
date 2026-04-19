# LinkU

[![CI](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml/badge.svg)](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**LinkU is a student guidance platform that combines verified mentorship, community learning, and admissions-focused AI workflows in one product.**

## Launch Status

**Launching soon.**

LinkU is currently in active build and validation. Core student and mentor journeys are implemented in this codebase, and the team is focused on quality, trust, and measurable outcomes before broad release.

## Why LinkU Exists

Students make high-stakes education decisions with fragmented advice:

- random social media tips
- expensive counseling that is often inaccessible
- generic AI output without personal context
- no clear execution system once a plan is made

LinkU is built to close that gap by combining people, product workflows, and AI in one place.

## What Is In The Product (from this codebase)

Current implemented surface areas include:

- **Mentor discovery and matching:** ranked mentor discovery with explainable scoring signals.
- **Booking workflow:** student booking flow with session duration, pricing, and booking states.
- **Payments integration:** Stripe Checkout and webhook-based booking confirmation are implemented.
- **Messaging and threads:** direct messaging with access controls tied to relationship context.
- **Community graph:** feed, channels, comments, shares, and networking connections.
- **Video calls:** Agora-powered call setup and call invitation APIs.
- **Student profile and onboarding:** profile pages and onboarding forms for guidance context.
- **LinkU-AI suite:** profile analysis, my-fit scoring, university compare, insights, essay analysis, and LOR/application workflows.
- **Admin tooling:** admin pages and APIs for moderation, users, mentors, and LinkU-AI data/statistics.

## Why Students Use LinkU

- **One workflow, not ten tools:** discover mentors, book sessions, message, and execute in one platform.
- **Human + AI together:** AI helps with speed; mentors add judgment, context, and accountability.
- **Outcome-focused design:** product is built around decisions and next steps, not just content consumption.
- **Trust layer:** verified mentor and admin workflows are part of the core architecture.
- **Community signal:** students can learn from live peer journeys, not just static content.

## Competitive Landscape

The market is real and growing. Students currently mix multiple products, including:

- **Admissions consulting/counseling players:** Crimson Education, CollegeAdvisor, Empowerly.
- **Application/admissions tooling:** CollegeVine and other AI-heavy admissions guidance products.
- **Peer/community-driven options:** Unibuddy, peer mentorship communities, Discord/Reddit groups.

LinkU's position is not "another counselor directory" and not "AI-only essay tooling."  
It is a vertically integrated student guidance system that unifies mentorship, community, execution, and admissions AI.

## Strategic Differentiation

- **Integrated journey moat:** guidance, action, and follow-through live in one system.
- **Explainable matching today:** ranking logic is tunable and transparent while data scale builds.
- **Compounding data advantage:** interactions across discovery, booking, messaging, and AI workflows create high-quality product feedback loops.
- **Trust-first expansion:** quality controls are prioritized over low-trust marketplace growth.

## Business Model Direction

- Session-based marketplace take rate on mentorship bookings.
- Premium AI and execution workflows as usage deepens.
- Potential subscription layers for students and mentor operators.

## Current Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Auth:** Clerk
- **Database:** PostgreSQL + Prisma
- **Payments:** Stripe
- **Storage:** S3-compatible upload flow with presigned URLs (or local upload fallback)
- **Video:** Agora
- **Validation/testing:** Zod + Vitest

## Near-Term Roadmap

- Launch hardening: reliability, moderation, and observability.
- Better notifications and real-time collaboration loops.
- Stronger outcome tracking and student progress intelligence.
- Expanded mentor-side products (programs, bundles, repeatable offerings).

## For Engineers

Architecture and implementation docs:

- [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md)
- [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md)
- [`PRODUCTION.md`](./PRODUCTION.md)
