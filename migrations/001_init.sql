-- Suhail, initial schema. CLAUDE.md section 9.
--
-- Run this against the suhail-demo Supabase project from the SQL editor or
-- the CLI. It is idempotent enough to re-run on a clean database, not on a
-- populated one.
--
-- RLS is enabled on every table from creation, per the section 3 trap note:
-- writing policies as you go is far easier than retrofitting them.
--
-- The access model for v1:
--   sites, operators, experiences, availability  read-only to anon
--   bookings                                     insert-only to anon,
--                                                never readable by anon
--
-- A traveller reads a booking back through a server route holding the
-- service role key, not directly. Anonymous select on bookings would expose
-- every guest's name, email and phone to anyone with the anon key, which is
-- published to the browser by design.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- operators

create table if not exists operators (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  contact_email text,
  approved      boolean not null default true,
  created_at    timestamptz not null default now()
);

-- -------------------------------------------------------------------- sites

create table if not exists sites (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  lat          numeric not null,
  lng          numeric not null,
  elevation_m  integer,
  bortle_class integer check (bortle_class between 1 and 9),
  description  text,
  best_for     text[] not null default '{}'
);

-- -------------------------------------------------------------- experiences

create table if not exists experiences (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references operators (id) on delete cascade,
  site_id       uuid not null references sites (id) on delete restrict,
  slug          text unique not null,
  title         text not null,
  description   text,
  duration_min  integer check (duration_min > 0),
  price_sar     numeric(10, 2) check (price_sar >= 0),
  group_min     integer not null default 1 check (group_min >= 1),
  group_max     integer check (group_max >= group_min),
  requires_dark boolean not null default false,
  active        boolean not null default true
);

create index if not exists experiences_site_idx on experiences (site_id);
create index if not exists experiences_operator_idx on experiences (operator_id);

-- ------------------------------------------------------------- availability

create table if not exists availability (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references experiences (id) on delete cascade,
  date            date not null,
  slots_remaining integer not null check (slots_remaining >= 0),
  unique (experience_id, date)
);

create index if not exists availability_date_idx on availability (date);

-- ----------------------------------------------------------------- bookings

create table if not exists bookings (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences (id) on delete restrict,
  date          date not null,
  guest_count   integer not null check (guest_count >= 1),
  contact_name  text not null,
  contact_email text not null,
  contact_phone text,
  status        text not null default 'pending'
                check (status in ('pending', 'confirmed', 'cancelled')),
  reference     text unique not null,
  created_at    timestamptz not null default now()
);

create index if not exists bookings_reference_idx on bookings (reference);

-- ---------------------------------------------------------------------- RLS

alter table operators    enable row level security;
alter table sites        enable row level security;
alter table experiences  enable row level security;
alter table availability enable row level security;
alter table bookings     enable row level security;

-- Public catalogue. Anyone may read it, nobody may write it from the client.
-- Seeding happens through the service role, which bypasses RLS.

drop policy if exists "operators readable" on operators;
create policy "operators readable" on operators
  for select to anon, authenticated using (approved);

drop policy if exists "sites readable" on sites;
create policy "sites readable" on sites
  for select to anon, authenticated using (true);

drop policy if exists "experiences readable" on experiences;
create policy "experiences readable" on experiences
  for select to anon, authenticated using (active);

drop policy if exists "availability readable" on availability;
create policy "availability readable" on availability
  for select to anon, authenticated using (true);

-- Bookings: insert only, and only in a shape the client is allowed to choose.
--
-- with check pins the two columns a client must not be able to set freely.
-- status is forced to 'pending' so nobody can self-confirm a booking, and
-- the reference must match the SUH- format so the column stays meaningful.
-- Everything else about the row is the traveller's own data.

drop policy if exists "bookings insertable" on bookings;
create policy "bookings insertable" on bookings
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and reference ~ '^SUH-[A-Z0-9]{5}$'
    and guest_count between 1 and 20
    and char_length(contact_name) between 1 and 120
    and char_length(contact_email) between 3 and 200
  );

-- Deliberately no select, update or delete policy on bookings. With RLS on
-- and no policy, those are denied for anon and authenticated. Reading a
-- booking back goes through the service role on the server, so a reference
-- alone never exposes anyone else's contact details to the browser.
