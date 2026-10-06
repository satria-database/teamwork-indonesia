import { supabase } from "./supabase";

export type LandingSectionId = "hero" | "metrics" | "dashboard" | "cv" | "skills";

export const ALL_LANDING_SECTIONS: {
  id: LandingSectionId;
  label: string;
  desc: string;
  defaultEnabled: boolean;
}[] = [
  {
    id: "hero",
    label: "Hero Section",
    desc: "Logo Noura, teks display pembuka, deskripsi, dan tombol aksi utama",
    defaultEnabled: true,
  },
  {
    id: "cv",
    label: "Curriculum Vitae & Portofolio",
    desc: "Profil lengkap, riwayat pekerjaan terverifikasi, pendidikan, dan kontak",
    defaultEnabled: true,
  },
  {
    id: "skills",
    label: "Matriks Keahlian & Spesialisasi",
    desc: "Daftar keahlian teknis, analisis data, dan standardisasi produk",
    defaultEnabled: true,
  },
];

export const DEFAULT_SECTION_ORDER: LandingSectionId[] = ["hero", "cv", "skills"];

export interface LandingPageConfig {
  // 1. Susunan Bagian (Order)
  sectionOrder: LandingSectionId[];

  // 2. Visibilitas Bagian Utama
  showHeroSection: boolean;
  showMetricsBanner: boolean;
  showDashboardSection: boolean;
  showCVSection: boolean;
  showVerifiedAchievementsInCV: boolean;
  showSkillsSection: boolean;

  // 3. Teks & Kustomisasi Hero (Sesuai Lampiran 2)
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  adminWhatsAppNumber: string;
  heroName: string;
  heroIsVerified: boolean;
  heroCurrentJobTitle: string;
  heroCurrentCompany: string;
  heroCurrentProject: string;
  heroJobSectionTitle: string;
  heroJobResponsibilities: string[];
  heroAvatarUrl?: string | null;
  heroAvatarPosition?: string | null;
  heroAvatarScale?: number | null;

  // 4. Konfigurasi Catatan Kerja di Landing Page
  workLogsFilter: "semua" | "selesai" | "berjalan";
  workLogsLimit: number;
  workLogsCategory: string;
  selectedWorkLogIds: string[]; // Pinned or specifically chosen IDs
  defaultDashboardTab: "catatan" | "rencana" | "notulen" | "berkas";
  visibleDashboardTabs: {
    catatan: boolean;
    rencana: boolean;
    notulen: boolean;
    berkas: boolean;
  };

  // 5. Konfigurasi Resume / CV
  cvSource: "active_user" | "default_satria";
  showCVEducation: boolean;
  showCVSkills: boolean;
  showCVExperience: boolean;
  showCVContactInfo: boolean;
  showCVAbout: boolean;

  // 6. Kustomisasi Teks Keahlian & Spesialisasi
  skillsHeader: string;
  skillsBadges: string[];
  specializationHeader: string;
  specializationItems: string[];

  // 7. Kartu pekerjaan tahun berjalan di samping CV
  showYearWorkCards: boolean;
  yearWorkBadge?: string;
  yearWorkTitle: string;
  yearWorkItems: LandingYearWorkItem[];

  // 8. Seksi Kontak / Mari Terhubung (Bawah Halaman Depan)
  showContactSection: boolean;
  contactBadge: string;
  contactTitle: string;
  contactSubtitle: string;
  contactEmail: string;
  contactWhatsApp: string;
  contactLinkedIn: string;
  contactOperatingHours: string;
  contactAvatarUrl?: string | null;
  contactAvatarPosition?: string | null;
  contactAvatarScale?: number | null;
}

export interface LandingYearWorkItem {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: "selesai" | "berjalan" | "direncanakan";
}

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  sectionOrder: DEFAULT_SECTION_ORDER,
  showHeroSection: true,
  showMetricsBanner: true,
  showDashboardSection: true,
  showCVSection: true,
  showVerifiedAchievementsInCV: true,
  showSkillsSection: true,

  heroTitle: "Workspace & Portofolio",
  heroSubtitle: "Catatan pekerjaan, jadwal, dokumen, dan portofolio saya dalam satu tempat.",
  heroBadgeText: "Technical Data Support & Portfolio",
  adminWhatsAppNumber: "081216130661",
  heroName: "SATRIA NUR ARDIANSYAH",
  heroIsVerified: false,
  heroCurrentJobTitle: "Cataloger Elins",
  heroCurrentCompany: "PT Sonar Persada Manunggal",
  heroCurrentProject: "Project | PT Semen Indonesia Group",
  heroJobSectionTitle: "Job saat ini :",
  heroJobResponsibilities: [
    "Menganalisis permintaan penambahan item baru berdasarkan standar penamaan yang telah ditetapkan melalui sistem FORCA Cataloguing, kemudian melakukan registrasi Item Number di SAP.",
    "Melakukan input dan pembaruan data Good Issued berdasarkan data dan standar terbaru untuk memastikan konsistensi dan akurasi data material.",
    "Meninjau dan memverifikasi datasheet, drawing, dan spesifikasi teknis untuk memastikan data material sesuai dengan kebutuhan operasional.",
    "Menyusun dan menganalisis data Volume Pooling berdasarkan histori Good Issued per kelompok material sebagai dasar dalam perencanaan kebutuhan material.",
    "Menyusun Bill of Quantity (BOQ) dan Engineer’s Estimate (Harga Perkiraan Perancang/HPP) sebagai bagian dari proses persiapan pengadaan dan tender.",
    "Menganalisis harga tahunan terbaru atau harga terakhir yang digunakan untuk setiap item dalam proses Volume Pooling sebagai dasar penyusunan Engineer’s Estimate (HPP).",
  ],
  heroAvatarUrl: null,
  heroAvatarPosition: "50% 50%",
  heroAvatarScale: 1,

  workLogsFilter: "semua",
  workLogsLimit: 4,
  workLogsCategory: "semua",
  selectedWorkLogIds: [],
  defaultDashboardTab: "catatan",
  visibleDashboardTabs: {
    catatan: true,
    rencana: true,
    notulen: true,
    berkas: true,
  },

  cvSource: "active_user",
  showCVEducation: true,
  showCVSkills: true,
  showCVExperience: true,
  showCVContactInfo: true,
  showCVAbout: true,

  skillsHeader: "Keahlian Utama",
  skillsBadges: [
    "Microsoft Office",
    "Cataloger",
    "Data Analysis",
    "Standardisasi Produk",
    "Pengarsipan Data",
  ],
  specializationHeader: "Spesialisasi Kompetensi",
  specializationItems: [
    "Standardisasi spesifikasi produk dan master barang perusahaan",
    "Pengolahan raw data menjadi format analitik siap pakai",
    "Pengarsipan database spreadsheet & katalog digital",
    "Manajemen alur kerja terstruktur dan kepatuhan administrasi",
  ],
  showYearWorkCards: true,
  yearWorkBadge: "PORTOFOLIO 2026",
  yearWorkTitle: "Pekerjaan Tahun Ini",
  yearWorkItems: [
    {
      id: "work-1",
      title: "Volume Pooling & Dokumen Tender Castable ,Refractories ,Low Cement",
      description:
        "- Perbaikan spesifikasi castable - Membuat mapping dan format RFI castable untuk vendor - Menyusun BOQ (Bill Of Quantity) & HPP (Harga Perkiraan Perancang) castable",
      date: "2026-09-07",
      category: "VOLUME POOLING",
      status: "berjalan",
    },
    {
      id: "work-2",
      title: "Volume Pooling & Dokumen Tender Firebrick ,Refractories",
      description:
        "- Perbaikan Spesifikasi Firebrick - Membuat Mapping Firebrick berdasarkan zona kiln kondisi - Membuat format isian qty per opco - Rekap dan menyusun BOQ (Bill Of Quantity) & HPP (Harga Perkiraan Perancang) Firebrick",
      date: "2026-08-25",
      category: "VOLUME POOLING",
      status: "selesai",
    },
  ],

  showContactSection: true,
  contactBadge: "HUBUNGI SAYA",
  contactTitle: "Mari Terhubung",
  contactSubtitle:
    "Saya terbuka untuk berbagai peluang kolaborasi, diskusi, atau pertanyaan terkait pekerjaan dan proyek. Jangan ragu untuk menghubungi saya melalui email, WhatsApp, atau LinkedIn.",
  contactEmail: "satria62317@gmail.com",
  contactWhatsApp: "081216130661",
  contactLinkedIn: "linkedin.com/in/satria-nur16",
  contactOperatingHours: "Senin – Jumat 08.00 – 17.00 WIB (Waktu Indonesia Barat)",
  contactAvatarUrl: null,
  contactAvatarPosition: "50% 50%",
  contactAvatarScale: 1,
};

const STORAGE_KEY = "noura_landing_page_config";

export function getSafeLandingConfig(raw?: Partial<LandingPageConfig> | null): LandingPageConfig {
  if (!raw) return DEFAULT_LANDING_CONFIG;

  // Ensure all valid section IDs are in sectionOrder without duplicate
  let safeOrder = Array.isArray(raw.sectionOrder)
    ? (raw.sectionOrder.filter((id) => DEFAULT_SECTION_ORDER.includes(id)) as LandingSectionId[])
    : [];

  if (safeOrder.length === 0) {
    safeOrder = [...DEFAULT_SECTION_ORDER];
  } else {
    // Add any missing sections to the end
    for (const id of DEFAULT_SECTION_ORDER) {
      if (!safeOrder.includes(id)) {
        safeOrder.push(id);
      }
    }
  }

  return {
    ...DEFAULT_LANDING_CONFIG,
    ...raw,
    heroTitle: raw?.heroTitle?.trim() || DEFAULT_LANDING_CONFIG.heroTitle,
    heroName: raw?.heroName?.trim() || DEFAULT_LANDING_CONFIG.heroName,
    heroIsVerified:
      typeof raw?.heroIsVerified === "boolean"
        ? raw.heroIsVerified
        : DEFAULT_LANDING_CONFIG.heroIsVerified,
    heroCurrentJobTitle:
      raw?.heroCurrentJobTitle?.trim() || DEFAULT_LANDING_CONFIG.heroCurrentJobTitle,
    heroCurrentCompany:
      raw?.heroCurrentCompany?.trim() || DEFAULT_LANDING_CONFIG.heroCurrentCompany,
    heroCurrentProject:
      raw?.heroCurrentProject?.trim() || DEFAULT_LANDING_CONFIG.heroCurrentProject,
    heroJobSectionTitle:
      raw?.heroJobSectionTitle?.trim() || DEFAULT_LANDING_CONFIG.heroJobSectionTitle,
    heroJobResponsibilities:
      Array.isArray(raw?.heroJobResponsibilities) && raw.heroJobResponsibilities.length > 0
        ? raw.heroJobResponsibilities.filter((r) => typeof r === "string" && r.trim().length > 0)
        : DEFAULT_LANDING_CONFIG.heroJobResponsibilities,
    heroAvatarUrl: raw?.heroAvatarUrl ?? null,
    showContactSection:
      typeof raw?.showContactSection === "boolean"
        ? raw.showContactSection
        : DEFAULT_LANDING_CONFIG.showContactSection,
    contactBadge: raw?.contactBadge?.trim() || DEFAULT_LANDING_CONFIG.contactBadge,
    contactTitle: raw?.contactTitle?.trim() || DEFAULT_LANDING_CONFIG.contactTitle,
    contactSubtitle: raw?.contactSubtitle?.trim() || DEFAULT_LANDING_CONFIG.contactSubtitle,
    contactEmail: raw?.contactEmail?.trim() || DEFAULT_LANDING_CONFIG.contactEmail,
    contactWhatsApp: raw?.contactWhatsApp?.trim() || DEFAULT_LANDING_CONFIG.contactWhatsApp,
    contactLinkedIn: raw?.contactLinkedIn?.trim() || DEFAULT_LANDING_CONFIG.contactLinkedIn,
    contactOperatingHours:
      raw?.contactOperatingHours?.trim() || DEFAULT_LANDING_CONFIG.contactOperatingHours,
    contactAvatarUrl: raw?.contactAvatarUrl ?? null,
    contactAvatarPosition:
      raw?.contactAvatarPosition || DEFAULT_LANDING_CONFIG.contactAvatarPosition,
    contactAvatarScale:
      raw?.contactAvatarScale !== undefined && raw?.contactAvatarScale !== null
        ? Number(raw.contactAvatarScale)
        : DEFAULT_LANDING_CONFIG.contactAvatarScale,
    sectionOrder: safeOrder,
    visibleDashboardTabs: {
      ...DEFAULT_LANDING_CONFIG.visibleDashboardTabs,
      ...(raw.visibleDashboardTabs || {}),
    },
    selectedWorkLogIds: Array.isArray(raw.selectedWorkLogIds) ? raw.selectedWorkLogIds : [],
    skillsBadges: Array.isArray(raw.skillsBadges) ? raw.skillsBadges : [],
    specializationItems: Array.isArray(raw.specializationItems) ? raw.specializationItems : [],
    yearWorkBadge: raw?.yearWorkBadge?.trim() || DEFAULT_LANDING_CONFIG.yearWorkBadge,
    yearWorkTitle: raw?.yearWorkTitle?.trim() || DEFAULT_LANDING_CONFIG.yearWorkTitle,
    yearWorkItems:
      Array.isArray(raw?.yearWorkItems) &&
      !raw.yearWorkItems.some(
        (item) =>
          item.title === "Penyusunan Database Produk" ||
          item.title === "Pengembangan Noura Workspace",
      ) &&
      raw.yearWorkItems.length > 0
        ? raw.yearWorkItems
            .filter((item) => item && typeof item === "object")
            .map((item, index) => ({
              id: String(item.id || `work-${index + 1}`),
              title: String(item.title || "Pekerjaan tanpa judul"),
              description: String(item.description || ""),
              date: String(item.date || ""),
              category: String(item.category || "VOLUME POOLING"),
              status: ["selesai", "berjalan", "direncanakan"].includes(item.status)
                ? item.status
                : "berjalan",
            }))
        : DEFAULT_LANDING_CONFIG.yearWorkItems,
  };
}

export function getLandingConfig(): LandingPageConfig {
  if (typeof window === "undefined") return DEFAULT_LANDING_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    let parsed: Partial<LandingPageConfig> = {};
    if (saved) {
      parsed = JSON.parse(saved);
    }
    // Baca cadangan persisten avatar terpadu jika ada
    const unifiedUrl =
      localStorage.getItem("noura_unified_avatar_url") ||
      localStorage.getItem("workhub_avatar_url");
    const unifiedPos =
      localStorage.getItem("noura_unified_avatar_pos") ||
      localStorage.getItem("workhub_avatar_position");
    const unifiedScale =
      localStorage.getItem("noura_unified_avatar_scale") ||
      localStorage.getItem("workhub_avatar_scale");

    // Jika parsed belum punya avatar tapi ada di cadangan lokal, terapkan
    if (unifiedUrl && !parsed.heroAvatarUrl) {
      parsed.heroAvatarUrl = unifiedUrl;
      parsed.contactAvatarUrl = unifiedUrl;
    }
    if (unifiedPos && !parsed.heroAvatarPosition) {
      parsed.heroAvatarPosition = unifiedPos;
      parsed.contactAvatarPosition = unifiedPos;
    }
    if (unifiedScale && parsed.heroAvatarScale === undefined) {
      parsed.heroAvatarScale = parseFloat(unifiedScale);
      parsed.contactAvatarScale = parseFloat(unifiedScale);
    }

    // Pastikan 3 foto profil di landing page selalu selaras 1 pengaturan:
    // heroAvatarUrl dan contactAvatarUrl selalu bernilai sama
    const unifiedAvatar = parsed.heroAvatarUrl || parsed.contactAvatarUrl || unifiedUrl || null;
    const unifiedPosition =
      parsed.heroAvatarPosition || parsed.contactAvatarPosition || unifiedPos || "50% 50%";
    const unifiedScaleNum =
      parsed.heroAvatarScale ??
      parsed.contactAvatarScale ??
      (unifiedScale ? parseFloat(unifiedScale) : 1);

    parsed.heroAvatarUrl = unifiedAvatar;
    parsed.contactAvatarUrl = unifiedAvatar;
    parsed.heroAvatarPosition = unifiedPosition;
    parsed.contactAvatarPosition = unifiedPosition;
    parsed.heroAvatarScale = unifiedScaleNum;
    parsed.contactAvatarScale = unifiedScaleNum;

    return getSafeLandingConfig(parsed);
  } catch {
    // ignore
  }
  return DEFAULT_LANDING_CONFIG;
}

export async function saveLandingConfig(config: LandingPageConfig): Promise<void> {
  // Selaraskan kedua slot foto landing page ke 1 foto terpadu
  const unifiedAvatar = config.heroAvatarUrl || config.contactAvatarUrl || null;
  const unifiedPos = config.heroAvatarPosition || config.contactAvatarPosition || "50% 50%";
  const unifiedScale = config.heroAvatarScale ?? config.contactAvatarScale ?? 1;

  const unifiedConfig: LandingPageConfig = {
    ...config,
    heroAvatarUrl: unifiedAvatar,
    contactAvatarUrl: unifiedAvatar,
    heroAvatarPosition: unifiedPos,
    contactAvatarPosition: unifiedPos,
    heroAvatarScale: unifiedScale,
    contactAvatarScale: unifiedScale,
  };

  const safe = getSafeLandingConfig(unifiedConfig);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      if (unifiedAvatar) {
        localStorage.setItem("noura_unified_avatar_url", unifiedAvatar);
        localStorage.setItem("workhub_avatar_url", unifiedAvatar);
      } else {
        localStorage.removeItem("noura_unified_avatar_url");
        localStorage.removeItem("workhub_avatar_url");
      }
      localStorage.setItem("noura_unified_avatar_pos", unifiedPos);
      localStorage.setItem("workhub_avatar_position", unifiedPos);
      localStorage.setItem("noura_unified_avatar_scale", String(unifiedScale));
      localStorage.setItem("workhub_avatar_scale", String(unifiedScale));

      window.dispatchEvent(new CustomEvent("noura_landing_config_updated", { detail: safe }));
      window.dispatchEvent(
        new CustomEvent("noura_unified_avatar_updated", {
          detail: { avatarUrl: unifiedAvatar, position: unifiedPos, scale: unifiedScale },
        }),
      );
    } catch (storageErr) {
      // Jika terjadi QuotaExceededError karena data lama, bersihkan cache data URL berlebih lalu coba lagi
      try {
        localStorage.removeItem("workhub_temp_photo");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
        if (unifiedAvatar) {
          localStorage.setItem("noura_unified_avatar_url", unifiedAvatar);
        }
      } catch {
        // ignore
      }
    }
  }

  // Simpan keras ke database Supabase jika pengguna login
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const userId = data.user.id;
      // 1. Simpan di Auth User Metadata (otomatis persisten di akun pengguna)
      await supabase.auth.updateUser({
        data: {
          landing_page_config: safe,
          avatar_url: unifiedAvatar,
          avatar_position: unifiedPos,
          avatar_scale: unifiedScale,
        },
      });

      // 2. Simpan keras di tabel profiles (upsert jika baris belum ada)
      try {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            avatar_url: unifiedAvatar,
            avatar_position: unifiedPos,
            avatar_scale: unifiedScale,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      } catch {
        // coba update jika kolom id sudah ada
        try {
          await supabase
            .from("profiles")
            .update({
              avatar_url: unifiedAvatar,
              avatar_position: unifiedPos,
              avatar_scale: unifiedScale,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        } catch {
          // ignore
        }
      }

      // 3. Simpan keras di tabel curriculum_vitae
      try {
        await supabase.from("curriculum_vitae").upsert(
          {
            user_id: userId,
            foto_url: unifiedAvatar,
            foto_position: unifiedPos,
            foto_scale: unifiedScale,
            diperbarui_pada: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn("Sinkronisasi cloud landing config:", err);
  }
}

/**
 * Menyimpan 1 pengaturan foto profil terpadu untuk 3 foto di landing page:
 * (Hero, CV portofolio, dan Kontak Hubungi Saya).
 * Tersimpan keras di LocalStorage, Profiles, Curriculum Vitae, dan Auth User Metadata.
 */
export async function saveUnifiedLandingAvatar({
  avatarUrl,
  position,
  scale,
  userId,
}: {
  avatarUrl: string | null;
  position?: string | null;
  scale?: number | null;
  userId?: string | null;
}): Promise<LandingPageConfig> {
  const current = getLandingConfig();
  const cleanPos = position ?? current.heroAvatarPosition ?? "50% 50%";
  const cleanScale = scale ?? current.heroAvatarScale ?? 1;

  const updatedConfig: LandingPageConfig = {
    ...current,
    heroAvatarUrl: avatarUrl,
    contactAvatarUrl: avatarUrl,
    heroAvatarPosition: cleanPos,
    contactAvatarPosition: cleanPos,
    heroAvatarScale: cleanScale,
    contactAvatarScale: cleanScale,
  };

  await saveLandingConfig(updatedConfig);
  return updatedConfig;
}

/**
 * Memuat konfigurasi dari cloud/metadata Supabase jika ada, lalu menyelaraskan dengan localStorage.
 * Menjaga dengan keras agar foto profil yang baru disimpan tidak terhapus atau kembali ke awal.
 */
export async function syncLandingConfigFromCloud(): Promise<LandingPageConfig> {
  const current = getLandingConfig();
  try {
    const { data } = await supabase.auth.getUser();
    const cloudConfig = data?.user?.user_metadata?.["landing_page_config"];
    const cloudAvatar = data?.user?.user_metadata?.["avatar_url"];

    const localUnifiedUrl =
      typeof window !== "undefined"
        ? localStorage.getItem("noura_unified_avatar_url") ||
          localStorage.getItem("workhub_avatar_url")
        : null;

    // Prioritaskan avatar yang valid agar tidak tertimpa nilai null dari cloud lama
    const effectiveAvatar =
      current.heroAvatarUrl ||
      localUnifiedUrl ||
      cloudConfig?.heroAvatarUrl ||
      cloudConfig?.contactAvatarUrl ||
      cloudAvatar ||
      null;

    const effectivePos =
      current.heroAvatarPosition ||
      cloudConfig?.heroAvatarPosition ||
      (typeof window !== "undefined" ? localStorage.getItem("noura_unified_avatar_pos") : null) ||
      "50% 50%";

    const effectiveScale =
      current.heroAvatarScale ??
      cloudConfig?.heroAvatarScale ??
      (typeof window !== "undefined" && localStorage.getItem("noura_unified_avatar_scale")
        ? parseFloat(localStorage.getItem("noura_unified_avatar_scale")!)
        : 1);

    const merged = getSafeLandingConfig({
      ...current,
      ...(cloudConfig || {}),
      heroAvatarUrl: effectiveAvatar,
      contactAvatarUrl: effectiveAvatar,
      heroAvatarPosition: effectivePos,
      contactAvatarPosition: effectivePos,
      heroAvatarScale: effectiveScale,
      contactAvatarScale: effectiveScale,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        if (effectiveAvatar) {
          localStorage.setItem("noura_unified_avatar_url", effectiveAvatar);
          localStorage.setItem("workhub_avatar_url", effectiveAvatar);
        }
        window.dispatchEvent(new CustomEvent("noura_landing_config_updated", { detail: merged }));
      } catch {
        // ignore storage error
      }
    }
    return merged;
  } catch {
    // ignore
  }
  return current;
}
