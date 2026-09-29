import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, MessageCircle } from "lucide-react";
import { supabase, isSupabaseConfigured, EMAIL_ADMIN_PERTAMA } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/UserAvatar";
import { NouraLogo } from "@/components/NouraLogo";
import { DEFAULT_LANDING_CONFIG, getLandingConfig } from "@/lib/landingConfig";

export const Route = createFileRoute("/masuk")({
  head: () => ({
    meta: [
      { title: "Masuk — Kerja Teman Indonesia" },
      {
        name: "description",
        content:
          "Masuk ke Kerja Teman Indonesia untuk mengelola task harian, catatan pekerjaan, notulen, dan berkas kerja Anda.",
      },
      { property: "og:title", content: "Masuk — Kerja Teman Indonesia" },
      {
        property: "og:description",
        content: "Halaman masuk Kerja Teman Indonesia dengan peran admin dan viewer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const n = s["next"];
    return typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? { next: n } : {};
  },
  component: Masuk,
});

function Masuk() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();

  const lanjut = useCallback(() => {
    if (next) window.location.href = next;
    else navigate({ to: "/dasbor", replace: true });
  }, [next, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminWhatsAppNumber, setAdminWhatsAppNumber] = useState(
    DEFAULT_LANDING_CONFIG.adminWhatsAppNumber,
  );

  const whatsappDigits = adminWhatsAppNumber.replace(/\D/g, "").replace(/^0/, "62");

  useEffect(() => {
    setAdminWhatsAppNumber(getLandingConfig().adminWhatsAppNumber);
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) lanjut();
    });
  }, [lanjut]);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase belum terhubung. Konfigurasikan di Project Settings.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      lanjut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#ebf1f8] dark:bg-[#070b13] p-4 flex items-center justify-center font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 transition-all">
        {/* Top visual branding */}
        <div className="flex flex-col items-center text-center">
          <Link
            to="/"
            className="mb-5 inline-flex items-center transition-opacity hover:opacity-85"
            aria-label="NOURA"
          >
            <NouraLogo size="xl" />
          </Link>
          <UserAvatar className="size-14" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-3">
            Masuk ke Workspace
          </h1>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-4 p-3 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
            Backend Supabase sedang berjalan pada mode demonstrasi lokal.
          </div>
        )}

        <form onSubmit={kirim} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Alamat Email
            </Label>
            <div className="relative">
              <Mail className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={EMAIL_ADMIN_PERTAMA}
                className="pl-10 rounded-2xl border-slate-200 dark:border-slate-800 text-xs focus-visible:ring-indigo-500 py-2.5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 rounded-2xl border-slate-200 dark:border-slate-800 text-xs focus-visible:ring-indigo-500 py-2.5"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold py-2.5 shadow-md flex items-center justify-center gap-2"
          >
            <span>{loading ? "Memproses…" : "Masuk ke Akun"}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pendaftaran mandiri dinonaktifkan. Akun baru hanya dapat dibuat oleh admin.
          </p>
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="size-3.5" />
              <span>Hubungi admin via WhatsApp</span>
            </a>
          )}
          <div>
            <Link
              to="/"
              className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1"
            >
              <span>← Lihat Portofolio CV & Ringkasan Dasbor</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
