-- Exhibition lifecycle fields for Supabase table `exposities`.
alter table public.exposities add column if not exists start_date date;
alter table public.exposities add column if not exists end_date date;
alter table public.exposities add column if not exists is_permanent boolean not null default false;
alter table public.exposities add column if not exists date_status text not null default 'unknown';
alter table public.exposities add column if not exists source_url text;
alter table public.exposities add column if not exists source_last_checked_at timestamptz;
alter table public.exposities add column if not exists content_last_verified_at timestamptz;
alter table public.exposities add column if not exists archived_at timestamptz;
alter table public.exposities add column if not exists verification_status text;

alter table public.exposities drop constraint if exists exposities_date_status_check;
alter table public.exposities add constraint exposities_date_status_check
  check (date_status in ('scheduled', 'current', 'ended', 'permanent', 'unknown'));

create index if not exists exposities_date_status_idx on public.exposities (date_status);
create index if not exists exposities_end_date_idx on public.exposities (end_date);
create index if not exists exposities_archived_at_idx on public.exposities (archived_at);
