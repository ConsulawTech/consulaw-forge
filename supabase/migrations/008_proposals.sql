-- ── PROPOSALS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  html        text NOT NULL,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'sent', 'viewed')),
  view_count  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  sent_at     timestamptz,
  viewed_at   timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS proposals_slug_idx ON proposals (slug);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Team members have full CRUD access via the authenticated Supabase client.
-- No anon policy — the public route handler uses the service-role admin client
-- which bypasses RLS, preventing direct REST API scraping of proposals.
CREATE POLICY "Team: full access to proposals" ON proposals
  FOR ALL USING (current_role_is('team'));

-- ── PROPOSAL SUBMISSIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposal_submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  client_name       text,
  client_email      text,
  client_phone      text,
  client_company    text,
  message           text,
  selected_template text,
  selected_features text[],
  submitted_at      timestamptz DEFAULT now()
);

ALTER TABLE proposal_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team: full access to submissions" ON proposal_submissions
  FOR ALL USING (current_role_is('team'));
