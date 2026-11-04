alter table public.contacts
  add column crm_stage text not null default 'nuevo'
  check (crm_stage in ('nuevo', 'contactado', 'interesado', 'cotizacion', 'confirmado', 'entregado', 'perdido'));

create or replace view public.contact_directory with (security_invoker = true) as
select
  c.id, c.first_name, c.last_name, c.email, c.phone, c.customer_type, c.lifecycle_stage,
  c.marketing_consent, c.marketing_consent_at, c.unsubscribe_token, c.source, c.created_at, c.updated_at,
  (select count(*) from public.inquiries i where i.contact_id = c.id)::int as inquiries_count,
  (select count(*) from public.orders o where o.contact_id = c.id)::int as orders_count,
  li.inquiry_type as last_inquiry_type,
  li.product_name as last_product_name,
  coalesce(li.created_at, c.created_at) as last_activity_at,
  c.crm_stage
from public.contacts c
left join lateral (
  select i.inquiry_type, i.product_name, i.created_at
  from public.inquiries i
  where i.contact_id = c.id
  order by i.created_at desc
  limit 1
) li on true;
