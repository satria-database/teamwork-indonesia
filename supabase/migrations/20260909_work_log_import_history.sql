create table if not exists public.work_log_import_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size bigint not null default 0,
  row_count integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  status text not null check (status in ('success', 'partial', 'failed')),
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.work_log_import_history enable row level security;
create index if not exists work_log_import_history_user_created_idx on public.work_log_import_history(user_id, created_at desc);
drop policy if exists "Users manage their import history" on public.work_log_import_history;
create policy "Users manage their import history" on public.work_log_import_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.work_log_import_history to authenticated;
