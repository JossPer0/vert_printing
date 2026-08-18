# Vert Printing Website

Astro brochure site and Phase 1 shop-management foundation for Vert Printing, deployed on Cloudflare Pages.

## Local Development

Install dependencies once, then run Astro locally:

```sh
npm install
npm run dev
```

Build the Cloudflare Pages output:

```sh
npm run build
```

The generated site is written to `dist/`.

## Cloudflare Pages

Use these settings:

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

`wrangler.toml` also declares `pages_build_output_dir = "dist"`.

## Required Environment

Set public Supabase values as Cloudflare Pages environment variables:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Set these as Cloudflare Pages secrets:

- `TURNSTILE_SECRET`
- `POSTMARK_SERVER_TOKEN`

Existing quote-form variables remain in `wrangler.toml`:

- `POSTMARK_FROM_EMAIL`
- `QUOTE_TO_EMAIL`
- `POSTMARK_MESSAGE_STREAM`

## Shop Manager

The admin entry point is `/admin`. It uses Supabase Auth and RLS, so only users with an admin `profiles` row can manage catalog records.

See:

- `docs/SUPABASE_SETUP.md`
- `docs/SHOP_MANAGER_GUIDE.md`
- `docs/VERT_SHOP_ARCHITECTURE.md`
