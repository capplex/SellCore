alter table public.platform_plans add column if not exists trial_days integer not null default 0 check (trial_days between 0 and 365);
