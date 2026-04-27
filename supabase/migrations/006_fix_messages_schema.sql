-- Fix internal_messages schema and policies

-- Drop existing function first (parameter name may differ)
drop function if exists public.current_role_is(text);

-- Create helper function for role checks
create function public.current_role_is(role_name text)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = role_name
  );
end;
$$ language plpgsql security definer;

-- Drop old policy if exists and recreate with robust check
drop policy if exists "Team: full access to internal_messages" on public.internal_messages;

-- Team members can do everything
create policy "Team: full access to internal_messages"
  on public.internal_messages
  for all
  to authenticated
  using (public.current_role_is('team'))
  with check (public.current_role_is('team'));

-- Ensure realtime publication includes internal_messages
-- (idempotent — safe to run multiple times)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and tablename = 'internal_messages'
  ) then
    alter publication supabase_realtime add table public.internal_messages;
  end if;
end $$;

-- Grant usage on the helper function to authenticated users
grant execute on function public.current_role_is(text) to authenticated;
grant execute on function public.current_role_is(text) to anon;
