# Supabase Setup

Phase 1 stores shop catalogue data in Supabase. Keep schema changes in Git under `supabase/migrations/`.

## Required Project Settings

Create or use a Supabase project for Vert Printing, then set these values in Cloudflare Pages:

Public variables:

```text
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
```

Secrets:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Existing secrets still required:

```text
TURNSTILE_SECRET
POSTMARK_SERVER_TOKEN
```

## Apply Migrations

Apply committed SQL migrations from:

```text
supabase/migrations/
```

The repo now includes the Supabase CLI as a project dev dependency and exposes the migration workflow through npm scripts.

### First-time local CLI setup

Install dependencies:

```sh
npm install
```

Log in to Supabase from this machine:

```sh
npx supabase login
```

Then link this repository to the Vert Supabase project:

```sh
npm run db:link
```

This creates local Supabase CLI state under `supabase/.temp/`, which is intentionally ignored by Git. Do not commit access tokens, database passwords or generated local state.

### Check migration state

Before applying a new migration, compare local migrations with the linked remote project:

```sh
npm run db:migrations
```

### Apply committed migrations

Push all unapplied committed migrations to the linked Supabase project:

```sh
npm run db:push
```

After `db:push`, run:

```sh
npm run db:migrations
```

to confirm the local and remote migration histories match.

### Existing migrations

Initial migration:

```text
202608180001_phase1_shop_foundation.sql
```

All schema changes must be added as committed SQL files in `supabase/migrations/` before being applied to Supabase.

## Initial Owner

1. Create Fran's auth user in Supabase Auth.
2. Insert a matching `profiles` row:

```sql
insert into public.profiles (id, full_name, role, active)
values ('AUTH_USER_ID', 'Fran', 'owner', true);
```

Replace `AUTH_USER_ID` with the Supabase Auth user id.

## Storage Buckets

The migration creates:

```text
product-images     public
customer-artwork   private
```

Customer artwork must remain private.

## Notes

Do not create undocumented schema changes in Supabase Studio. If a manual operational step is unavoidable, add it to this document.
