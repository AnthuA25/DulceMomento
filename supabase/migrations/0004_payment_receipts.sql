alter table public.payments add column if not exists receipt_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

grant select on storage.objects to authenticated;
alter table storage.objects enable row level security;
create policy payment_receipts_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-receipts' and public.is_admin());
