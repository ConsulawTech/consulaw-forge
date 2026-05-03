-- Add a manually-set recipient email to proposals so the team can send
-- without requiring a linked Supabase client record.
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS recipient_email TEXT;
