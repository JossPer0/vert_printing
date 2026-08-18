-- Product information fields and repeatable product specifications.

alter table public.products
  add column if not exists material text,
  add column if not exists dimensions text,
  add column if not exists colour_information text,
  add column if not exists finish text,
  add column if not exists weight text,
  add column if not exists customisation_information text,
  add column if not exists care_instructions text,
  add column if not exists whats_included text,
  add column if not exists made_to_order_information text;

create table if not exists public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(label)) > 0),
  check (length(trim(value)) > 0)
);

create index if not exists product_specifications_product_id_sort_idx on public.product_specifications(product_id, sort_order, label);

alter table public.product_specifications enable row level security;

drop trigger if exists touch_product_specifications_updated_at on public.product_specifications;
create trigger touch_product_specifications_updated_at
  before update on public.product_specifications
  for each row execute function public.touch_updated_at();

create policy "product specifications public published read"
  on public.product_specifications
  for select
  using (
    public.is_admin_user()
    or exists (
      select 1
      from public.products p
      where p.id = product_specifications.product_id
        and p.is_active = true
        and p.is_published = true
        and p.archived_at is null
    )
  );

create policy "product specifications admin write"
  on public.product_specifications
  for all
  using (public.current_admin_role() in ('owner','admin'))
  with check (public.current_admin_role() in ('owner','admin'));
