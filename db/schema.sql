-- Schema for Replit Postgres (DATABASE_URL) -- the source of truth for all
-- app data: identity (users/orgs/roles, used by Replit Auth in
-- lib/auth/store.ts) plus flights, debriefs, reservations, and training data
-- (used by PostgresRepository in lib/data/postgres-repository.ts).
-- Ids are text so they can match the seeded ids in lib/data/seed.ts.
-- Applied to the development database; production is migrated automatically
-- by Replit's Publish flow.

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'individual' CHECK (kind IN ('individual','independent_cfi','school')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  -- Stable auth identity anchor. With magic-link sign-in this is the
  -- normalized (lowercased) email; null until their first successful login.
  auth_user_id text UNIQUE,
  -- Set once they confirm their name on the one-time onboarding form.
  profile_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotent column additions for existing databases.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Legacy migration (idempotent): auth_user_id used to hold a Replit OIDC
-- subject; with magic-link sign-in it must be the normalized email. Rewrite
-- old subjects so previously linked users can still sign in. Guarded against
-- (theoretical) case-collisions on the unique auth_user_id.
UPDATE users u SET auth_user_id = lower(u.email)
WHERE u.auth_user_id IS NOT NULL
  AND u.auth_user_id <> lower(u.email)
  AND NOT EXISTS (SELECT 1 FROM users o WHERE o.auth_user_id = lower(u.email) AND o.id <> u.id);

-- Persistent per-email cooldown for magic-link sends (survives restarts and
-- multiple instances, unlike in-memory state).
CREATE TABLE IF NOT EXISTS magic_link_requests (
  email text PRIMARY KEY,
  last_sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student','instructor','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  certificate_type text CHECK (certificate_type IN ('PRIVATE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, role)
);

-- --- Flight / training domain -----------------------------------------------
-- Ids are text (seeded ids like 'flight-1' plus runtime UUIDs). Dates that the
-- app treats as plain strings (flight_date) stay text to avoid TZ drift.

CREATE TABLE IF NOT EXISTS instructors (
  id text PRIMARY KEY,
  name text NOT NULL,
  organization_id text REFERENCES organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aircraft (
  id text PRIMARY KEY,
  tail_number text NOT NULL,
  type text NOT NULL,
  make text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  home_airport text NOT NULL DEFAULT '',
  organization_id text REFERENCES organizations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
  external_provider text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS aircraft_tail_number_idx ON aircraft (upper(tail_number));

CREATE TABLE IF NOT EXISTS student_instructors (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, instructor_id, organization_id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aircraft_id text NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  external_provider text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flights (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id text REFERENCES organizations(id) ON DELETE SET NULL,
  aircraft_id text NOT NULL REFERENCES aircraft(id) ON DELETE RESTRICT,
  departure_airport text NOT NULL,
  arrival_airport text NOT NULL,
  flight_date text NOT NULL,
  duration_minutes integer NOT NULL,
  instructor_id text REFERENCES instructors(id) ON DELETE SET NULL,
  reservation_id text REFERENCES reservations(id) ON DELETE SET NULL,
  fr24_flight_id text,
  external_provider text,
  external_id text,
  debrief_status text NOT NULL DEFAULT 'not_started' CHECK (debrief_status IN ('not_started','in_progress','complete')),
  track jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flights_student_idx ON flights (student_id);
CREATE INDEX IF NOT EXISTS flights_org_idx ON flights (organization_id);

CREATE TABLE IF NOT EXISTS debriefs (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  transcript text NOT NULL,
  audio_duration_seconds integer NOT NULL DEFAULT 0,
  structured_result jsonb NOT NULL,
  analyzed_with text NOT NULL CHECK (analyzed_with IN ('claude','mock')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flight_id)
);

CREATE TABLE IF NOT EXISTS training_items (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  debrief_id text NOT NULL REFERENCES debriefs(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('keep_working_on','before_next_flight','todo')),
  description text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  visibility text NOT NULL DEFAULT 'shared' CHECK (visibility IN ('shared','instructor_only','admin_only')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS training_items_flight_idx ON training_items (flight_id);

CREATE TABLE IF NOT EXISTS training_signals (
  id text PRIMARY KEY,
  organization_id text REFERENCES organizations(id) ON DELETE SET NULL,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id text,
  aircraft_id text REFERENCES aircraft(id) ON DELETE SET NULL,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  debrief_id text NOT NULL REFERENCES debriefs(id) ON DELETE CASCADE,
  flight_date text NOT NULL,
  category text NOT NULL,
  skill text NOT NULL,
  status text NOT NULL CHECK (status IN ('NEEDS_WORK','IMPROVING')),
  source text NOT NULL CHECK (source IN ('STUDENT','INSTRUCTOR','STUDENT_AND_INSTRUCTOR')),
  statement text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS training_signals_student_idx ON training_signals (student_id);
CREATE INDEX IF NOT EXISTS training_signals_org_idx ON training_signals (organization_id);

-- Seed rows mirroring lib/data/seed.ts (same ids).
INSERT INTO organizations (id, name, kind) VALUES ('org-falcon','Falcon Aviation','school') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email) VALUES
  ('user-andy','Ron Johnson','andy@example.com'),
  ('user-danny','Danny Franks','danny@falconaviation.example'),
  ('user-maria','Maria Chen','maria@falconaviation.example'),
  ('user-sarah','Sarah Miller','sarah@example.com'),
  ('user-jordan','Jordan Reyes','jordan@falconaviation.example')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type) VALUES
  ('member-andy','org-falcon','user-andy','student','PRIVATE'),
  ('member-danny','org-falcon','user-danny','instructor',NULL),
  ('member-maria','org-falcon','user-maria','instructor',NULL),
  ('member-sarah','org-falcon','user-sarah','student','PRIVATE'),
  ('member-jordan','org-falcon','user-jordan','admin',NULL)
ON CONFLICT (id) DO NOTHING;

-- The real app owner's admin login (distinct from the 'user-andy' demo/seed
-- student above, which is placeholder data, not a real account). Provisioned
-- here rather than relying on the "first real login becomes admin" bootstrap
-- in resolveUserOnLogin() so it's deterministic regardless of who signs in
-- first once the app is public.
INSERT INTO users (id, name, email) VALUES
  ('user-owner','Andy Renk','andyrenk@gmail.com')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_members (id, organization_id, user_id, role) VALUES
  ('member-owner','org-falcon','user-owner','admin')
ON CONFLICT (id) DO NOTHING;
