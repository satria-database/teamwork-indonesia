import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  RotateCcw,
  Save,
  Check,
  Sparkles,
  UserCheck,
  Cpu,
  ExternalLink,
  CheckCircle2,
  FileBadge,
  Plus,
  Trash2,
  X,
  BriefcaseBusiness,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getLandingConfig,
  saveLandingConfig,
  syncLandingConfigFromCloud,
  DEFAULT_LANDING_CONFIG,
  ALL_LANDING_SECTIONS,
  type LandingPageConfig,
  type LandingSectionId,
} from "@/lib/landingConfig";
import { useAuth } from "@/hooks/useAuth";
import { LandingPreview } from "@/components/LandingPreview";
import { DEFAULT_CV_SATRIA } from "@/lib/cvData";

export const Route = createFileRoute("/_authenticated/tata-letak")({
  component: TataLetakLandingPage,
});

const SECTION_ICONS: Partial<Record<LandingSectionId, typeof Sparkles>> = {
  hero: Sparkles,
  cv: UserCheck,
  skills: Cpu,
};

function TataLetakLandingPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [activeTab, setActiveTab] = useState<"susunan" | "cv" | "pekerjaan" | "pratinjau">("susunan");
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Load existing config on mount and sync with cloud
  useEffect(() => {
    const local = getLandingConfig();
    setConfig(local);

    // Sync cloud metadata if available
    syncLandingConfigFromCloud().then((synced) => {
      setConfig(synced);
    });
  }, []);

  // Move a section up in order
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...config.sectionOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  // Move a section down in order
  const handleMoveDown = (index: number) => {
    if (index >= config.sectionOrder.length - 1) return;
    const newOrder = [...config.sectionOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  // Toggle visibility of a specific section
  const handleToggleSection = (sectionId: LandingSectionId, enabled: boolean) => {
    setConfig((prev) => {
      switch (sectionId) {
        case "hero":
          return { ...prev, showHeroSection: enabled };
        case "cv":
          return { ...prev, showCVSection: enabled };
        case "skills":
          return { ...prev, showSkillsSection: enabled };
        default:
          return prev;
      }
    });
  };

  // Check whether a section is currently enabled
  const isSectionEnabled = (sectionId: LandingSectionId): boolean => {
    switch (sectionId) {
      case "hero":
        return config.showHeroSection;
      case "cv":
        return config.showCVSection;
      case "skills":
        return config.showSkillsSection;
      default:
        return true;
    }
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveLandingConfig(config);
      toast.success("Susunan dan pengaturan landing page berhasil disimpan & diterapkan!", {
        description: "Halaman landing kini menampilkan susunan terbaru Anda.",
      });
    } catch {
      toast.error("Gagal menyimpan ke cloud, disimpan di lokal peramban.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (
      confirm(
        "Kembalikan tata letak ke susunan bawaan Noura Workspace? Perubahan Anda akan diatur ulang.",
      )
    ) {
      setConfig(DEFAULT_LANDING_CONFIG);
      saveLandingConfig(DEFAULT_LANDING_CONFIG);
      toast.info("Tata letak dikembalikan ke susunan bawaan.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        judul="Tata Letak & Susunan Landing Page"
        deskripsi="Atur urutan bagian, kendalikan visibilitas modul, sesuaikan teks, dan buat tampilan landing page sesuai alur yang Anda inginkan."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
              title="Reset ke susunan awal"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset Default</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 cursor-pointer border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Link to="/" target="_blank">
                <ExternalLink className="size-3.5" />
                <span>Lihat Landing Page</span>
              </Link>
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              {isSaving ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("susunan"))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "susunan"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Susunan & Urutan Bagian</span>
        </button>

        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("cv"))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "cv"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileBadge className="size-3.5" />
          <span>Teks Hero & Format CV</span>
        </button>

        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("pekerjaan"))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "pekerjaan"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BriefcaseBusiness className="size-3.5" />
          <span>Pekerjaan Tahun Ini</span>
        </button>

        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("pratinjau"))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "pratinjau"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Eye className="size-3.5" />
          <span>Pratinjau Hasil</span>
        </button>
      </div>

      {/* TAB 1: SUSUNAN BAGIAN */}
      {activeTab === "susunan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Reorder Section Cards */}
          <div className="lg:col-span-2 space-y-3">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
              <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950 dark:text-indigo-200">
                <p className="font-bold">Cara Mengatur Susunan:</p>
                <p className="mt-0.5 text-indigo-800 dark:text-indigo-300">
                  Gunakan tombol panah <strong>Naik (▲)</strong> dan <strong>Turun (▼)</strong>{" "}
                  untuk memindahkan posisi bagian. Sakelar di sebelah kanan mengatur apakah bagian
                  tersebut ditampilkan atau disembunyikan di landing page.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {config.sectionOrder.map((sectionId, index) => {
                const meta = ALL_LANDING_SECTIONS.find((s) => s.id === sectionId);
                const Icon = SECTION_ICONS[sectionId] || Sparkles;
                const enabled = isSectionEnabled(sectionId);
                const isFirst = index === 0;
                const isLast = index === config.sectionOrder.length - 1;

                return (
                  <div
                    key={sectionId}
                    className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      enabled
                        ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs"
                        : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Position Badge */}
                      <span className="shrink-0 size-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center font-mono">
                        #{index + 1}
                      </span>

                      {/* Icon */}
                      <div
                        className={`shrink-0 p-2 rounded-xl ${
                          enabled
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {meta?.label || sectionId}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              enabled
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            }`}
                          >
                            {enabled ? "Aktif Tampil" : "Disembunyikan"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {meta?.desc}
                        </p>
                      </div>
                    </div>

                    {/* Controls: Move Up/Down + Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={isFirst}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Pindahkan ke atas"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={isLast}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Pindahkan ke bawah"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>

                      <Switch
                        checked={enabled}
                        onCheckedChange={(val) => handleToggleSection(sectionId, val)}
                        className="data-[state=checked]:bg-indigo-600 cursor-pointer"
                        title={enabled ? "Klik untuk sembunyikan" : "Klik untuk tampilkan"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Schematic Live Flow Preview */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Alur Visual Halaman
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Atas ke Bawah</span>
              </div>

              {/* Schematic mini blocks */}
              <div className="mt-4 space-y-2">
                {/* Navbar mock */}
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 text-center border border-dashed border-slate-300 dark:border-slate-700">
                  Header / Navbar Noura
                </div>

                {config.sectionOrder.map((sectionId, idx) => {
                  const meta = ALL_LANDING_SECTIONS.find((s) => s.id === sectionId);
                  const enabled = isSectionEnabled(sectionId);
                  const Icon = SECTION_ICONS[sectionId] || Sparkles;

                  if (!enabled) {
                    return (
                      <div
                        key={sectionId}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-[10px] font-medium text-slate-400 text-center border border-slate-200/40 dark:border-slate-800/40 line-through opacity-50"
                      >
                        {meta?.label} (Tersembunyi)
                      </div>
                    );
                  }

                  return (
                    <div
                      key={sectionId}
                      className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <Icon className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="truncate">{meta?.label}</span>
                      </div>
                      <Check className="size-3.5 text-emerald-600 shrink-0" />
                    </div>
                  );
                })}

                {/* Footer mock */}
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 text-center border border-dashed border-slate-300 dark:border-slate-700">
                  Footer & Hak Cipta
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 gap-2 cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <Save className="size-4" />
                  <span>Terapkan & Simpan Sekarang</span>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold h-10 gap-2 cursor-pointer"
                >
                  <Link to="/" target="_blank">
                    <ExternalLink className="size-4" />
                    <span>Buka Landing Page di Tab Baru</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEKS HERO & FORMAT CV */}
      {activeTab === "cv" && (
        <div className="space-y-6 max-w-4xl">
          {/* Kustomisasi Teks Hero */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kustomisasi Teks Display Hero
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ubah judul besar, subjudul, dan teks badge pengantar pada bagian paling atas landing
                page.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Judul Utama Display (Headline)
                </Label>
                <Input
                  value={config.heroTitle}
                  onChange={(e) => setConfig((prev) => ({ ...prev, heroTitle: e.target.value }))}
                  placeholder="WorkSpace & Portfolio"
                  className="rounded-xl mt-1 text-sm font-medium"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subjudul / Ringkasan Pembuka
                </Label>
                <Textarea
                  value={config.heroSubtitle}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, heroSubtitle: e.target.value }))
                  }
                  rows={2}
                  placeholder="Catatan pekerjaan, jadwal, dokumen, dan portofolio saya dalam satu tempat."
                  className="rounded-xl mt-1 text-sm font-medium"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teks Badge Pengumuman
                </Label>
                <Input
                  value={config.heroBadgeText}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, heroBadgeText: e.target.value }))
                  }
                  placeholder="Technical Data Support & Portfolio"
                  className="rounded-xl mt-1 text-sm font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Label
                  htmlFor="adminWhatsAppNumber"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <MessageCircle className="size-3.5 text-emerald-600" />
                  Nomor WhatsApp Admin
                </Label>
                <Input
                  id="adminWhatsAppNumber"
                  type="tel"
                  inputMode="tel"
                  value={config.adminWhatsAppNumber}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, adminWhatsAppNumber: e.target.value }))
                  }
                  placeholder="Contoh: 081216130661"
                  className="rounded-xl mt-1 text-sm font-medium"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Ditampilkan sebagai tautan kontak admin pada halaman masuk.
                </p>
              </div>
            </div>
          </div>

          {/* Pengaturan CV */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sumber Data & Elemen Curriculum Vitae
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tentukan profil siapa yang dipajang pada bagian CV dan elemen apa saja yang
                diperlihatkan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setConfig((prev) => ({ ...prev, cvSource: "active_user" }))}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                  config.cvSource === "active_user"
                    ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Akun Pengguna Aktif
                  </span>
                  {config.cvSource === "active_user" && (
                    <Check className="size-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Menggunakan data dari profil akun login saat ini ({user?.email || "User"}).
                </p>
              </div>

              <div
                onClick={() => setConfig((prev) => ({ ...prev, cvSource: "default_satria" }))}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                  config.cvSource === "default_satria"
                    ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Satria Nur Ardiansyah
                  </span>
                  {config.cvSource === "default_satria" && (
                    <Check className="size-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Portofolio lengkap Technical Data Supporting PT Swabina Gatra.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              {[
                {
                  key: "showCVExperience",
                  label: "Riwayat Pengalaman Kerja",
                  desc: "Tampilkan riwayat posisi, perusahaan, dan tanggung jawab kerja",
                },
                {
                  key: "showCVEducation",
                  label: "Riwayat Pendidikan",
                  desc: "Tampilkan riwayat institusi pendidikan dan jurusan",
                },
                {
                  key: "showCVSkills",
                  label: "Daftar Keahlian Utama",
                  desc: "Tampilkan tag kemampuan teknis dan spesialisasi",
                },
                {
                  key: "showCVContactInfo",
                  label: "Kontak & Informasi Penghubung",
                  desc: "Tampilkan tombol salin email dan rincian kontak",
                },
                {
                  key: "showCVAbout",
                  label: "Tentang Saya / Ringkasan Profil",
                  desc: "Tampilkan paragraf ringkasan profil dan latar belakang",
                },
              ].map(({ key, label, desc }) => {
                const checked = config[key as keyof typeof config] as boolean;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(val) => setConfig((prev) => ({ ...prev, [key]: val }))}
                      className="data-[state=checked]:bg-indigo-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kustomisasi Keahlian & Spesialisasi */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kustomisasi Keahlian & Spesialisasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit judul, daftar badge keahlian, dan daftar spesialisasi kompetensi yang tampil di
                landing page.
              </p>
            </div>

            {/* Skills Header */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Bagian Keahlian
              </Label>
              <Input
                value={config.skillsHeader}
                onChange={(e) => setConfig((prev) => ({ ...prev, skillsHeader: e.target.value }))}
                placeholder="Keahlian Utama"
                className="rounded-xl mt-1 text-sm font-medium"
              />
            </div>

            {/* Skills Badges */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Daftar Badge Keahlian
              </Label>
              <div className="space-y-2">
                {config.skillsBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={badge}
                      onChange={(e) => {
                        const next = [...config.skillsBadges];
                        next[idx] = e.target.value;
                        setConfig((prev) => ({ ...prev, skillsBadges: next }));
                      }}
                      className="rounded-xl text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          skillsBadges: prev.skillsBadges.filter((_, i) => i !== idx),
                        }))
                      }
                      className="rounded-xl text-xs h-9 px-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      skillsBadges: [...prev.skillsBadges, ""],
                    }))
                  }
                  className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Badge</span>
                </Button>
              </div>
            </div>

            {/* Specialization Header */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Bagian Spesialisasi
              </Label>
              <Input
                value={config.specializationHeader}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, specializationHeader: e.target.value }))
                }
                placeholder="Spesialisasi Kompetensi"
                className="rounded-xl mt-1 text-sm font-medium"
              />
            </div>

            {/* Specialization Items */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Daftar Item Spesialisasi
              </Label>
              <div className="space-y-2">
                {config.specializationItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Textarea
                      value={item}
                      onChange={(e) => {
                        const next = [...config.specializationItems];
                        next[idx] = e.target.value;
                        setConfig((prev) => ({ ...prev, specializationItems: next }));
                      }}
                      rows={2}
                      className="rounded-xl text-xs flex-1 resize-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          specializationItems: prev.specializationItems.filter((_, i) => i !== idx),
                        }))
                      }
                      className="rounded-xl text-xs h-9 px-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      specializationItems: [...prev.specializationItems, ""],
                    }))
                  }
                  className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Item Spesialisasi</span>
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-11 px-6 gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Save className="size-4" />
            <span>Simpan Teks & Format CV</span>
          </Button>
        </div>
      )}

      {activeTab === "pekerjaan" && (
        <div className="max-w-4xl space-y-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kartu Pekerjaan Tahun Berjalan</h3>
                <p className="mt-0.5 text-xs text-slate-500">Isi kartu ini tampil di sisi kanan CV pada halaman depan.</p>
              </div>
              <Switch
                checked={config.showYearWorkCards}
                onCheckedChange={(value) => setConfig((prev) => ({ ...prev, showYearWorkCards: value }))}
                className="shrink-0 data-[state=checked]:bg-indigo-600"
              />
            </div>

            <div className="mt-4">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Judul Bagian</Label>
              <Input
                value={config.yearWorkTitle}
                onChange={(event) => setConfig((prev) => ({ ...prev, yearWorkTitle: event.target.value }))}
                placeholder="Pekerjaan Tahun Ini"
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="mt-5 space-y-3">
              {config.yearWorkItems.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">Kartu #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfig((prev) => ({ ...prev, yearWorkItems: prev.yearWorkItems.filter((entry) => entry.id !== item.id) }))}
                      className="size-8 shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      title="Hapus kartu"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label className="text-[11px] font-semibold">Judul Pekerjaan</Label>
                      <Input value={item.title} onChange={(event) => setConfig((prev) => ({ ...prev, yearWorkItems: prev.yearWorkItems.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry) }))} className="mt-1 rounded-xl text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold">Tanggal</Label>
                      <Input type="date" value={item.date} onChange={(event) => setConfig((prev) => ({ ...prev, yearWorkItems: prev.yearWorkItems.map((entry) => entry.id === item.id ? { ...entry, date: event.target.value } : entry) }))} className="mt-1 rounded-xl text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold">Kategori</Label>
                      <Input value={item.category} onChange={(event) => setConfig((prev) => ({ ...prev, yearWorkItems: prev.yearWorkItems.map((entry) => entry.id === item.id ? { ...entry, category: event.target.value } : entry) }))} className="mt-1 rounded-xl text-xs" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-[11px] font-semibold">Status</Label>
                      <select value={item.status} onChange={(event) => setConfig((prev) => ({ ...prev, yearWorkItems: prev.yearWorkItems.map((entry) => entry.id === item.id ? { ...entry, status: event.target.value as typeof item.status } : entry) }))} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-xs">
                        <option value="selesai">Selesai</option>
                        <option value="berjalan">Berjalan</option>
                        <option value="direncanakan">Direncanakan</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-[11px] font-semibold">Deskripsi</Label>
                      <Textarea value={item.description} onChange={(event) => setConfig((prev) => ({ ...prev, yearWorkItems: prev.yearWorkItems.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry) }))} rows={2} className="mt-1 resize-none rounded-xl text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfig((prev) => ({ ...prev, yearWorkItems: [...prev.yearWorkItems, { id: `work-${Date.now()}`, title: "Pekerjaan Baru", description: "", date: new Date().toISOString().slice(0, 10), category: "Pekerjaan", status: "berjalan" }] }))}
                className="rounded-xl border-dashed text-xs font-semibold"
              >
                <Plus className="size-3.5" />
                Tambah Kartu
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700">
                <Save className="size-3.5" />
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRATINJU HASIL */}
      {activeTab === "pratinjau" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
            <Eye className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 dark:text-indigo-200">
              <p className="font-bold">Pratinjau Visual Landing Page</p>
              <p className="mt-0.5 text-indigo-800 dark:text-indigo-300">
                Ini adalah gambaran langsung bagaimana landing page akan tampil dengan pengaturan
                saat ini. Perubahan teks hero, urutan bagian, visibilitas modul, dan elemen CV
                langsung tercermin di sini. Klik <strong>Simpan Perubahan</strong> untuk
 menerapkan ke landing page publik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Live Preview */}
            <div className="lg:col-span-3">
              <LandingPreview
                config={config}
                cvData={DEFAULT_CV_SATRIA}
              />
            </div>

            {/* Summary of current settings */}
            <div className="lg:col-span-2 space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ringkasan Pengaturan Aktif
                </h3>

                {/* Hero text summary */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Headline</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {config.heroTitle || "WorkSpace & Portfolio"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Subjudul</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {config.heroSubtitle || "Catatan pekerjaan, jadwal, dokumen, dan portofolio saya dalam satu tempat."}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Badge</span>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      {config.heroBadgeText || "Technical Data Support & Portfolio"}
                    </p>
                  </div>
                </div>

                {/* Sections visibility */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Bagian Aktif</span>
                  {config.sectionOrder.map((id, idx) => {
                    const meta = ALL_LANDING_SECTIONS.find((s) => s.id === id);
                    const enabled = isSectionEnabled(id);
                    const Icon = SECTION_ICONS[id] || Sparkles;
                    return (
                      <div key={id} className="flex items-center gap-2 text-xs">
                        <span className="size-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <Icon className={`size-3.5 ${enabled ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"}`} />
                        <span className={`truncate ${enabled ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-400 line-through"}`}>
                          {meta?.label || id}
                        </span>
                        {enabled ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 ml-auto" />
                        ) : (
                          <span className="text-[10px] text-slate-400 ml-auto">Off</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CV source */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Sumber CV</span>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {config.cvSource === "active_user" ? "Akun Pengguna Aktif" : "Satria Nur Ardiansyah"}
                  </p>
                </div>

              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-11 gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Save className="size-4" />
                <span>Simpan & Terapkan ke Landing Page</span>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full rounded-2xl text-xs font-semibold h-11 gap-2 cursor-pointer"
              >
                <Link to="/" target="_blank">
                  <ExternalLink className="size-4" />
                  <span>Buka Landing Page di Tab Baru</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
