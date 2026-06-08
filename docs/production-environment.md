# Production Environment

Use `.env.production.example` as the source of truth when configuring the
Production environment in Vercel or another hosting provider. Never upload
`.env.production.local` or commit real secrets.

## Added for the content automation system

These variables are new compared with the original production setup:

| Variable | Purpose | Secret |
| --- | --- | --- |
| `APP_ENV` | Prevents a production runtime from using development config | No |
| `PROMOTION_AGENT_MODEL` | Model used to extract and normalize promotions | No |
| `SITE_CONTENT_AGENT_MODEL` | Lower-cost model used for site content extraction | No |
| `ARTICLE_AGENT_MODEL` | Model used to draft SEO articles | No |

The existing `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, and `CRON_SECRET`
are reused by the new agents. No second OpenRouter key is required.

## Recommended Supabase key migration

Production currently supports the legacy `SUPABASE_SERVICE_ROLE_KEY`. The
preferred replacement is:

```text
SUPABASE_SECRET_KEY=sb_secret_xxx
```

Keep this server-only. Do not prefix it with `NEXT_PUBLIC_`. The browser should
receive only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Vercel scopes

Set all values in the **Production** scope. Public preview deployments should
not point to the production Supabase project. If previews are needed, configure
their Preview scope with the development Supabase project instead.

After saving environment variables, redeploy because every `NEXT_PUBLIC_*`
value is embedded at build time.

## Required before deploy

1. Set `APP_ENV=production`.
2. Confirm `NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`, and `DIRECT_URL` contain
   the same production Supabase project ref.
3. Set `SUPABASE_SECRET_KEY`, or retain the legacy service-role fallback until
   the key migration is complete.
4. Set `OPENROUTER_API_KEY` and `CRON_SECRET`.
5. Set the three agent model variables from `.env.production.example`.
6. Run `npm run env:check:prod`.
7. Run `npm run build`.

The Article Agent is created disabled and draft-only. Enabling it is an admin
setting in the dashboard, not an environment variable.
