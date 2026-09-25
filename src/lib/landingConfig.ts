import { supabase } from "./supabase";

export type LandingSectionId =
  | "hero"
  | "metrics"
  | "dashboard"
  | "cv"
  | "skills";

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

export const DEFAULT_SECTION_ORDER: LandingSectionId[] = [
  "hero",
  "cv",
  "skills",
];

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

  // 3. Teks & Kustomisasi Hero
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  adminWhatsAppNumber: string;

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
  yearWorkTitle: string;
  yearWorkItems: LandingYearWorkItem[];
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

  heroTitle: "WorkSpace & Portfolio",
  heroSubtitle:
    "Catatan pekerjaan, jadwal, dokumen, dan portofolio saya dalam satu tempat.",
  heroBadgeText: "Technical Data Support & Portfolio",
  adminWhatsAppNumber: "081216130661",

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
  yearWorkTitle: "Pekerjaan Tahun Ini",
  yearWorkItems: [
    {
      id: "work-1",
      title: "Penyusunan Database Produk",
      description: "Standardisasi data, validasi spesifikasi, dan pembaruan katalog barang.",
      date: "2026-08-20",
      category: "Data & Katalog",
      status: "selesai",
    },
    {
      id: "work-2",
      title: "Pengembangan Noura Workspace",
      description: "Penyempurnaan alur catatan kerja, dokumen, dan tampilan portofolio.",
      date: "2026-09-12",
      category: "Development",
      status: "berjalan",
    },
  ],
};

const STORAGE_KEY = "noura_landing_page_config";

export function getSafeLandingConfig(
  raw?: Partial<LandingPageConfig> | null,
): LandingPageConfig {
  if (!raw) return DEFAULT_LANDING_CONFIG;

  // Ensure all valid section IDs are in sectionOrder without duplicate
  let safeOrder = Array.isArray(raw.sectionOrder)
    ? (raw.sectionOrder.filter((id) =>
        DEFAULT_SECTION_ORDER.includes(id),
      ) as LandingSectionId[])
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
    sectionOrder: safeOrder,
    visibleDashboardTabs: {
      ...DEFAULT_LANDING_CONFIG.visibleDashboardTabs,
      ...(raw.visibleDashboardTabs || {}),
    },
    selectedWorkLogIds: Array.isArray(raw.selectedWorkLogIds)
      ? raw.selectedWorkLogIds
      : [],
    skillsBadges: Array.isArray(raw.skillsBadges) ? raw.skillsBadges : [],
    specializationItems: Array.isArray(raw.specializationItems)
      ? raw.specializationItems
      : [],
    yearWorkItems: Array.isArray(raw.yearWorkItems)
      ? raw.yearWorkItems
          .filter((item) => item && typeof item === "object")
          .map((item, index) => ({
            id: String(item.id || `work-${index + 1}`),
            title: String(item.title || "Pekerjaan tanpa judul"),
            description: String(item.description || ""),
            date: String(item.date || ""),
            category: String(item.category || "Pekerjaan"),
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
    if (saved) {
      const parsed = JSON.parse(saved);
      return getSafeLandingConfig(parsed);
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANDING_CONFIG;
}

export async function saveLandingConfig(
  config: LandingPageConfig,
): Promise<void> {
  const safe = getSafeLandingConfig(config);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      window.dispatchEvent(
        new CustomEvent("noura_landing_config_updated", { detail: safe }),
      );
    } catch {
      // ignore
    }
  }

  // Sync to Supabase Auth User Metadata if user is logged in
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      await supabase.auth.updateUser({
        data: { landing_page_config: safe },
      });
    }
  } catch (err) {
    console.warn("Sinkronisasi cloud landing config:", err);
  }
}

/**
 * Memuat konfigurasi dari cloud/metadata Supabase jika ada, lalu menyelaraskan dengan localStorage.
 */
export async function syncLandingConfigFromCloud(): Promise<LandingPageConfig> {
  const current = getLandingConfig();
  try {
    const { data } = await supabase.auth.getUser();
    const cloudConfig = data?.user?.user_metadata?.["landing_page_config"];
    if (cloudConfig) {
      const merged = getSafeLandingConfig({ ...current, ...cloudConfig });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(
            new CustomEvent("noura_landing_config_updated", { detail: merged }),
          );
        } catch {}
      }
      return merged;
    }
  } catch {
    // ignore
  }
  return current;
}

