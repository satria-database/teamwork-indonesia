-- ============================================================
-- Migration: Fitur Catatan Pekerjaan (Daily Work Log)
-- ============================================================

-- 1. Kategori Pekerjaan
create table if not exists public.work_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nama text not null,
  warna text default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tag Pekerjaan
create table if not exists public.work_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nama text not null,
  created_at timestamptz not null default now()
);

-- 3. Tabel Utama: work_logs
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.work_categories(id) on delete set null,
  judul text not null,
  deskripsi text,
  work_date date not null default current_date,
  start_time time,
  end_time time,
  durasi_menit integer not null default 0,
  status text not null default 'belum_mulai' check (status in ('belum_mulai', 'berjalan', 'selesai')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  prioritas text not null default 'sedang' check (prioritas in ('rendah', 'sedang', 'tinggi')),
  link_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Relasi N:N work_logs <-> work_tags
create table if not exists public.work_log_tags (
  id uuid primary key default gen_random_uuid(),
  work_log_id uuid not null references public.work_logs(id) on delete cascade,
  tag_id uuid not null references public.work_tags(id) on delete cascade,
  unique (work_log_id, tag_id)
);

-- 5. Tabel Lampiran: work_log_attachments
create table if not exists public.work_log_attachments (
  id uuid primary key default gen_random_uuid(),
  work_log_id uuid not null references public.work_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  path text not null,
  ukuran bigint,
  tipe text,
  created_at timestamptz not null default now()
);

-- Indexing untuk query & filter berkecepatan tinggi
create index if not exists idx_work_logs_user_id on public.work_logs(user_id);
create index if not exists idx_work_logs_work_date on public.work_logs(work_date);
create index if not exists idx_work_logs_status on public.work_logs(status);
create index if not exists idx_work_logs_category_id on public.work_logs(category_id);
create index if not exists idx_work_log_attachments_log on public.work_log_attachments(work_log_id);

-- Aktifkan Row Level Security (RLS)
alter table public.work_categories enable row level security;
alter table public.work_tags enable row level security;
alter table public.work_logs enable row level security;
alter table public.work_log_tags enable row level security;
alter table public.work_log_attachments enable row level security;

-- Policy RLS berdasarkan auth.uid()
-- Kategori
drop policy if exists "work_categories_user_all" on public.work_categories;
create policy "work_categories_user_all" on public.work_categories
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

-- Tag
drop policy if exists "work_tags_user_all" on public.work_tags;
create policy "work_tags_user_all" on public.work_tags
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

-- Work logs: Pengguna hanya boleh membaca & mengelola miliknya sendiri
drop policy if exists "work_logs_user_all" on public.work_logs;
create policy "work_logs_user_all" on public.work_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Work log tags
drop policy if exists "work_log_tags_user_all" on public.work_log_tags;
create policy "work_log_tags_user_all" on public.work_log_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.work_logs
      where work_logs.id = work_log_tags.work_log_id
      and work_logs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.work_logs
      where work_logs.id = work_log_tags.work_log_id
      and work_logs.user_id = auth.uid()
    )
  );

-- Attachments
drop policy if exists "work_log_attachments_user_all" on public.work_log_attachments;
create policy "work_log_attachments_user_all" on public.work_log_attachments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Grants
grant select, insert, update, delete on public.work_categories to authenticated;
grant select, insert, update, delete on public.work_tags to authenticated;
grant select, insert, update, delete on public.work_logs to authenticated;
grant select, insert, update, delete on public.work_log_tags to authenticated;
grant select, insert, update, delete on public.work_log_attachments to authenticated;

-- Storage Bucket untuk Attachment Pekerjaan
insert into storage.buckets (id, name, public)
values ('work-attachments', 'work-attachments', false)
on conflict (id) do nothing;

drop policy if exists "work_attachments_select" on storage.objects;
create policy "work_attachments_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'work-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "work_attachments_insert" on storage.objects;
create policy "work_attachments_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'work-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "work_attachments_delete" on storage.objects;
create policy "work_attachments_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'work-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
