alter table public.product_model_files
  add column if not exists material text,
  add column if not exists weight numeric,
  add column if not exists weight_unit text;
