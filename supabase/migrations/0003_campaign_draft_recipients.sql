create or replace function public.admin_save_campaign_draft(
  p_draft jsonb,
  p_contact_ids uuid[],
  p_campaign_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_campaign campaigns;
  v_requested int;
  v_inserted int;
begin
  if not is_admin() then raise exception 'no_autorizado'; end if;
  if p_draft is null
    or nullif(trim(p_draft ->> 'name'), '') is null
    or nullif(trim(p_draft ->> 'subject'), '') is null
    or nullif(trim(p_draft ->> 'html'), '') is null
    or coalesce(p_draft ->> 'kind', '') not in ('comercial', 'operativa')
  then raise exception 'borrador_invalido'; end if;
  if cardinality(coalesce(p_contact_ids, '{}'::uuid[])) > 2000 then
    raise exception 'demasiados_destinatarios';
  end if;

  if p_campaign_id is null then
    insert into campaigns (name, subject, sender_name, kind, html, segment, created_by)
    values (
      left(trim(p_draft ->> 'name'), 120),
      left(trim(p_draft ->> 'subject'), 200),
      coalesce(nullif(left(trim(p_draft ->> 'sender_name'), 80), ''), 'Dulce Momento'),
      p_draft ->> 'kind',
      p_draft ->> 'html',
      coalesce(nullif(left(trim(p_draft ->> 'segment'), 80), ''), 'manual'),
      auth.uid()
    )
    returning * into v_campaign;
  else
    update campaigns set
      name = left(trim(p_draft ->> 'name'), 120),
      subject = left(trim(p_draft ->> 'subject'), 200),
      sender_name = coalesce(nullif(left(trim(p_draft ->> 'sender_name'), 80), ''), 'Dulce Momento'),
      kind = p_draft ->> 'kind',
      html = p_draft ->> 'html',
      segment = coalesce(nullif(left(trim(p_draft ->> 'segment'), 80), ''), 'manual')
    where id = p_campaign_id and status = 'borrador'
    returning * into v_campaign;
    if not found then raise exception 'borrador_no_editable'; end if;
  end if;

  delete from campaign_recipients where campaign_id = v_campaign.id;
  select count(distinct contact_id)::int into v_requested
  from unnest(coalesce(p_contact_ids, '{}'::uuid[])) as selected(contact_id);
  insert into campaign_recipients (campaign_id, contact_id, email)
  select v_campaign.id, c.id, c.email
  from contacts c
  where c.id = any(coalesce(p_contact_ids, '{}'::uuid[]))
  on conflict (campaign_id, contact_id) do update set email = excluded.email, status = 'pendiente';
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_requested then raise exception 'destinatario_no_encontrado'; end if;
  update campaigns set recipients_count = v_inserted
  where id = v_campaign.id
  returning * into v_campaign;

  return to_jsonb(v_campaign);
end $$;

revoke execute on function public.admin_save_campaign_draft(jsonb, uuid[], uuid) from public, anon;
grant execute on function public.admin_save_campaign_draft(jsonb, uuid[], uuid) to authenticated;
