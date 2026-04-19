# Contributing

## Local setup

1. `npm ci`
2. `cp .env.example .env.local` and fill in secrets (see README).
3. `npm run prisma:generate` then `npm run prisma:migrate`
4. `npm run dev`

## Before opening a pull request

Run the same checks as CI, then a production build:

```bash
npm run ci && npm run build
```

Use a **real** Clerk publishable key in `.env.local` for full auth behavior, or leave `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` unset / use a short placeholder so the app uses the same non-Clerk shell as CI (see `lib/clerk-publishable-key.ts`).

## Code style

- Match existing TypeScript and ESLint rules (`npm run lint`).
- Prefer small, focused changes with clear commit messages.
