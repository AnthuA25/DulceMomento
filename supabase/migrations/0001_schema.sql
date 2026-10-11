-- =====================================================================
-- Dulce Momento — esquema de base de datos
-- Contactos (1) → (N) consultas / pedidos / notas / eventos de email.
-- Toda escritura pública pasa por Edge Functions (service role);
-- el panel administrativo accede con RLS mediante is_admin().
-- =====================================================================

-- ---------- Administración ----------
create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Administrador',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

-- ---------- Configuración ----------
create table public.site_settings (
  key text primary key,
  value jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null,
  price numeric(10,2),                 -- null = precio según diseño (solo cotización)
  portions text not null,
  lead_time text not null,
  flavors jsonb not null default '[]',
  customizable boolean not null default false,
  personalization_fields jsonb not null default '[]',
  image text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- CRM ----------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  email text not null unique check (email = lower(email)),
  phone text,
  customer_type text not null default 'nuevo'
    check (customer_type in ('nuevo', 'recurrente')),
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead', 'interesado', 'cliente', 'cliente_recurrente', 'cliente_fidelizado')),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  source text not null default 'formulario',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  request_code text not null unique,
  inquiry_type text not null
    check (inquiry_type in ('cotizacion', 'keke_personalizado', 'pedido', 'delivery', 'otro')),
  product_id text references public.products (id) on delete set null,
  product_name text,
  event_type text,
  event_date date,
  quantity text,
  message text,
  source text not null default 'formulario'
    check (source in ('formulario', 'chatbot', 'checkout', 'suscripcion')),
  status text not null default 'nueva'
    check (status in ('nueva', 'en_proceso', 'respondida', 'cerrada')),
  created_at timestamptz not null default now()
);
create index inquiries_contact_idx on public.inquiries (contact_id, created_at desc);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  contact_id uuid not null references public.contacts (id) on delete restrict,
  delivery_type text not null check (delivery_type in ('delivery', 'recojo')),
  district text,
  address text,
  reference text,
  requested_date date,
  comments text,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2),          -- null = por confirmar con el cliente
  total numeric(10,2) not null,
  status text not null default 'recibido'
    check (status in ('recibido', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_contact_idx on public.orders (contact_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity between 1 and 20),
  options jsonb not null default '{}',
  subtotal numeric(10,2) not null
);
create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method text not null check (method in ('yape', 'plin', 'transferencia', 'online')),
  amount numeric(10,2) not null,
  operation_number text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_verificacion', 'pagado', 'rechazado')),
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

create table public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index crm_notes_contact_idx on public.crm_notes (contact_id, created_at desc);

create table public.marketing_consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  granted boolean not null,
  source text not null,
  created_at timestamptz not null default now()
);

-- ---------- Email marketing ----------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  sender_name text not null default 'Dulce Momento',
  kind text not null check (kind in ('comercial', 'operativa')),
  html text not null,
  segment text not null default 'manual',
  status text not null default 'borrador'
    check (status in ('borrador', 'programada', 'enviando', 'enviada', 'error')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count int not null default 0,
  error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  email text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'enviado', 'error', 'omitido')),
  provider_message_id text,
  error text,
  sent_at timestamptz,
  unique (campaign_id, contact_id)
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete cascade,
  email text not null,
  kind text not null check (kind in ('transaccional', 'campana', 'automatizacion')),
  type text not null
    check (type in ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed')),
  subject text,
  provider_message_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index email_events_campaign_idx on public.email_events (campaign_id, type);
create index email_events_contact_idx on public.email_events (contact_id, created_at desc);
create index email_events_message_idx on public.email_events (provider_message_id);

-- ---------- Automatizaciones ----------
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  trigger_label text not null,
  requires_marketing_consent boolean not null default true,
  enabled boolean not null default false
);

create table public.automation_steps (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  step_order int not null,
  delay_days int not null check (delay_days >= 0),
  name text not null,
  subject text not null,
  html text not null,
  unique (automation_id, step_order)
);

create table public.automation_enrollments (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  status text not null default 'activa' check (status in ('activa', 'completada', 'detenida')),
  current_step int not null default 0,
  stop_reason text,
  enrolled_at timestamptz not null default now(),
  next_run_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index automation_enrollments_unique on public.automation_enrollments
  (automation_id, contact_id, coalesce(order_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index automation_enrollments_due_idx on public.automation_enrollments (status, next_run_at);

-- ---------- Anti-spam ----------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (key, window_start)
);

-- =====================================================================
-- Funciones internas
-- =====================================================================

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  delete from rate_limits where window_start < now() - interval '1 day';
  insert into rate_limits (key, window_start) values (p_key, v_window)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_max;
end $$;

create or replace function public.new_code(p_prefix text) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  loop
    v := p_prefix || '-' || lpad(floor(random() * 1000000)::int::text, 6, '0');
    exit when not exists (select 1 from inquiries where request_code = v)
          and not exists (select 1 from orders where order_code = v);
  end loop;
  return v;
end $$;

create or replace function public.lifecycle_rank(p_stage text) returns int
language sql immutable as $$
  select case p_stage
    when 'lead' then 1 when 'interesado' then 2 when 'cliente' then 3
    when 'cliente_recurrente' then 4 when 'cliente_fidelizado' then 5 else 0 end;
$$;

create or replace function public.paid_orders_count(p_contact uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(distinct o.id)::int from orders o
  join payments p on p.order_id = o.id and p.status = 'pagado'
  where o.contact_id = p_contact and o.status <> 'cancelado';
$$;

-- Customer Lifecycle: solo avanza de forma automática. El administrador puede
-- corregirlo manualmente desde el CRM. Es independiente de customer_type.
create or replace function public.refresh_contact_lifecycle(p_contact uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_current text;
  v_target text;
  v_paid int := paid_orders_count(p_contact);
  v_loyal int := coalesce((select (value #>> '{}')::int from site_settings where key = 'loyalty_min_orders'), 4);
  v_inquiries int;
  v_orders int;
  v_quotes int;
begin
  select lifecycle_stage into v_current from contacts where id = p_contact;
  if v_current is null then return null; end if;
  select count(*) into v_inquiries from inquiries where contact_id = p_contact;
  select count(*) into v_orders from orders where contact_id = p_contact;
  select count(*) into v_quotes from inquiries
    where contact_id = p_contact and inquiry_type in ('cotizacion', 'keke_personalizado', 'pedido');

  v_target := case
    when v_paid >= v_loyal then 'cliente_fidelizado'
    when v_paid >= 2 then 'cliente_recurrente'
    when v_paid >= 1 then 'cliente'
    when v_inquiries >= 2 or v_orders >= 1 or v_quotes >= 1 then 'interesado'
    else 'lead' end;

  if lifecycle_rank(v_target) > lifecycle_rank(v_current) then
    update contacts set lifecycle_stage = v_target, updated_at = now() where id = p_contact;
    return v_target;
  end if;
  return v_current;
end $$;

create or replace function public.enroll_automation(p_key text, p_contact uuid, p_order uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_auto uuid; v_delay int;
begin
  select id into v_auto from automations where key = p_key;
  if v_auto is null then return; end if;
  select delay_days into v_delay from automation_steps where automation_id = v_auto and step_order = 1;
  if v_delay is null then return; end if;
  insert into automation_enrollments (automation_id, contact_id, order_id, next_run_at)
  values (v_auto, p_contact, p_order, now() + make_interval(days => v_delay))
  on conflict do nothing;
end $$;

create or replace function public.stop_automation(p_key text, p_contact uuid, p_reason text)
returns void language sql security definer set search_path = public as $$
  update automation_enrollments e set status = 'detenida', stop_reason = p_reason, updated_at = now()
  from automations a
  where a.id = e.automation_id and a.key = p_key and e.contact_id = p_contact and e.status = 'activa';
$$;

-- Crea o actualiza el contacto usando el email como identificador.
create or replace function public.upsert_contact(
  p_first text, p_last text, p_email text, p_phone text, p_consent boolean, p_source text
) returns table (contact_id uuid, is_new boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
  v_had_consent boolean;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'email_invalido';
  end if;
  if char_length(trim(coalesce(p_first, ''))) < 2 then raise exception 'nombre_invalido'; end if;

  select id, marketing_consent into v_id, v_had_consent from contacts where email = v_email for update;

  if v_id is null then
    insert into contacts (first_name, last_name, email, phone, marketing_consent, marketing_consent_at, source)
    values (left(trim(p_first), 80), left(trim(coalesce(p_last, '')), 80), v_email,
            nullif(left(trim(coalesce(p_phone, '')), 30), ''),
            coalesce(p_consent, false), case when p_consent then now() end, p_source)
    returning id into v_id;
    if p_consent then
      insert into marketing_consents (contact_id, granted, source) values (v_id, true, p_source);
    end if;
    return query select v_id, true;
  else
    -- No marcar la casilla en una nueva consulta no revoca un consentimiento previo.
    update contacts set
      phone = coalesce(nullif(left(trim(coalesce(p_phone, '')), 30), ''), phone),
      marketing_consent = marketing_consent or coalesce(p_consent, false),
      marketing_consent_at = case when coalesce(p_consent, false) and not marketing_consent then now()
                                  else marketing_consent_at end,
      updated_at = now()
    where id = v_id;
    if coalesce(p_consent, false) and not v_had_consent then
      insert into marketing_consents (contact_id, granted, source) values (v_id, true, p_source);
    end if;
    return query select v_id, false;
  end if;
end $$;

-- Formulario y Dulce Bot: contacto + consulta + código único.
create or replace function public.submit_inquiry(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_contact uuid; v_is_new boolean; v_code text; v_inquiry uuid;
  v_product_id text; v_product_name text; v_count int; v_type text;
  v_consent boolean := coalesce((p ->> 'marketing_consent')::boolean, false);
  v_source text := coalesce(nullif(p ->> 'source', ''), 'formulario');
  v_message text := nullif(left(trim(coalesce(p ->> 'message', '')), 2000), '');
  v_contact_row contacts;
begin
  select u.contact_id, u.is_new into v_contact, v_is_new
  from upsert_contact(p ->> 'first_name', p ->> 'last_name', p ->> 'email', p ->> 'phone', v_consent, v_source) u;

  select id, name into v_product_id, v_product_name from products where id = nullif(p ->> 'product_id', '');

  v_code := new_code('DM');
  insert into inquiries (contact_id, request_code, inquiry_type, product_id, product_name,
                         event_type, event_date, quantity, message, source)
  values (v_contact, v_code, coalesce(nullif(p ->> 'inquiry_type', ''), 'otro'), v_product_id, v_product_name,
          nullif(left(coalesce(p ->> 'event_type', ''), 60), ''),
          nullif(p ->> 'event_date', '')::date,
          nullif(left(coalesce(p ->> 'quantity', ''), 60), ''),
          v_message, v_source)
  returning id into v_inquiry;

  -- Nuevo / Recurrente depende solo del número de consultas.
  select count(*) into v_count from inquiries where contact_id = v_contact;
  v_type := case when v_count >= 2 then 'recurrente' else 'nuevo' end;
  update contacts set customer_type = v_type, updated_at = now() where id = v_contact;

  perform refresh_contact_lifecycle(v_contact);

  select * into v_contact_row from contacts where id = v_contact;
  if v_contact_row.marketing_consent and paid_orders_count(v_contact) = 0 then
    perform enroll_automation('lead_nurture', v_contact);
  end if;

  return jsonb_build_object(
    'inquiry_id', v_inquiry, 'contact_id', v_contact, 'request_code', v_code,
    'is_new_contact', v_is_new, 'customer_type', v_type, 'inquiries_count', v_count,
    'first_name', v_contact_row.first_name, 'last_name', v_contact_row.last_name,
    'email', v_contact_row.email, 'phone', v_contact_row.phone,
    'product_name', v_product_name, 'marketing_consent', v_contact_row.marketing_consent,
    'unsubscribe_token', v_contact_row.unsubscribe_token);
end $$;

-- Checkout: los precios se calculan siempre desde la tabla products.
create or replace function public.create_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer jsonb := p -> 'customer';
  v_delivery jsonb := p -> 'delivery';
  v_payment jsonb := p -> 'payment';
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
  from upsert_contact(v_customer ->> 'first_name', v_customer ->> 'last_name', v_customer ->> 'email',
                      v_customer ->> 'phone', coalesce((v_customer ->> 'marketing_consent')::boolean, false),
                      'checkout') u;

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

  -- Un pago manual nunca nace como pagado: requiere verificación del administrador.
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
    'email', (select email from contacts where id = v_contact));
end $$;

-- Baja de comunicaciones comerciales mediante el enlace del correo.
create or replace function public.unsubscribe_contact(p_token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text;
begin
  select id, email into v_id, v_email from contacts where unsubscribe_token = p_token;
  if v_id is null then return false; end if;
  update contacts set marketing_consent = false, updated_at = now() where id = v_id and marketing_consent;
  if found then
    insert into marketing_consents (contact_id, granted, source) values (v_id, false, 'baja_email');
    insert into email_events (contact_id, email, kind, type) values (v_id, v_email, 'campana', 'unsubscribed');
    perform stop_automation('lead_nurture', v_id, 'baja');
  end if;
  return true;
end $$;

-- =====================================================================
-- Funciones del panel administrativo (validan is_admin())
-- =====================================================================

create or replace function public.admin_set_payment_status(p_payment uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_order orders; v_stage text;
begin
  if not is_admin() then raise exception 'no_autorizado'; end if;
  if p_status not in ('pendiente', 'en_verificacion', 'pagado', 'rechazado') then
    raise exception 'estado_invalido';
  end if;

  update payments set status = p_status,
    verified_by = case when p_status in ('pagado', 'rechazado') then auth.uid() end,
    verified_at = case when p_status in ('pagado', 'rechazado') then now() end
  where id = p_payment;
  if not found then raise exception 'pago_no_encontrado'; end if;

  select o.* into v_order from orders o join payments p on p.order_id = o.id where p.id = p_payment;

  if p_status = 'pagado' then
    update orders set status = 'confirmado', updated_at = now() where id = v_order.id and status = 'recibido';
    -- Quien ya compró sale de la secuencia de conversión y pasa a posventa.
    perform stop_automation('lead_nurture', v_order.contact_id, 'compra_confirmada');
    perform stop_automation('pedido_pendiente', v_order.contact_id, 'compra_confirmada');
    perform enroll_automation('posventa', v_order.contact_id, v_order.id);
  elsif p_status = 'en_verificacion' then
    perform stop_automation('pedido_pendiente', v_order.contact_id, 'pago_registrado');
  end if;

  v_stage := refresh_contact_lifecycle(v_order.contact_id);
  return jsonb_build_object('order_id', v_order.id, 'contact_id', v_order.contact_id, 'lifecycle_stage', v_stage);
end $$;

create or replace function public.admin_dashboard_metrics() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_total int; v_buyers int;
begin
  if not is_admin() then raise exception 'no_autorizado'; end if;
  select count(*) into v_total from contacts;
  select count(*) into v_buyers from contacts c where paid_orders_count(c.id) >= 1;
  return jsonb_build_object(
    'total_contacts', v_total,
    'new_contacts', (select count(*) from contacts where customer_type = 'nuevo'),
    'recurrent_contacts', (select count(*) from contacts where customer_type = 'recurrente'),
    'inquiries', (select count(*) from inquiries),
    'marketing_consent', (select count(*) from contacts where marketing_consent),
    'lifecycle', (select coalesce(jsonb_object_agg(lifecycle_stage, n), '{}')
                  from (select lifecycle_stage, count(*) n from contacts group by 1) s),
    'quote_contacts', (select count(distinct contact_id) from inquiries
                       where inquiry_type in ('cotizacion', 'keke_personalizado', 'pedido')),
    'orders', (select count(*) from orders),
    'paid_orders', (select count(distinct order_id) from payments where status = 'pagado'),
    'pending_payments', (select count(*) from payments where status in ('pendiente', 'en_verificacion')),
    'paid_revenue', (select coalesce(sum(amount), 0) from payments where status = 'pagado'),
    'buyers', v_buyers,
    'conversion_rate', case when v_total > 0 then round(v_buyers::numeric * 100 / v_total, 1) end);
end $$;

-- Directorio del CRM: una fila por contacto con el resumen de sus consultas.
create view public.contact_directory with (security_invoker = true) as
select c.*,
  (select count(*) from public.inquiries i where i.contact_id = c.id)::int as inquiries_count,
  (select count(*) from public.orders o where o.contact_id = c.id)::int as orders_count,
  li.inquiry_type as last_inquiry_type,
  li.product_name as last_product_name,
  coalesce(li.created_at, c.created_at) as last_activity_at
from public.contacts c
left join lateral (
  select i.inquiry_type, i.product_name, i.created_at from public.inquiries i
  where i.contact_id = c.id order by i.created_at desc limit 1
) li on true;

-- =====================================================================
-- Seguridad: RLS y permisos
-- =====================================================================
alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.contacts enable row level security;
alter table public.inquiries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.crm_notes enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.email_events enable row level security;
alter table public.automations enable row level security;
alter table public.automation_steps enable row level security;
alter table public.automation_enrollments enable row level security;
alter table public.rate_limits enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.products, public.site_settings to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- Público: solo catálogo activo y configuración marcada como pública.
create policy products_public_read on public.products for select using (active or public.is_admin());
create policy products_admin_write on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy settings_public_read on public.site_settings for select using (is_public or public.is_admin());
create policy settings_admin_write on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_profiles_read on public.admin_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Datos de clientes: exclusivamente administradores autenticados.
create policy contacts_admin on public.contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inquiries_admin on public.inquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy orders_admin on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy payments_admin on public.payments for select to authenticated using (public.is_admin());
create policy crm_notes_admin on public.crm_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy consents_admin on public.marketing_consents for select to authenticated using (public.is_admin());
create policy campaigns_admin on public.campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy recipients_admin on public.campaign_recipients for select to authenticated using (public.is_admin());
create policy events_admin on public.email_events for select to authenticated using (public.is_admin());
create policy automations_admin on public.automations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy steps_admin on public.automation_steps for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enrollments_admin on public.automation_enrollments for select to authenticated using (public.is_admin());

-- Las funciones de escritura pública solo las ejecuta el backend.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.lifecycle_rank(text) to authenticated;
grant execute on function public.paid_orders_count(uuid) to authenticated;
grant execute on function public.admin_set_payment_status(uuid, text) to authenticated;
grant execute on function public.admin_dashboard_metrics() to authenticated;
grant execute on all functions in schema public to service_role;

-- =====================================================================
-- Datos iniciales (configuración y automatizaciones; no son datos de clientes)
-- =====================================================================
insert into public.site_settings (key, value, is_public) values
  ('business_name', '"Dulce Momento"', true),
  ('whatsapp_number', 'null', true),
  ('instagram_url', 'null', true),
  ('facebook_url', 'null', true),
  ('tiktok_url', 'null', true),
  ('payment_yape', '{"number": null, "holder": null}', true),
  ('payment_plin', '{"number": null, "holder": null}', true),
  ('payment_transfer', '{"bank": null, "holder": null, "account": null, "cci": null}', true),
  ('delivery_zones', '[{"name": "San Isidro", "fee": null}]', true),
  ('pickup_enabled', 'false', true),
  ('seo_title', '"Dulce Momento | Kekes artesanales en Lima"', true),
  ('seo_description', '"Kekes artesanales hechos por pedido en Lima. Precio único de S/ 50 todo incluido y delivery en San Isidro y alrededores."', true),
  ('admin_email', 'null', false),
  ('sender_name', '"Dulce Momento"', false),
  ('sender_email', 'null', false),
  ('loyalty_min_orders', '4', false);

insert into public.automations (key, name, description, trigger_label, requires_marketing_consent, enabled) values
  ('lead_nurture', 'Bienvenida y conversión de leads',
   'Secuencia de 4 correos para leads que aceptaron recibir novedades. Se detiene si el contacto compra o se da de baja.',
   'Nuevo lead con consentimiento de marketing', true, false),
  ('posventa', 'Posventa',
   'Agradecimiento después de confirmar el pago de un pedido.',
   'Pago verificado por el administrador', false, false),
  ('pedido_pendiente', 'Pedido sin pago registrado',
   'Recordatorio operativo para quien registró un pedido en el checkout y aún no informó su pago. Solo aplica a contactos identificados.',
   'Pedido creado con pago pendiente', false, false);

insert into public.automation_steps (automation_id, step_order, delay_days, name, subject, html)
select a.id, s.step_order, s.delay_days, s.name, s.subject, s.html
from public.automations a
join (values
  ('lead_nurture', 1, 0, 'Bienvenida', 'Gracias por interesarte en Dulce Momento, {{nombre}}',
   '<h2>Gracias por interesarte en Dulce Momento</h2><p>Hola, {{nombre}}:</p><p>Preparamos kekes artesanales por pedido, cuidando el sabor, la presentación y la entrega. Todos nuestros kekes del catálogo tienen un precio único de S/ 50, todo incluido.</p><p><a data-cta="1" href="{{site_url}}/productos">Ver nuestros kekes</a></p>'),
  ('lead_nurture', 2, 2, 'Ayuda', '¿No sabes qué keke elegir?',
   '<h2>¿No sabes qué keke elegir?</h2><p>Hola, {{nombre}}:</p><p>Tenemos kekes clásicos de 8 a 10 porciones, kekes de cumpleaños de 12 a 15 porciones y bandejas para reuniones con 20 porciones individuales. Cuéntanos la ocasión y te orientamos con el sabor y el tamaño.</p><p><a data-cta="1" href="{{site_url}}/productos">Ver opciones</a></p>'),
  ('lead_nurture', 3, 4, 'Productos', 'Descubre nuestros kekes personalizados',
   '<h2>Descubre nuestros kekes personalizados</h2><p>Hola, {{nombre}}:</p><p>Podemos personalizar tu keke con dedicatoria, colores, decoraciones, tamaños, presentaciones especiales y empaque para regalo. Los pedidos personalizados se coordinan con 3 a 5 días de anticipación.</p><p><a data-cta="1" href="{{site_url}}/kekes-personalizados">Ver productos</a></p>'),
  ('lead_nurture', 4, 7, 'Conversión', '¿Listo para crear tu keke?',
   '<h2>¿Listo para crear tu keke?</h2><p>Hola, {{nombre}}:</p><p>Cuéntanos la fecha, el sabor y la ocasión. Confirmamos disponibilidad y coordinamos la entrega por delivery en San Isidro y alrededores.</p><p><a data-cta="1" href="{{site_url}}/contacto">Solicitar cotización</a></p>'),
  ('posventa', 1, 0, 'Gracias por tu compra', '¡Gracias por tu compra, {{nombre}}!',
   '<h2>¡Gracias por tu compra!</h2><p>Hola, {{nombre}}:</p><p>Confirmamos el pago de tu pedido. Ya estamos coordinando la preparación y la entrega en la fecha acordada. Si necesitas ajustar algún detalle, responde a este correo o escríbenos por WhatsApp.</p>'),
  ('pedido_pendiente', 1, 1, 'Recordatorio de pago', 'Tu pedido en Dulce Momento está pendiente de pago',
   '<h2>Tu pedido sigue reservado</h2><p>Hola, {{nombre}}:</p><p>Registramos tu pedido, pero aún no recibimos la información de tu pago. Preparamos cada keke después de confirmar el pago acordado. Si ya pagaste, envíanos tu número de operación por WhatsApp.</p><p><a data-cta="1" href="{{site_url}}/contacto">Necesito ayuda con mi pedido</a></p>')
) as s (key, step_order, delay_days, name, subject, html) on s.key = a.key;
