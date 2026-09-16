-- ============================================================
-- Migration: Dukungan Folder pada Fitur Berkas Dokumen
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tambahkan kolom folder_id dan is_folder pada public.berkas
do $$ begin
  alter table public.berkas add column if not exists folder_id uuid references public.berkas(id) on delete cascade;
  alter table public.berkas add column if not exists is_folder boolean not null default false;
exception when others then null;
end $$;

-- 2. Buat index untuk performa query folder
create index if not exists idx_berkas_folder_id on public.berkas(folder_id);
create index if not exists idx_berkas_is_folder on public.berkas(is_folder);

-- 3. Pastikan RLS policy tetap berjalan aman untuk semua operasi
alter table public.berkas enable row level security;
