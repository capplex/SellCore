-- SellCore initial production schema
create extension if not exists pgcrypto;

create type public.platform_role as enum ('user','admin');
create type public.member_role as enum ('owner','admin','staff','viewer');
create type public.store_status as enum ('draft','published','unpublished','suspended');
create type public.product_type as enum ('license','digital_file','account','service','subscription','generated','custom');
create type public.product_status as enum ('draft','active','archived');
create type public.inventory_status as enum ('available','reserved','sold','invalid','disabled');
create type public.payment_status as enum ('pending','paid','failed','refunded','partially_refunded');
create type public.fulfillment_status as enum ('pending','processing','fulfilled','failed','manual','refunded');
create type public.review_status as enum ('pending','approved','hidden','rejected');
create type public.domain_status as enum ('pending','verified','failed');
create type public.subscription_status as enum ('free','trialing','active','past_due','canceled','unpaid','incomplete');
create type public.billing_interval as enum ('none','monthly','yearly');
create type public.service_status as enum ('pending','paid','in_progress','awaiting_customer','completed','cancelled','refunded');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  platform_role public.platform_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.merchant_members (
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (merchant_id, user_id)
);

create table public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_free boolean not null default false,
  is_active boolean not null default true,
  monthly_price_minor integer not null default 0 check (monthly_price_minor >= 0),
  yearly_price_minor integer not null default 0 check (yearly_price_minor >= 0),
  currency text not null default 'USD',
  stripe_monthly_price_id text,
  stripe_yearly_price_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_features (
  plan_id uuid not null references public.platform_plans(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  primary key (plan_id, feature_key)
);

create table public.plan_limits (
  plan_id uuid not null references public.platform_plans(id) on delete cascade,
  limit_key text not null,
  limit_value bigint,
  primary key (plan_id, limit_key)
);

create table public.merchant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null unique references public.merchants(id) on delete cascade,
  plan_id uuid not null references public.platform_plans(id),
  status public.subscription_status not null default 'free',
  billing_interval public.billing_interval not null default 'none',
  stripe_subscription_id text unique,
  stripe_price_id text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  status public.store_status not null default 'draft',
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stores_merchant_idx on public.stores(merchant_id);

create table public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  title text,
  meta_description text,
  logo_path text,
  favicon_path text,
  og_image_path text,
  support_email text,
  checkout_require_account boolean not null default false,
  verified_reviews_only boolean not null default true,
  header_links jsonb not null default '[]'::jsonb,
  footer_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  is_advanced boolean not null default false,
  defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.theme_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  theme_id uuid not null references public.themes(id),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  slug text not null,
  content jsonb not null default '[]'::jsonb,
  status public.product_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  image_path text,
  created_at timestamptz not null default now(),
  unique(store_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  short_description text,
  type public.product_type not null,
  status public.product_status not null default 'draft',
  price_minor integer not null default 0 check (price_minor >= 0),
  currency text not null default 'USD',
  sku text,
  tags text[] not null default '{}',
  inventory_quantity integer,
  track_inventory boolean not null default false,
  custom_fields jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  subscription_interval text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug),
  unique(store_id, sku)
);
create index products_store_status_idx on public.products(store_id, status);
create index products_search_idx on public.products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' ')));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price_minor integer check (price_minor >= 0),
  inventory_quantity integer,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, sku)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key(product_id, category_id)
);

create table public.license_pools (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.license_pools(id) on delete cascade,
  key_value text not null,
  key_hash text not null,
  status public.inventory_status not null default 'available',
  reserved_until timestamptz,
  order_item_id uuid,
  created_at timestamptz not null default now(),
  unique(pool_id, key_hash)
);
create index licenses_claim_idx on public.licenses(pool_id, status, created_at);

create table public.account_pools (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table public.account_inventory (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.account_pools(id) on delete cascade,
  encrypted_payload text not null,
  fingerprint text not null,
  status public.inventory_status not null default 'available',
  reserved_until timestamptz,
  order_item_id uuid,
  created_at timestamptz not null default now(),
  unique(pool_id, fingerprint)
);
create index account_inventory_claim_idx on public.account_inventory(pool_id, status, created_at);

create table public.digital_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint not null default 0,
  max_downloads integer,
  created_at timestamptz not null default now()
);

create table public.generated_products (
  product_id uuid primary key references public.products(id) on delete cascade,
  mode text not null default 'internal',
  endpoint_url text,
  encrypted_secret text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.custom_delivery (
  product_id uuid primary key references public.products(id) on delete cascade,
  instructions text,
  webhook_url text,
  encrypted_secret text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider text not null check (provider in ('stripe')),
  provider_account_id text not null,
  charges_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, provider),
  unique(provider, provider_account_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  auth_user_id uuid references public.users(id) on delete set null,
  email text not null,
  name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, email)
);
create index customers_store_idx on public.customers(store_id);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value integer not null check (discount_value > 0),
  currency text,
  expires_at timestamptz,
  usage_limit integer,
  per_customer_limit integer,
  minimum_order_minor integer,
  product_ids uuid[] not null default '{}',
  category_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(store_id, code)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  order_number bigint generated always as identity,
  currency text not null,
  subtotal_minor integer not null check (subtotal_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'pending',
  payment_provider text,
  payment_provider_session_id text unique,
  payment_provider_payment_id text,
  access_token_hash text,
  coupon_id uuid references public.coupons(id) on delete set null,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_store_created_idx on public.orders(store_id, created_at desc);
create index orders_customer_idx on public.orders(customer_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  product_type public.product_type not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  metadata jsonb not null default '{}'::jsonb
);
create index order_items_order_idx on public.order_items(order_id);

alter table public.licenses add constraint licenses_order_item_fk foreign key(order_item_id) references public.order_items(id) on delete set null;
alter table public.account_inventory add constraint account_inventory_order_item_fk foreign key(order_item_id) references public.order_items(id) on delete set null;

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  delivery_type text not null,
  payload jsonb not null default '{}'::jsonb,
  download_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.service_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  status public.service_status not null default 'paid',
  customer_notes text,
  merchant_notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  provider text not null,
  provider_subscription_id text not null unique,
  status text not null,
  started_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  amount_minor integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  session_token_hash text,
  currency text not null,
  coupon_code text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  addons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(cart_id, product_id, variant_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) between 3 and 5000),
  verified_purchase boolean not null default false,
  status public.review_status not null default 'pending',
  merchant_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, customer_id, order_item_id)
);
create index reviews_public_idx on public.reviews(product_id, status, created_at desc);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  hostname text not null unique,
  status public.domain_status not null default 'pending',
  verification_token text not null default encode(gen_random_bytes(16), 'hex'),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  url text not null,
  events text[] not null,
  secret_hash text not null,
  encrypted_secret text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_id uuid not null default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  attempt integer not null default 0,
  status text not null default 'pending' check (status in ('pending','delivered','failed')),
  response_status integer,
  response_body text,
  next_attempt_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(webhook_id, event_id)
);
create index webhook_delivery_queue_idx on public.webhook_deliveries(status, next_attempt_at);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  session_id text,
  customer_id uuid references public.customers(id) on delete set null,
  event_type text not null,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index analytics_store_time_idx on public.analytics_events(store_id, created_at desc);
create index analytics_store_event_idx on public.analytics_events(store_id, event_type, created_at desc);

create table public.merchant_usage (
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  period_start date not null,
  metric_key text not null,
  metric_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key(merchant_id, period_start, metric_key)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index notifications_merchant_idx on public.notifications(merchant_id, read_at, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index audit_merchant_idx on public.audit_logs(merchant_id, created_at desc);

create table public.api_rate_limits (
  key_hash text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0,
  primary key(key_hash, bucket_start)
);

-- Auth and tenant helper functions.
create or replace function public.current_user_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.users where id = auth.uid() and platform_role = 'admin');
$$;

create or replace function public.is_merchant_member(target_merchant uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.merchant_members where merchant_id = target_merchant and user_id = auth.uid());
$$;

create or replace function public.can_access_store(target_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.stores s
    join public.merchant_members mm on mm.merchant_id = s.merchant_id
    where s.id = target_store and mm.user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users(id, email, display_name)
  values(new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

-- Atomic inventory claims. These functions run server-side and prevent double assignment.
create or replace function public.claim_license(p_order_item uuid, p_product uuid, p_variant uuid default null)
returns table(license_id uuid, key_value text)
language plpgsql security definer set search_path = public as $$
declare v_license public.licenses%rowtype;
begin
  if exists(select 1 from public.deliveries where order_item_id = p_order_item) then return; end if;
  select l.* into v_license
  from public.licenses l join public.license_pools lp on lp.id = l.pool_id
  where lp.product_id = p_product
    and (p_variant is null or lp.variant_id = p_variant)
    and l.status = 'available'
  order by l.created_at
  for update skip locked limit 1;
  if not found then raise exception 'OUT_OF_STOCK'; end if;
  update public.licenses set status='sold', order_item_id=p_order_item, reserved_until=null where id=v_license.id;
  license_id := v_license.id; key_value := v_license.key_value; return next;
end; $$;

create or replace function public.claim_account_inventory(p_order_item uuid, p_product uuid, p_variant uuid default null)
returns table(inventory_id uuid, encrypted_payload text)
language plpgsql security definer set search_path = public as $$
declare v_item public.account_inventory%rowtype;
begin
  if exists(select 1 from public.deliveries where order_item_id = p_order_item) then return; end if;
  select ai.* into v_item
  from public.account_inventory ai join public.account_pools ap on ap.id = ai.pool_id
  where ap.product_id = p_product
    and (p_variant is null or ap.variant_id = p_variant)
    and ai.status = 'available'
  order by ai.created_at
  for update skip locked limit 1;
  if not found then raise exception 'OUT_OF_STOCK'; end if;
  update public.account_inventory set status='sold', order_item_id=p_order_item, reserved_until=null where id=v_item.id;
  inventory_id := v_item.id; encrypted_payload := v_item.encrypted_payload; return next;
end; $$;

create or replace function public.increment_usage(p_merchant uuid, p_metric text, p_amount bigint default 1)
returns void language sql security definer set search_path = public as $$
  insert into public.merchant_usage(merchant_id, period_start, metric_key, metric_value)
  values(p_merchant, date_trunc('month', now())::date, p_metric, p_amount)
  on conflict (merchant_id, period_start, metric_key)
  do update set metric_value = public.merchant_usage.metric_value + excluded.metric_value, updated_at = now();
$$;

create or replace function public.check_api_rate_limit(p_key_hash text, p_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_bucket timestamptz := date_trunc('minute', now()); v_count integer;
begin
  insert into public.api_rate_limits(key_hash, bucket_start, request_count)
  values(p_key_hash, v_bucket, 1)
  on conflict(key_hash, bucket_start) do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_count;
  return v_count <= p_limit;
end; $$;

-- Updated-at triggers.
do $$ declare t text; begin
  foreach t in array array['users','merchants','platform_plans','merchant_subscriptions','stores','store_settings','products','customers','orders','reviews','theme_settings','payment_accounts','webhooks']
  loop execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t); end loop;
end $$;

-- Enable RLS on every user-facing table.
alter table public.users enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_members enable row level security;
alter table public.platform_plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.plan_limits enable row level security;
alter table public.merchant_subscriptions enable row level security;
alter table public.stores enable row level security;
alter table public.store_settings enable row level security;
alter table public.themes enable row level security;
alter table public.theme_settings enable row level security;
alter table public.pages enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;
alter table public.license_pools enable row level security;
alter table public.licenses enable row level security;
alter table public.account_pools enable row level security;
alter table public.account_inventory enable row level security;
alter table public.digital_files enable row level security;
alter table public.generated_products enable row level security;
alter table public.custom_delivery enable row level security;
alter table public.payment_accounts enable row level security;
alter table public.customers enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.service_fulfillments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.reviews enable row level security;
alter table public.domains enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.analytics_events enable row level security;
alter table public.merchant_usage enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles and platform configuration.
create policy users_self on public.users for select using (id = auth.uid() or public.current_user_is_admin());
create policy users_self_update on public.users for update using (id = auth.uid()) with check (id = auth.uid());
create policy plans_public_read on public.platform_plans for select using (is_active or public.current_user_is_admin());
create policy plan_features_public_read on public.plan_features for select using (exists(select 1 from public.platform_plans p where p.id=plan_id and p.is_active) or public.current_user_is_admin());
create policy plan_limits_public_read on public.plan_limits for select using (exists(select 1 from public.platform_plans p where p.id=plan_id and p.is_active) or public.current_user_is_admin());
create policy themes_public_read on public.themes for select using (is_active or public.current_user_is_admin());

-- Merchant-owned direct tables.
create policy merchants_member on public.merchants for select using (public.is_merchant_member(id) or public.current_user_is_admin());
create policy merchant_members_member on public.merchant_members for select using (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy merchant_subscriptions_member on public.merchant_subscriptions for select using (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy api_keys_member on public.api_keys for all using (public.is_merchant_member(merchant_id) or public.current_user_is_admin()) with check (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy webhooks_member on public.webhooks for all using (public.is_merchant_member(merchant_id) or public.current_user_is_admin()) with check (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy merchant_usage_member on public.merchant_usage for select using (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy notifications_member on public.notifications for all using (public.is_merchant_member(merchant_id) or public.current_user_is_admin()) with check (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy audit_logs_member on public.audit_logs for select using (public.is_merchant_member(merchant_id) or public.current_user_is_admin());

-- Store-owned direct tables.
create policy stores_member on public.stores for all using (public.is_merchant_member(merchant_id) or public.current_user_is_admin()) with check (public.is_merchant_member(merchant_id) or public.current_user_is_admin());
create policy store_settings_member on public.store_settings for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy theme_settings_member on public.theme_settings for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy pages_member on public.pages for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy categories_member on public.categories for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy products_member on public.products for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy payment_accounts_member on public.payment_accounts for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy customers_member on public.customers for all using (public.can_access_store(store_id) or auth_user_id = auth.uid() or public.current_user_is_admin()) with check (public.can_access_store(store_id) or auth_user_id = auth.uid() or public.current_user_is_admin());
create policy coupons_member on public.coupons for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy orders_member on public.orders for select using (public.can_access_store(store_id) or customer_id in (select id from public.customers where auth_user_id=auth.uid()) or public.current_user_is_admin());
create policy reviews_member on public.reviews for all using (public.can_access_store(store_id) or customer_id in (select id from public.customers where auth_user_id=auth.uid()) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or customer_id in (select id from public.customers where auth_user_id=auth.uid()) or public.current_user_is_admin());
create policy domains_member on public.domains for all using (public.can_access_store(store_id) or public.current_user_is_admin()) with check (public.can_access_store(store_id) or public.current_user_is_admin());
create policy analytics_member on public.analytics_events for select using (public.can_access_store(store_id) or public.current_user_is_admin());

-- Child-table policies derive tenancy through parent relationships.
create policy variants_member on public.product_variants for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy images_member on public.product_images for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy pc_member on public.product_categories for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy license_pools_member on public.license_pools for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy licenses_member on public.licenses for all using (exists(select 1 from public.license_pools lp join public.products p on p.id=lp.product_id where lp.id=pool_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.license_pools lp join public.products p on p.id=lp.product_id where lp.id=pool_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy account_pools_member on public.account_pools for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy account_inventory_member on public.account_inventory for all using (exists(select 1 from public.account_pools ap join public.products p on p.id=ap.product_id where ap.id=pool_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.account_pools ap join public.products p on p.id=ap.product_id where ap.id=pool_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy digital_files_member on public.digital_files for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy generated_products_member on public.generated_products for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy custom_delivery_member on public.custom_delivery for all using (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()) with check (exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin());
create policy order_items_member on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and (public.can_access_store(o.store_id) or o.customer_id in (select id from public.customers where auth_user_id=auth.uid()))) or public.current_user_is_admin());
create policy deliveries_member on public.deliveries for select using (exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.id=order_item_id and (public.can_access_store(o.store_id) or o.customer_id in (select id from public.customers where auth_user_id=auth.uid()))) or public.current_user_is_admin());
create policy service_member on public.service_fulfillments for all using (exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.id=order_item_id and (public.can_access_store(o.store_id) or o.customer_id in (select id from public.customers where auth_user_id=auth.uid()))) or public.current_user_is_admin()) with check (exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.id=order_item_id and public.can_access_store(o.store_id)) or public.current_user_is_admin());
create policy subscriptions_member on public.subscriptions for select using (public.can_access_store(store_id) or customer_id in (select id from public.customers where auth_user_id=auth.uid()) or public.current_user_is_admin());
create policy coupon_redemptions_member on public.coupon_redemptions for select using (exists(select 1 from public.orders o where o.id=order_id and (public.can_access_store(o.store_id) or o.customer_id in (select id from public.customers where auth_user_id=auth.uid()))) or public.current_user_is_admin());
create policy carts_member on public.carts for select using (public.can_access_store(store_id) or customer_id in (select id from public.customers where auth_user_id=auth.uid()) or public.current_user_is_admin());
create policy cart_items_member on public.cart_items for select using (exists(select 1 from public.carts c where c.id=cart_id and (public.can_access_store(c.store_id) or c.customer_id in (select id from public.customers where auth_user_id=auth.uid()))) or public.current_user_is_admin());
create policy webhook_deliveries_member on public.webhook_deliveries for select using (exists(select 1 from public.webhooks w where w.id=webhook_id and public.is_merchant_member(w.merchant_id)) or public.current_user_is_admin());

-- Storage buckets are private. Application code creates signed URLs only after authorization.
insert into storage.buckets(id, name, public) values ('product-images','product-images',true) on conflict do nothing;
insert into storage.buckets(id, name, public) values ('digital-files','digital-files',false) on conflict do nothing;
insert into storage.buckets(id, name, public) values ('store-assets','store-assets',true) on conflict do nothing;

-- Platform configuration seed. These are defaults, editable in /admin/plans after setup.
insert into public.platform_plans(slug,name,description,is_free,monthly_price_minor,yearly_price_minor,sort_order) values
('free','Free','A permanent plan for getting a real store online.',true,0,0,0),
('starter','Starter','Higher limits, custom domains and more storefront control.',false,1200,12000,10),
('pro','Pro','Advanced analytics, API, webhooks and higher limits.',false,2900,29000,20),
('business','Business','Multiple stores and the highest operating limits.',false,7900,79000,30)
on conflict(slug) do nothing;

insert into public.plan_limits(plan_id,limit_key,limit_value)
select id, key, value from public.platform_plans p cross join lateral (values
 ('stores', case p.slug when 'free' then 1 when 'starter' then 1 when 'pro' then 3 else 10 end::bigint),
 ('products', case p.slug when 'free' then 10 when 'starter' then 100 when 'pro' then 1000 else 10000 end::bigint),
 ('orders_monthly', case p.slug when 'free' then 100 when 'starter' then 1000 when 'pro' then 10000 else 100000 end::bigint),
 ('customers', case p.slug when 'free' then 500 when 'starter' then 5000 when 'pro' then 50000 else 500000 end::bigint),
 ('storage_mb', case p.slug when 'free' then 250 when 'starter' then 2000 when 'pro' then 20000 else 100000 end::bigint),
 ('api_requests_minute', case p.slug when 'free' then 0 when 'starter' then 0 when 'pro' then 120 else 600 end::bigint),
 ('webhook_deliveries_monthly', case p.slug when 'free' then 0 when 'starter' then 0 when 'pro' then 10000 else 100000 end::bigint),
 ('custom_domains', case p.slug when 'free' then 0 when 'starter' then 1 when 'pro' then 3 else 20 end::bigint),
 ('team_members', case p.slug when 'free' then 1 when 'starter' then 2 when 'pro' then 10 else 50 end::bigint),
 ('analytics_retention_days', case p.slug when 'free' then 30 when 'starter' then 90 when 'pro' then 365 else 1095 end::bigint),
 ('digital_downloads_monthly', case p.slug when 'free' then 250 when 'starter' then 5000 when 'pro' then 50000 else 500000 end::bigint),
 ('product_variants', case p.slug when 'free' then 3 when 'starter' then 20 when 'pro' then 100 else 500 end::bigint)
) v(key,value)
on conflict(plan_id,limit_key) do nothing;

insert into public.plan_features(plan_id,feature_key,enabled)
select p.id, f.key,
  case f.key
    when 'basic_storefront' then true
    when 'basic_analytics' then true
    when 'reviews' then true
    when 'custom_domain' then p.slug <> 'free'
    when 'advanced_themes' then p.slug in ('pro','business')
    when 'advanced_analytics' then p.slug in ('pro','business')
    when 'api' then p.slug in ('pro','business')
    when 'webhooks' then p.slug in ('pro','business')
    when 'custom_branding' then p.slug <> 'free'
    when 'priority_support' then p.slug = 'business'
    else false end
from public.platform_plans p cross join lateral (values
 ('basic_storefront'),('basic_analytics'),('reviews'),('custom_domain'),('advanced_themes'),('advanced_analytics'),('api'),('webhooks'),('custom_branding'),('priority_support')
) f(key)
on conflict(plan_id,feature_key) do nothing;

insert into public.themes(slug,name,description,is_advanced,defaults) values
('minimal','Minimal','Quiet typography, generous whitespace, compact product cards.',false,'{"layout":"grid","radius":"8px","font":"Manrope","background":"#f5f5f5","text":"#111111","accent":"#E50914"}'),
('dark','Dark','Dense charcoal storefront with sharp contrast.',false,'{"layout":"grid","radius":"8px","font":"Manrope","background":"#050505","text":"#F5F5F5","accent":"#E50914"}'),
('editorial','Editorial','Large type, asymmetric cards and content-led sections.',true,'{"layout":"editorial","radius":"0px","font":"Space Grotesk","background":"#f1efe9","text":"#111111","accent":"#8B0000"}'),
('modern','Modern','Balanced product discovery with soft geometric surfaces.',true,'{"layout":"grid","radius":"16px","font":"Plus Jakarta Sans","background":"#090909","text":"#F5F5F5","accent":"#E50914"}'),
('technical','Technical','Compact data-rich cards and structured borders.',true,'{"layout":"technical","radius":"4px","font":"Space Grotesk","background":"#050505","text":"#F5F5F5","accent":"#FF1A24"}')
on conflict(slug) do nothing;
