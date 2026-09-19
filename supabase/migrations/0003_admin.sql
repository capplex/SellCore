create table public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  reporter_email text,
  category text not null,
  description text not null,
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.abuse_reports enable row level security;
alter table public.platform_settings enable row level security;
create policy abuse_admin on public.abuse_reports for all using(public.current_user_is_admin()) with check(public.current_user_is_admin());
create policy settings_admin on public.platform_settings for all using(public.current_user_is_admin()) with check(public.current_user_is_admin());
insert into public.platform_settings(key,value) values
('storefront_registration', '{"enabled":true}'::jsonb),
('support', '{"email":"support@example.com"}'::jsonb)
on conflict do nothing;
