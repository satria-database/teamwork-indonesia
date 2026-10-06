import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { getHighResolutionAvatarUrl } from "./avatarUtils";
import satriaRedAvatar from "@/assets/images/satria_avatar_red_1790582692896.jpg";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  job_title: string | null;
  company_name: string | null;
  vendor_name: string | null;
  avatar_url: string | null;
  avatar_position?: string | null;
  avatar_scale?: number | null;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export type UpdateProfilePayload = {
  full_name: string;
  job_title?: string | null;
  company_name?: string | null;
  vendor_name?: string | null;
  avatar_url?: string | null;
  avatar_position?: string | null;
  avatar_scale?: number | null;
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

  let avatarUrl = (dbRow?.avatar_url !== undefined ? dbRow.avatar_url : meta.avatar_url) ?? null;
  let avatarPosition =
    (dbRow?.avatar_position !== undefined ? dbRow.avatar_position : meta.avatar_position) ??
    (typeof window !== "undefined" ? localStorage.getItem("workhub_avatar_position") : null) ??
    null;
  let avatarScale =
    (dbRow?.avatar_scale !== undefined
      ? Number(dbRow.avatar_scale)
      : meta.avatar_scale !== undefined
        ? Number(meta.avatar_scale)
        : null) ??
    (typeof window !== "undefined"
      ? parseFloat(localStorage.getItem("workhub_avatar_scale") || "1")
      : null);

  // Jika avatar_url belum diset di profiles / user_metadata, ambil foto_url resolusi tinggi dari curriculum_vitae
  if (!avatarUrl && user?.id) {
    try {
      const { data: cvData } = await supabase
        .from("curriculum_vitae")
        .select("foto_url, foto_position")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cvData?.foto_url) {
        avatarUrl = cvData.foto_url;
        if (cvData.foto_position && !avatarPosition) {
          avatarPosition = cvData.foto_position;
        }
      }
    } catch {
      // ignore
    }
  }

  // Jika masih kosong, gunakan foto resmi HD Satria (1024x1024)
  if (!avatarUrl) {
    avatarUrl = satriaRedAvatar;
  }
  avatarUrl = getHighResolutionAvatarUrl(avatarUrl) || avatarUrl;

  if (!avatarPosition) {
    avatarPosition = "50% 50%";
  }
  if (!avatarScale) {
    avatarScale = 1;
  }

  return {
    id: user.id,
    email: user.email || dbRow?.email || "",
    full_name: fullName,
    job_title: jobTitle,
    company_name: companyName,
    vendor_name: vendorName,
    avatar_url: avatarUrl,
    avatar_position: avatarPosition,
    avatar_scale: avatarScale,
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
  const cleanAvatarPosition = payload.avatar_position || "50% 50%";
  const cleanAvatarScale =
    payload.avatar_scale !== undefined && payload.avatar_scale !== null
      ? Number(payload.avatar_scale)
      : 1;

  // Persist locally for instant responsiveness
  if (typeof window !== "undefined") {
    localStorage.setItem("workhub_avatar_position", cleanAvatarPosition);
    localStorage.setItem("workhub_avatar_scale", String(cleanAvatarScale));
  }

  const existingMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const authMetadata = {
    full_name: cleanFullName,
    nama: cleanFullName,
    job_title: cleanJobTitle,
    company_name: cleanCompanyName,
    vendor_name: cleanVendorName,
    avatar_url: cleanAvatarUrl,
    avatar_position: cleanAvatarPosition,
    avatar_scale: cleanAvatarScale,
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
        avatar_position: cleanAvatarPosition,
        avatar_scale: cleanAvatarScale,
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
          avatar_url: cleanAvatarUrl,
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
    avatar_position: cleanAvatarPosition,
    avatar_scale: cleanAvatarScale,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Upload foto profil ke Supabase Storage (Bucket 'avatars').
 * Memvalidasi ukuran (maks 2MB) dan format gambar.
 */
export async function uploadAvatarFile(user: User, file: File): Promise<string> {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB untuk menjaga kualitas tinggi tanpa pecah
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran foto profil maksimal 10MB.");
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Format foto tidak didukung. Harap gunakan file PNG atau JPG.");
  }

  file = await compressImage(file);
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

async function compressImage(file: File, maxSize = 800, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
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
