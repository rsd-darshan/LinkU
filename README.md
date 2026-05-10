# LinkU

[![CI](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml/badge.svg)](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

LinkU is a student guidance platform that brings mentorship, peer community, and admissions AI into one place.

Students currently bounce between scattered communities, generic advice threads, expensive counseling, and disconnected tools. LinkU is built to make that flow intentional: discover mentors, book sessions, ask questions in structured university channels, collaborate in a main feed, and turn advice into next steps.

## Why this matters

- **One integrated flow:** discover -> connect -> book -> execute.
- **Structured social layer:** main feed + university-focused channels.
- **Human + AI:** mentor judgment with AI-assisted analysis.
- **Built for outcomes:** progress over passive content consumption.

## Feeds and channels

- **Main feed:** supports `for_you` and `top` ranking modes.
- **University channels:** focused spaces for school-specific application discussion.
- **Contextual conversation:** comments, shares, and messaging in one product.

Reference Reddit communities this consolidates behavior from:

| Community | Approx. members |
|-----------|------------------|
| [r/ApplyingToCollege](https://www.reddit.com/r/ApplyingToCollege/) | 1.3M+ |
| [r/college](https://www.reddit.com/r/college/) | ~2.9M |
| [r/IntltoUSA](https://www.reddit.com/r/IntltoUSA/) | 52k+ |

## For developers (quick start)

**Requirements:** Node 20+, Docker, Clerk dev keys.

```bash
git clone https://github.com/rsd-darshan/LinkU.git
cd LinkU
npm ci
docker compose up -d
cp .env.example .env.local
```

Set in `.env.local` at minimum:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Then run:

```bash
npm run prisma:generate
npm run prisma:migrate
npx prisma db seed   # optional
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Clerk, PostgreSQL, Prisma, Zod, Vitest, Stripe (optional), Agora (optional).

## Docs

- [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md)
- [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md)
- [`PRODUCTION.md`](./PRODUCTION.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## License

[MIT](./LICENSE)
