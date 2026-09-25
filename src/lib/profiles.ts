import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  job_title: string | null;
  company_name: string | null;
  vendor_name: string | null;
  avatar_url: string | null;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export type UpdateProfilePayload = {
  full_name: string;
  job_title?: string | null;
  company_name?: string | null;
  vendor_name?: string | null;
  avatar_url?: string | null;
};

/**
 * Mendapatkan profil pengguna aktif.
 * Menggabungkan data dari tabel `profiles` dan Supabase Auth metadata sebagai jaminan data presisten.
 */
export async function fetchUserProfile(user: User): Promise<UserProfile> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta: any = user.user_metadata || {};
  const emailDefaultName = user.email
    ? user.email
        .split("@")[0]!
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : "Pengguna";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbRow: any = null;

  try {
    // Coba ambil seluruh kolom dari tabel profiles
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      dbRow = data;
    } else if (error && error.code === "42703") {
      // Fallback jika migrasi kolom baru di Supabase belum sempat dijalankan user
      const { data: legacyData } = await supabase
        .from("profiles")
        .select("id, email, nama")
        .eq("id", user.id)
        .maybeSingle();
      if (legacyData) {
        dbRow = legacyData;
      }
    }
  } catch (err) {
    console.warn("Catatan fetch profile DB:", err);
  }

  // Gabungkan prioritas: data DB > auth user_metadata > default fallback
  const fullName =
    dbRow?.full_name || dbRow?.nama || meta.full_name || meta.nama || emailDefaultName;

  const jobTitle = (dbRow?.job_title !== undefined ? dbRow.job_title : meta.job_title) ?? null;

  const companyName =
    (dbRow?.company_name !== undefined ? dbRow.company_name : meta.company_name) ?? null;

  const vendorName =
    (dbRow?.vendor_name !== undefined ? dbRow.vendor_name : meta.vendor_name) ?? null;

  const avatarUrl = (dbRow?.avatar_url !== undefined ? dbRow.avatar_url : meta.avatar_url) ?? null;

  return {
    id: user.id,
    email: user.email || dbRow?.email || "",
    full_name: fullName,
    job_title: jobTitle,
    company_name: companyName,
    vendor_name: vendorName,
    avatar_url: avatarUrl,
    created_at: dbRow?.created_at,
    updated_at: dbRow?.updated_at,
  };
}

/**
 * Menyimpan pembaruan profil pengguna ke Supabase.
 * Mengupdate Auth User Metadata (otomatis persistent di akun) dan tabel `profiles`.
 */
export async function updateUserProfile(
  user: User,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const cleanFullName = payload.full_name.trim();
  if (!cleanFullName) {
    throw new Error("Nama lengkap wajib diisi.");
  }

  const cleanJobTitle = payload.job_title?.trim() || null;
  const cleanCompanyName = payload.company_name?.trim() || null;
  const cleanVendorName = payload.vendor_name?.trim() || null;
  const cleanAvatarUrl = payload.avatar_url ?? null;

  const existingMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const authMetadata = {
    full_name: cleanFullName,
    nama: cleanFullName,
    job_title: cleanJobTitle,
    company_name: cleanCompanyName,
    vendor_name: cleanVendorName,
    avatar_url: cleanAvatarUrl,
    updated_at: new Date().toISOString(),
    // Preserve account type metadata
    account_type: existingMeta["account_type"],
    parent_user_id: existingMeta["parent_user_id"],
  };

  // 1. Simpan ke Supabase Auth User Metadata (presisten, realtime, aman)
  const { error: authError } = await supabase.auth.updateUser({
    data: authMetadata,
  });
  if (authError) {
    console.warn("Warning saat update auth metadata:", authError);
  }

  // 2. Simpan ke tabel profiles
  try {
    const { error: dbError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email || "",
        nama: cleanFullName,
        full_name: cleanFullName,
        job_title: cleanJobTitle,
        company_name: cleanCompanyName,
        vendor_name: cleanVendorName,
        avatar_url: cleanAvatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (dbError) {
      console.warn(
        "DB Upsert attempt notice (jika kolom belum di-migrate di SQL editor):",
        dbError.message,
      );
      // Coba fallback ke kolom bawaan jika kolom baru belum dieksekusi di Supabase SQL editor
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || "",
          nama: cleanFullName,
        },
        { onConflict: "id" },
      );
    }
  } catch (err) {
    console.warn("Gagal update tabel profiles, data tetap tersimpan di Supabase Auth:", err);
  }

  return {
    id: user.id,
    email: user.email || "",
    full_name: cleanFullName,
    job_title: cleanJobTitle,
    company_name: cleanCompanyName,
    vendor_name: cleanVendorName,
    avatar_url: cleanAvatarUrl,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Upload foto profil ke Supabase Storage (Bucket 'avatars').
 * Memvalidasi ukuran (maks 2MB) dan format gambar.
 */
export async function uploadAvatarFile(user: User, file: File): Promise<string> {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran foto profil maksimal 2MB.");
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Format foto tidak didukung. Harap gunakan file PNG atau JPG.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `profile_${Date.now()}.${ext}`;
  const filePath = `${user.id}/${fileName}`;

  try {
    // Unggah ke Supabase Storage
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      console.warn("Supabase Storage bucket upload info:", uploadError);
      // Jika bucket belum dibuat di remote Supabase, buat base64 data url sebagai fallback transparan
      return await fileToDataUrl(file);
    }

    // Ambil URL publik dari Supabase Storage
    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return publicData.publicUrl;
  } catch (err) {
    console.warn("Storage upload exception:", err);
    return await fileToDataUrl(file);
  }
}

/**
 * Menghapus foto profil dari Supabase Storage jika memungkinkan.
 */
export async function deleteAvatarFile(
  user: User,
  currentAvatarUrl?: string | null,
): Promise<void> {
  if (!currentAvatarUrl) return;

  try {
    if (currentAvatarUrl.includes("/avatars/")) {
      const parts = currentAvatarUrl.split("/avatars/")[1];
      if (parts) {
        const decodedPath = decodeURIComponent(parts.split("?")[0]!);
        await supabase.storage.from("avatars").remove([decodedPath]);
      }
    }
  } catch (err) {
    console.warn("Gagal menghapus file dari storage:", err);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
