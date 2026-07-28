-- Suhail, consume availability on booking. Adds to 001-004.
--
-- Run this against the same Supabase project, after the first four.
--
-- migrations/004_restore_slots_on_cancel.sql restores a seat when a booking
-- is cancelled, which only makes sense paired with something that took the
-- seat in the first place — and nothing did. A booking has never touched
-- availability on creation; slots_remaining was seed dressing (scripts/
-- seed.mjs's deterministic-per-slug-and-date number), not live inventory.
-- Shipping 004 alone would have made things worse, not better: every
-- cancellation would inflate the seed number a little further from
-- whatever it started at, with nothing on the other side of the ledger.
--
-- This is the other half. A booking of any status — pending included —
-- holds its seat from the moment it is written, on the same reasoning
-- BookingFlow.tsx already uses for the reference format: two travellers
-- should not both be able to book the last seat because neither one has
-- been operator-confirmed yet.
--
-- greatest(..., 0) rather than letting this go negative: the column has a
-- `slots_remaining >= 0` check (migrations/001_init.sql), and this project
-- has never enforced "no more bookings than seats" as a hard rule elsewhere
-- (BookingFlow does not check remaining slots against guest_count before
-- submitting). Clamping to zero keeps the insert succeeding rather than
-- rolling back a booking over an inventory rule that was never actually
-- enforced end to end. The number can undercount after that point; it
-- cannot go negative or crash a booking.

create or replace function consume_slot_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update availability
  set slots_remaining = greatest(slots_remaining - new.guest_count, 0)
  where experience_id = new.experience_id and date = new.date;
  return new;
end;
$$;

drop trigger if exists bookings_consume_slot on bookings;
create trigger bookings_consume_slot
  after insert on bookings
  for each row
  execute function consume_slot_on_booking();
