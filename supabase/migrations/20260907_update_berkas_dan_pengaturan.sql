-- ============================================================
-- Migration: Pembaruan SQL untuk Berkas Dokumen & Pengaturan Profil
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- BAGIAN 1: PENGATURAN PROFIL & AVATAR STORAGE
-- ============================================================

-- 1.1 Tambahkan kolom lengkap pada public.profiles jika belum ada
do $$ begin
  alter table public.profiles add column if not exists full_name text;
  alter table public.profiles add column if not exists job_title text;
  alter table public.profiles add column if not exists company_name text;
  alter table public.profiles add column if not exists vendor_name text;
  alter table public.profiles add column if not exists avatar_url text;
  alter table public.profiles add column if not exists updated_at timestamptz default now();
exception when others then null;
end $$;

-- 1.2 Sinkronkan full_name dari nama untuk data yang sudah ada
update public.profiles
set full_name = coalesce(full_name, nama)
where full_name is null and nama is not null;

-- 1.3 Trigger otomatis memperbarui updated_at & sinkronisasi nama
create or replace function public.handle_profile_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.full_name is not null and (new.nama is null or new.nama <> new.full_name) then
    new.nama := new.full_name;
  end if;
  return new;
end $$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_profile_updated();

-- 1.4 Izin dan RLS Policy untuk public.profiles
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- Pengguna login dapat melihat profil
drop policy if exists "profil terlihat oleh pengguna login" on public.profiles;
create policy "profil terlihat oleh pengguna login" on public.profiles
  for select to authenticated using (true);

-- Pengguna dapat membuat profil miliknya sendiri
drop policy if exists "pengguna dapat membuat profil sendiri" on public.profiles;
create policy "pengguna dapat membuat profil sendiri" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Pengguna dapat memperbarui profil miliknya sendiri
drop policy if exists "pengguna dapat memperbarui profil sendiri" on public.profiles;
create policy "pengguna dapat memperbarui profil sendiri" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 1.5 Supabase Storage: Bucket 'avatars' untuk Foto Profil
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage RLS Policies untuk 'avatars'
drop policy if exists "Avatar dapat dilihat oleh siapa saja" on storage.objects;
create policy "Avatar dapat dilihat oleh siapa saja"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Pengguna dapat mengunggah avatar miliknya" on storage.objects;
create policy "Pengguna dapat mengunggah avatar miliknya"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Pengguna dapat memperbarui avatar miliknya" on storage.objects;
create policy "Pengguna dapat memperbarui avatar miliknya"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Pengguna dapat menghapus avatar miliknya" on storage.objects;
create policy "Pengguna dapat menghapus avatar miliknya"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- BAGIAN 2: BERKAS DOKUMEN & FOLDER
-- ============================================================

-- 2.1 Pastikan kolom folder_id dan is_folder tersedia di public.berkas
do $$ begin
  alter table public.berkas add column if not exists folder_id uuid references public.berkas(id) on delete cascade;
  alter table public.berkas add column if not exists is_folder boolean not null default false;
exception when others then null;
end $$;

-- 2.2 Index performa query berkas dan folder
create index if not exists idx_berkas_folder_id on public.berkas(folder_id);
create index if not exists idx_berkas_is_folder on public.berkas(is_folder);
create index if not exists idx_berkas_dibuat_oleh on public.berkas(dibuat_oleh);
create index if not exists idx_berkas_created_at on public.berkas(created_at desc);

-- 2.3 Izin tabel public.berkas
grant select, insert, update, delete on public.berkas to authenticated;
grant all on public.berkas to service_role;
alter table public.berkas enable row level security;

-- Pengguna login dapat membaca semua berkas/folder
drop policy if exists "baca semua login" on public.berkas;
drop policy if exists "baca berkas login" on public.berkas;
create policy "baca berkas login" on public.berkas
  for select to authenticated using (true);

-- Admin dapat mengelola semua berkas, atau pengguna mengelola berkas miliknya sendiri
drop policy if exists "admin tulis" on public.berkas;
drop policy if exists "kelola berkas login" on public.berkas;
create policy "kelola berkas login" on public.berkas
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or dibuat_oleh = auth.uid() or dibuat_oleh is null)
  with check (public.has_role(auth.uid(), 'admin') or dibuat_oleh = auth.uid() or dibuat_oleh is null);

-- 2.4 Supabase Storage: Bucket 'berkas'
insert into storage.buckets (id, name, public)
values ('berkas', 'berkas', false)
on conflict (id) do nothing;

-- Storage RLS Policies untuk 'berkas'
drop policy if exists "berkas baca login" on storage.objects;
create policy "berkas baca login" on storage.objects
  for select to authenticated
  using (bucket_id = 'berkas');

drop policy if exists "berkas tulis login" on storage.objects;
drop policy if exists "berkas tulis admin" on storage.objects;
create policy "berkas tulis login" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'berkas' and
    (public.has_role(auth.uid(), 'admin') or (storage.foldername(name))[1] = auth.uid()::text or auth.uid() is not null)
  );

drop policy if exists "berkas update login" on storage.objects;
create policy "berkas update login" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'berkas' and
    (public.has_role(auth.uid(), 'admin') or (storage.foldername(name))[1] = auth.uid()::text or auth.uid() is not null)
  );

drop policy if exists "berkas hapus login" on storage.objects;
drop policy if exists "berkas hapus admin" on storage.objects;
create policy "berkas hapus login" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'berkas' and
    (public.has_role(auth.uid(), 'admin') or (storage.foldername(name))[1] = auth.uid()::text or auth.uid() is not null)
  );
