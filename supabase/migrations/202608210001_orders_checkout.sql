-- Guest checkout/order capture for Vert Printing.
-- Payments are intentionally deferred; orders are created as unpaid order requests.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  company_name text,
  email text not null,
  phone text not null,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'new' check (status in ('new','awaiting_artwork','awaiting_approval','in_production','ready','shipped','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded','partially_refunded')),
  fulfilment_method text not null default 'collection' check (fulfilment_method in ('collection','delivery')),
  customer_email text not null,
  customer_phone text not null,
  customer_name text not null,
  company_name text,
  billing_address_snapshot jsonb,
  delivery_address_snapshot jsonb,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(12,2) not null default 0 check (shipping_total >= 0),
  tax_total numeric(12,2) not null default 0 check (tax_total >= 0),
  grand_total numeric(12,2) not null default 0 check (grand_total >= 0),
  currency text not null default 'ZAR',
  customer_note text,
  internal_note text,
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  variant_snapshot jsonb,
  options_snapshot jsonb,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  setup_charges numeric(12,2) not null default 0 check (setup_charges >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  requires_artwork boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['customers','orders'] loop
    execute format('drop trigger if exists touch_%I_updated_at on public.%I', t, t);
    execute format('create trigger touch_%I_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

create policy "customers admin read" on public.customers for select using (public.is_admin_user());
create policy "customers admin write" on public.customers for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "orders admin read" on public.orders for select using (public.is_admin_user());
create policy "orders admin write" on public.orders for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "order items admin read" on public.order_items for select using (public.is_admin_user());
create policy "order items admin write" on public.order_items for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "order history admin read" on public.order_status_history for select using (public.is_admin_user());
create policy "order history admin write" on public.order_status_history for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create index if not exists customers_email_idx on public.customers (lower(email));
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
