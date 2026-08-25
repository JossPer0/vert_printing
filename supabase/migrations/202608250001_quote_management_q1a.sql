-- Quote management foundation for Vert Printing.
-- Phase Q1a: manual draft quotes in Shop Manager. Website intake, Gmail,
-- PDF sending, customer acceptance and quote-to-order are intentionally later.

create sequence if not exists public.quote_number_seq;

create or replace function public.next_quote_number()
returns text
language plpgsql
as $$
declare
  seq_value bigint;
begin
  seq_value := nextval('public.quote_number_seq');
  return 'VERT-Q-' || to_char(now(), 'YYYY') || '-' || lpad(seq_value::text, 5, '0');
end;
$$;

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual' check (source in ('website','gmail','whatsapp','phone','walk_in','manual','other')),
  status text not null default 'new_request' check (status in ('new_request','ai_prepared','draft','cancelled')),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  company_name text,
  email text,
  phone text,
  subject text,
  raw_message text,
  summary text,
  requested_by_date date,
  original_email_message_id text,
  gmail_thread_id text,
  created_by_admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default public.next_quote_number(),
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','ready_to_send','sent','viewed','accepted','declined','expired','converted_to_order','cancelled')),
  source text not null default 'manual' check (source in ('website','gmail','whatsapp','phone','walk_in','manual','other')),
  customer_name text not null,
  company_name text,
  email text,
  phone text,
  billing_address_snapshot jsonb,
  currency text not null default 'ZAR',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  delivery_total numeric(12,2) not null default 0 check (delivery_total >= 0),
  tax_total numeric(12,2) not null default 0 check (tax_total >= 0),
  grand_total numeric(12,2) not null default 0 check (grand_total >= 0),
  prices_include_tax boolean not null default true,
  tax_rate numeric(6,4),
  valid_until date,
  customer_note text,
  internal_note text,
  terms_text text,
  prepared_by_user_id uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  sort_order integer not null default 0,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  sku text,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_subtotal numeric(12,2) not null default 0 check (line_subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  taxable boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_attachments (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.quote_requests(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  source text not null default 'admin' check (source in ('website','gmail','admin')),
  created_at timestamptz not null default now(),
  constraint quote_attachments_parent_check check (quote_request_id is not null or quote_id is not null)
);

create table if not exists public.quote_status_history (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by_user_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['quote_requests','quotes','quote_items'] loop
    execute format('drop trigger if exists touch_%I_updated_at on public.%I', t, t);
    execute format('create trigger touch_%I_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

alter table public.quote_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_attachments enable row level security;
alter table public.quote_status_history enable row level security;

create policy "quote requests admin read" on public.quote_requests for select using (public.is_admin_user());
create policy "quote requests admin write" on public.quote_requests for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "quotes admin read" on public.quotes for select using (public.is_admin_user());
create policy "quotes admin write" on public.quotes for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "quote items admin read" on public.quote_items for select using (public.is_admin_user());
create policy "quote items admin write" on public.quote_items for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "quote attachments admin read" on public.quote_attachments for select using (public.is_admin_user());
create policy "quote attachments admin write" on public.quote_attachments for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create policy "quote history admin read" on public.quote_status_history for select using (public.is_admin_user());
create policy "quote history admin write" on public.quote_status_history for all using (public.current_admin_role() in ('owner','admin','staff')) with check (public.current_admin_role() in ('owner','admin','staff'));

create index if not exists quote_requests_status_created_idx on public.quote_requests (status, created_at desc);
create index if not exists quote_requests_email_idx on public.quote_requests (lower(email));
create unique index if not exists quote_requests_original_email_message_id_idx on public.quote_requests (original_email_message_id) where original_email_message_id is not null;
create index if not exists quotes_status_created_idx on public.quotes (status, created_at desc);
create index if not exists quotes_customer_email_idx on public.quotes (lower(email));
create index if not exists quotes_quote_request_id_idx on public.quotes (quote_request_id);
create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id, sort_order);
create index if not exists quote_status_history_quote_id_idx on public.quote_status_history (quote_id, created_at desc);
