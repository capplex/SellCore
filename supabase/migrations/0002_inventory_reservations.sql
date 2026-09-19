create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status text not null default 'reserved' check (status in ('reserved','consumed','released')),
  expires_at timestamptz not null default (now() + interval '35 minutes'),
  created_at timestamptz not null default now()
);
alter table public.inventory_reservations enable row level security;
create policy inventory_reservations_member on public.inventory_reservations for select using (
  exists(select 1 from public.products p where p.id=product_id and public.can_access_store(p.store_id)) or public.current_user_is_admin()
);

create or replace function public.reserve_order_item_inventory(p_order_item uuid, p_product uuid, p_variant uuid, p_quantity integer)
returns void language plpgsql security definer set search_path = public as $$
declare p public.products%rowtype; v public.product_variants%rowtype; available integer;
begin
  select * into p from public.products where id=p_product for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if p.type in ('license','account','digital_file','service','subscription','generated','custom') and not p.track_inventory then
    insert into public.inventory_reservations(order_item_id,product_id,variant_id,quantity) values(p_order_item,p_product,p_variant,p_quantity) on conflict do nothing;
    return;
  end if;
  if p_variant is not null then
    select * into v from public.product_variants where id=p_variant and product_id=p_product for update;
    if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
    if v.inventory_quantity is null then
      insert into public.inventory_reservations(order_item_id,product_id,variant_id,quantity) values(p_order_item,p_product,p_variant,p_quantity) on conflict do nothing;
      return;
    end if;
    available := v.inventory_quantity;
    if available < p_quantity then raise exception 'OUT_OF_STOCK'; end if;
    update public.product_variants set inventory_quantity=inventory_quantity-p_quantity where id=p_variant;
  elsif p.track_inventory then
    available := coalesce(p.inventory_quantity,0);
    if available < p_quantity then raise exception 'OUT_OF_STOCK'; end if;
    update public.products set inventory_quantity=inventory_quantity-p_quantity where id=p_product;
  end if;
  insert into public.inventory_reservations(order_item_id,product_id,variant_id,quantity) values(p_order_item,p_product,p_variant,p_quantity) on conflict do nothing;
end; $$;

create or replace function public.reserve_license_inventory(p_order_item uuid, p_product uuid, p_variant uuid, p_quantity integer)
returns void language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(id) into ids from (
    select l.id from public.licenses l join public.license_pools lp on lp.id=l.pool_id
    where lp.product_id=p_product and (p_variant is null or lp.variant_id=p_variant)
      and (l.status='available' or (l.status='reserved' and l.reserved_until < now()))
    order by l.created_at for update skip locked limit p_quantity
  ) s;
  if coalesce(array_length(ids,1),0) < p_quantity then raise exception 'OUT_OF_STOCK'; end if;
  update public.licenses set status='reserved', reserved_until=now()+interval '35 minutes', order_item_id=p_order_item where id=any(ids);
  insert into public.inventory_reservations(order_item_id,product_id,variant_id,quantity) values(p_order_item,p_product,p_variant,p_quantity) on conflict do nothing;
end; $$;

create or replace function public.reserve_account_inventory(p_order_item uuid, p_product uuid, p_variant uuid, p_quantity integer)
returns void language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(id) into ids from (
    select ai.id from public.account_inventory ai join public.account_pools ap on ap.id=ai.pool_id
    where ap.product_id=p_product and (p_variant is null or ap.variant_id=p_variant)
      and (ai.status='available' or (ai.status='reserved' and ai.reserved_until < now()))
    order by ai.created_at for update skip locked limit p_quantity
  ) s;
  if coalesce(array_length(ids,1),0) < p_quantity then raise exception 'OUT_OF_STOCK'; end if;
  update public.account_inventory set status='reserved', reserved_until=now()+interval '35 minutes', order_item_id=p_order_item where id=any(ids);
  insert into public.inventory_reservations(order_item_id,product_id,variant_id,quantity) values(p_order_item,p_product,p_variant,p_quantity) on conflict do nothing;
end; $$;

create or replace function public.consume_order_reservations(p_order uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.inventory_reservations r set status='consumed'
    from public.order_items oi where oi.id=r.order_item_id and oi.order_id=p_order and r.status='reserved';
  update public.licenses l set status='sold', reserved_until=null
    from public.order_items oi where l.order_item_id=oi.id and oi.order_id=p_order and l.status='reserved';
  update public.account_inventory a set status='sold', reserved_until=null
    from public.order_items oi where a.order_item_id=oi.id and oi.order_id=p_order and a.status='reserved';
end; $$;

create or replace function public.release_order_reservations(p_order uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select ir.* from public.inventory_reservations ir join public.order_items oi on oi.id=ir.order_item_id where oi.order_id=p_order and ir.status='reserved' for update of ir
  loop
    if r.variant_id is not null then update public.product_variants set inventory_quantity=coalesce(inventory_quantity,0)+r.quantity where id=r.variant_id and inventory_quantity is not null;
    else update public.products set inventory_quantity=coalesce(inventory_quantity,0)+r.quantity where id=r.product_id and track_inventory=true;
    end if;
    update public.inventory_reservations set status='released' where id=r.id;
  end loop;
  update public.licenses l set status='available', reserved_until=null, order_item_id=null from public.order_items oi where l.order_item_id=oi.id and oi.order_id=p_order and l.status='reserved';
  update public.account_inventory a set status='available', reserved_until=null, order_item_id=null from public.order_items oi where a.order_item_id=oi.id and oi.order_id=p_order and a.status='reserved';
end; $$;
