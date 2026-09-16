import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabaseProjectUrl(): string {
  return (
    configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]) ??
    (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ??
    "https://olvogyukyydooiuzljml.supabase.co"
  );
}

function supabasePublishableKey(): string {
  return (
    configuredEnv([
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_ANON_KEY",
    ]) ??
    ((import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
      import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined) ??
    "sb_publishable_VzVzypBHlc2EqXJsOYsCtg_0r64-p8B"
  );
}

/** Klien Supabase yang meneruskan token pengguna, sehingga RLS berlaku sebagai dia. */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser membutuhkan token OAuth terverifikasi");
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
