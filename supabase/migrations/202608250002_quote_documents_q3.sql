-- Quote PDF documents for Phase Q3.
-- Documents are private and only readable through admin-authenticated server functions.

create table if not exists public.quote_documents (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  document_type text not null default 'quote' check (document_type in ('quote','pro_forma','invoice','credit_note')),
  version_number integer not null check (version_number > 0),
  storage_path text not null,
  generated_at timestamptz not null default now(),
  generated_by_user_id uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (quote_id, document_type, version_number)
);

alter table public.quote_documents enable row level security;

drop policy if exists "quote documents admin read" on public.quote_documents;
drop policy if exists "quote documents admin write" on public.quote_documents;

create policy "quote documents admin read"
  on public.quote_documents
  for select
  using (public.is_admin_user());

create policy "quote documents admin write"
  on public.quote_documents
  for all
  using (public.current_admin_role() in ('owner','admin','staff'))
  with check (public.current_admin_role() in ('owner','admin','staff'));

create index if not exists quote_documents_quote_id_idx
  on public.quote_documents (quote_id, document_type, version_number desc);

insert into storage.buckets (id, name, public)
values ('quote-documents', 'quote-documents', false)
on conflict (id) do nothing;

drop policy if exists "admins manage quote documents" on storage.objects;

create policy "admins manage quote documents"
  on storage.objects
  for all
  using (bucket_id = 'quote-documents' and public.is_admin_user())
  with check (bucket_id = 'quote-documents' and public.is_admin_user());
