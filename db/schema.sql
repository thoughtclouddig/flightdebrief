-- Schema for Replit Postgres (DATABASE_URL) -- the source of truth for all
-- app data: identity (users/orgs/roles, used by Replit Auth in
-- lib/auth/store.ts) plus flights, debriefs, reservations, and training data
-- (used by PostgresRepository in lib/data/postgres-repository.ts).
-- Ids are text so they can match the seeded ids in lib/data/seed.ts.
-- Applied via scripts/init-db.mjs, run both before the dev server starts and
-- as part of "npm run build" -- production has its own separate database
-- from the dev workspace, so the build-time run is what actually migrates it
-- on every publish.

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'individual' CHECK (kind IN ('individual','independent_cfi','school')),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- One default debrief guidance mode per org for now (Phase 1 decision -- see
-- the debrief-redesign plan). "guided" is the new structured flow;
-- "freeform" opts an org out entirely, preserving today's behavior. Added via
-- ALTER (not the CREATE TABLE above) so it also applies to already-existing
-- organizations rows, same pattern as the debriefs.guidance_mode column below.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_guidance_mode text NOT NULL DEFAULT 'guided'
  CHECK (default_guidance_mode IN ('guided','light','freeform'));

-- Reconciliation (idempotent): a solo pilot has no CFI to provide an
-- independent assessment, so "guided" mode's two-rater comparison can never
-- complete -- every 'individual' org must be 'freeform'. This has been true
-- since lib/auth/store.ts's resolveSignupOnLogin/createOrganization started
-- enforcing it for NEW orgs, but ON CONFLICT DO NOTHING in this file's own
-- seed inserts below means any 'individual' org row created before that
-- logic existed is stuck on the column's old 'guided' default forever unless
-- something actively re-checks it -- this UPDATE is that something, re-run
-- on every schema apply so the fix doesn't depend on someone noticing and
-- hand-patching it via psql again.
UPDATE organizations SET default_guidance_mode = 'freeform'
WHERE kind = 'individual' AND default_guidance_mode <> 'freeform';

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  -- Stable auth identity anchor. With magic-link sign-in this is the
  -- normalized (lowercased) email; null until their first successful login.
  auth_user_id text UNIQUE,
  -- Set once they confirm their name on the one-time onboarding form.
  profile_completed boolean NOT NULL DEFAULT false,
  -- Small square photo, stored inline as a data: URL (client resizes/compresses
  -- before upload, see components/avatar-upload.tsx) -- no object storage is
  -- wired up in this app, and profile photos are small enough that adding one
  -- wasn't worth it. Null falls back to initials.
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tracks which one-off "have you seen this yet" milestones a user has hit
-- inside the persistent AfterFlight Guide (see lib/guide.ts) -- a flexible
-- key -> true bag rather than one rigid boolean column per milestone, so
-- future contextual-help flags don't need another migration. Most Guide
-- steps derive completion from real data (a debrief exists, a CFI link
-- exists, etc.); this only covers the handful that can't be derived any
-- other way ("has the student opened their Debrief Replay yet").
ALTER TABLE users ADD COLUMN IF NOT EXISTS guide_progress jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Idempotent column additions for existing databases.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

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
CREATE INDEX IF NOT EXISTS organization_members_user_created_idx ON organization_members (user_id, created_at);

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
CREATE INDEX IF NOT EXISTS reservations_org_instructor_start_idx ON reservations (organization_id, instructor_id, scheduled_start);
CREATE INDEX IF NOT EXISTS reservations_student_start_idx ON reservations (student_id, scheduled_start);
DROP INDEX IF EXISTS reservations_org_start_idx;

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
CREATE INDEX IF NOT EXISTS flights_student_date_idx ON flights (student_id, flight_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS flights_org_date_idx ON flights (organization_id, flight_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS flights_instructor_date_idx ON flights (instructor_id, flight_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS flights_instructor_org_date_idx ON flights (instructor_id, organization_id, flight_date DESC, created_at DESC);
-- Superseded by the date-ordered indexes above; keeping both would add write
-- overhead without improving the current query shapes.
DROP INDEX IF EXISTS flights_student_idx;
DROP INDEX IF EXISTS flights_org_idx;

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

-- When a recording is completed while the organization is billing-blocked,
-- retain the transcript so the pilot can resume AI analysis after access is
-- restored instead of recording again.
CREATE TABLE IF NOT EXISTS pending_debrief_transcripts (
  flight_id text PRIMARY KEY REFERENCES flights(id) ON DELETE CASCADE,
  transcript text NOT NULL,
  audio_duration_seconds integer NOT NULL DEFAULT 0,
  guidance_mode text NOT NULL DEFAULT 'freeform',
  recording_started_at timestamptz,
  recording_ended_at timestamptz,
  words jsonb,
  card_boundaries jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
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

-- CFI-authored standing notes about a student, independent of any specific
-- flight or debrief (unlike training_items, whose flight_id/debrief_id are
-- NOT NULL by design). A CFI can add one any time -- mid-flight, between
-- lessons, before a flight is even logged -- and open notes surface as
-- guaranteed debrief cards next time that student debriefs (see the
-- 'instructor_selected'-source injection in
-- app/api/flights/[id]/debrief/assessments/[role]/submit/route.ts), then get
-- marked done automatically once that debrief completes.
CREATE TABLE IF NOT EXISTS student_notes (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_notes_student_idx ON student_notes (student_id);

-- Tracks only whether a student has opened a recommended study resource
-- (first-click timestamp) -- not scoped to one debrief, since the same FAA
-- resource can legitimately resurface across multiple debriefs and "have I
-- already opened this" is the useful question. No duration/read-time field
-- on purpose -- that data doesn't exist anywhere and shouldn't be invented.
CREATE TABLE IF NOT EXISTS study_resource_views (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_resource_views_student_idx ON study_resource_views (student_id);

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

-- V1: the app's own vocabulary is Introduced/Developing/Needs Coaching/
-- Improving/Demonstrated, derived at read time (see lib/skill-progress.ts)
-- from the *sequence* of these two raw per-flight signals -- a single
-- transcript can only reliably support "this came up as a strength" vs "this
-- needs more work," not a 5-way judgment. NEEDS_WORK is renamed to
-- NEEDS_COACHING to match the V1 vocabulary directly; existing rows are
-- migrated in place below rather than left stale.
ALTER TABLE training_signals DROP CONSTRAINT IF EXISTS training_signals_status_check;
UPDATE training_signals SET status = 'NEEDS_COACHING' WHERE status = 'NEEDS_WORK';
ALTER TABLE training_signals ADD CONSTRAINT training_signals_status_check
  CHECK (status IN ('NEEDS_COACHING','IMPROVING'));

-- CFI authority over AI-inferred signals (V1 change 14): a CFI can dismiss a
-- signal they disagree with; dismissed rows are excluded from progression
-- and recurring-theme aggregation going forward but never deleted, so the
-- original AI inference stays auditable.
ALTER TABLE training_signals ADD COLUMN IF NOT EXISTS dismissed boolean NOT NULL DEFAULT false;

-- Carries a "before next flight" item's task forward so it can pre-populate
-- the next flight's flight_tasks. Nullable -- most items aren't task-specific.
ALTER TABLE training_items ADD COLUMN IF NOT EXISTS related_task_code text;

-- --- Structured, CFI-led debrief (guided/light modes) -----------------------
-- Everything below is created BEFORE a debriefs row exists (assessments and
-- cards happen pre-recording), so it keys off flight_id, not debrief_id.
-- debriefs.flight_id stays UNIQUE -- one immutable debrief per flight, same
-- as before; these tables hold the structured inputs that feed it.

ALTER TABLE debriefs ADD COLUMN IF NOT EXISTS guidance_mode text NOT NULL DEFAULT 'freeform'
  CHECK (guidance_mode IN ('guided','light','freeform'));
ALTER TABLE debriefs ADD COLUMN IF NOT EXISTS recording_started_at timestamptz;
ALTER TABLE debriefs ADD COLUMN IF NOT EXISTS recording_ended_at timestamptz;

-- Which maneuvers/tasks were actually flown this flight, selected by the CFI
-- at "Flight Complete" before either assessment starts. task_code is a
-- TrainingSkill-shaped code enforced in TypeScript only (same convention as
-- training_signals.skill) -- label is denormalized so relabeling the catalog
-- later never rewrites history.
CREATE TABLE IF NOT EXISTS flight_tasks (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  task_code text NOT NULL,
  label text NOT NULL,
  source text NOT NULL DEFAULT 'instructor_selected'
    CHECK (source IN ('instructor_selected','syllabus','ai_suggested','carried_over')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flight_tasks_flight_idx ON flight_tasks (flight_id);
CREATE UNIQUE INDEX IF NOT EXISTS flight_tasks_flight_task_idx ON flight_tasks (flight_id, task_code);

-- One row per (flight, role) -- UNIQUE enforces exactly one student and one
-- instructor assessment per flight, which is what lets "CFI can't see
-- student's ratings until their own is submitted" be a plain query condition
-- (WHERE role='student' AND EXISTS (instructor assessment with status='submitted'))
-- rather than bespoke access-control logic.
CREATE TABLE IF NOT EXISTS debrief_assessments (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student','instructor')),
  assessor_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
  submitted_at timestamptz,
  overall_reflection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flight_id, role)
);
CREATE INDEX IF NOT EXISTS debrief_assessments_flight_idx ON debrief_assessments (flight_id);

-- Performance level is one of lib/performance-levels.ts's stable
-- PerformanceLevelCode values (LEARNING/NEEDS_COACHING/INDEPENDENT) --
-- the FAA FITS-equivalent mapping and any future display-label change live
-- entirely in code, never in this column, so relabeling touches zero rows.
CREATE TABLE IF NOT EXISTS debrief_assessment_ratings (
  id text PRIMARY KEY,
  assessment_id text NOT NULL REFERENCES debrief_assessments(id) ON DELETE CASCADE,
  flight_task_id text NOT NULL REFERENCES flight_tasks(id) ON DELETE CASCADE,
  performance_level text NOT NULL CHECK (performance_level IN ('LEARNING','NEEDS_COACHING','INDEPENDENT')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, flight_task_id)
);
CREATE INDEX IF NOT EXISTS debrief_assessment_ratings_assessment_idx ON debrief_assessment_ratings (assessment_id);

-- Reusable card templates. organization_id NULL = system-global default;
-- non-null = a school's override/addition for the same `code` -- this is
-- what makes future school customization (Phase 3) purely additive, no
-- schema change needed later.
CREATE TABLE IF NOT EXISTS card_definitions (
  id text PRIMARY KEY,
  organization_id text REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  category text NOT NULL CHECK (category IN
    ('OBJECTIVE','STRENGTHS','IMPROVEMENT','KEY_TASK','RISK_ADM','REFLECTION','NEXT_FLIGHT','DISCREPANCY','CUSTOM')),
  title text NOT NULL,
  primary_prompt text NOT NULL,
  follow_up_prompts text[] NOT NULL DEFAULT '{}',
  applies_to_task_code text,
  default_priority integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

-- The generated card instances for one flight's guided session. Snapshots
-- ratings/discrepancy/ACS at generation time so the Compare/Guided screens
-- don't recompute them repeatedly; debrief_assessment_ratings stays the
-- source of truth for any later recomputation or longitudinal query.
CREATE TABLE IF NOT EXISTS debrief_cards (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  card_definition_id text REFERENCES card_definitions(id) ON DELETE SET NULL,
  flight_task_id text REFERENCES flight_tasks(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN
    ('standard','assessment_discrepancy','ai_generated','previous_flight_issue','instructor_selected','school_curriculum')),
  category text NOT NULL,
  title text NOT NULL,
  primary_prompt text NOT NULL,
  follow_up_prompts text[] NOT NULL DEFAULT '{}',
  acs_area text,
  acs_area_url text,
  student_rating text CHECK (student_rating IN ('LEARNING','NEEDS_COACHING','INDEPENDENT')),
  instructor_rating text CHECK (instructor_rating IN ('LEARNING','NEEDS_COACHING','INDEPENDENT')),
  discrepancy_status text NOT NULL DEFAULT 'none' CHECK (discrepancy_status IN ('none','minor','significant')),
  sort_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','skipped')),
  flagged_for_follow_up boolean NOT NULL DEFAULT false,
  recording_start_seconds numeric,
  recording_end_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS debrief_cards_flight_idx ON debrief_cards (flight_id);

-- Flight-scoped, not hard-tied to a single card: a card's boundary can shift
-- if the CFI goes Back and re-covers ground, so segments stay a raw,
-- re-attributable record. debrief_card_id is null for Freeform-mode
-- sessions (no cards exist at all in that mode).
CREATE TABLE IF NOT EXISTS debrief_transcript_segments (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  debrief_card_id text REFERENCES debrief_cards(id) ON DELETE SET NULL,
  start_seconds numeric NOT NULL,
  end_seconds numeric NOT NULL,
  text text NOT NULL,
  speaker_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS debrief_transcript_segments_flight_idx ON debrief_transcript_segments (flight_id);

-- --- Recording consent (V1 change 12) ---------------------------------------
-- Keyed to flight_id, not debrief_id: consent must be captured *before*
-- recording starts, which is before a debriefs row exists (that's only
-- created once analysis completes). One row per participant present for the
-- debrief. Copy shown to the user lives in code (components/debrief/
-- recording-consent.tsx), not this table, so jurisdiction-specific wording
-- can change later without a migration.
CREATE TABLE IF NOT EXISTS consent_records (
  id text PRIMARY KEY,
  flight_id text NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  participant_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_role text NOT NULL CHECK (participant_role IN ('student','instructor')),
  status text NOT NULL CHECK (status IN ('granted','declined')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consent_records_flight_idx ON consent_records (flight_id);

-- --- Revenue share (V1 change 10) -- data relationships only, no payout -----
-- engine and no billing integration in this pass. `subscriptions` is a stub
-- (there is no Stripe/billing system yet); it exists so qualification logic
-- has something real to key off instead of being unwritable.
CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('pilot','cfi','school')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions (user_id);

-- One row per (student, period) qualification computed by
-- lib/data/postgres-repository.ts's computeRevenueShareQualification --
-- never written from a UI, never surfaced prominently, explicitly not tied
-- to FlightScore/proficiency/ratings (only to whether a genuine qualifying
-- debrief occurred). Enterprise accounts are excluded at the call site (they
-- have no individual revenue-share logic), not by a flag on this table.
CREATE TABLE IF NOT EXISTS revenue_share_qualifications (
  id text PRIMARY KEY,
  subscribing_student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qualifying_cfi_id text REFERENCES instructors(id) ON DELETE SET NULL,
  qualifying_school_org_id text REFERENCES organizations(id) ON DELETE SET NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  cfi_share_pct numeric NOT NULL DEFAULT 15,
  school_share_pct numeric NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS revenue_share_qualifications_student_idx ON revenue_share_qualifications (subscribing_student_id);

-- --- Flight tracking / notifications (Phase 2 -- tables only for now, no ----
-- poller/real provider yet, so nothing later needs a schema change) --------

CREATE TABLE IF NOT EXISTS flight_tracking_events (
  id text PRIMARY KEY,
  flight_id text REFERENCES flights(id) ON DELETE CASCADE,
  organization_id text REFERENCES organizations(id) ON DELETE CASCADE,
  aircraft_id text REFERENCES aircraft(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_flight_id text,
  event_type text NOT NULL CHECK (event_type IN
    ('airborne_detected','landing_detected','ground_confirmed','touch_and_go_detected','flight_complete','reminder_sent')),
  detected_at timestamptz NOT NULL,
  raw_signal jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flight_tracking_events_aircraft_idx ON flight_tracking_events (aircraft_id, detected_at);
CREATE INDEX IF NOT EXISTS flight_tracking_events_flight_idx ON flight_tracking_events (flight_id);

CREATE TABLE IF NOT EXISTS flight_tracking_config (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  aircraft_id text REFERENCES aircraft(id) ON DELETE CASCADE,
  ground_speed_threshold_kt numeric NOT NULL DEFAULT 5,
  min_time_on_ground_seconds integer NOT NULL DEFAULT 180,
  airport_proximity_radius_nm numeric NOT NULL DEFAULT 1.0,
  reminder_delay_minutes integer NOT NULL DEFAULT 15,
  auto_reminders_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, aircraft_id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('push','email')),
  debrief_reminders_enabled boolean NOT NULL DEFAULT true,
  reminder_delay_minutes integer,
  push_subscription jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel)
);

CREATE TABLE IF NOT EXISTS notification_events (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flight_id text REFERENCES flights(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('debrief_reminder','assessment_reminder')),
  channel text NOT NULL CHECK (channel IN ('push','email')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','dismissed','clicked')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_events_user_idx ON notification_events (user_id);
CREATE INDEX IF NOT EXISTS notification_events_flight_idx ON notification_events (flight_id);

-- A CFI-assigned (or self-assigned, for a solo student) radio-communications
-- practice drill -- see lib/radio-practice-scenarios.ts for the scenario
-- content itself, which lives in code (not this table) since it's a fixed,
-- versioned content bank, not per-organization data. scenario_id references
-- RadioScenario.id there, enforced in TypeScript only -- same convention as
-- flight_tasks.task_code above. matched_elements is a boolean-per-element
-- array (see lib/radio-practice-scoring.ts's RadioElementScore), stored so
-- the student/CFI can see exactly which required elements were missed
-- without re-scoring the transcript on every read.
CREATE TABLE IF NOT EXISTS radio_practice_assignments (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by text REFERENCES users(id) ON DELETE SET NULL,
  scenario_id text NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','completed')),
  transcript text,
  correct boolean,
  matched_elements jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS radio_practice_assignments_student_idx ON radio_practice_assignments (student_id, status);

-- How many times this assignment has been submitted (see the submit route's
-- "Try Again" support) -- not a full attempt-by-attempt log (transcript/
-- matched_elements only ever hold the latest try), just enough for a CFI to
-- see "passed on attempt 3" instead of only the final result.
ALTER TABLE radio_practice_assignments ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- Standard card set (item 9 of the debrief spec), global defaults
-- (organization_id NULL). Schools can later add organization_id-scoped rows
-- with the same `code` to override title/prompts without a schema change.
INSERT INTO card_definitions (id, organization_id, code, category, title, primary_prompt, follow_up_prompts, default_priority) VALUES
  ('card-def-objective', NULL, 'objective', 'OBJECTIVE', 'Flight Objective',
    'What were we working on today?', '{}', 0),
  ('card-def-student-reflection-best', NULL, 'student_reflection_best', 'STRENGTHS', 'Student Reflection',
    'What do you think went best today?', '{"What felt better than your previous flight?"}', 10),
  ('card-def-improvement', NULL, 'areas_for_improvement', 'IMPROVEMENT', 'Areas for Improvement',
    'Where did you need the most help?', '{}', 20),
  ('card-def-key-task', NULL, 'key_training_task', 'KEY_TASK', 'Key Training Task',
    'What went well, and what still needs work?', '{}', 30),
  ('card-def-risk-adm', NULL, 'risk_management', 'RISK_ADM', 'Risk Management / ADM',
    'Was there a decision today that''s worth talking about?',
    '{"Discuss judgment, situational awareness, weather, traffic, workload, fuel, or aircraft limitations."}', 5),
  ('card-def-student-reflection-next', NULL, 'student_reflection_next', 'REFLECTION', 'Student Reflection',
    'What would you do differently next time?', '{}', 40),
  ('card-def-next-flight', NULL, 'next_flight', 'NEXT_FLIGHT', 'Next Flight',
    'What should we focus on next flight?', '{}', 1)
ON CONFLICT (id) DO NOTHING;

-- Stripe billing state (V1: Pilot and Flight School Pro only -- Enterprise is
-- handled entirely outside Stripe Checkout, via manually-created invoices).
-- subscription_status mirrors Stripe's own subscription status strings
-- verbatim (active/past_due/canceled/unpaid/etc.) rather than inventing a
-- parallel vocabulary -- one less place for a mapping bug to hide.
-- subscription_quantity is the seat/location count for Flight School Pro's
-- adjustable-quantity price; always 1 for Pilot. Populated by the Stripe
-- webhook handler (app/api/webhooks/stripe/route.ts), never set directly by
-- app code -- Stripe is the source of truth for all of these.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan text CHECK (subscription_plan IN ('pilot','school_pro'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_quantity integer NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_stripe_customer_idx ON organizations (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Public live-demo orgs (see lib/demo/live-demo-seed.ts): NULL = a real org;
-- non-null = a per-visitor demo org, doubling as the cleanup cutoff so no
-- separate boolean flag is needed. Cleanup is lazy, not cron-driven --
-- app/api/demo/start/route.ts deletes expired rows before provisioning a new
-- demo on every visit.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;
CREATE INDEX IF NOT EXISTS organizations_demo_expires_at_idx ON organizations (demo_expires_at) WHERE demo_expires_at IS NOT NULL;

-- The default organization every signup joins (see lib/auth/store.ts). This is
-- real identity data, not demo content; demo users/flights are seeded
-- separately and only when SEED_DEMO_DATA is set (lib/data/postgres-repository.ts).
INSERT INTO organizations (id, name, kind) VALUES ('org-falcon','Falcon Aviation','school') ON CONFLICT (id) DO NOTHING;
-- The real app owner's admin login -- real identity data, not demo
-- content, same category as the org-falcon insert above. `ON CONFLICT (id)`
-- alone isn't enough here: a database that's already seen real usage (e.g.
-- production, once this script started running as part of the build step --
-- see package.json "build") may already have a users row for this email
-- under a different id, created via the real magic-link signup flow. The
-- WHERE NOT EXISTS guard skips the insert in that case instead of hitting
-- users_email_key's separate UNIQUE constraint. The membership insert below
-- then looks the id up by email rather than assuming it's 'user-owner', so
-- it grants admin on org-falcon correctly either way.
INSERT INTO users (id, name, email)
SELECT 'user-owner', 'Andy Renk', 'andyrenk@gmail.com'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'andyrenk@gmail.com');

INSERT INTO organization_members (id, organization_id, user_id, role)
SELECT 'member-owner', 'org-falcon', u.id, 'admin'
FROM users u
WHERE u.email = 'andyrenk@gmail.com'
ON CONFLICT (organization_id, user_id, role) DO NOTHING;

-- Rewards Phase 1: milestone/streak tracking. `type` is deliberately a free
-- string, not a CHECK-constrained enum -- future milestone types (first
-- solo, checkride passed, etc.) are just a new constant in lib/milestones.ts,
-- not a schema change. `source` IS constrained to the 3 values the full
-- Rewards spec calls for, even though Phase 1 only ever writes 'automatic'.
-- UNIQUE (student_id, type) is the idempotency backstop -- every Phase 1 rule
-- fires at most once per student by construction (evaluated as an exact
-- threshold match, not a range), so this should never actually be hit in
-- normal operation, just guard against double-processing/races.
CREATE TABLE IF NOT EXISTS milestones (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text NOT NULL DEFAULT 'automatic' CHECK (source IN ('automatic','student_confirmed','cfi_confirmed')),
  achieved_at timestamptz NOT NULL DEFAULT now(),
  related_flight_id text REFERENCES flights(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, type)
);
CREATE INDEX IF NOT EXISTS milestones_student_idx ON milestones (student_id, achieved_at DESC);

-- Content Engine Phase 1: public /resources hub. Articles are Postgres-backed
-- (not MDX/files) per product decision; body is plain text rendered as
-- paragraphs -- no markdown pipeline until Phase 2's AI-writing workflow
-- exists to produce richer formatting consistently.
CREATE TABLE IF NOT EXISTS resource_topics (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO resource_topics (id, slug, name, description) VALUES
  ('topic-student-pilot', 'student-pilot', 'Student Pilot', 'Guidance for pilots working toward their first certificate.'),
  ('topic-flight-training', 'flight-training', 'Flight Training', 'How structured training and debriefing actually work.'),
  ('topic-checkride-prep', 'checkride-prep', 'Checkride Prep', 'Getting ready for the practical test.'),
  ('topic-cfi-resources', 'cfi-resources', 'CFI Resources', 'For instructors running a better debrief.'),
  ('topic-flight-schools', 'flight-schools', 'Flight Schools', 'Running a training program, not just a lesson.'),
  ('topic-safety-proficiency', 'safety-proficiency', 'Safety & Proficiency', 'Staying sharp between checkrides.'),
  ('topic-aviation-research', 'aviation-research', 'Aviation Research', 'What the research actually says about training retention.'),
  ('topic-afterflight', 'afterflight', 'AfterFlight', 'How AfterFlight itself works.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS articles (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  topic_id text REFERENCES resource_topics(id) ON DELETE SET NULL,
  title text NOT NULL,
  dek text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_name text NOT NULL DEFAULT 'AfterFlight',
  -- Citations for factual claims, each tagged with a sourceType so a reader
  -- (human or machine) can tell an FAA requirement apart from an AfterFlight
  -- recommendation -- see the Source type in lib/types.ts.
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS articles_topic_idx ON articles (topic_id);

-- AI/LLM discoverability layer: original research, published only when real
-- data exists -- no seed rows, no fabricated findings. See Source/sourceType
-- above (shared shape) for citation typing.
CREATE TABLE IF NOT EXISTS research_reports (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  key_findings text,
  methodology text,
  sample_size text,
  date_range text,
  definitions text,
  limitations text,
  anonymization_note text,
  data_source text,
  author_name text NOT NULL DEFAULT 'AfterFlight',
  reviewer_name text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS research_reports_status_idx ON research_reports (status, published_at DESC);

-- Hero image, as a plain https:// or data: URL -- reuses the same
-- storage-free pattern already used by users.avatar_url (no object storage
-- infra in this app). Populated manually via the admin form, or
-- automatically by the AI content pipeline (lib/ai/generate-article-image.ts).
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url text;
-- Structured body: lead answer, key facts, H2 sections, FAQ. See
-- lib/content/article-body.ts for why prose alone was the wrong shape.
-- Nullable: articles written before this keep only the flat `body`, and
-- there's no honest way to derive sections for them after the fact.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS body_blocks jsonb;

-- Article ideas: the review gate that makes an automated pipeline survivable.
-- Generating a draft is slow and expensive; generating an idea is neither, so
-- the human decision moves to the cheap end. You approve a one-line idea in
-- seconds, and only approved ideas are ever written up.
CREATE TABLE IF NOT EXISTS article_ideas (
  id text PRIMARY KEY,
  topic_id text REFERENCES resource_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  /* What makes this specific rather than a generic overview. */
  angle text NOT NULL DEFAULT '',
  /* The question or search this is meant to answer, in the reader's words. */
  target_query text NOT NULL DEFAULT '',
  /* Why it's worth writing -- shown at review time so the call is informed. */
  rationale text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','drafted')),
  /* Set once the draft exists, so an idea links to what it became. */
  article_id text REFERENCES articles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS article_ideas_status_idx ON article_ideas (status, created_at DESC);
ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS image_url text;

-- AI referral tracking: minimal, privacy-first (no IP, no user agent, no
-- cookies) -- just enough to see which marketing pages get traffic from
-- ChatGPT/Perplexity/Gemini/Copilot/etc, classified by referrer host.
CREATE TABLE IF NOT EXISTS referral_events (
  id text PRIMARY KEY,
  path text NOT NULL,
  referrer_source text NOT NULL,
  referrer_host text,
  raw_referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_events_created_idx ON referral_events (created_at DESC);
CREATE INDEX IF NOT EXISTS referral_events_source_idx ON referral_events (referrer_source);

-- Synthesized narration audio, keyed by what was said (see lib/audio-cache.ts).
-- Deepgram renders a full debrief in several seconds, and the cache was
-- process-memory only: every dev-server reload, deploy, or scale-out threw it
-- all away and the next listener waited again. The key already contains a
-- hash of the script, so a changed narration writes a new row rather than
-- needing invalidation.
CREATE TABLE IF NOT EXISTS audio_cache (
  key text PRIMARY KEY,
  audio bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- --- Airport reports -------------------------------------------------------
-- The data behind per-airport content: one page per training airport carrying
-- numbers that exist nowhere else.
--
-- The unit is a FLIGHT, not a movement, because that is what the data source
-- actually reports. A 1.4-hour local lesson containing a dozen touch-and-goes
-- comes back as a single record. Publishing those as "operations" would be
-- wrong by an order of magnitude, so the schema, the aggregation and the page
-- all say flights and mean it.
--
-- airport_flights is the observation log: one row per flight touching the
-- airport, whatever the source. Append-only, never rendered.
--
-- airport_insights is what a page reads: a periodically recomputed summary
-- with the window and sample size it was computed from. Pages never aggregate
-- at request time and never call an external API -- a page that recomputes on
-- every view is slow, inconsistent between visitors, and impossible to cite.
--
-- The first cut of these tables counted movements. Superseded rather than
-- migrated: they only ever held synthetic rows, and there is nothing in them
-- worth keeping. scripts/drop-legacy-airport-tables.mjs removes them.

CREATE TABLE IF NOT EXISTS airports (
  -- ICAO where one exists, else the local identifier. Upper case.
  ident text PRIMARY KEY,
  name text NOT NULL,
  municipality text,
  region text,
  latitude double precision,
  longitude double precision,
  -- IANA zone, e.g. America/Phoenix. Required to turn the UTC timestamps the
  -- data source returns into the local hours a reader actually cares about.
  timezone text,
  -- Whether this is somewhere training actually happens. Set from observed
  -- activity rather than assumed, so the page list can be driven by it.
  is_training_field boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE airports ADD COLUMN IF NOT EXISTS timezone text;

CREATE TABLE IF NOT EXISTS airport_flights (
  id text PRIMARY KEY,
  airport_ident text NOT NULL REFERENCES airports(ident) ON DELETE CASCADE,
  -- Provider flight id, so re-running a window updates rather than duplicates.
  provider_flight_id text,
  -- "local"     -- departed and returned here: a lesson, pattern work, airwork
  -- "departure" -- left here for somewhere else
  -- "arrival"   -- came here from somewhere else
  -- Local flights are the training signal and are counted separately rather
  -- than folded into departures and arrivals.
  flight_kind text NOT NULL CHECK (flight_kind IN ('local','departure','arrival')),
  -- The moment this flight touched the airport: takeoff for local and
  -- departure, landing for arrival. Everything time-based keys off this.
  occurred_at timestamptz NOT NULL,
  -- Local hour 0-23, stored rather than derived: "busiest hour" means local
  -- time to a student, and deriving it at query time needs the timezone on
  -- every row anyway.
  local_hour smallint NOT NULL CHECK (local_hour BETWEEN 0 AND 23),
  local_day_of_week smallint NOT NULL CHECK (local_day_of_week BETWEEN 0 AND 6),
  -- 1-12, local. Seasonality is the strongest effect at most training fields,
  -- and at a desert field it moves the busy hours as well as the volume.
  local_month smallint NOT NULL CHECK (local_month BETWEEN 1 AND 12),
  duration_minutes integer,
  aircraft_type text,
  registration text,
  -- Operator callsign prefix where the source reports one, so a flight
  -- school's own traffic is distinguishable from transient GA.
  operator text,
  -- Where a departure went. Null on arrivals and local flights: counting the
  -- arrival leg too would double every round trip and make the busiest
  -- "destination" the airport itself.
  destination_ident text,
  -- Where the observation came from ("fr24", "afterflight"), so a finding can
  -- state its provenance and a source can be excluded wholesale if its terms
  -- require it.
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- When this flight's track was pulled, so a second track run adds to the
-- sample rather than re-fetching flights already in it.
--
-- Recorded here rather than on airport_tracks because airport_tracks holds no
-- flight id by design, and adding one to make re-runs cheap would trade the
-- anonymity of the geometry for a convenience. The id is already on this row;
-- marking it costs nothing and links nothing.
ALTER TABLE airport_flights ADD COLUMN IF NOT EXISTS track_fetched_at timestamptz;

CREATE INDEX IF NOT EXISTS airport_flights_airport_time_idx
  ON airport_flights (airport_ident, occurred_at);
CREATE UNIQUE INDEX IF NOT EXISTS airport_flights_provider_idx
  ON airport_flights (airport_ident, provider_flight_id)
  WHERE provider_flight_id IS NOT NULL;

-- Which days have already been pulled, so a re-run resumes instead of
-- re-spending API calls. Recorded per day rather than inferred from
-- airport_flights: a genuinely quiet day has no flights, and inferring from
-- the flights table would re-fetch it forever.
CREATE TABLE IF NOT EXISTS airport_ingest_days (
  airport_ident text NOT NULL REFERENCES airports(ident) ON DELETE CASCADE,
  day date NOT NULL,
  source text NOT NULL,
  flights integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (airport_ident, day, source)
);

-- Sampled ground tracks, for the density map of where flying from this field
-- actually happens.
--
-- A SAMPLE, not a census: the track endpoint costs one call per flight, and a
-- few hundred local flights already show where the practice areas are and
-- which corridor everyone takes out. Thirty thousand would show the same
-- thing for a hundred times the cost.
--
-- Deliberately anonymous. No registration, no callsign, no flight id, no
-- timestamps beyond the month. The published artefact is the composite --
-- where the lines pile up -- and that is a real finding about a place. Four
-- hundred identifiable aircraft paths is surveillance of the local flying
-- community, is a much harder thing to defend under a data licence, and is a
-- worse product. Storing the identifiers "just in case" would mean the only
-- thing standing between the two is a SELECT list.
CREATE TABLE IF NOT EXISTS airport_tracks (
  id text PRIMARY KEY,
  airport_ident text NOT NULL REFERENCES airports(ident) ON DELETE CASCADE,
  -- Simplified [[lon, lat], ...] in display order.
  points jsonb NOT NULL,
  -- Kept because seasonal and time-of-day differences in where people fly are
  -- interesting, and neither identifies a flight.
  local_month smallint CHECK (local_month BETWEEN 1 AND 12),
  local_hour smallint CHECK (local_hour BETWEEN 0 AND 23),
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS airport_tracks_airport_idx ON airport_tracks (airport_ident);

-- What is registered near an airport, from Windsock's registry.
--
-- "Registered near" is NOT "based at": the coordinate on a registry row is
-- the registrant's mailing address, which for a management company is an
-- office downtown. Within ten miles of a field that is a good proxy and not a
-- fact, and the page has to say so -- the same discipline as calling flights
-- flights rather than operations.
CREATE TABLE IF NOT EXISTS airport_fleet (
  airport_ident text PRIMARY KEY REFERENCES airports(ident) ON DELETE CASCADE,
  aircraft_count integer NOT NULL,
  median_year integer,
  -- [{type, count, share}], most common first.
  top_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  trainer_count integer NOT NULL DEFAULT 0,
  median_trainer_hours integer,
  -- Trainers that flew 500+ hours last year. The number that separates a
  -- school aeroplane on a line from a privately owned one, which is the
  -- distinction a student comparing schools actually cares about.
  hard_worked_trainers integer NOT NULL DEFAULT 0,
  -- The radius the census covers, so the page can state it rather than imply
  -- a precision it does not have.
  radius_mi integer NOT NULL DEFAULT 10,
  -- Runway identifiers as painted, from Windsock's airport record. Deriving
  -- runway use from tracks gives a heading; this gives the name a reader
  -- expects to see.
  runways text[] NOT NULL DEFAULT '{}',
  source text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- CREATE TABLE IF NOT EXISTS does nothing to a table that already exists, so
-- every column added to airport_fleet after it first shipped needs an
-- explicit ALTER. This is the fourth time this file has caught me out the
-- same way; the rule is that a new column in a CREATE block above always
-- needs a line down here too.
-- The shot brief behind an article's hero image, as editable parts (scene,
-- subjects, aircraft, light, camera). Stored so an editor can adjust one
-- element and regenerate rather than re-rolling a prompt they cannot see.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_prompt jsonb;

ALTER TABLE airport_fleet ADD COLUMN IF NOT EXISTS radius_mi integer NOT NULL DEFAULT 10;
ALTER TABLE airport_fleet ADD COLUMN IF NOT EXISTS runways text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS airport_insights (
  airport_ident text PRIMARY KEY REFERENCES airports(ident) ON DELETE CASCADE,
  -- The window these numbers cover. Published on the page: a figure without a
  -- window is an assertion, not a finding, and nothing citable.
  window_start date NOT NULL,
  window_end date NOT NULL,
  -- Flights, not movements. Named so the two cannot be confused. Also the
  -- gate: below a floor, the airport gets no page rather than a page saying
  -- "insufficient data".
  flight_count integer NOT NULL,
  -- Computed summaries, shaped by lib/airport-insights.ts.
  busiest_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  busiest_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  by_month jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Per-season volume AND that season's peak hour. The second half is the
  -- point: at a field where summer flying starts at dawn, an annual "busiest
  -- hour" is an average of two different behaviours and describes neither.
  by_season jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_destinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_operators jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Share of flights that departed and returned here. The training-intensity
  -- figure, and the one number on the page that needs no caveat about units.
  local_share double precision NOT NULL DEFAULT 0,
  -- Median duration of a local flight, in minutes. Median rather than mean:
  -- a single ferry flight or a stuck record drags an average badly.
  median_local_minutes integer,
  -- Which sources the window drew on. The page reads this: a summary built
  -- from synthetic or sample data must not be able to render looking like a
  -- real finding, and provenance is the only thing that can tell it apart
  -- once the numbers are aggregated.
  sources text[] NOT NULL DEFAULT '{}',
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Recording consent + data retention.
--
-- A debrief captures two people talking, and one of them is an employee. The
-- product must be able to prove, later and without argument, that the
-- required consent existed AT THE TIME a recording happened -- not that a
-- policy page existed somewhere.
--
-- Worth stating plainly because it shapes this whole section: AfterFlight
-- NEVER STORES THE RECORDING. lib/transcription/use-deepgram-transcription.ts
-- streams microphone chunks from the browser straight to Deepgram over a live
-- socket and discards them; no audio blob is ever POSTed to this app and no
-- audio column exists on `debriefs`. The retained artifact is the TRANSCRIPT
-- and the structured result derived from it. So retention here governs text,
-- and the honest answer to "where does the audio live" is "nowhere."
--
-- Consent capture itself already exists above (V1 change 12): one row per
-- participant, keyed to the flight, written before recording starts. What was
-- missing is the POLICY VERSION -- proving consent existed is only half the
-- artifact if you cannot show WHICH text the person agreed to. Added by ALTER
-- so existing rows keep their timestamps; they backfill to the version that
-- was live when they were written.
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS policy_version text NOT NULL DEFAULT '2026-08-30-initial';

-- Per-org retention policy. Configurable rather than hard-coded so a school
-- with its own counsel can set its own number; the default is deliberately
-- conservative and is documented in the UI, not baked into copy.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS transcript_retention_days integer;

-- Set when a debrief's raw transcript has been cleared by retention. The
-- structured result survives -- that is the training record, and deleting it
-- would silently destroy the student's history. Nulling the transcript
-- removes the verbatim conversation while keeping what was learned from it.
ALTER TABLE debriefs ADD COLUMN IF NOT EXISTS transcript_purged_at timestamptz;

-- ---------------------------------------------------------------------------
-- Mobile recording sessions.
--
-- The phone records offline and uploads in batches, so the server needs
-- somewhere to accumulate a flight that does not exist yet -- a Flight row is
-- only created when the session finalizes and its duration is known.
--
-- The session is stored as a single JSONB document rather than a fixes table
-- because it is written as a whole on every batch and read as a whole on
-- finalize; there is no query that wants one fix. `seen_batch_keys` is what
-- makes retries idempotent, and it is indexed inside the document rather than
-- as rows for the same reason.
CREATE TABLE IF NOT EXISTS mobile_recording_sessions (
  -- Client-generated, so the phone can reference the session before it has
  -- ever reached the network.
  id text PRIMARY KEY,
  -- text, not uuid: every id in this schema is text, and users.id in
  -- particular is a text key rather than a generated uuid.
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Epoch ms of the START FLIGHT tap. The canonical session origin that GPS,
  -- replay and later cockpit audio all stamp against.
  t0 bigint NOT NULL,
  aircraft_tail text NOT NULL,
  instructor_id text REFERENCES users(id) ON DELETE SET NULL,
  device jsonb NOT NULL DEFAULT '{}'::jsonb,
  session jsonb NOT NULL,
  -- Set when the session finalizes into a real flight.
  flight_id text REFERENCES flights(id) ON DELETE SET NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mobile_recording_sessions_user_idx
  ON mobile_recording_sessions (user_id, created_at DESC);
-- Finds the unfinished session on app relaunch.
CREATE INDEX IF NOT EXISTS mobile_recording_sessions_active_idx
  ON mobile_recording_sessions (user_id) WHERE ended_at IS NULL;
