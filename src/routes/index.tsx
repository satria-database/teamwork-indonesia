import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  User,
  FileBadge,
  SlidersHorizontal,
  CalendarDays,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CV_SATRIA, createDefaultCVForUser, type CVData } from "@/lib/cvData";
import { NouraLogo } from "@/components/NouraLogo";
import {
  getLandingConfig,
  saveLandingConfig,
  getSafeLandingConfig,
  syncLandingConfigFromCloud,
  DEFAULT_LANDING_CONFIG,
  type LandingPageConfig,
} from "@/lib/landingConfig";
import { LandingConfigModal } from "@/components/LandingConfigModal";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkSpace & Portfolio — Noura" },
      {
        name: "description",
        content:
          "Catatan pekerjaan, jadwal, dokumen, dan portofolio dalam satu tempat terpadu realtime.",
      },
      { property: "og:title", content: "WorkSpace & Portfolio — Noura" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content:
          "Catatan pekerjaan, jadwal, dokumen, dan portofolio dalam satu tempat terpadu realtime.",
      },
    ],
  }),
  component: LandingPage,
});

export default function LandingPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const activeUserName = profile?.full_name || user?.email;

  // CV data state
  const [cvData, setCvData] = useState<CVData>(DEFAULT_CV_SATRIA);

  // Open config modal if URL contains ?config=true and load configs (local + cloud)
  useEffect(() => {
    // Safely load user's custom landing page config from client storage without SSR mismatch
    const stored = getLandingConfig();
    if (stored) {
      setLandingConfig(stored);
    }

    // Also sync latest config from Supabase Cloud
    syncLandingConfigFromCloud().then((cloudConfig) => {
      setLandingConfig(cloudConfig);
    });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("config") === "true") {
        setConfigModalOpen(true);
      }
    }
  }, []);

  // Listen to configuration updates from anywhere (sidebar /tata-letak, modal, other tabs)
  useEffect(() => {
    const handleConfigEvent = (e: Event) => {
      const customEvent = e as CustomEvent<LandingPageConfig>;
      if (customEvent.detail) {
        setLandingConfig(getSafeLandingConfig(customEvent.detail));
      }
    };
    window.addEventListener("noura_landing_config_updated", handleConfigEvent);
    return () => {
      window.removeEventListener("noura_landing_config_updated", handleConfigEvent);
    };
  }, []);

  // Save updated config handler
  const handleSaveConfig = (newConfig: LandingPageConfig) => {
    const safe = getSafeLandingConfig(newConfig);
    setLandingConfig(safe);
    saveLandingConfig(safe);
  };

  // Fetch CV data from Supabase
  const fetchLatestData = useCallback(async () => {
    try {
      const targetUserId = landingConfig.cvSource === "active_user" && user?.id ? user.id : null;
      let cvQuery = supabase.from("curriculum_vitae").select("*");
      if (targetUserId) {
        cvQuery = cvQuery.eq("user_id", targetUserId);
      }
      const { data: cv } = await cvQuery.limit(1).maybeSingle();

      const baseCV =
        landingConfig.cvSource === "active_user" && user
          ? createDefaultCVForUser(user.email, profile ?? undefined)
          : DEFAULT_CV_SATRIA;

      if (cv) {
        setCvData({
          nama_lengkap: cv.nama_lengkap || baseCV.nama_lengkap,
          headline: cv.headline || baseCV.headline,
          alamat: cv.alamat || baseCV.alamat,
          telepon: cv.telepon || baseCV.telepon,
          email: cv.email || baseCV.email,
          tentang_saya: cv.tentang_saya || baseCV.tentang_saya,
          pengalaman:
            Array.isArray(cv.pengalaman) && cv.pengalaman.length > 0
              ? cv.pengalaman
              : baseCV.pengalaman,
          pendidikan:
            Array.isArray(cv.pendidikan) && cv.pendidikan.length > 0
              ? cv.pendidikan
              : baseCV.pendidikan,
          keahlian:
            Array.isArray(cv.keahlian) && cv.keahlian.length > 0 ? cv.keahlian : baseCV.keahlian,
          foto_url: cv.foto_url || baseCV.foto_url || null,
          foto_position: cv.foto_position || baseCV.foto_position || "center center",
        });
      } else {
        setCvData(baseCV);
      }
    } catch {
      // Fallback to default CV
    }
  }, [landingConfig.cvSource, user, profile]);

  // Initial fetch on mount or when user/config changes
  useEffect(() => {
    fetchLatestData();
  }, [fetchLatestData]);

  // Supabase Real-Time: Live sync CV data to landing page
  useEffect(() => {
    const channel = supabase
      .channel("noura_landing_cv_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "curriculum_vitae" }, () => {
        fetchLatestData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchLatestData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLatestData]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(cvData.email || "satria62317@gmail.com");
    setCopiedEmail(true);
    toast.success("Alamat email berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. NAVBAR / HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/70 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="NOURA">
            <NouraLogo size="md" />
            <span className="hidden sm:inline-flex text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
              Personal Workspace
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {landingConfig.showCVSection && (
              <a
                href="#cv"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Curriculum Vitae
              </a>
            )}
            {landingConfig.showSkillsSection && (
              <a
                href="#keahlian"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Keahlian
              </a>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold h-9 px-3.5 hidden lg:flex cursor-pointer"
            >
              <Link to="/cv">
                <FileBadge className="size-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                <span>Format CV PDF</span>
              </Link>
            </Button>

            {user ? (
              <Button
                size="sm"
                asChild
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                <Link to="/dasbor">
                  <span>Buka Dasbor</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                asChild
                className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
              >
                <Link to="/masuk">
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      {landingConfig.showHeroSection && (
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="mb-6 flex justify-center">
            <NouraLogo size="xl" />
          </div>
          {/* Badge Pengumuman */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-6 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {cvData.nama_lengkap || "Satria Nur Ardiansyah"}
            </span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span>{landingConfig.heroBadgeText || cvData.headline || "Technical Data Support"}</span>
          </div>

          {/* Heading Display Utama */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            {landingConfig.heroTitle || "WorkSpace & Portfolio"}
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-normal">
            {landingConfig.heroSubtitle ||
              "Catatan pekerjaan, jadwal, dokumen, dan portofolio saya dalam satu tempat."}
          </p>

          {/* Tombol Aksi Utama */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 px-6 gap-2 text-sm shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Link to={user ? "/dasbor" : "/masuk"}>
                <span>{user ? "Masuk ke Ruang Kerja Dasbor" : "Jelajahi Workspace"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-semibold h-11 px-5 gap-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
            >
              <a href="#cv">
                <User className="size-4 text-slate-500" />
                <span>Lihat Portofolio CV</span>
              </a>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="lg"
              className="rounded-2xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium h-11 px-4 text-sm cursor-pointer"
            >
              <Link to="/cv">
                <Printer className="size-4 mr-1.5" />
                <span>Format Cetak PDF</span>
              </Link>
            </Button>
          </div>

        </div>
      </section>
      )}

      {/* 4. CURRICULUM VITAE & PORTOFOLIO SECTION */}
      {landingConfig.showCVSection && (
        <section
          id="cv"
          className="py-16 md:py-24 bg-white dark:bg-slate-900/60 border-y border-slate-200/70 dark:border-slate-800/80"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section CV */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
                  <FileBadge className="size-3.5" />
                  <span>CURRICULUM VITAE RESMI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Profil & Portofolio {cvData.nama_lengkap || "Satria Nur Ardiansyah"}
                </h2>

              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEmail}
                  className="rounded-xl text-xs font-semibold h-9 px-3.5 gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {copiedEmail ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copiedEmail ? "Email Tersalin!" : "Salin Email"}</span>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
                >
                  <Link to="/cv">
                    <Printer className="size-3.5" />
                    <span>Buka & Cetak PDF CV</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
            {/* Profile Master Card */}
            <div className="min-w-0 bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              {/* Top Identity Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start sm:items-center gap-4">
                  {cvData.foto_url ? (
                    <img
                      src={cvData.foto_url}
                      alt={cvData.nama_lengkap || "Profile"}
                      className="size-16 sm:size-20 rounded-2xl object-cover shadow-sm shrink-0 border-2 border-slate-200/80 dark:border-slate-700/80"
                      style={{ objectPosition: cvData.foto_position || "center center" }}
                    />
                  ) : (
                    <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-sm tracking-wider shrink-0">
                      {cvData.nama_lengkap
                        ? cvData.nama_lengkap
                            .split(" ")
                            .map((w) => w[0])
                            .filter(Boolean)
                            .slice(0, 3)
                            .join("")
                            .toUpperCase()
                        : "SNA"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {cvData.nama_lengkap}
                      </h3>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-semibold border-none">
                        Siap Bekerja
                      </Badge>

                    </div>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {cvData.headline}
                    </p>
                  </div>
                </div>

                {/* Contact Pills */}
                {landingConfig.showCVContactInfo && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                      <MapPin className="size-3.5 text-indigo-500 shrink-0" />
                      <span>{cvData.alamat}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                      <Phone className="size-3.5 text-indigo-500 shrink-0" />
                      <span>{cvData.telepon}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                      <Mail className="size-3.5 text-indigo-500 shrink-0" />
                      <span>{cvData.email}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ringkasan Profil / Tentang Saya */}
              {landingConfig.showCVAbout && (
              <div className="py-6 border-b border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tentang Saya
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {cvData.tentang_saya}
                </p>
              </div>
              )}

              {/* Dua Kolom Pengalaman, Pendidikan & Keahlian */}
              <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Kolom Kiri: Pengalaman & Pendidikan (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Pengalaman Kerja */}
                  {landingConfig.showCVExperience && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Briefcase className="size-4 text-indigo-500" />
                        <span>Pengalaman Kerja</span>
                      </h4>

                      <div className="space-y-4">
                        {cvData.pengalaman.map((exp) => (
                          <div
                            key={exp.id}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {exp.posisi}
                              </h5>
                              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 w-fit">
                                {exp.periode}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                              {exp.perusahaan}
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                              {exp.deskripsi.map((desc, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-indigo-500 font-bold">•</span>
                                  <span>{desc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Riwayat Pendidikan */}
                  {landingConfig.showCVEducation && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <GraduationCap className="size-4 text-indigo-500" />
                        <span>Riwayat Pendidikan</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {cvData.pendidikan.map((edu) => (
                          <div
                            key={edu.id}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80"
                          >
                            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                              {edu.periode}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {edu.institusi}
                            </h5>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                              {edu.jurusan}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Keahlian & Spesialisasi Teknis (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {landingConfig.showCVSkills && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                      <h4
                        id="keahlian"
                        className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4"
                      >
                        {landingConfig.skillsHeader || "Keahlian Utama"}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(landingConfig.skillsBadges.length > 0
                          ? landingConfig.skillsBadges
                          : cvData.keahlian
                        ).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kompetensi Teknis */}
                  {landingConfig.showSkillsSection && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {landingConfig.specializationHeader || "Spesialisasi Kompetensi"}
                      </h4>
                      <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {landingConfig.specializationItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            {landingConfig.showYearWorkCards && (
              <aside className="min-w-0 rounded-3xl border border-slate-200/80 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      Portofolio {new Date().getFullYear()}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {landingConfig.yearWorkTitle || "Pekerjaan Tahun Ini"}
                    </h3>
                  </div>
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <Briefcase className="size-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {landingConfig.yearWorkItems.length > 0 ? (
                    landingConfig.yearWorkItems.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-800/80">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                            {item.category}
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.status === "selesai"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : item.status === "berjalan"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {item.status === "selesai" ? "Selesai" : item.status === "berjalan" ? "Berjalan" : "Direncanakan"}
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">{item.title}</h4>
                        {item.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
                        )}
                        {item.date && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                            <CalendarDays className="size-3.5" />
                            <time dateTime={item.date}>
                              {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${item.date}T00:00:00`))}
                            </time>
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
                      <Clock3 className="mx-auto size-5 text-slate-400" />
                      <p className="mt-2 text-xs text-slate-500">Belum ada pekerjaan yang ditampilkan.</p>
                    </div>
                  )}
                </div>
              </aside>
            )}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-8 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <NouraLogo size="sm" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {cvData.nama_lengkap || "Satria Nur Ardiansyah"}
            </span>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <Link
              to="/cv"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Curriculum Vitae
            </Link>
            <Link
              to="/dasbor"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Dasbor
            </Link>
            <Link
              to="/catatan"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Catatan
            </Link>
            <Link
              to="/berkas"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Berkas
            </Link>
            <Link
              to="/masuk"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Masuk
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} {cvData.nama_lengkap || "Satria Nur Ardiansyah"}. Hak cipta
            dilindungi.
          </p>
        </div>
      </footer>

      {/* MODAL KONFIGURASI TAMPILAN LANDING PAGE & CATATAN PEKERJAAN */}
      <LandingConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        config={landingConfig}
        onSave={handleSaveConfig}
        availableWorkLogs={[]}
        workLogs={[]}
        {...(user?.email ? { activeUserEmail: user.email } : {})}
        {...(activeUserName ? { activeUserName } : {})}
      />
    </div>
  );
}
