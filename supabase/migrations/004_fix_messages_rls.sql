-- Fix messages RLS so clients with multiple projects can message on any of them

-- Drop old client policies
DROP POLICY IF EXISTS "Client: read own messages" ON messages;
DROP POLICY IF EXISTS "Client: insert own messages" ON messages;

-- New policy: clients can read messages for any project they own
CREATE POLICY "Client: read own messages" ON messages
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.profile_id = auth.uid()
    )
  );

-- New policy: clients can insert messages for any project they own
CREATE POLICY "Client: insert own messages" ON messages
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.profile_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );
