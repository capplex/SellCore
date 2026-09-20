create table if not exists public.merchant_themes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  mode text not null default 'visual' check (mode in ('visual','code')),
  source_platform text,
  base_theme_id uuid references public.themes(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  draft_layout jsonb not null default '{"home":[]}'::jsonb,
  published_layout jsonb not null default '{"home":[]}'::jsonb,
  custom_css text not null default '',
  source_files jsonb not null default '{}'::jsonb,
  import_report jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, name)
);

create index if not exists merchant_themes_merchant_idx on public.merchant_themes(merchant_id);
create index if not exists merchant_themes_store_idx on public.merchant_themes(store_id);

alter table public.theme_settings
  add column if not exists custom_theme_id uuid references public.merchant_themes(id) on delete set null;

alter table public.merchant_themes enable row level security;

drop policy if exists merchant_themes_member on public.merchant_themes;
create policy merchant_themes_member on public.merchant_themes
for all
using (public.is_merchant_member(merchant_id) or public.current_user_is_admin())
with check (public.is_merchant_member(merchant_id) or public.current_user_is_admin());

grant select, insert, update, delete on public.merchant_themes to authenticated;
grant all privileges on public.merchant_themes to service_role;
