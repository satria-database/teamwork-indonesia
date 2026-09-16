-- ============================================================
-- Migration: Fitur Profil Lengkap & Supabase Storage Avatars
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tambahkan kolom baru pada public.profiles jika belum ada
do $$ begin
  alter table public.profiles add column if not exists full_name text;
  alter table public.profiles add column if not exists job_title text;
  alter table public.profiles add column if not exists company_name text;
  alter table public.profiles add column if not exists vendor_name text;
  alter table public.profiles add column if not exists avatar_url text;
  alter table public.profiles add column if not exists updated_at timestamptz default now();
exception when others then null;
end $$;

-- 2. Sinkronkan nilai full_name dari nama (jika nama ada isinya)
update public.profiles
set full_name = nama
where full_name is null and nama is not null;

-- 3. Trigger otomatis untuk memperbarui updated_at
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

-- 4. Perbarui RLS Policies pada public.profiles
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

-- 5. Supabase Storage: Bucket 'avatars'
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

-- Storage RLS Policies
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
