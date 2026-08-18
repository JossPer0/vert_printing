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

Initial migration:

```text
202608180001_phase1_shop_foundation.sql
```

Use Supabase SQL editor or Supabase CLI. If using the SQL editor, paste the migration exactly and record that it was applied.

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