-- ==============================================================================
-- Relationship Manager Supabase Schema
-- Source of Truth defined in AGENT.md
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Table: persons
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS persons (
  person_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  gender              TEXT,
  profession          TEXT,
  company             TEXT,
  phone               TEXT,
  whatsapp_phone      TEXT,
  email               TEXT,
  relationship_to_me  TEXT,
  communication_style TEXT[],
  nicknames           TEXT[],
  hobbies             TEXT[],
  likes               TEXT[],
  dislikes            TEXT[],
  memories            JSONB,
  notes               TEXT[],
  created_at          TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for search and relationships
CREATE INDEX IF NOT EXISTS idx_persons_full_name ON persons(full_name);
CREATE INDEX IF NOT EXISTS idx_persons_relationship ON persons(relationship_to_me);
CREATE INDEX IF NOT EXISTS idx_persons_gender ON persons(gender);

-- ------------------------------------------------------------------------------
-- 2. Table: events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  event_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT NOT NULL,
  event_date  DATE NOT NULL,
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  person_id   UUID REFERENCES persons(person_id) ON DELETE CASCADE
);

-- Indexes for date queries and person joins
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_person_id ON events(person_id);

-- ------------------------------------------------------------------------------
-- 3. Table: wishes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishes (
  wish_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  mail_wish  JSONB,
  short_wish TEXT,
  long_wish  TEXT,
  event_id   UUID REFERENCES events(event_id) ON DELETE SET NULL,
  person_id  UUID REFERENCES persons(person_id) ON DELETE CASCADE,
  "isSent"   BOOLEAN DEFAULT false
);

-- Indexes for filtering new vs sent wishes, and joins
CREATE INDEX IF NOT EXISTS idx_wishes_is_sent ON wishes("isSent");
CREATE INDEX IF NOT EXISTS idx_wishes_person_id ON wishes(person_id);
CREATE INDEX IF NOT EXISTS idx_wishes_event_id ON wishes(event_id);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Configuration
-- IMPORTANT: In production or multi-user setups, enforce user ownership 
-- (e.g. auth.uid() = user_id). If using the anon client key for a personal single-user 
-- deployment, the policies below enable read/write for the app while requiring 
-- that the project not be exposed publicly without auth or proxy protection.
-- ------------------------------------------------------------------------------

ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Allow anon key full CRUD for personal app use (adjust when adding Supabase Auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'persons' AND policyname = 'Allow anon full access to persons'
  ) THEN
    CREATE POLICY "Allow anon full access to persons" ON persons FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow anon full access to events'
  ) THEN
    CREATE POLICY "Allow anon full access to events" ON events FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wishes' AND policyname = 'Allow anon full access to wishes'
  ) THEN
    CREATE POLICY "Allow anon full access to wishes" ON wishes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
