# Contributing

## Local setup

1. **Node:** 20+ (22 recommended — see [`.nvmrc`](./.nvmrc) and CI).
2. **Postgres:** Either your own instance or from the repo:
   ```bash
   docker compose up -d
   ```
   (Default URL is in [`.env.example`](./.env.example): port **5433**.)
3. **Install and env:**
   ```bash
   npm ci
   cp .env.example .env.local
   ```
   Set `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` at minimum (see [README.md](./README.md)).
4. **Prisma:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. **Optional seed** (university list for LinkU-AI):
   ```bash
   npx prisma db seed
   ```
6. **Dev server:**
   ```bash
   npm run dev
   ```

## Before opening a pull request

```bash
npm run ci && npm run build
```

## Code style

- Match existing TypeScript and ESLint rules (`npm run lint`).
- Prefer small, focused changes with clear commit messages.
