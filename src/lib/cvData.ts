import satriaRedAvatar from "@/assets/images/satria_avatar_red_1790582692896.jpg";

export type PengalamanKerja = {
  id: string;
  perusahaan: string;
  posisi: string;
  periode: string;
  deskripsi: string[];
};

export type RiwayatPendidikan = {
  id: string;
  institusi: string;
  jurusan: string;
  periode: string;
};

export type CVData = {
  nama_lengkap: string;
  headline: string;
  alamat: string;
  telepon: string;
  email: string;
  linkedin?: string;
  tentang_saya: string;
  pengalaman: PengalamanKerja[];
  pendidikan: RiwayatPendidikan[];
  sertifikasi?: string[];
  keahlian: string[];
  spesialisasi_kompetensi?: string[];
  foto_url?: string | null;
  foto_position?: string | null;
  foto_scale?: number | null;
  judul_tentang_saya?: string;
  judul_pendidikan?: string;
  judul_pengalaman?: string;
  judul_keahlian?: string;
  judul_kompetensi?: string;
};

// Data CV Resmi Satria Nur Ardiansyah (Sesuai Urutan & Dokumen)
export const DEFAULT_CV_SATRIA: CVData = {
  nama_lengkap: "SATRIA NUR ARDIANSYAH",
  headline: "Cataloger Elins Staff & Data Standardization",
  alamat: "Jl. Teuku Umar, Latsari 2 No.57 Tuban–Jawa Timur",
  telepon: "081216130661",
  email: "satria62317@gmail.com",
  linkedin: "www.linkedin.com/in/satria-nur16",
  tentang_saya:
    "Graduate of Electrical Power Installation Engineering from SMK Negeri 1 Tuban, currently pursuing a Bachelor's degree in Management at Universitas Terbuka. Experienced in product and material standardization, data management, and administrative activities.",
  pendidikan: [
    {
      id: "edu-1",
      institusi: "Universitas Terbuka",
      jurusan: "S1 Management",
      periode: "2023 – Present",
    },
    {
      id: "edu-2",
      institusi: "SMK Negeri 1 Tuban",
      jurusan: "Electrical Power Installation Engineering",
      periode: "2017 – 2020",
    },
  ],
  pengalaman: [
    {
      id: "exp-1",
      perusahaan: "PT Sonar Persada Manunggal - Tuban,East Java",
      posisi: "Cataloger Elins Staff (Project at PT. Semen Indonesia (Persero) Tbk)",
      periode: "Jan 2026 – Present",
      deskripsi: [
        "Analyze requests for new item additions based on established naming convention standards through the FORCA Cataloguing system, followed by Item Number registration in SAP.",
        "Perform Good Issued data entry and updates based on the latest data and standards to ensure material data consistency and accuracy.",
        "Review and verify datasheets, drawings, and technical specifications to ensure material data complies with operational requirements.",
        "Prepare and analyze Volume Pooling data based on historical Good Issued records by material group as a basis for material demand planning.",
        "Prepare the Bill of Quantity (BOQ) and Engineer’s Estimate (Harga Perkiraan Perancang/HPP) as part of the procurement and tender preparation process.",
        "Analyze the latest or most recent annual prices used for each item included in the Volume Pooling process as a basis for preparing the Engineer’s Estimate (HPP).",
      ],
    },
    {
      id: "exp-2",
      perusahaan: "PT Swabina Gatra - Tuban,East Java",
      posisi: "Supporting Enrichment Data Staff (Project at PT. Semen Indonesia (Persero) Tbk)",
      periode: "June 2022 - April 2025",
      deskripsi: [
        "Develop and maintain standardized naming conventions for machinery, equipment, and spare parts required by plants to support procurement processes and vendor requirements.",
        "Analyze requests for new item additions based on established naming convention standards through the FORCA Cataloguing system, followed by Item Number registration in SAP.",
        "Perform Good Issued data entry and updates based on the latest data and standards to ensure material data consistency and accuracy.",
        "Provide DN/LN spare part data as evaluation material to support the improvement of TKDN (Domestic Component Level) across industrial operations.",
        "Provide information on critical spare part availability and collect and analyze data to support the identification and resolution of operational issues.",
      ],
    },
    {
      id: "exp-3",
      perusahaan: "PT Jaykay Files Indonesia - Semarang,Central Java",
      posisi: "Hot Forging (Project)",
      periode: "Augst 2020 - Sept 2020",
      deskripsi: [
        "Performed forging operations to shape steel materials into file tangs according to production specifications and standards.",
        "Conducted visual inspections of forged materials to check their shape and condition.",
        "Sorted file products by separating acceptable products from those with production defects based on established quality standards.",
      ],
    },
    {
      id: "exp-4",
      perusahaan: "Mustika Hotel - Tuban,East Java",
      posisi: "Electrical Engineering (Intership)",
      periode: "April 2019 - June 2019",
      deskripsi: [
        "Performed maintenance and inspection of the hotel's electrical installations to ensure safe and efficient operation.",
        "Conducted lighting replacement, electrical equipment maintenance, and air conditioning (AC) cleaning and maintenance.",
        "Conducted routine inspections of electrical equipment and supporting facilities to ensure they remained in good working condition.",
      ],
    },
  ],
  keahlian: [
    "Microsoft Office",
    "Material Cataloging & Product Standardization",
    "Data Management & Data Entry",
  ],
  sertifikasi: [
    "Sertifikasi Kompetensi Kelistrikan & Instrumentasi Industri",
    "Standarisasi Material & Kodifikasi SAP/FORCA",
  ],
  spesialisasi_kompetensi: [
    "Sertifikasi Kompetensi Kelistrikan & Instrumentasi Industri",
    "Standarisasi Material & Kodifikasi SAP/FORCA",
    "Manajemen Pengadaan & Estimasi HPP / BOQ",
  ],
  foto_url: satriaRedAvatar,
  foto_position: "center center",
  foto_scale: 1,
  judul_tentang_saya: "Tentang Saya",
  judul_pendidikan: "Riwayat Pendidikan",
  judul_pengalaman: "Pengalaman Kerja",
  judul_keahlian: "Keahlian Utama",
  judul_kompetensi: "Spesialisasi Kompetensi",
};

export function createDefaultCVForUser(
  userEmail?: string,
  profile?: { full_name?: string | null; job_title?: string | null; company_name?: string | null },
): CVData {
  if (userEmail === "satria62317@gmail.com") {
    return DEFAULT_CV_SATRIA;
  }

  const name =
    profile?.full_name?.trim() ||
    (userEmail
      ? userEmail
          .split("@")[0]!
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Pengguna Noura");

  const headline = profile?.job_title?.trim() || "Profesional Spesialis";
  const company = profile?.company_name?.trim() || "Noura Workhub";

  return {
    nama_lengkap: name,
    headline: headline,
    alamat: "Indonesia",
    telepon: "",
    email: userEmail || "",
    tentang_saya: `Profesional berdedikasi tinggi di bidang ${headline} dengan keahlian mendalam, integritas, dan rekam jejak kerja terstruktur pada ruang kerja personal Noura.`,
    pengalaman: [
      {
        id: "exp-default-1",
        perusahaan: company,
        posisi: headline,
        periode: "2024 – Sekarang",
        deskripsi: [
          "Mengelola koordinasi operasional dan pelaporan tugas harian secara terorganisir",
          "Menerapkan efisiensi kerja melalui pencatatan sistematis dan pemantauan berkas kerja",
          "Berorientasi pada hasil berkualitas tinggi dan kepatuhan terhadap standar mutu",
        ],
      },
    ],
    pendidikan: [
      {
        id: "edu-default-1",
        institusi: "Universitas Terbuka",
        jurusan: "S1 Management",
        periode: "2023 – Present",
      },
      {
        id: "edu-default-2",
        institusi: "SMK Negeri 1 Tuban",
        jurusan: "Electrical Power Installation Engineering",
        periode: "2017 – 2020",
      },
    ],
    keahlian: [
      "Microsoft Office",
      "Material Cataloging & Product Standardization",
      "Data Management & Data Entry",
    ],
    spesialisasi_kompetensi: [
      "Sertifikasi Kompetensi Kelistrikan & Instrumentasi Industri",
      "Standarisasi Material & Kodifikasi SAP/FORCA",
      "Manajemen Pengadaan & Estimasi HPP / BOQ",
    ],
    foto_url: satriaRedAvatar,
    foto_position: "center center",
    foto_scale: 1,
    judul_tentang_saya: "Tentang Saya",
    judul_pendidikan: "1. Riwayat Pendidikan",
    judul_pengalaman: "2. Pengalaman Kerja",
    judul_keahlian: "3. Keahlian Utama",
    judul_kompetensi: "4. Spesialisasi Kompetensi",
  };
}
