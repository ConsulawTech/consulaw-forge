CREATE TABLE IF NOT EXISTS invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id    uuid REFERENCES proposals(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  client_name    text NOT NULL,
  recipient_email text NOT NULL,
  items          jsonb NOT NULL DEFAULT '[]',
  notes          text,
  due_date       date,
  currency       text NOT NULL DEFAULT 'USD',
  amount_total   numeric(10,2) NOT NULL DEFAULT 0,
  sent_at        timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team: full access to invoices" ON invoices
  FOR ALL USING (current_role_is('team'));
