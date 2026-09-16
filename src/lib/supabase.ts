import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://olvogyukyydooiuzljml.supabase.co";
const DEFAULT_KEY = "sb_publishable_VzVzypBHlc2EqXJsOYsCtg_0r64-p8B";

const url = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? DEFAULT_URL;
const key =
  ((import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined) ?? DEFAULT_KEY;

/** True hanya jika project Supabase eksternal sudah terhubung. */
export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const EMAIL_ADMIN_PERTAMA = "satria62317@gmail.com";
export const PASSWORD_ADMIN_DEFAULT = "WorkHub#2026!Ganti";
