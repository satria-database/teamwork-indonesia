-- ============================================================
-- WorkHub Personal — skema Supabase
-- Jalankan seluruh isi file ini di Supabase Dashboard > SQL Editor.
-- ============================================================

-- 1. Peran pengguna -------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'viewer');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nama text,
  full_name text,
  job_title text,
  company_name text,
  vendor_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

-- Undangan: admin mendaftarkan email + peran sebelum orangnya membuat akun.
create table if not exists public.undangan (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.app_role not null default 'viewer',
  dibuat_oleh uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.undangan to authenticated;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;
grant all on public.undangan to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.undangan enable row level security;

drop policy if exists "profil terlihat oleh pengguna login" on public.profiles;
create policy "profil terlihat oleh pengguna login" on public.profiles
  for select to authenticated using (true);

drop policy if exists "pengguna dapat membuat profil sendiri" on public.profiles;
create policy "pengguna dapat membuat profil sendiri" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "pengguna dapat memperbarui profil sendiri" on public.profiles;
create policy "pengguna dapat memperbarui profil sendiri" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger otomatis untuk profil updated_at
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

drop policy if exists "peran terlihat oleh pengguna login" on public.user_roles;
create policy "peran terlihat oleh pengguna login" on public.user_roles
  for select to authenticated using (true);

drop policy if exists "admin kelola peran" on public.user_roles;
create policy "admin kelola peran" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin kelola undangan" on public.undangan;
create policy "admin kelola undangan" on public.undangan
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2. Trigger: buat profil + peran otomatis saat akun dibuat ---------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  peran public.app_role;
begin
  insert into public.profiles (id, email, nama)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  if lower(new.email) = 'satria62317@gmail.com' then
    peran := 'admin';                       -- admin pertama otomatis
  else
    select u.role into peran from public.undangan u where lower(u.email) = lower(new.email);
    peran := coalesce(peran, 'viewer');
  end if;

  insert into public.user_roles (user_id, role) values (new.id, peran)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Tabel konten ----------------------------------------------------
create table if not exists public.tugas (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  catatan text,
  tanggal date not null default current_date,
  prioritas text not null default 'sedang',
  selesai boolean not null default false,
  dibuat_oleh uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.catatan_kerja (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text,
  tanggal date not null default current_date,
  durasi_menit integer,
  dibuat_oleh uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pekerjaan_mendatang (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  tenggat date,
  status text not null default 'direncanakan',
  dibuat_oleh uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notulen (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  tanggal date not null default current_date,
  peserta text,
  isi text,
  keputusan text,
  dibuat_oleh uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.berkas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  path text not null,
  ukuran bigint,
  tipe text,
  folder_id uuid references public.berkas(id) on delete cascade,
  is_folder boolean not null default false,
  dibuat_oleh uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Index untuk berkas & folder
create index if not exists idx_berkas_folder_id on public.berkas(folder_id);
create index if not exists idx_berkas_is_folder on public.berkas(is_folder);
create index if not exists idx_berkas_dibuat_oleh on public.berkas(dibuat_oleh);
create index if not exists idx_berkas_created_at on public.berkas(created_at desc);

do $$
declare t text;
begin
  foreach t in array array['tugas','catatan_kerja','pekerjaan_mendatang','notulen','berkas'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "baca semua login" on public.%I', t);
    execute format('create policy "baca semua login" on public.%I for select to authenticated using (true)', t);
    execute format('drop policy if exists "admin tulis" on public.%I', t);
    execute format($f$create policy "admin tulis" on public.%I for all to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'))$f$, t);
  end loop;
end $$;

-- Policy spesifik berkas: pengguna dapat mengunggah dan mengelola berkas miliknya atau admin
drop policy if exists "kelola berkas login" on public.berkas;
create policy "kelola berkas login" on public.berkas
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or dibuat_oleh = auth.uid() or dibuat_oleh is null)
  with check (public.has_role(auth.uid(), 'admin') or dibuat_oleh = auth.uid() or dibuat_oleh is null);

-- 4. Storage ---------------------------------------------------------
-- 4.1 Bucket Berkas Dokumen
insert into storage.buckets (id, name, public)
values ('berkas', 'berkas', false)
on conflict (id) do nothing;

drop policy if exists "berkas baca login" on storage.objects;
create policy "berkas baca login" on storage.objects
  for select to authenticated using (bucket_id = 'berkas');

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

-- 4.2 Bucket Avatars (Foto Profil Pengaturan)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

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

-- 5. Daily Work Log Skema (work_logs, work_categories, work_tags, work_log_attachments)
create table if not exists public.work_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nama text not null,
  warna text default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nama text not null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.work_log_tags (
  id uuid primary key default gen_random_uuid(),
  work_log_id uuid not null references public.work_logs(id) on delete cascade,
  tag_id uuid not null references public.work_tags(id) on delete cascade,
  unique (work_log_id, tag_id)
);

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

create index if not exists idx_work_logs_user_id on public.work_logs(user_id);
create index if not exists idx_work_logs_work_date on public.work_logs(work_date);
create index if not exists idx_work_logs_status on public.work_logs(status);
create index if not exists idx_work_logs_category_id on public.work_logs(category_id);

alter table public.work_categories enable row level security;
alter table public.work_tags enable row level security;
alter table public.work_logs enable row level security;
alter table public.work_log_tags enable row level security;
alter table public.work_log_attachments enable row level security;

drop policy if exists "work_categories_user_all" on public.work_categories;
create policy "work_categories_user_all" on public.work_categories
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "work_tags_user_all" on public.work_tags;
create policy "work_tags_user_all" on public.work_tags
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "work_logs_user_all" on public.work_logs;
create policy "work_logs_user_all" on public.work_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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

drop policy if exists "work_log_attachments_user_all" on public.work_log_attachments;
create policy "work_log_attachments_user_all" on public.work_log_attachments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.work_categories to authenticated;
grant select, insert, update, delete on public.work_tags to authenticated;
grant select, insert, update, delete on public.work_logs to authenticated;
grant select, insert, update, delete on public.work_log_tags to authenticated;
grant select, insert, update, delete on public.work_log_attachments to authenticated;

insert into storage.buckets (id, name, public)
values ('work-attachments', 'work-attachments', false)
on conflict (id) do nothing;

-- 6. Curriculum Vitae (CV Digital) -----------------------------------
create table if not exists public.curriculum_vitae (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  nama_lengkap text not null,
  headline text,
  email text,
  telepon text,
  alamat text,
  tentang_saya text,
  pengalaman jsonb default '[]'::jsonb,
  pendidikan jsonb default '[]'::jsonb,
  keahlian jsonb default '[]'::jsonb,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

alter table public.curriculum_vitae enable row level security;

drop policy if exists "cv_baca_semua" on public.curriculum_vitae;
create policy "cv_baca_semua" on public.curriculum_vitae
  for select to authenticated using (true);

drop policy if exists "cv_kelola_sendiri" on public.curriculum_vitae;
create policy "cv_kelola_sendiri" on public.curriculum_vitae
  for all to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

grant select, insert, update, delete on public.curriculum_vitae to authenticated;
grant all on public.curriculum_vitae to service_role;

-- 6.1 Foto Profil CV & Kustomisasi Judul Seksi
alter table public.curriculum_vitae add column if not exists foto_url text;
alter table public.curriculum_vitae add column if not exists foto_position text default 'center center';
alter table public.curriculum_vitae add column if not exists linkedin text;
alter table public.curriculum_vitae add column if not exists sertifikasi jsonb default '[]'::jsonb;
alter table public.curriculum_vitae add column if not exists spesialisasi_kompetensi jsonb default '[]'::jsonb;
alter table public.curriculum_vitae add column if not exists judul_tentang_saya text default 'Tentang Saya';
alter table public.curriculum_vitae add column if not exists judul_pendidikan text default '1. Riwayat Pendidikan';
alter table public.curriculum_vitae add column if not exists judul_pengalaman text default '2. Pengalaman Kerja';
alter table public.curriculum_vitae add column if not exists judul_keahlian text default '3. Keahlian Utama';
alter table public.curriculum_vitae add column if not exists judul_kompetensi text default '4. Spesialisasi Kompetensi';

-- Izin baca anon untuk tampilan depan / publik
grant select on public.curriculum_vitae to anon;
drop policy if exists "cv_baca_publik" on public.curriculum_vitae;
create policy "cv_baca_publik" on public.curriculum_vitae
  for select to anon using (true);

-- 7. Work Checklists (Checklist Pekerjaan) ---------------------------
-- Helper: cek kepemilikan catatan pekerjaan melalui work_logs ATAU catatan_kerja
-- (work_logs mungkin belum ada di semua project)
create or replace function public.check_work_log_owner(_work_log_id uuid, _user_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  begin
    if exists (select 1 from public.work_logs where id = _work_log_id and user_id = _user_id) then
      return true;
    end if;
  exception when undefined_table then
    null;
  end;
  begin
    if exists (select 1 from public.catatan_kerja where id = _work_log_id and dibuat_oleh = _user_id) then
      return true;
    end if;
  exception when undefined_table then
    null;
  end;
  return false;
end;
$$;

create table if not exists public.work_checklists (
  id uuid primary key default gen_random_uuid(),
  work_log_id uuid not null,
  title text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_work_checklists_work_log_id on public.work_checklists(work_log_id);
create index if not exists idx_work_checklists_sort_order on public.work_checklists(sort_order);

alter table public.work_checklists enable row level security;

drop policy if exists "work_checklists_user_all" on public.work_checklists;
create policy "work_checklists_user_all" on public.work_checklists
  for all to authenticated
  using (public.check_work_log_owner(work_log_id, auth.uid()))
  with check (public.check_work_log_owner(work_log_id, auth.uid()));

grant select, insert, update, delete on public.work_checklists to authenticated;
grant all on public.work_checklists to service_role;


