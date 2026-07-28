-- Suhail, client accounts. Adds to migrations/001_init.sql and 002_messages.sql.
--
-- Run this against the same Supabase project, after the first two. Adds
-- Supabase Auth (email + password) so a traveller can optionally sign in and
-- see their own bookings from any device, on top of the anonymous booking
-- flow, which is unchanged: user_id is nullable, so a guest checkout still
-- works exactly as it did before this migration.
--
-- This project's default access model for v1 was "no login" (CLAUDE.md
-- section 12, as originally written). That decision is superseded here at
-- the project owner's explicit direction, in the same conversation this
-- migration was written for. See DESIGN_SYSTEM_REPLACEMENT-style note in
-- CLAUDE.md section 12 for the update.

alter table bookings add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists bookings_user_idx on bookings (user_id);

-- Reissue the insert policy from 001_init.sql, with one added clause: a
-- signed-in client may tag a booking as its own, never as someone else's.
-- Guests keep inserting exactly as before, since user_id is optional.
drop policy if exists "bookings insertable" on bookings;
create policy "bookings insertable" on bookings
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and reference ~ '^SUH-[A-Z0-9]{5}$'
    and guest_count between 1 and 20
    and char_length(contact_name) between 1 and 120
    and char_length(contact_email) between 3 and 200
    and (user_id is null or user_id = auth.uid())
  );

-- A signed-in traveller may read back bookings tagged as their own. This is
-- the one exception to 001_init.sql's "no select policy" rule, and it is
-- scoped tightly enough to keep the reasoning there intact: nobody can read
-- a booking they do not own, signed in or not, and a guest booking with no
-- user_id is still only readable through the service role, same as always.
drop policy if exists "bookings readable by owner" on bookings;
create policy "bookings readable by owner" on bookings
  for select to authenticated
  using (user_id = auth.uid());

-- ...and cancel one of their own, and nothing else about it. `using` gates
-- which rows a client may target: their own, and not already cancelled.
-- `with check` gates what the row is allowed to become: cancelled, full
-- stop. A signed-in client cannot self-confirm a pending booking, change
-- the date or guest count, or revive a cancelled one through this policy.
drop policy if exists "bookings cancellable by owner" on bookings;
create policy "bookings cancellable by owner" on bookings
  for update to authenticated
  using (user_id = auth.uid() and status <> 'cancelled')
  with check (status = 'cancelled');
