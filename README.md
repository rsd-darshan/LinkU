# LinkU

[![CI](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml/badge.svg)](https://github.com/rsd-darshan/LinkU/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Full-stack student guidance app: **mentor discovery & bookings**, **feed & university channels**, **messaging & calls**, and **LinkU-AI** (fit, compare, essay tooling) on **Next.js (App Router)**, **Clerk**, **PostgreSQL**, and **Prisma**.

---

## Requirements

| Tool | Notes |
|------|--------|
| **Node.js** | **20+** (local dev). **Node 22** matches [`.nvmrc`](./.nvmrc) and [CI](.github/workflows/ci.yml); use `nvm use` if you use nvm. |
| **PostgreSQL** | **16+**, or run the bundled Docker service (see below). |
| **Clerk** | Free [Clerk](https://clerk.com) dev application for sign-in and API protection (see [Clerk](#clerk)). |

---

## Quick start

From the repo root:

```bash
git clone https://github.com/rsd-darshan/LinkU.git
cd LinkU
npm ci
```

**1. Database**

```bash
docker compose up -d
```

This starts Postgres on **host port `5433`** (user/password/db: `linku` / `linku` / `linku`), matching [`.env.example`](./.env.example).

**2. Environment**

```bash
cp .env.example .env.local
```

Edit `.env.local`: set at least **`DATABASE_URL`**, **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**, and **`CLERK_SECRET_KEY`** (see [Environment variables](#environment-variables) and [Clerk](#clerk)).

**3. Schema & optional seed**

```bash
npm run prisma:generate
npm run prisma:migrate
```

Optional — loads US university rows (and supplement prompts where defined) for LinkU-AI flows:

```bash
npx prisma db seed
```

**4. Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up/in via Clerk completes onboarding routes.

**5. Sanity checks**

```bash
npm run ci && npm run build
```

With the app and DB up: `GET /api/health` should return **`200`** and `"database": "ok"` (see [`app/api/health/route.ts`](./app/api/health/route.ts)).

---

## Environment variables

| Variable | Required for local app | Purpose |
|----------|------------------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes* | Clerk browser key; must be a real `pk_test_…` / `pk_live_…` string long enough to pass [`isUsableClerkPublishableKey`](./lib/clerk-publishable-key.ts). |
| `CLERK_SECRET_KEY` | Yes* | Clerk server secret (`sk_test_…` / `sk_live_…`). |
| `NEXT_PUBLIC_APP_URL` | No | Defaults to `http://localhost:3000` in code where used. |
| `OPENROUTER_API_KEY` | No | LinkU-AI features that call the model layer. |
| `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` | No | Video calls. |
| `STRIPE_*` | No | Payments / webhooks when enabled. |
| `S3_*` | No | Presigned uploads; otherwise local upload path applies. |
| `LINKU_AI_CRON_SECRET` | No | Protects `POST /api/linku-ai/cron/fetch` when set. |

\*The UI can render without a usable publishable key, but **middleware and most routes expect Clerk** ([`proxy.ts`](./proxy.ts)). For a normal clone-and-run, configure both Clerk keys.

Full template: [`.env.example`](./.env.example).

---

## Clerk

1. Create a Clerk application (development instance).
2. Add **`http://localhost:3000`** to allowed origins / redirect URLs as needed.
3. Copy **Publishable key** and **Secret key** into `.env.local`.
4. After first sign-in, your user is synced to Postgres ([`lib/auth.ts`](./lib/auth.ts)); use Clerk dashboard or DB to adjust roles (e.g. `ADMIN`) if you need admin routes.

---

## Feeds & community

Public admissions discussion is fragmented across many Reddit-style communities. LinkU keeps **one product** with a **main feed**, **university-oriented channels**, and the rest of the stack (mentors, DMs, AI) in the same place.

### Main feed

- **For you** — ranked for the signed-in user.
- **Top** — by engagement (e.g. upvotes), then recency.
- **Channel filter** — e.g. `?channel=<slug>` on the feed API for a university channel.

### University & school channels

Channels are first-class spaces (name, slug, optional university label) for posts, comments, upvotes, and shares—see [`app/api/channels/route.ts`](./app/api/channels/route.ts) and [`app/api/feed/route.ts`](./app/api/feed/route.ts).

### Reference Reddit communities (scale)

| Subreddit | Role | Approx. members* |
|-----------|------|------------------|
| [r/ApplyingToCollege](https://www.reddit.com/r/ApplyingToCollege/) | US admissions hub (essays, ECs, decisions, strategy). | 1.3M+ |
| [r/college](https://www.reddit.com/r/college/) | College life, academics, transfers. | ~2.9M |
| [r/IntltoUSA](https://www.reddit.com/r/IntltoUSA/) | International students applying to the US. | 52k+ |

\*Public Reddit “members” counts; not a live snapshot—check each subreddit for current numbers.

---

## What’s in the repo (high level)

- **Mentors:** discovery, matching signals, profiles, booking flow and statuses.
- **Community:** feed, channels, comments, shares, networking / connections.
- **Messaging:** threads and access rules tied to connections.
- **Calls:** Agora token route and client integration (needs Agora env when exercising calls).
- **LinkU-AI:** profile, applications, compare, insights, essay analysis, cron hook for data pipeline (OpenRouter and cron secret when using those paths).
- **Admin:** admin UI and APIs for users, mentors, LinkU-AI raw data / stats.

Details: [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md), [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md), [`PRODUCTION.md`](./PRODUCTION.md).

---

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS  
- **Auth:** Clerk (`@clerk/nextjs`)  
- **Data:** PostgreSQL, Prisma  
- **Payments:** Stripe (optional, wired where used)  
- **Storage:** S3-compatible presigns or local uploads  
- **Video:** Agora  
- **Validation / tests:** Zod, Vitest  

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| `Can't reach database` / Prisma errors | Postgres running; `DATABASE_URL` host/port (**`5433`** if using `docker-compose.yml`). |
| Redirect loops or 401 on routes | Clerk keys in `.env.local`; Clerk URLs and localhost allowed in Clerk dashboard. |
| Empty feed / no channels | Expected on a fresh DB until users create channels and posts (demo auto-seed was removed on purpose). |
| `prisma:seed` / `prisma db seed` fails | Run `npm ci` (repo includes `tsx`); ensure `DATABASE_URL` is set and DB is up. |

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) (install, migrate, `npm run ci`, PR expectations).

---

## License

[MIT](./LICENSE)
