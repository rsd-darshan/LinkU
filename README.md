# LinkU — Your All-in-One Student Guidance Platform

[![CI](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml/badge.svg)](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

LinkU is a student guidance platform that combines mentorship, peer community, and admissions-focused AI tools.

## Launch Status

**Launching Soon** — Currently in active development and validation.

Core student and mentor workflows are implemented in this repository. Current work is focused on reliability, moderation, and launch readiness.

## The Problem

Students often make major education decisions with:

- fragmented advice from social platforms
- expensive counseling options
- AI guidance without personal context
- no consistent system to move from planning to execution

This leads to uncertainty and lower-quality outcomes.

## Our Solution

LinkU addresses this by combining mentors, community workflows, and AI support in one product.
Students can discover guidance, book sessions, execute plans, and track progress in a single place.

## Core Features (Currently Implemented)

- **Mentor discovery and matching:** ranked mentor discovery with explainable scoring signals.
- **Booking workflow:** student booking flow with session duration, pricing, and booking states.
- **Booking lifecycle:** session scheduling, pricing, and state transitions are implemented.
- **Messaging and threads:** direct messaging with access controls tied to relationship context.
- **Community graph:** feed, channels, comments, shares, and networking connections.
- **Video calls:** Agora-powered call setup and call invitation APIs.
- **Student profile and onboarding:** profile pages and onboarding forms for guidance context.
- **LinkU-AI suite:** profile analysis, my-fit scoring, university compare, insights, essay analysis, and LOR/application workflows.
- **Admin tooling:** admin pages and APIs for moderation, users, mentors, and LinkU-AI data/statistics.

## Why Students Choose LinkU

- **One platform, not ten tools:** everything from discovery to execution lives in one place.
- **Human + AI synergy:** AI for speed and scale; verified mentors for judgment, context, and accountability.
- **Outcome-oriented design:** built around decisions and next actions, not passive content.
- **Trust-first approach:** verified mentors and moderation workflows are built into the core.
- **Live community signal:** students learn from real peer journeys happening in real time.

## How LinkU Stands Out

The market is growing, but most solutions stay in one category:

- **Admissions consulting/counseling players:** Crimson Education, CollegeAdvisor, Empowerly.
- **Application/admissions tooling:** CollegeVine and other AI-heavy admissions guidance products.
- **Peer/community-driven options:** Unibuddy, peer mentorship communities, Discord/Reddit groups.

LinkU is differentiated by combining:

- verified mentorship
- active community
- execution workflows
- deep admissions AI

### Key Differentiators

- integrated end-to-end journey (discovery -> booking -> mentoring -> execution)
- transparent and tunable mentor matching algorithm
- compounding data moat from cross-feature interactions
- strong focus on quality and trust over rapid, low-quality growth

## Business Model

- **Primary:** take rate on mentorship session bookings.
- **Growth:** premium AI features and advanced execution workflows.
- **Future:** tiered subscriptions for students and mentor operators/programs.

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Auth:** Clerk
- **Database:** PostgreSQL + Prisma
- **Payments:** optional Stripe module is scaffolded in the codebase for future activation
- **Storage:** S3-compatible upload flow with presigned URLs (or local upload fallback)
- **Video:** Agora
- **Validation and testing:** Zod + Vitest

## Documentation For Engineers

- [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md)
- [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md)
- [`PRODUCTION.md`](./PRODUCTION.md)

## Repo Layout

High-level repository structure lives in [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md).

## Near-Term Roadmap

- Launch hardening: reliability, moderation, and observability.
- Better notifications and real-time collaboration loops.
- Stronger outcome tracking and student progress intelligence.
- Expanded mentor-side products (programs, bundles, repeatable offerings).

LinkU is built with a focus on trust, quality, and measurable student outcomes.
