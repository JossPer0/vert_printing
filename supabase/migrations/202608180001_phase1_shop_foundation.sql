-- Phase 1 Supabase foundation for Vert Printing shop manager.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  short_description text,
  description text,
  product_type text not null default 'standard' check (product_type in ('standard', 'configurable', 'quote_only')),
  pricing_mode text not null default 'fixed' check (pricing_mode in ('fixed', 'from_price', 'quote_only')),
  base_price numeric(12,2),
  compare_at_price numeric(12,2),
  cost_price numeric(12,2),
  is_taxable boolean not null default true,
  stock_mode text not null default 'made_to_order' check (stock_mode in ('tracked', 'made_to_order', 'untracked')),
  stock_quantity integer,
  low_stock_threshold integer,
  allow_backorder boolean not null default false,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_on_sale boolean not null default false,
  is_active boolean not null default true,
  is_published boolean not null default false,
  requires_artwork boolean not null default false,
  artwork_instructions text,
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  maximum_quantity integer,
  lead_time_text text,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (base_price is null or base_price >= 0),
  check (compare_at_price is null or compare_at_price >= 0),
  check (cost_price is null or cost_price >= 0),
  check (stock_quantity is null or stock_quantity >= 0),
  check (maximum_quantity is null or maximum_quantity >= minimum_quantity)
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  display_type text not null default 'select' check (display_type in ('select', 'radio', 'swatch')),
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.option_values (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  label text not null,
  value text not null,
  price_adjustment numeric(12,2) not null default 0,
  sku_suffix text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  name text not null,
  price_override numeric(12,2),
  stock_quantity integer,
  is_active boolean not null default true,
  option_signature jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_override is null or price_override >= 0),
  check (stock_quantity is null or stock_quantity >= 0)
);

create table if not exists public.product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_quantity integer not null check (min_quantity > 0),
  max_quantity integer,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_quantity is null or max_quantity >= min_quantity)
);

create table if not exists public.product_charges (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  description text,
  charge_type text not null check (charge_type in ('per_item', 'per_line')),
  amount numeric(12,2) not null check (amount >= 0),
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles','categories','products','option_groups','option_values','product_variants','product_price_tiers','product_charges'] loop
    execute format('drop trigger if exists touch_%I_updated_at on public.%I', t, t);
    execute format('create trigger touch_%I_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.current_admin_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_admin_role() in ('owner', 'admin', 'staff');
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_price_tiers enable row level security;
alter table public.product_charges enable row level security;
alter table public.shop_settings enable row level security;

create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin_user());
create policy "profiles owner manage" on public.profiles for all using (public.current_admin_role() = 'owner') with check (public.current_admin_role() = 'owner');

create policy "categories public active read" on public.categories for select using (is_active = true or public.is_admin_user());
create policy "categories admin write" on public.categories for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "products public published read" on public.products for select using ((is_active = true and is_published = true and archived_at is null) or public.is_admin_user());
create policy "products admin write" on public.products for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "product categories public read" on public.product_categories for select using (true);
create policy "product categories admin write" on public.product_categories for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "product images public read" on public.product_images for select using (true);
create policy "product images admin write" on public.product_images for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "option groups public read" on public.option_groups for select using (true);
create policy "option groups admin write" on public.option_groups for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "option values public read" on public.option_values for select using (is_active = true or public.is_admin_user());
create policy "option values admin write" on public.option_values for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "variants public read" on public.product_variants for select using (is_active = true or public.is_admin_user());
create policy "variants admin write" on public.product_variants for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "price tiers public read" on public.product_price_tiers for select using (true);
create policy "price tiers admin write" on public.product_price_tiers for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "charges public read" on public.product_charges for select using (true);
create policy "charges admin write" on public.product_charges for all using (public.current_admin_role() in ('owner','admin')) with check (public.current_admin_role() in ('owner','admin'));

create policy "settings admin read" on public.shop_settings for select using (public.is_admin_user());
create policy "settings owner write" on public.shop_settings for all using (public.current_admin_role() = 'owner') with check (public.current_admin_role() = 'owner');

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true), ('customer-artwork', 'customer-artwork', false)
on conflict (id) do nothing;

create policy "product images publicly readable" on storage.objects for select using (bucket_id = 'product-images');
create policy "admins manage product images" on storage.objects for all using (bucket_id = 'product-images' and public.is_admin_user()) with check (bucket_id = 'product-images' and public.is_admin_user());
create policy "admins manage customer artwork" on storage.objects for all using (bucket_id = 'customer-artwork' and public.is_admin_user()) with check (bucket_id = 'customer-artwork' and public.is_admin_user());

insert into public.shop_settings (key, value) values
  ('shop_enabled', 'false'::jsonb),
  ('currency', '"ZAR"'::jsonb),
  ('collection_enabled', 'true'::jsonb),
  ('delivery_enabled', 'false'::jsonb)
on conflict (key) do nothing;