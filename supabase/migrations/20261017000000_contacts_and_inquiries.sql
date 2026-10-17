create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name text not null check (char_length(btrim(last_name)) between 1 and 80),
  whatsapp text not null check (whatsapp ~ '^\+519[0-9]{8}$'),
  email_normalized text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    email_normalized is null
    or (
      char_length(email_normalized) <= 254
      and email_normalized = lower(btrim(email_normalized))
      and email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  check (not marketing_consent or (email_normalized is not null and marketing_consent_at is not null))
);

create unique index contacts_email_normalized_unique
  on public.contacts (email_normalized)
  where email_normalized is not null;

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  event_type text not null check (
    event_type in (
      'Cumpleaños',
      'Reunión u oficina',
      'Aniversario',
      'Momento especial',
      'Consulta general'
    )
  ),
  event_date date,
  approximate_quantity integer check (approximate_quantity is null or approximate_quantity > 0),
  product_id text check (
    product_id is null
    or product_id in (
      'keke-chocolate',
      'keke-vainilla',
      'keke-zanahoria',
      'keke-arandanos',
      'keke-cumpleanos',
      'keke-reuniones',
      'keke-personalizado'
    )
  ),
  message text not null check (char_length(btrim(message)) between 10 and 1000),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (marketing_consent and marketing_consent_at is not null)
    or (not marketing_consent and marketing_consent_at is null)
  )
);

alter table public.contacts enable row level security;
alter table public.contacts force row level security;
alter table public.contact_inquiries enable row level security;
alter table public.contact_inquiries force row level security;

revoke all on table public.contacts from anon, authenticated;
revoke all on table public.contact_inquiries from anon, authenticated;

create or replace function public.submit_contact_inquiry(
  p_first_name text,
  p_last_name text,
  p_whatsapp text,
  p_email text,
  p_event_type text,
  p_event_date date,
  p_approximate_quantity integer,
  p_product_id text,
  p_message text,
  p_marketing_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
  v_inquiry_id uuid;
  v_email text := nullif(lower(btrim(p_email)), '');
begin
  if char_length(btrim(p_first_name)) not between 1 and 80
    or char_length(btrim(p_last_name)) not between 1 and 80
    or p_whatsapp !~ '^\+519[0-9]{8}$'
    or char_length(btrim(p_message)) not between 10 and 1000
    or p_event_type not in (
      'Cumpleaños',
      'Reunión u oficina',
      'Aniversario',
      'Momento especial',
      'Consulta general'
    )
    or (
      p_event_date is not null
      and p_event_date < (pg_catalog.timezone('America/Lima', pg_catalog.now()))::date
    )
    or (p_approximate_quantity is not null and p_approximate_quantity <= 0)
    or (
      p_product_id is not null
      and p_product_id not in (
        'keke-chocolate',
        'keke-vainilla',
        'keke-zanahoria',
        'keke-arandanos',
        'keke-cumpleanos',
        'keke-reuniones',
        'keke-personalizado'
      )
    )
    or (v_email is not null and (
      char_length(v_email) > 254
      or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ))
    or (p_marketing_consent and v_email is null)
  then
    raise exception using
      errcode = '22023',
      message = 'La consulta contiene datos inválidos.';
  end if;

  if v_email is null then
    insert into public.contacts (first_name, last_name, whatsapp)
    values (btrim(p_first_name), btrim(p_last_name), p_whatsapp)
    returning id into v_contact_id;
  else
    insert into public.contacts as existing_contact (
      first_name,
      last_name,
      whatsapp,
      email_normalized,
      marketing_consent,
      marketing_consent_at
    )
    values (
      btrim(p_first_name),
      btrim(p_last_name),
      p_whatsapp,
      v_email,
      p_marketing_consent,
      case when p_marketing_consent then now() else null end
    )
    on conflict (email_normalized) where email_normalized is not null
    do update set
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      whatsapp = excluded.whatsapp,
      marketing_consent = existing_contact.marketing_consent or excluded.marketing_consent,
      marketing_consent_at = case
        when excluded.marketing_consent then excluded.marketing_consent_at
        else existing_contact.marketing_consent_at
      end,
      updated_at = now()
    returning id into v_contact_id;
  end if;

  insert into public.contact_inquiries (
    contact_id,
    event_type,
    event_date,
    approximate_quantity,
    product_id,
    message,
    marketing_consent,
    marketing_consent_at
  )
  values (
    v_contact_id,
    p_event_type,
    p_event_date,
    p_approximate_quantity,
    p_product_id,
    btrim(p_message),
    p_marketing_consent,
    case when p_marketing_consent then now() else null end
  )
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$;

revoke all on function public.submit_contact_inquiry(
  text, text, text, text, text, date, integer, text, text, boolean
) from public;
grant execute on function public.submit_contact_inquiry(
  text, text, text, text, text, date, integer, text, text, boolean
) to anon, authenticated;
