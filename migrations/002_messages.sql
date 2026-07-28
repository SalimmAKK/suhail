-- Suhail, contact messages. Adds to migrations/001_init.sql.
--
-- Run this against the same Supabase project, after 001_init.sql. Same
-- access model as bookings: anon may insert, anon may never read, because a
-- contact message carries a real email address and there is no reason for
-- anyone holding the published anon key to be able to list every message
-- ever sent.
--
-- A traveller never needs to read a message back — unlike a booking, there
-- is no reference to look up later — so unlike bookings this table has no
-- server-side read path either. It is written once and read only from the
-- Supabase dashboard.

create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "messages insertable" on messages;
create policy "messages insertable" on messages
  for insert to anon, authenticated
  with check (
    char_length(name) between 1 and 200
    and char_length(email) between 3 and 200
    and char_length(subject) between 1 and 200
    and char_length(message) between 1 and 4000
  );

-- Deliberately no select, update or delete policy. With RLS on and no
-- policy, those are denied for anon and authenticated, same reasoning as
-- bookings in 001_init.sql: the anon key is published to the browser, and a
-- select policy here would make every message readable by anyone holding it.
