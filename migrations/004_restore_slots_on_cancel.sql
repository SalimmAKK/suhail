-- Suhail, restore availability on cancellation. Adds to 001-003.
--
-- Run this against the same Supabase project, after the first three.
--
-- Cancelling a booking today does not free the seat it held: availability
-- rows are never touched by the cancel path, so a cancelled night still
-- reads as fully booked in the catalogue. This is a trigger rather than
-- application code because there are now two places a booking gets
-- cancelled from (an account holder's own cancel in lib/account.ts, and an
-- operator's cancel from /operators, added alongside this migration) and a
-- third is easy to imagine later. A trigger fires for all of them, present
-- and future, without each call site having to remember to also touch
-- availability.
--
-- security definer is required, not decorative: availability has no update
-- policy for anon or authenticated (migrations/001_init.sql), so a trigger
-- running as the invoking role would fail silently-to-Postgres's-RLS the
-- same way a client update would. Defining it as the function owner (the
-- migration-running role, which owns every function created here) is what
-- lets the trigger do the one write its own logic requires without opening
-- availability up to client writes generally.

create or replace function restore_slots_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update availability
    set slots_remaining = slots_remaining + old.guest_count
    where experience_id = old.experience_id and date = old.date;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_restore_slots on bookings;
create trigger bookings_restore_slots
  after update on bookings
  for each row
  execute function restore_slots_on_cancel();
