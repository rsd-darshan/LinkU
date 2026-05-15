# LinkU

There are millions of students navigating college admissions — and most of them are doing it alone, scattered across hundreds of Reddit threads, Discord servers, and anonymous forums. Communities like [r/ApplyingToCollege](https://www.reddit.com/r/ApplyingToCollege/) (1.3M+ members), [r/college](https://www.reddit.com/r/college/) (2.9M+ members), and [r/IntltoUSA](https://www.reddit.com/r/IntltoUSA/) (52k+ members) are full of students asking the same questions, looking for the same guidance — but getting buried under noise, outdated advice, and no real structure.

**LinkU brings all of that into one place.**

A platform where students connect directly with mentors who have already been through it — people from their target universities, their intended major, their country. Where conversations are organized, sessions are bookable, and the guidance is real. Not another Reddit thread. Not another Discord server. A purpose-built space for the college admissions journey.

---

## What it does

- **Mentor discovery** — browse and filter mentors by major, university, country, and hourly rate; a scoring engine ranks results by how well each mentor matches a student's profile
- **Session booking** — book 30 or 60-minute paid sessions; LinkU takes a 15% platform fee and mentors receive 85%
- **Messaging** — direct chat between students and mentors with typing indicators and message history
- **Video calls** — in-app video sessions powered by Agora
- **Networking** — send and manage connection requests
- **Feed** — university-specific channels where students and mentors post, comment, upvote, and share
- **LinkU AI** — admissions intelligence module with essay analysis, university comparison, and outcome predictions; college data is refreshed weekly from CDS, IPEDS, and NCES sources
- **Admin panel** — account moderation and platform management

---

## For developers

### Tech stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16 via Prisma |
| Auth | Clerk |
| Payments | Stripe |
| Storage | AWS S3 |
| Video | Agora |
| AI/LLM | OpenRouter |
| Testing | Vitest |

### Prerequisites

- Node.js 20+ (22 recommended)
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Install dependencies
npm ci

# 2. Start the database
docker compose up -d

# 3. Set up environment variables
cp .env.example .env.local
# Fill in the required values (see Environment variables below)

# 4. Set up the database
npm run prisma:generate
npm run prisma:migrate

# 5. (Optional) Seed university data for LinkU AI
npm run prisma:seed

# 6. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`. For HTTPS (needed for WebRTC/mobile testing):

```bash
npm run dev:https
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://linku:linku@localhost:5433/linku

# Clerk (auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Agora (video calls)
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=

# OpenRouter (LinkU AI)
OPENROUTER_API_KEY=
LINKU_AI_CRON_SECRET=

# Stripe (optional — payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AWS S3 (optional — file uploads)
S3_REGION=us-east-1
S3_BUCKET_NAME=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
```

See `.env.example` for the full list including optional tuning variables for the matching algorithm and LinkU AI weights.

### Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run ci            # Full check: generate, lint, typecheck, test
npm run prisma:studio # Open Prisma Studio
```

### Project structure

```
app/          # Next.js routes and pages
components/   # UI components
lib/          # Utilities, auth helpers, LinkU AI logic
services/     # Business logic (matching, booking, reviews, feed ranking)
prisma/       # Database schema and migrations
```

### Deployment

The project is configured for Vercel with a weekly cron job (`vercel.json`) that refreshes college statistics data for the LinkU AI module.

Before deploying to production:

- Switch Clerk to production keys
- Use a managed PostgreSQL instance (Neon, RDS, etc.)
- Configure S3 bucket with CORS and IAM permissions
- Add Stripe webhook endpoint
- Set all environment variables in your hosting platform
