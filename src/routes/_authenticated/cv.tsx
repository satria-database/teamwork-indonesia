import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Printer,
  Copy,
  Edit3,
  Eye,
  Plus,
  Trash2,
  Save,
  Check,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Wrench,
  AlertCircle,
  Database,
  Code,
  FileCheck,
  RefreshCw,
  Loader2,
  FileText,
  Activity,
  Layers,
  Zap,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { WorkLog } from "@/lib/workLogs";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/cv")({
  component: CurriculumVitaePage,
});

import {
  DEFAULT_CV_SATRIA,
  createDefaultCVForUser,
  type CVData,
  type PengalamanKerja,
  type RiwayatPendidikan,
} from "@/lib/cvData";

const SQL_SCHEMA_SNIPPET = `-- Jalankan skrip ini di Supabase Dashboard > SQL Editor:
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
grant all on public.curriculum_vitae to service_role;`;

function CurriculumVitaePage() {
  const { user, isAdmin, effectiveUserId } = useAuth();
  const { profile } = useProfile();

  const [cv, setCv] = useState<CVData>(() => createDefaultCVForUser(user?.email, profile ?? undefined));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storageType, setStorageType] = useState<"cloud" | "local">("local");
  const [tableMissing, setTableMissing] = useState(false);
  const [realtimeSyncWithDashboard, setRealtimeSyncWithDashboard] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [completedWorkLogs, setCompletedWorkLogs] = useState<
  Array<{ id: string; judul: string; deskripsi?: string; tanggal: string; kategori?: string }>
  >([]);

  // Dialog states
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [rawTextToParse, setRawTextToParse] = useState("");
  const [parsedPreview, setParsedPreview] = useState<CVData | null>(null);
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [isCheckingCloud, setIsCheckingCloud] = useState(false);

  const loadFromLocal = useCallback(() => {
    const localKey = `workhub_cv_${user?.id || "default"}`;
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        setCv(JSON.parse(saved));
        return;
      } catch {
        // ignore
      }
    }
    setCv(createDefaultCVForUser(user?.email, profile ?? undefined));
  }, [user?.id, user?.email, profile]);

  // Muat catatan pekerjaan yang telah diselesaikan dari dasbor
  const loadCompletedWorkLogs = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      let data: WorkLog[] | null = null;
      const res = await supabase
        .from("catatan_kerja")
        .select("id, judul, deskripsi, tanggal, kategori, status")
        .eq("dibuat_oleh", effectiveUserId)
        .eq("status", "selesai")
        .order("tanggal", { ascending: false })
        .limit(6);
      data = res.data as WorkLog[] | null;

      if (data && data.length > 0) {
        setCompletedWorkLogs(data);
      }
    } catch {
      // ignore
    }
  }, [effectiveUserId]);

  // Load and verify CV data from Supabase for this logged in account
  const checkAndLoadCV = useCallback(
    async (showNotification = false) => {
      setIsCheckingCloud(true);
      try {
        if (!user?.id) {
          loadFromLocal();
          return;
        }

        const { data, error } = await supabase
          .from("curriculum_vitae")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          setTableMissing(true);
          setStorageType("local");
          loadFromLocal();
          if (showNotification) {
            toast.error("Tabel Supabase belum terdeteksi. Menggunakan penyimpanan lokal.");
          }
          return;
        }

        setTableMissing(false);
        setStorageType("cloud");

        const fallback = createDefaultCVForUser(user.email, profile ?? undefined);

        if (data) {
          setCv({
            nama_lengkap:
              (realtimeSyncWithDashboard && profile?.full_name?.trim()) ||
              data.nama_lengkap ||
              fallback.nama_lengkap,
            headline:
              (realtimeSyncWithDashboard && profile?.job_title?.trim()) ||
              data.headline ||
              fallback.headline,
            alamat: data.alamat || fallback.alamat,
            telepon: data.telepon || fallback.telepon,
            email: user.email || data.email || fallback.email,
            tentang_saya: data.tentang_saya || fallback.tentang_saya,
            pengalaman:
              Array.isArray(data.pengalaman) && data.pengalaman.length > 0
                ? data.pengalaman
                : fallback.pengalaman,
            pendidikan:
              Array.isArray(data.pendidikan) && data.pendidikan.length > 0
                ? data.pendidikan
                : fallback.pendidikan,
            keahlian:
              Array.isArray(data.keahlian) && data.keahlian.length > 0
                ? data.keahlian
                : fallback.keahlian,
            foto_url: data.foto_url || fallback.foto_url || null,
            foto_position: data.foto_position || fallback.foto_position || "center center",
          });
          setLastSyncedAt(new Date());
          if (showNotification) {
            toast.success("Resume berhasil disinkronkan secara realtime dengan akun Anda!");
          }
        } else {
          // Buat CV default dinamis untuk akun ini
          const initialUserCV = createDefaultCVForUser(user.email, profile ?? undefined);
          setCv(initialUserCV);
          setLastSyncedAt(new Date());
          if (showNotification) {
            toast.info("Membuat template resume terintegrasi untuk akun Anda.");
          }
        }
      } catch {
        setTableMissing(true);
        setStorageType("local");
        loadFromLocal();
      } finally {
        setIsCheckingCloud(false);
      }
    },
    [user?.id, user?.email, profile, realtimeSyncWithDashboard, loadFromLocal],
  );

  // 1. Sinkronisasi realtime ketika profil di hook useProfile berubah di Dasbor
  useEffect(() => {
    if (realtimeSyncWithDashboard && profile) {
      setCv((prev) => {
        const nextName = profile.full_name?.trim();
        const nextHeadline = profile.job_title?.trim();
        if (!nextName && !nextHeadline) return prev;
        if (
          (nextName ? prev.nama_lengkap === nextName : true) &&
          (nextHeadline ? prev.headline === nextHeadline : true)
        ) {
          return prev;
        }
        return {
          ...prev,
          nama_lengkap: nextName || prev.nama_lengkap,
          headline: nextHeadline || prev.headline,
        };
      });
      setLastSyncedAt(new Date());
    }
  }, [profile, realtimeSyncWithDashboard]);

  // 2. Load CV & work logs on mount and user change
  useEffect(() => {
    checkAndLoadCV();
    loadCompletedWorkLogs();
  }, [checkAndLoadCV, loadCompletedWorkLogs]);

  // 3. Supabase Realtime channel subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`cv_realtime_sync_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "curriculum_vitae",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const row = payload.new as Record<string, unknown>;
            setCv((prev) => ({
              ...prev,
              nama_lengkap:
                typeof row["nama_lengkap"] === "string" ? row["nama_lengkap"] : prev.nama_lengkap,
              headline: typeof row["headline"] === "string" ? row["headline"] : prev.headline,
              alamat: typeof row["alamat"] === "string" ? row["alamat"] : prev.alamat,
              telepon: typeof row["telepon"] === "string" ? row["telepon"] : prev.telepon,
              email: typeof row["email"] === "string" ? row["email"] : prev.email,
              tentang_saya:
                typeof row["tentang_saya"] === "string" ? row["tentang_saya"] : prev.tentang_saya,
              pengalaman: Array.isArray(row["pengalaman"])
                ? (row["pengalaman"] as PengalamanKerja[])
                : prev.pengalaman,
              pendidikan: Array.isArray(row["pendidikan"])
                ? (row["pendidikan"] as RiwayatPendidikan[])
                : prev.pendidikan,
              keahlian: Array.isArray(row["keahlian"]) ? (row["keahlian"] as string[]) : prev.keahlian,
              foto_url:
                typeof row["foto_url"] === "string" ? row["foto_url"] : (prev.foto_url ?? null),
              foto_position:
                typeof row["foto_position"] === "string" ? row["foto_position"] : (prev.foto_position ?? null),
            }));
            setLastSyncedAt(new Date());
            toast.info("Perubahan CV diperbarui secara realtime dari cloud!");
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const p = payload.new as Record<string, unknown>;
            if (realtimeSyncWithDashboard) {
              const fullName = typeof p["full_name"] === "string" ? p["full_name"].trim() : "";
              const jobTitle = typeof p["job_title"] === "string" ? p["job_title"].trim() : "";
              setCv((prev) => ({
                ...prev,
                nama_lengkap: fullName || prev.nama_lengkap,
                headline: jobTitle || prev.headline,
              }));
              setLastSyncedAt(new Date());
              toast.info("Profil Dasbor diperbarui: Resume disinkronkan realtime!");
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "catatan_kerja",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadCompletedWorkLogs();
          setLastSyncedAt(new Date());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, realtimeSyncWithDashboard, loadCompletedWorkLogs]);

  // Sinkronkan manual langsung dari profil akun dasbor
  const syncWithDashboardProfile = useCallback(() => {
    setCv((prev) => {
      const newName =
        profile?.full_name?.trim() ||
        (user?.email
          ? user.email
              .split("@")[0]!
              .replace(/[._]/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
          : prev.nama_lengkap);
      const newHeadline = profile?.job_title?.trim() || prev.headline;
      const newEmail = user?.email || prev.email;
      return {
        ...prev,
        nama_lengkap: newName,
        headline: newHeadline,
        email: newEmail,
      };
    });
    setLastSyncedAt(new Date());
    toast.success("Resume disinkronkan langsung dari profil akun dasbor!");
  }, [profile, user?.email]);

  // Impor catatan pekerjaan selesai dari dasbor ke pengalaman kerja CV
  const importDashboardWorkToExperience = () => {
    if (completedWorkLogs.length === 0) {
      toast.info("Belum ada catatan pekerjaan dengan status selesai di dasbor.");
      return;
    }
    const descriptions = completedWorkLogs.map(
      (log) => `${log.judul}${log.deskripsi ? `: ${log.deskripsi}` : ""}`,
    );
    const newExp: PengalamanKerja = {
      id: `exp-dashboard-${Date.now()}`,
      perusahaan: profile?.company_name?.trim() || "Noura Workhub (Aktivitas Dasbor)",
      posisi: profile?.job_title?.trim() || cv.headline || "Profesional Spesialis",
      periode: "Terkini (Sinkron Dasbor)",
      deskripsi: descriptions,
    };
    setCv((prev) => ({
      ...prev,
      pengalaman: [newExp, ...prev.pengalaman],
    }));
    toast.success("Catatan pekerjaan dasbor berhasil diimpor ke Pengalaman Kerja CV!");
  };

  // Simpan data CV
  const handleSaveCV = async () => {
    setIsSaving(true);
    const localKey = `workhub_cv_${user?.id || "default"}`;
    localStorage.setItem(localKey, JSON.stringify(cv));

    try {
      if (!user?.id) throw new Error("Pengguna belum terautentikasi");

      const { error } = await supabase.from("curriculum_vitae").upsert(
        {
          user_id: user.id,
          nama_lengkap: cv.nama_lengkap,
          headline: cv.headline,
          alamat: cv.alamat,
          telepon: cv.telepon,
          email: cv.email || user.email,
          tentang_saya: cv.tentang_saya,
          pengalaman: cv.pengalaman,
          pendidikan: cv.pendidikan,
          keahlian: cv.keahlian,
          foto_url: cv.foto_url || null,
          foto_position: cv.foto_position || "center center",
          diperbarui_pada: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        setTableMissing(true);
        setStorageType("local");
        toast.info("Tersimpan di penyimpanan lokal browser.");
      } else {
        setStorageType("cloud");
        setTableMissing(false);
        setLastSyncedAt(new Date());
        toast.success("Curriculum Vitae berhasil disimpan dan disinkronkan ke cloud!");
      }
    } catch {
      setStorageType("local");
      toast.success("Curriculum Vitae berhasil disimpan secara lokal!");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  // Konversi & Parser Cerdas
  const handleParseText = () => {
    if (!rawTextToParse.trim()) {
      toast.error("Silakan masukkan teks CV atau pilih preset.");
      return;
    }

    const text = rawTextToParse;
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Default template from parsed text
    const parsed: CVData = {
      nama_lengkap: lines[0]?.toUpperCase() || cv.nama_lengkap,
      headline: "Professional Specialist",
      alamat: "",
      telepon: "",
      email: "",
      tentang_saya: "",
      pengalaman: [],
      pendidikan: [],
      keahlian: [],
    };

    // Regex extraction
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    if (emailMatch) parsed.email = emailMatch[1]!;

    const phoneMatch = text.match(
      /(?:Telepon|Telp|Phone|WA|No\.?\s*HP)?\s*[:]?\s*(08[0-9\s-]{8,14}|\+62[0-9\s-]{8,14})/i,
    );
    if (phoneMatch) parsed.telepon = phoneMatch[1]!.replace(/[^0-9+]/g, "");

    const alamatMatch = text.match(/(?:Alamat|Address)\s*[:]?\s*([^\n]+)/i);
    if (alamatMatch) parsed.alamat = alamatMatch[1]!.trim();

    // Section markers detection
    const lowerText = text.toLowerCase();

    // Tentang Saya
    if (
      lowerText.includes("tentang saya") ||
      lowerText.includes("about me") ||
      lowerText.includes("ringkasan")
    ) {
      const parts = text.split(/(?:TENTANG SAYA|Tentang Saya|About Me|RINGKASAN|Ringkasan)/i);
      if (parts[1]) {
        const aboutSnippet = parts[1].split(
          /(?:PENGALAMAN|Pengalaman|PENDIDIKAN|Pendidikan|KEAHLIAN|Keahlian)/i,
        )[0];
        if (aboutSnippet) parsed.tentang_saya = aboutSnippet.trim();
      }
    }

    // Keahlian
    if (lowerText.includes("keahlian") || lowerText.includes("skills")) {
      const parts = text.split(/(?:KEAHLIAN|Keahlian|SKILLS|Skills)/i);
      if (parts[1]) {
        const skillsSnippet = parts[1].split("\n\n")[0];
        if (skillsSnippet) {
          parsed.keahlian = skillsSnippet
            .split(/[,;\n•●-]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 1);
        }
      }
    }

    // Fallback if empty
    if (!parsed.tentang_saya) parsed.tentang_saya = cv.tentang_saya;
    if (parsed.keahlian.length === 0) parsed.keahlian = cv.keahlian;
    parsed.pengalaman = cv.pengalaman;
    parsed.pendidikan = cv.pendidikan;

    setParsedPreview(parsed);
    toast.success("Teks berhasil diparsing! Tinjau hasilnya di bawah sebelum menerapkan.");
  };

  // Terapkan hasil parsing
  const applyParsedCV = (target: CVData) => {
    setCv(target);
    setParseDialogOpen(false);
    setParsedPreview(null);
    setRawTextToParse("");
    toast.success(`Data CV "${target.nama_lengkap}" berhasil dimuat ke formulir!`);
  };

  // Cetak ke PDF
  const handlePrint = () => {
    window.print();
  };

  // Salin SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    toast.success("Skrip SQL berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="cv-page space-y-4 sm:space-y-6 w-full pb-12">
      {/* Header Halaman (Disembunyikan saat cetak) */}
      <div className="print:hidden space-y-4">
        <PageHeader
          judul="Curriculum Vitae"
          deskripsi="Format CV profesional, pratinjau langsung, ekspor PDF, dan integrasi konversi / parsing cerdas."
          action={
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Tombol Konversi / Parsing */}
              <Button
                type="button"
                onClick={() => setParseDialogOpen(true)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="size-4 text-amber-300" />
                <span>Konversi / Parsing CV</span>
              </Button>

              {/* Toggle Edit / Preview */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-xs"
              >
                {isEditing ? (
                  <>
                    <Eye className="size-4" />
                    <span>Mode Pratinjau</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="size-4" />
                    <span>Edit CV</span>
                  </>
                )}
              </Button>

              {/* Print / Download PDF */}
              <Button
                type="button"
                onClick={handlePrint}
                variant="outline"
                className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="size-4 text-slate-500" />
                <span>Cetak / PDF</span>
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  onClick={handleSaveCV}
                  disabled={isSaving}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  <span>Simpan</span>
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* MODE EDIT: FORMULIR PENGATURAN CV */}
      {isEditing && (
        <div className="print:hidden bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Formulir Pengaturan Curriculum Vitae</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                  Akun: {user?.email}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sesuaikan profil, riwayat kerja, capaian dasbor, dan keahlian untuk resume
                profesional Anda.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={syncWithDashboardProfile}
                className="rounded-xl border-slate-200 dark:border-slate-700 text-xs h-9 px-3 gap-1.5 cursor-pointer"
              >
                <RefreshCw className="size-3.5 text-indigo-500" />
                <span>Sinkronkan dari Dasbor</span>
              </Button>
              <Button
                type="button"
                onClick={handleSaveCV}
                disabled={isSaving}
                className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span>Simpan Perubahan</span>
              </Button>
            </div>
          </div>

          {/* 0. Foto Profil CV */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              0. Foto Profil CV
            </h4>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Photo Preview */}
              <div className="relative shrink-0">
                <div
                  className="size-28 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm"
                  style={{ objectPosition: cv.foto_position || "center center" }}
                >
                  {cv.foto_url ? (
                    <img
                      src={cv.foto_url}
                      alt="Foto Profil CV"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: cv.foto_position || "center center" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white font-black text-2xl">
                      {(cv.nama_lengkap || "U")
                        .split(" ")
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 3)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & Position Controls */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="cv-foto-upload" className="cursor-pointer">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                      <Plus className="size-3.5" />
                      {cv.foto_url ? "Ganti Foto" : "Upload Foto"}
                    </div>
                  </Label>
                  <input
                    id="cv-foto-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user?.id) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Ukuran foto maksimal 2MB");
                        return;
                      }
                      try {
                        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                        const path = `cv-photos/${user.id}/${Date.now()}-${cleanName}`;
                        const uploadRes = await supabase.storage
                          .from("avatars")
                          .upload(path, file);
                        if (uploadRes.error) throw uploadRes.error;
                        const { data: urlData } = supabase.storage
                          .from("avatars")
                          .getPublicUrl(path);
                        setCv({ ...cv, foto_url: urlData.publicUrl });
                        toast.success("Foto berhasil diunggah!");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Gagal mengunggah foto",
                        );
                      }
                    }}
                  />
                  {cv.foto_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCv({ ...cv, foto_url: null })}
                      className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      Hapus Foto
                    </Button>
                  )}
                </div>

                {/* Position Adjustment */}
                {cv.foto_url && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <Label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <SlidersHorizontal className="size-3" />
                      Atur Posisi Foto
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400">Horizontal</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={
                            (() => {
                              const pos = cv.foto_position || "center center";
                              const match = pos.match(/(\d+)%\s+(\d+)%/);
                              return match ? match[1] : "50";
                            })()
                          }
                          onChange={(e) => {
                            const yMatch = (cv.foto_position || "50% 50%").match(/(\d+)%\s+(\d+)%/);
                            const yVal = yMatch ? yMatch[2] : "50";
                            setCv({ ...cv, foto_position: `${e.target.value}% ${yVal}%` });
                          }}
                          className="w-full accent-indigo-600 h-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400">Vertikal</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={
                            (() => {
                              const pos = cv.foto_position || "center center";
                              const match = pos.match(/(\d+)%\s+(\d+)%/);
                              return match ? match[2] : "50";
                            })()
                          }
                          onChange={(e) => {
                            const xMatch = (cv.foto_position || "50% 50%").match(/(\d+)%\s+(\d+)%/);
                            const xVal = xMatch ? xMatch[1] : "50";
                            setCv({ ...cv, foto_position: `${xVal}% ${e.target.value}%` });
                          }}
                          className="w-full accent-indigo-600 h-1.5"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {[
                        { label: "Tengah", value: "50% 50%" },
                        { label: "Atas", value: "50% 0%" },
                        { label: "Bawah", value: "50% 100%" },
                        { label: "Kiri", value: "0% 50%" },
                        { label: "Kanan", value: "100% 50%" },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setCv({ ...cv, foto_position: preset.value })}
                          className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                            cv.foto_position === preset.value
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Format: JPG/PNG/WebP. Maksimal 2MB. Foto akan tampil di CV dan landing page.
                </p>
              </div>
            </div>
          </div>

          {/* 1. Informasi Pribadi */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              1. Informasi Pribadi & Kontak
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Lengkap</Label>
                <Input
                  value={cv.nama_lengkap}
                  onChange={(e) => setCv({ ...cv, nama_lengkap: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Headline / Target Posisi</Label>
                <Input
                  value={cv.headline}
                  onChange={(e) => setCv({ ...cv, headline: e.target.value })}
                  placeholder="Contoh: Technical Data Supporting, Administrator..."
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Alamat Lengkap</Label>
                <Input
                  value={cv.alamat}
                  onChange={(e) => setCv({ ...cv, alamat: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nomor Telepon / WhatsApp</Label>
                <Input
                  value={cv.telepon}
                  onChange={(e) => setCv({ ...cv, telepon: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Alamat Email</Label>
                <Input
                  value={cv.email}
                  onChange={(e) => setCv({ ...cv, email: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* 2. Tentang Saya */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              2. Tentang Saya / Profil Profesional
            </h4>
            <Textarea
              value={cv.tentang_saya}
              onChange={(e) => setCv({ ...cv, tentang_saya: e.target.value })}
              rows={4}
              className="rounded-xl text-xs leading-relaxed"
            />
          </div>

          {/* 3. Pengalaman Kerja */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                3. Pengalaman Kerja ({cv.pengalaman.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newExp: PengalamanKerja = {
                    id: `exp-${Date.now()}`,
                    perusahaan: "Nama Perusahaan",
                    posisi: "Posisi Jabatan",
                    periode: "Bulan Tahun – Bulan Tahun",
                    deskripsi: ["Tanggung jawab atau pencapaian utama"],
                  };
                  setCv({ ...cv, pengalaman: [...cv.pengalaman, newExp] });
                }}
                className="rounded-xl text-xs font-semibold gap-1 h-8 cursor-pointer"
              >
                <Plus className="size-3.5" />
                Tambah Pengalaman
              </Button>
            </div>

            <div className="space-y-4">
              {cv.pengalaman.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Pengalaman #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCv({
                          ...cv,
                          pengalaman: cv.pengalaman.filter((p) => p.id !== item.id),
                        });
                      }}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg size-7 p-0 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] text-slate-500">Perusahaan / Instansi</Label>
                      <Input
                        value={item.perusahaan}
                        onChange={(e) => {
                          const updated = [...cv.pengalaman];
                          updated[index]!.perusahaan = e.target.value;
                          setCv({ ...cv, pengalaman: updated });
                        }}
                        className="rounded-xl text-xs h-8 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500">Posisi / Jabatan</Label>
                      <Input
                        value={item.posisi}
                        onChange={(e) => {
                          const updated = [...cv.pengalaman];
                          updated[index]!.posisi = e.target.value;
                          setCv({ ...cv, pengalaman: updated });
                        }}
                        className="rounded-xl text-xs h-8 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500">Periode</Label>
                      <Input
                        value={item.periode}
                        onChange={(e) => {
                          const updated = [...cv.pengalaman];
                          updated[index]!.periode = e.target.value;
                          setCv({ ...cv, pengalaman: updated });
                        }}
                        className="rounded-xl text-xs h-8 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] text-slate-500">
                      Uraian Tugas (Satu poin per baris)
                    </Label>
                    <Textarea
                      value={item.deskripsi.join("\n")}
                      onChange={(e) => {
                        const updated = [...cv.pengalaman];
                        updated[index]!.deskripsi = e.target.value
                          .split("\n")
                          .filter((l) => l.trim() !== "");
                        setCv({ ...cv, pengalaman: updated });
                      }}
                      rows={3}
                      className="rounded-xl text-xs mt-1 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Pendidikan */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                4. Riwayat Pendidikan ({cv.pendidikan.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newEdu: RiwayatPendidikan = {
                    id: `edu-${Date.now()}`,
                    institusi: "Nama Sekolah / Universitas",
                    jurusan: "Nama Jurusan / Program Studi",
                    periode: "Tahun – Tahun",
                  };
                  setCv({ ...cv, pendidikan: [...cv.pendidikan, newEdu] });
                }}
                className="rounded-xl text-xs font-semibold gap-1 h-8 cursor-pointer"
              >
                <Plus className="size-3.5" />
                Tambah Pendidikan
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cv.pendidikan.map((edu, index) => (
                <div
                  key={edu.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCv({
                        ...cv,
                        pendidikan: cv.pendidikan.filter((e) => e.id !== edu.id),
                      });
                    }}
                    className="absolute right-2 top-2 text-rose-500 hover:text-rose-600 rounded-lg size-7 p-0 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>

                  <div>
                    <Label className="text-[11px] text-slate-500">Institusi</Label>
                    <Input
                      value={edu.institusi}
                      onChange={(e) => {
                        const updated = [...cv.pendidikan];
                        updated[index]!.institusi = e.target.value;
                        setCv({ ...cv, pendidikan: updated });
                      }}
                      className="rounded-xl text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">Jurusan / Program Studi</Label>
                    <Input
                      value={edu.jurusan}
                      onChange={(e) => {
                        const updated = [...cv.pendidikan];
                        updated[index]!.jurusan = e.target.value;
                        setCv({ ...cv, pendidikan: updated });
                      }}
                      className="rounded-xl text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">Tahun / Periode</Label>
                    <Input
                      value={edu.periode}
                      onChange={(e) => {
                        const updated = [...cv.pendidikan];
                        updated[index]!.periode = e.target.value;
                        setCv({ ...cv, pendidikan: updated });
                      }}
                      className="rounded-xl text-xs h-8 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Keahlian */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              5. Keahlian & Keterampilan
            </h4>
            <div className="flex flex-wrap gap-2">
              {cv.keahlian.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCv({
                        ...cv,
                        keahlian: cv.keahlian.filter((_, i) => i !== index),
                      });
                    }}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <Input
                id="inputKeahlianBaru"
                placeholder="Tambah keahlian baru..."
                className="rounded-xl text-xs h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !cv.keahlian.includes(val)) {
                      setCv({ ...cv, keahlian: [...cv.keahlian, val] });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById("inputKeahlianBaru") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const val = input.value.trim();
                    if (!cv.keahlian.includes(val)) {
                      setCv({ ...cv, keahlian: [...cv.keahlian, val] });
                      input.value = "";
                    }
                  }
                }}
                className="rounded-xl text-xs h-8 cursor-pointer shrink-0"
              >
                Tambah
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER STATUS SINKRONISASI REALTIME DASBOR (Disembunyikan saat cetak) */}
      <div className="print:hidden max-w-4xl mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Resume Terhubung Realtime ke Dasbor Akun
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {storageType === "cloud" ? "Database Cloud" : "Penyimpanan Lokal"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Akun:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {user?.email || "Tamu"}
              </span>
              {profile?.job_title && (
                <>
                  {" • "}
                  Jabatan:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {profile.job_title}
                  </span>
                </>
              )}
              {completedWorkLogs.length > 0 && (
                <>
                  {" • "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {completedWorkLogs.length} Catatan Selesai Tersinkron
                  </span>
                </>
              )}
              {" • "}
              Pembaruan: {lastSyncedAt.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Otomatis Sinkron Dasbor
            </span>
            <Switch
              checked={realtimeSyncWithDashboard}
              onCheckedChange={(val) => {
                setRealtimeSyncWithDashboard(val);
                if (val) syncWithDashboardProfile();
              }}
            />
          </div>

          {completedWorkLogs.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={importDashboardWorkToExperience}
              className="rounded-xl border-slate-200 dark:border-slate-700 text-xs h-8 px-3 gap-1.5 cursor-pointer shadow-xs"
            >
              <Layers className="size-3.5 text-indigo-500" />
              <span>Impor Catatan Dasbor ke CV</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              checkAndLoadCV(true);
              loadCompletedWorkLogs();
            }}
            disabled={isCheckingCloud}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-xs h-8 px-3 gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw
              className={`size-3.5 text-slate-500 ${isCheckingCloud ? "animate-spin" : ""}`}
            />
            <span>Sinkronkan Sekarang</span>
          </Button>
        </div>
      </div>

      {/* MODE PRATINJAU DESAIN CV (ATS-FRIENDLY & MODERN) */}
      <div
        id="printable-cv"
        className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
      >
        {/* CV Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {cv.foto_url && (
              <img
                src={cv.foto_url}
                alt={cv.nama_lengkap}
                className="size-20 sm:size-24 rounded-2xl object-cover border-2 border-slate-200 shrink-0"
                style={{ objectPosition: cv.foto_position || "center center" }}
              />
            )}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
                {cv.nama_lengkap}
              </h1>
            {cv.headline && (
              <p className="text-sm sm:text-base font-semibold text-slate-600 uppercase tracking-wide">
                {cv.headline}
              </p>
            )}
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 sm:text-right font-medium">
            {cv.alamat && (
              <div className="flex items-center sm:justify-end gap-2">
                <span>{cv.alamat}</span>
                <MapPin className="size-3.5 text-slate-400 shrink-0 print:hidden" />
              </div>
            )}
            {cv.telepon && (
              <div className="flex items-center sm:justify-end gap-2">
                <span>{cv.telepon}</span>
                <Phone className="size-3.5 text-slate-400 shrink-0 print:hidden" />
              </div>
            )}
            {cv.email && (
              <div className="flex items-center sm:justify-end gap-2">
                <a
                  href={`mailto:${cv.email}`}
                  className="hover:underline text-indigo-600 print:text-slate-900"
                >
                  {cv.email}
                </a>
                <Mail className="size-3.5 text-slate-400 shrink-0 print:hidden" />
              </div>
            )}
          </div>
        </div>

        {/* Section: Tentang Saya */}
        {cv.tentang_saya && (
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-2">
              <span>TENTANG SAYA</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              {cv.tentang_saya}
            </p>
          </div>
        )}

        {/* Section: Pengalaman Kerja */}
        {cv.pengalaman.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-2">
              <span>PENGALAMAN KERJA</span>
            </h2>

            <div className="space-y-5">
              {cv.pengalaman.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">{exp.perusahaan}</h3>
                    <span className="text-xs font-semibold text-slate-500 sm:text-right">
                      {exp.periode}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {exp.posisi}
                  </p>
                  <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                    {exp.deskripsi.map((point, pIdx) => (
                      <li key={pIdx}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Pendidikan */}
        {cv.pendidikan.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-2">
              <span>PENDIDIKAN</span>
            </h2>

            <div className="space-y-3">
              {cv.pendidikan.map((edu) => (
                <div
                  key={edu.id}
                  className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{edu.institusi}</h3>
                    <p className="text-xs text-slate-700 font-medium">{edu.jurusan}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 sm:text-right">
                    {edu.periode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Keahlian */}
        {cv.keahlian.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-2">
              <span>KEAHLIAN</span>
            </h2>

            <div className="flex flex-wrap gap-2 pt-1">
              {cv.keahlian.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="px-3 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 print:border-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Catatan & Capaian Pekerjaan Terverifikasi dari Dasbor Akun */}
        {completedWorkLogs.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>AKTIVITAS & PEKERJAAN TERVERIFIKASI (SINKRONISASI DASBOR NOURA)</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 print:text-slate-600 tracking-normal normal-case font-mono">
                {completedWorkLogs.length} Catatan Selesai
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {completedWorkLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200 print:border-slate-300 bg-slate-50/50 print:bg-transparent space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800 line-clamp-1">{log.judul}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono ml-2">
                      {log.tanggal}
                    </span>
                  </div>
                  {log.deskripsi && (
                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {log.deskripsi}
                    </p>
                  )}
                  <div className="pt-1 flex items-center gap-1.5">
                    {log.kategori && (
                      <span className="text-[9px] uppercase tracking-wide font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-200/80 print:border print:border-slate-300">
                        {log.kategori}
                      </span>
                    )}
                    <span className="text-[9px] text-emerald-600 font-semibold print:text-slate-700">
                      ✓ Terverifikasi Selesai di Dasbor
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DIALOG 1: KONVERSI & PARSING CV */}
      <Dialog open={parseDialogOpen} onOpenChange={setParseDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              <span>Konversi & Parsing CV Cerdas</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Muat data otomatis dari akun dasbor aktif, dokumen lampiran, atau tempel teks CV Anda
              untuk diekstraksi ke formulir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick preset 0: Akun Dasbor Aktif */}
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Activity className="size-4" />
                  Preset Akun Dasbor Aktif
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  Realtime Sinkron
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Otomatis menghasilkan resume berdasarkan data profil akun (
                {profile?.full_name || user?.email}), posisi (
                {profile?.job_title || "Profesional Spesialis"}), dan integrasi dasbor Noura.
              </p>
              <Button
                type="button"
                onClick={() => applyParsedCV(createDefaultCVForUser(user?.email, profile ?? undefined))}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 gap-1.5 cursor-pointer mt-1"
              >
                <Check className="size-3.5" />
                Terapkan Data Profil Akun Dasbor ({user?.email})
              </Button>
            </div>

            {/* Quick preset 1: Satria Nur Ardiansyah (PDF Lampiran) */}
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <FileCheck className="size-4" />
                  Preset CV Satria Nur Ardiansyah
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                  Sesuai Lampiran PDF
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Memuat data lengkap: PT Swabina Gatra (Technical Data Supporting), Hotel Mustika
                Tuban, SMK N 1 Tuban, Universitas Terbuka, dan keahlian Office/Analysis.
              </p>
              <Button
                type="button"
                onClick={() => applyParsedCV(DEFAULT_CV_SATRIA)}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 gap-1.5 cursor-pointer mt-1"
              >
                <Check className="size-3.5" />
                Terapkan Data CV Satria Nur Ardiansyah
              </Button>
            </div>

            {/* Input teks mentah untuk parsing kustom */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="rawText"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Atau Tempel Teks CV / Resume Lainnya:
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRawTextToParse(`SATRIA NUR ARDIANSYAH
Alamat : Jl.Teuku Umar,Latsari 2 No.57 Tuban 
Telepon : 081216130661
Email : satria62317@gmail.com
TENTANG SAYA
Lulusan SMK Teknik Instalasi Tenaga Listrik dari SMK Negeri 1 Tuban. Saat ini sedang menjalani Pendidikan S1-Manajemen di Universitas Terbuka...
PENGALAMAN KERJA
PT SWABINA GATRA
TECHNICAL DATA SUPPORTING (02 Juni 2022– 02 April 2025)
● Membuat standard spesifikasi Produk/Barang
● Mengumpulkan & mengolah data mentah menjadi data final sesuai dengan standard yang telah dibuat perusahaan
● Membuat arsip dari data-data yang telah di olah di spreadsheet mauapun aplikasi perusahaan
HOTEL MUSTIKA TUBAN
ELECTRICAL ENGGINERING (01 April 2019 – 30 Juni 2019)
● Pemeliharaan instalasi listrik hotel
● Melakukan penggantian lampu dan pembersihan air conditioner
PENDIDIKAN
SMK Negeri 1 Tuban (2017-2020)
Teknik Instalasi Tenaga Listrik
Universitas Terbuka (2023-ON GOING)
S1 Manajemen
KEAHLIAN
Microsoft Office, Cataloger, Data Analysis`)
                  }
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 h-6 px-2 cursor-pointer"
                >
                  Tempel Contoh OCR
                </Button>
              </div>

              <Textarea
                id="rawText"
                value={rawTextToParse}
                onChange={(e) => setRawTextToParse(e.target.value)}
                placeholder="Tempel teks CV mentah di sini untuk diparsing otomatis..."
                rows={5}
                className="rounded-xl text-xs font-mono"
              />

              <Button
                type="button"
                onClick={handleParseText}
                variant="outline"
                className="w-full rounded-xl text-xs font-semibold h-8 gap-1.5 cursor-pointer border-slate-200 dark:border-slate-800"
              >
                <RefreshCw className="size-3.5 text-indigo-500" />
                Parsing Teks Otomatis
              </Button>
            </div>

            {/* Pratinjau Parsed Result */}
            {parsedPreview && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-500" />
                  Pratinjau Hasil Parsing:
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    <strong>Nama:</strong> {parsedPreview.nama_lengkap}
                  </p>
                  <p>
                    <strong>Email / Telepon:</strong> {parsedPreview.email || "-"} /{" "}
                    {parsedPreview.telepon || "-"}
                  </p>
                  <p>
                    <strong>Tentang:</strong> {parsedPreview.tentang_saya?.slice(0, 90)}...
                  </p>
                  <p>
                    <strong>Keahlian:</strong> {parsedPreview.keahlian.join(", ")}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => applyParsedCV(parsedPreview)}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 gap-1.5 cursor-pointer mt-2"
                >
                  <Check className="size-3.5" />
                  Terapkan Hasil Parsing ke CV
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setParseDialogOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: SKRIP SQL SUPABASE */}
      <Dialog open={sqlDialogOpen} onOpenChange={setSqlDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Database className="size-5 text-indigo-500" />
              <span>Skrip SQL Tabel `curriculum_vitae` Supabase</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Salin kode SQL berikut dan jalankan di menu <strong>SQL Editor</strong> pada Supabase
              Dashboard Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed select-all">
              {SQL_SCHEMA_SNIPPET}
            </pre>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSqlDialogOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleCopySql}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer"
            >
              {copiedSql ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copiedSql ? "Tersalin!" : "Salin Kode SQL"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
