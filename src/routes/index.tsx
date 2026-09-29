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
import hero3dVectorTransparent from "@/assets/images/workspace_hero_vector_transparent.png";
import satriaRedAvatar from "@/assets/images/satria_avatar_red_1790582692896.jpg";

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
          linkedin: cv.linkedin || baseCV.linkedin,
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
          spesialisasi_kompetensi:
            Array.isArray(cv.spesialisasi_kompetensi) && cv.spesialisasi_kompetensi.length > 0
              ? cv.spesialisasi_kompetensi
              : baseCV.spesialisasi_kompetensi,
          foto_url: cv.foto_url || baseCV.foto_url || satriaRedAvatar,
          foto_position: cv.foto_position || baseCV.foto_position || "center center",
          judul_tentang_saya: cv.judul_tentang_saya || baseCV.judul_tentang_saya,
          judul_pendidikan: cv.judul_pendidikan || baseCV.judul_pendidikan,
          judul_pengalaman: cv.judul_pengalaman || baseCV.judul_pengalaman,
          judul_keahlian: cv.judul_keahlian || baseCV.judul_keahlian,
          judul_kompetensi: cv.judul_kompetensi || baseCV.judul_kompetensi,
        });
      } else {
        setCvData({
          ...baseCV,
          foto_url: baseCV.foto_url || satriaRedAvatar,
        });
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

      {/* 2. HERO SECTION (SESUAI LAMPIRAN 2) */}
      {landingConfig.showHeroSection && (
        <section className="relative overflow-hidden pt-8 pb-12 md:pt-12 md:pb-16 border-b border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* KOLOM KIRI: Identitas, Tombol Aksi & Rincian Pekerjaan */}
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-start">
                {/* Judul Utama (Tanpa Logo Noura) */}
                <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-[#0f172a] dark:text-white mb-6 leading-tight">
                  {landingConfig.heroTitle || "Workspace & Portofolio"}
                </h1>

                {/* Baris Profil & Tombol Aksi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6">
                  {/* Foto & Detail Profil (Tanpa Simbol Hijau Keduanya) */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={
                          landingConfig.heroAvatarUrl ||
                          profile?.avatar_url ||
                          cvData.foto_url ||
                          satriaRedAvatar
                        }
                        alt={landingConfig.heroName || "Satria Nur Ardiansyah"}
                        className="size-20 sm:size-24 rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                          {landingConfig.heroName || "SATRIA NUR ARDIANSYAH"}
                        </h2>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal">
                        Jabatan saat ini :
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {landingConfig.heroCurrentJobTitle || "Cataloger Elins"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {landingConfig.heroCurrentCompany || "PT Sonar Persada Manunggal"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {landingConfig.heroCurrentProject || "Project | PT Semen Indonesia Group"}
                      </p>
                    </div>
                  </div>

                  {/* 3 Tombol Aksi Sesuai Lampiran 2 */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                    <Button
                      asChild
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-6 gap-1.5 shadow-sm shadow-blue-600/20 cursor-pointer justify-center"
                    >
                      <Link to={user ? "/dasbor" : "/masuk"}>
                        <span>Jelajahi Workspace</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold h-9 px-6 gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs justify-center"
                    >
                      <a href="#cv">
                        <User className="size-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Lihat Portofolio CV</span>
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold h-9 px-6 gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs justify-center"
                    >
                      <Link to="/cv">
                        <Printer className="size-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Format Cetak PDF</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Garis Pembatas Aksen */}
                <div className="w-12 h-0.5 bg-blue-600 rounded-full mb-4" />

                {/* Seksi Job Saat Ini */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    {landingConfig.heroJobSectionTitle || "Job saat ini :"}
                  </h3>

                  <ul className="space-y-3">
                    {(landingConfig.heroJobResponsibilities &&
                    landingConfig.heroJobResponsibilities.length > 0
                      ? landingConfig.heroJobResponsibilities
                      : DEFAULT_LANDING_CONFIG.heroJobResponsibilities
                    ).map((job, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                        <span className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                          {job}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* KOLOM KANAN: Hanya Vektor 3D Saja (Tanpa Background Apapun, Menyatu Alami di Sheet, Posisi Tengah) */}
              <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center self-center my-auto w-full py-4 lg:py-0">
                <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none flex items-center justify-center">
                  <img
                    src={hero3dVectorTransparent}
                    alt="Workspace 3D Vector"
                    className="w-full max-w-[460px] lg:max-w-[500px] h-auto object-contain select-none pointer-events-none transition-transform duration-300 hover:scale-[1.02] filter drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. CURRICULUM VITAE & PORTOFOLIO SECTION (SESUAI LAMPIRAN 2 & 3) */}
      {landingConfig.showCVSection && (
        <section
          id="cv"
          className="py-14 md:py-20 bg-white dark:bg-slate-900/60 border-y border-slate-200/70 dark:border-slate-800/80"
        >
          <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
            {/* Header Section CV Sesuai Lampiran 2 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  CURRICULUM VITAE
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                  {cvData.nama_lengkap || "SATRIA NUR ARDIANSYAH"}
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

            {/* Grid CV (Geser ke Kiri) & Pekerjaan Tahun Ini (Dilebarkan) Sesuai Lampiran 3 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Profile Master Card (Kolom Kiri 7 Col - Geser ke Kiri) */}
              <div className="min-w-0 lg:col-span-7 xl:col-span-7 bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                {/* Top Identity Row Sesuai Lampiran 1 */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="space-y-3.5 w-full">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                      {cvData.nama_lengkap || "SATRIA NUR ARDIANSYAH"}
                    </h3>

                    {/* Foto diposisikan tepat di tengah vertikal antara baris alamat dan email (Lampiran 1) */}
                    <div className="flex items-center gap-4 sm:gap-5">
                      {cvData.foto_url ? (
                        <img
                          src={cvData.foto_url}
                          alt={cvData.nama_lengkap || "Profile"}
                          className="size-20 sm:size-24 rounded-2xl object-cover shadow-sm shrink-0 border-2 border-slate-200/80 dark:border-slate-700/80 self-center"
                          style={{ objectPosition: cvData.foto_position || "center center" }}
                        />
                      ) : (
                        <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-sm tracking-wider shrink-0 self-center">
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

                      {/* Contact Pills Disusun Vertikal Sesuai Lampiran 1 */}
                      {landingConfig.showCVContactInfo && (
                        <div className="flex flex-col items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          {cvData.alamat && (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                              <MapPin className="size-3.5 text-indigo-500 shrink-0" />
                              <span>{cvData.alamat}</span>
                            </div>
                          )}
                          {cvData.email && (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                              <Mail className="size-3.5 text-indigo-500 shrink-0" />
                              <span>{cvData.email}</span>
                            </div>
                          )}
                          {cvData.telepon && (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                              <Phone className="size-3.5 text-indigo-500 shrink-0" />
                              <span>{cvData.telepon}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ringkasan Profil / Tentang Saya */}
                {landingConfig.showCVAbout && (
                  <div className="py-6 border-b border-slate-200/80 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {cvData.judul_tentang_saya || "Tentang Saya"}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {cvData.tentang_saya}
                    </p>
                  </div>
                )}

                {/* Urutan Bagian CV: 1. Pendidikan, 2. Pengalaman, 3. Keahlian, 4. Spesialisasi (Full Width Card Lebih Luas) */}
                <div className="pt-6 space-y-8">
                  {/* 1. Riwayat Pendidikan (Diletakkan Pertama Sesuai Permintaan) */}
                  {landingConfig.showCVEducation && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <GraduationCap className="size-4 text-indigo-500" />
                        <span>{cvData.judul_pendidikan || "1. Riwayat Pendidikan"}</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cvData.pendidikan.map((edu) => (
                          <div
                            key={edu.id}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1 shadow-2xs"
                          >
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block font-mono">
                              {edu.periode}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                              {edu.institusi}
                            </h5>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {edu.jurusan}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Pengalaman Kerja (Full Width, Card Luas) */}
                  {landingConfig.showCVExperience && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Briefcase className="size-4 text-indigo-500" />
                        <span>{cvData.judul_pengalaman || "2. Pengalaman Kerja"}</span>
                      </h4>

                      <div className="space-y-4">
                        {cvData.pengalaman.map((exp) => (
                          <div
                            key={exp.id}
                            className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {exp.posisi}
                              </h5>
                              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 w-fit">
                                {exp.periode}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2.5">
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

                  {/* 3. Keahlian Utama (Diposisikan di Bawah Pengalaman Kerja, Luas) */}
                  {landingConfig.showCVSkills && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <h4
                        id="keahlian"
                        className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4"
                      >
                        {cvData.judul_keahlian || landingConfig.skillsHeader || "3. Keahlian Utama"}
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        {(landingConfig.skillsBadges.length > 0
                          ? landingConfig.skillsBadges
                          : cvData.keahlian
                        ).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Spesialisasi Kompetensi (Diposisikan di Bawah Keahlian Utama, Luas) */}
                  {landingConfig.showSkillsSection && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-4 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {cvData.judul_kompetensi ||
                          landingConfig.specializationHeader ||
                          "4. Spesialisasi Kompetensi"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                        {(cvData.spesialisasi_kompetensi && cvData.spesialisasi_kompetensi.length > 0
                          ? cvData.spesialisasi_kompetensi
                          : landingConfig.specializationItems
                        ).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                          >
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {landingConfig.showYearWorkCards && (
                <aside className="min-w-0 lg:col-span-5 xl:col-span-5 rounded-3xl border border-slate-200/80 bg-slate-50 p-6 sm:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
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
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-800/80"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                              {item.category}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                item.status === "selesai"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : item.status === "berjalan"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {item.status === "selesai"
                                ? "Selesai"
                                : item.status === "berjalan"
                                  ? "Berjalan"
                                  : "Direncanakan"}
                            </span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {item.description}
                            </p>
                          )}
                          {item.date && (
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                              <CalendarDays className="size-3.5" />
                              <time dateTime={item.date}>
                                {new Intl.DateTimeFormat("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }).format(new Date(`${item.date}T00:00:00`))}
                              </time>
                            </div>
                          )}
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
                        <Clock3 className="mx-auto size-5 text-slate-400" />
                        <p className="mt-2 text-xs text-slate-500">
                          Belum ada pekerjaan yang ditampilkan.
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. SEKSI HUBUNGI SAYA / MARI TERHUBUNG */}
      {landingConfig.showContactSection !== false && (
        <section
          id="kontak"
          className="py-14 md:py-20 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800/80"
        >
          <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
            {/* Header Seksi */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
                {landingConfig.contactBadge || "HUBUNGI SAYA"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {landingConfig.contactTitle || "Mari Terhubung"}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {landingConfig.contactSubtitle ||
                  "Saya terbuka untuk berbagai peluang kolaborasi, diskusi, atau pertanyaan terkait pekerjaan dan proyek. Jangan ragu untuk menghubungi saya melalui email, WhatsApp, atau LinkedIn."}
              </p>
            </div>

            {/* Master Card Kontak Sesuai Lampiran */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Kolom Kiri: Profil Singkat (Tanpa Centang Hijau & Tanpa Titik Hijau) */}
                <div className="lg:col-span-4 xl:col-span-4 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={
                        landingConfig.heroAvatarUrl ||
                        profile?.avatar_url ||
                        cvData.foto_url ||
                        satriaRedAvatar
                      }
                      alt={landingConfig.heroName || "Satria Nur Ardiansyah"}
                      className="size-16 sm:size-20 rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                      {landingConfig.heroName || "SATRIA NUR ARDIANSYAH"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                      Jabatan saat ini :
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {landingConfig.heroCurrentJobTitle || "Cataloger Elins"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {landingConfig.heroCurrentCompany || "PT Sonar Persada Manunggal"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {landingConfig.heroCurrentProject || "Project | PT Semen Indonesia Group"}
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: 3 Kartu Kontak Sejajar Sesuai Lampiran */}
                <div className="lg:col-span-8 xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* 1. Email */}
                  <a
                    href={`mailto:${landingConfig.contactEmail || "satria62317@gmail.com"}`}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 sm:p-5 hover:border-blue-400 hover:shadow-xs dark:hover:border-blue-500 transition-all group block"
                  >
                    <div className="size-10 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                      <Mail className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Email</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {landingConfig.contactEmail || "satria62317@gmail.com"}
                    </p>
                  </a>

                  {/* 2. WhatsApp */}
                  <a
                    href={`https://wa.me/${(landingConfig.contactWhatsApp || "081216130661").replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 sm:p-5 hover:border-emerald-400 hover:shadow-xs dark:hover:border-emerald-500 transition-all group block"
                  >
                    <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                      <svg className="size-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {landingConfig.contactWhatsApp || "081216130661"}
                    </p>
                  </a>

                  {/* 3. LinkedIn */}
                  <a
                    href={`https://${(landingConfig.contactLinkedIn || "linkedin.com/in/satria-nur16").replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 sm:p-5 hover:border-sky-400 hover:shadow-xs dark:hover:border-sky-500 transition-all group block"
                  >
                    <div className="size-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                      <svg className="size-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">LinkedIn</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {landingConfig.contactLinkedIn || "linkedin.com/in/satria-nur16"}
                    </p>
                  </a>
                </div>
              </div>

              {/* Jam Operasional */}
              <div className="flex items-center gap-3 pt-5 mt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 text-xs">
                    Jam Operasional
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {landingConfig.contactOperatingHours ||
                      "Senin – Jumat 08.00 – 17.00 WIB (Waktu Indonesia Barat)"}
                  </p>
                </div>
              </div>
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
