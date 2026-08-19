create table if not exists public.product_model_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  format text not null check (format in ('stl', '3mf')),
  file_size_bytes bigint not null,
  unit text not null,
  width numeric,
  depth numeric,
  height numeric,
  volume numeric,
  surface_area numeric,
  triangle_count integer not null default 0,
  object_count integer not null default 1,
  watertight boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id)
);

alter table public.product_model_files enable row level security;

create policy "product model files admin access"
  on public.product_model_files for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

insert into storage.buckets (id, name, public)
values ('product-models', 'product-models', false)
on conflict (id) do nothing;

create policy "admins manage product models"
  on storage.objects for all
  using (bucket_id = 'product-models' and public.is_admin_user())
  with check (bucket_id = 'product-models' and public.is_admin_user());
