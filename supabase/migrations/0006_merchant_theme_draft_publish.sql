alter table public.merchant_themes
  add column if not exists published_settings jsonb not null default '{}'::jsonb,
  add column if not exists published_custom_css text not null default '';

update public.merchant_themes
set published_settings=settings,
    published_custom_css=custom_css
where published_settings='{}'::jsonb and published_custom_css='';
