create table public.customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  contact_id uuid unique references public.contacts (id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;
revoke all on public.customer_profiles from anon, authenticated;
grant select on public.customer_profiles to authenticated;

create policy customer_profiles_owner_read on public.customer_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.create_customer_profile()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ->> 'account_type' <> 'customer' then return new; end if;
  insert into public.customer_profiles (user_id, first_name, last_name, phone)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), 80),
    left(trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')), 80),
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), 30), '')
  );
  return new;
end $$;

create trigger on_auth_user_created_customer_profile
  after insert on auth.users
  for each row execute function public.create_customer_profile();

create policy contacts_customer_read on public.contacts for select to authenticated
  using (exists (
    select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.contact_id = contacts.id
  ));
create policy orders_customer_read on public.orders for select to authenticated
  using (exists (
    select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.contact_id = orders.contact_id
  ));
create policy order_items_customer_read on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    join public.customer_profiles cp on cp.contact_id = o.contact_id
    where cp.user_id = auth.uid() and o.id = order_items.order_id
  ));
create policy payments_customer_read on public.payments for select to authenticated
  using (exists (
    select 1 from public.orders o
    join public.customer_profiles cp on cp.contact_id = o.contact_id
    where cp.user_id = auth.uid() and o.id = payments.order_id
  ));

create or replace function public.create_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer jsonb := p -> 'customer';
  v_delivery jsonb := p -> 'delivery';
  v_payment jsonb := p -> 'payment';
  v_user_id uuid := nullif(v_customer ->> 'auth_user_id', '')::uuid;
  v_auth_email text;
  v_contact uuid; v_order uuid; v_code text;
  v_item jsonb; v_product products; v_qty int;
  v_subtotal numeric(10,2) := 0; v_fee numeric(10,2); v_total numeric(10,2);
  v_type text := v_delivery ->> 'type';
  v_district text := nullif(left(trim(coalesce(v_delivery ->> 'district', '')), 80), '');
  v_method text := v_payment ->> 'method';
  v_operation text := nullif(left(trim(coalesce(v_payment ->> 'operation_number', '')), 40), '');
  v_pay_status text;
  v_items jsonb := '[]';
begin
  if v_user_id is null then raise exception 'cuenta_cliente_requerida'; end if;
  select lower(email) into v_auth_email from auth.users where id = v_user_id;
  if v_auth_email is null or v_auth_email <> lower(trim(coalesce(v_customer ->> 'email', ''))) then
    raise exception 'cuenta_cliente_invalida';
  end if;
  if not exists (select 1 from customer_profiles where user_id = v_user_id) then
    raise exception 'cuenta_cliente_requerida';
  end if;
  if jsonb_typeof(p -> 'items') <> 'array' or jsonb_array_length(p -> 'items') = 0 then
    raise exception 'carrito_vacio';
  end if;
  if jsonb_array_length(p -> 'items') > 20 then raise exception 'carrito_demasiado_grande'; end if;
  if v_type is null or v_type not in ('delivery', 'recojo') then raise exception 'entrega_invalida'; end if;
  if v_type = 'recojo' and not coalesce((select (value #>> '{}')::boolean from site_settings where key = 'pickup_enabled'), false) then
    raise exception 'entrega_invalida';
  end if;
  if v_method is null or v_method not in ('yape', 'plin', 'transferencia') then raise exception 'pago_invalido'; end if;
  if v_type = 'delivery' and (v_district is null or nullif(trim(coalesce(v_delivery ->> 'address', '')), '') is null) then
    raise exception 'direccion_requerida';
  end if;

  select u.contact_id into v_contact
  from upsert_contact(v_customer ->> 'first_name', v_customer ->> 'last_name', v_auth_email,
                      v_customer ->> 'phone', coalesce((v_customer ->> 'marketing_consent')::boolean, false),
                      'checkout') u;

  update customer_profiles set contact_id = v_contact
  where user_id = v_user_id and (contact_id is null or contact_id = v_contact);
  if not found then raise exception 'cuenta_cliente_invalida'; end if;

  if v_type = 'recojo' then
    v_fee := 0;
  else
    select (z ->> 'fee')::numeric into v_fee
    from site_settings s, jsonb_array_elements(s.value) z
    where s.key = 'delivery_zones' and lower(z ->> 'name') = lower(v_district) limit 1;
  end if;

  v_code := new_code('DMP');
  insert into orders (order_code, contact_id, delivery_type, district, address, reference,
                      requested_date, comments, subtotal, delivery_fee, total)
  values (v_code, v_contact, v_type, v_district,
          nullif(left(trim(coalesce(v_delivery ->> 'address', '')), 200), ''),
          nullif(left(trim(coalesce(v_delivery ->> 'reference', '')), 200), ''),
          nullif(v_delivery ->> 'requested_date', '')::date,
          nullif(left(trim(coalesce(v_delivery ->> 'comments', '')), 1000), ''),
          0, v_fee, 0)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    select * into v_product from products where id = v_item ->> 'product_id' and active;
    if v_product.id is null or v_product.price is null then raise exception 'producto_no_disponible'; end if;
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'cantidad_invalida'; end if;
    insert into order_items (order_id, product_id, product_name, unit_price, quantity, options, subtotal)
    values (v_order, v_product.id, v_product.name, v_product.price, v_qty,
            coalesce(v_item -> 'options', '{}'), v_product.price * v_qty);
    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_items := v_items || jsonb_build_object(
      'product_name', v_product.name, 'unit_price', v_product.price, 'quantity', v_qty,
      'options', coalesce(v_item -> 'options', '{}'), 'subtotal', v_product.price * v_qty);
  end loop;

  v_total := v_subtotal + coalesce(v_fee, 0);
  update orders set subtotal = v_subtotal, total = v_total where id = v_order;

  v_pay_status := case when v_operation is null then 'pendiente' else 'en_verificacion' end;
  insert into payments (order_id, method, amount, operation_number, status)
  values (v_order, v_method, v_total, v_operation, v_pay_status);

  perform refresh_contact_lifecycle(v_contact);
  if v_pay_status = 'pendiente' then
    perform enroll_automation('pedido_pendiente', v_contact, v_order);
  end if;

  return jsonb_build_object(
    'order_id', v_order, 'order_code', v_code, 'contact_id', v_contact,
    'subtotal', v_subtotal, 'delivery_fee', v_fee, 'total', v_total,
    'payment_method', v_method, 'payment_status', v_pay_status,
    'delivery_type', v_type, 'district', v_district, 'items', v_items,
    'first_name', (select first_name from contacts where id = v_contact),
    'email', v_auth_email);
end $$;

revoke execute on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
