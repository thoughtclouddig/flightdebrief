-- Identity schema for Replit Postgres (DATABASE_URL) -- the source of truth
-- for app-level user/org/role data, used by Replit Auth (lib/auth/store.ts).
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
  -- Replit user id (OIDC `sub`). Null until the person first logs in with
  -- the Replit account matching their invited email.
  auth_user_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
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

-- Seed rows mirroring lib/data/seed.ts (same ids).
INSERT INTO organizations (id, name, kind) VALUES ('org-falcon','Falcon Aviation','school') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email) VALUES
  ('user-andy','Andy Renk','andy@example.com'),
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
