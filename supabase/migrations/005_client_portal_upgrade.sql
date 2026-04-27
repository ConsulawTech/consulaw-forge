-- Client Portal Upgrade: logo support

-- Add logo_url to clients table
alter table clients add column if not exists logo_url text;

-- Note: Storage bucket creation for 'client-logos' must be done via Supabase Dashboard
-- or Supabase CLI: supabase storage create-bucket client-logos --public
--
-- After bucket creation, apply these RLS policies:
--
-- CREATE POLICY "Team: full access to client-logos" ON storage.objects
--   FOR ALL USING (current_role_is('team')) WITH CHECK (current_role_is('team'));
--
-- CREATE POLICY "Client: access own logo" ON storage.objects
--   FOR ALL USING (
    --     bucket_id = 'client-logos' AND
    --     (storage.foldername(name))[1] = auth.uid()::text
    --   );
