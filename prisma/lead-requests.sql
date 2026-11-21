-- Creates the table behind the site's lead form (model LeadRequest).
-- Run once in the Supabase SQL Editor of the production project.
-- The app reads and writes it through server-side Prisma only, so row level
-- security is enabled with no policies: browser roles get no direct access.

begin;

create table if not exists public.lead_requests (
  id            text primary key,
  ref_code      text not null,
  full_name     text not null,
  phone         text not null,
  package_name  text not null,
  package_info  text,
  latitude      double precision,
  longitude     double precision,
  address_note  text,
  source        text,
  line_sent     boolean not null default false,
  status        text not null default 'new',
  created_at    timestamp(3) not null default current_timestamp
);

create index if not exists lead_requests_created_at_idx on public.lead_requests (created_at);
create index if not exists lead_requests_ref_code_idx on public.lead_requests (ref_code);

alter table public.lead_requests enable row level security;

commit;
