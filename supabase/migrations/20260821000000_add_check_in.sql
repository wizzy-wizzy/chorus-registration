alter table public.registrations
  add column if not exists checked_in_at timestamptz null;

alter table public.registrations enable row level security;

revoke update on table public.registrations from anon, authenticated;
revoke update (checked_in_at) on table public.registrations from anon, authenticated;
grant update (last_reminded_at) on table public.registrations to authenticated;

drop policy if exists registrations_authenticated_update_reminder
  on public.registrations;

create policy registrations_authenticated_update_reminder
  on public.registrations
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create or replace function public.check_in_registration(
  target_registration_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_check_in timestamptz;
  saved_check_in timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not (
    timezone('Africa/Lagos', now())::date >= date '2026-09-13'
  ) then
    raise exception 'Check-in is not open'
      using errcode = '42501';
  end if;

  select checked_in_at
    into existing_check_in
    from public.registrations
   where registration_id::text = target_registration_id;

  if not found then
    raise exception 'Registration not found'
      using errcode = 'P0002';
  end if;

  if existing_check_in is not null then
    return jsonb_build_object(
      'already_checked_in', true,
      'checked_in_at', existing_check_in
    );
  end if;

  update public.registrations
     set checked_in_at = now()
   where registration_id::text = target_registration_id
     and checked_in_at is null
  returning checked_in_at into saved_check_in;

  if saved_check_in is null then
    raise exception 'Could not save check-in';
  end if;

  return jsonb_build_object(
    'already_checked_in', false,
    'checked_in_at', saved_check_in
  );
end;
$$;

revoke all on function public.check_in_registration(text) from public;
revoke all on function public.check_in_registration(text) from anon;
grant execute on function public.check_in_registration(text) to authenticated;
