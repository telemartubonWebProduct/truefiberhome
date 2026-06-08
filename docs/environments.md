# Dev and production environments

The application uses Next.js environment file precedence:

- Development: `.env.development.local`
- Local production build: `.env.production.local`
- Vercel production: Production Environment Variables in the Vercel project

Each environment must use credentials from one Supabase project only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`)
- `DATABASE_URL`
- `DIRECT_URL`

The Supabase project ref in the public URL and both PostgreSQL connection
strings is checked before Next.js or Prisma starts.

## Commands

```bash
npm run env:check:dev
npm run env:check:strict
npm run env:check:prod
npm run db:dev:generate
npm run db:dev:push
npm run db:dev:studio
npm run db:prod:generate
```

Production database writes are intentionally not exposed as a short npm
script. Run migrations from the deployment workflow after reviewing the target
project printed by the environment check.
