-- FlightBrief schema — supports an individual student, an independent CFI's
-- students, or a full flight school on the same tables. Run against a
-- Supabase project, then set NEXT_PUBLIC_SUPABASE_URL,
-- NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to switch the
-- app from the in-memory mock repository to this Postgres schema.
--
-- NOTE ON AUTH: this prototype has no real login yet (see lib/viewer.ts) --
-- SupabaseRepository always connects with the service-role key, which
-- bypasses RLS entirely. `enable row level security` is left on below (so
-- nothing is silently open if a non-service-role key is ever used), but the
-- policies here are intentionally simple; real per-user policies keyed off
-- auth.uid() should be written once real auth is wired up.

create extension if not exists "pgcrypto";

-- One row per "workspace": a personal individual-student workspace, an
-- independent CFI's workspace, or a full flight school. `kind` only changes
-- labels/copy in the UI -- the underlying structure is identical.
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'individual' check (kind in ('individual', 'independent_cfi', 'school')),
  created_at timestamptz not null default now()
);

-- Real user identities. A user can belong to multiple organizations and/or
-- hold multiple roles (see organization_members) without duplicate accounts.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role text not null check (role in ('student', 'instructor', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  certificate_type text check (certificate_type in ('PRIVATE')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

-- Explicit many-to-many roster relationship. A student's training history
-- (flights/debriefs/training_items) belongs to the student regardless of
-- what this table says -- this only tracks who currently/previously
-- works with whom, for roster and handoff-brief purposes.
create table if not exists student_instructors (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users (id) on delete cascade,
  instructor_id uuid not null references users (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (student_id, instructor_id, organization_id)
);

-- Instructor is a lightweight, denormalized lookup kept for backward
-- compatibility with flights.instructor_id. When an instructor is a
-- registered user, instructors.id = users.id by convention.
create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists aircraft (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  tail_number text not null,
  type text not null,
  make text not null default '',
  model text not null default '',
  home_airport text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  external_provider text,
  external_id text,
  created_at timestamptz not null default now()
);

-- A scheduled lesson, sourced from a SchedulingProvider (e.g. Flight
-- Schedule Pro) or seed data. Exists only to give the debrief app
-- operational context -- this app never creates or manages reservations.
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  student_id uuid not null references users (id) on delete cascade,
  instructor_id uuid not null references users (id) on delete cascade,
  aircraft_id uuid not null references aircraft (id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  external_provider text,
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists flights (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users (id) on delete cascade,
  organization_id uuid references organizations (id) on delete set null,
  aircraft_id uuid not null references aircraft (id) on delete cascade,
  departure_airport text not null,
  arrival_airport text not null,
  flight_date date not null,
  duration_minutes integer not null,
  instructor_id uuid references instructors (id) on delete set null,
  reservation_id uuid references reservations (id) on delete set null,
  -- ADS-B track source (separate concern from record-origin fields below).
  fr24_flight_id text,
  -- Where this flight *record* originated, e.g. 'flight_schedule_pro'.
  external_provider text,
  external_id text,
  debrief_status text not null default 'not_started'
    check (debrief_status in ('not_started', 'in_progress', 'complete')),
  track_geojson jsonb,
  created_at timestamptz not null default now()
);

create table if not exists debriefs (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references flights (id) on delete cascade,
  transcript text not null,
  audio_duration_seconds integer not null default 0,
  structured_result jsonb not null,
  analyzed_with text not null default 'mock' check (analyzed_with in ('claude', 'mock')),
  created_at timestamptz not null default now()
);

create table if not exists training_items (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references flights (id) on delete cascade,
  debrief_id uuid not null references debriefs (id) on delete cascade,
  category text not null check (category in ('keep_working_on', 'before_next_flight', 'todo')),
  description text not null,
  done boolean not null default false,
  completed_at timestamptz,
  visibility text not null default 'shared' check (visibility in ('shared', 'instructor_only', 'admin_only')),
  created_at timestamptz not null default now()
);

-- Normalized layer under debriefs.structured_result: one row per (skill, status)
-- extracted from a debrief's needsWork/wentWell text, denormalized with
-- organization/student/instructor/aircraft/date so a school can aggregate
-- "what are students struggling with" without joining through flights every
-- time. See lib/taxonomy.ts (classification) and lib/training-insights.ts
-- (school-level aggregation).
create table if not exists training_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete set null,
  student_id uuid not null references users (id) on delete cascade,
  instructor_id uuid references users (id) on delete set null,
  aircraft_id uuid references aircraft (id) on delete set null,
  flight_id uuid not null references flights (id) on delete cascade,
  debrief_id uuid not null references debriefs (id) on delete cascade,
  flight_date date not null,
  category text not null check (category in
    ('LANDINGS', 'MANEUVERS', 'COMMUNICATIONS', 'PROCEDURES', 'AIRSPEED_CONTROL', 'NAVIGATION')),
  skill text not null,
  status text not null check (status in ('NEEDS_WORK', 'IMPROVING')),
  source text not null default 'STUDENT_AND_INSTRUCTOR'
    check (source in ('STUDENT', 'INSTRUCTOR', 'STUDENT_AND_INSTRUCTOR')),
  statement text not null,
  created_at timestamptz not null default now()
);

create index if not exists training_signals_student_idx on training_signals (student_id);
create index if not exists training_signals_organization_idx on training_signals (organization_id);
create index if not exists training_signals_skill_idx on training_signals (skill);

alter table organizations enable row level security;
alter table users enable row level security;
alter table organization_members enable row level security;
alter table student_instructors enable row level security;
alter table instructors enable row level security;
alter table aircraft enable row level security;
alter table reservations enable row level security;
alter table flights enable row level security;
alter table debriefs enable row level security;
alter table training_items enable row level security;
alter table training_signals enable row level security;
