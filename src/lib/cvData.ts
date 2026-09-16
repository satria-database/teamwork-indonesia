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
  tentang_saya: string;
  pengalaman: PengalamanKerja[];
  pendidikan: RiwayatPendidikan[];
  keahlian: string[];
  foto_url?: string | null;
  foto_position?: string | null;
};

// Data CV Satria Nur Ardiansyah
export const DEFAULT_CV_SATRIA: CVData = {
  nama_lengkap: "SATRIA NUR ARDIANSYAH",
  headline: "Technical Data Supporting & Data Analysis",
  alamat: "Jl. Teuku Umar, Latsari 2 No.57 Tuban",
  telepon: "081216130661",
  email: "satria62317@gmail.com",
  tentang_saya:
    "Lulusan SMK Teknik Instalasi Tenaga Listrik dari SMK Negeri 1 Tuban. Saat ini sedang menjalani Pendidikan S1-Manajemen di Universitas Terbuka, Memiliki kemampuan berpikir kritis, dan mengoperasikan Microsoft Office. Berpengalaman dalam membuat standarisasi produk/barang, termasuk pengarsipan, pengelolaan raw data. Sedang mencari pekerjaan yang berhubungan dengan administrasi/data analysis di perusahaan untuk mengaplikasikan kemampuan yang telah dikembangkan selama masa bekerja.",
  pengalaman: [
    {
      id: "exp-1",
      perusahaan: "PT SWABINA GATRA",
      posisi: "TECHNICAL DATA SUPPORTING",
      periode: "02 Juni 2022 – 02 April 2025",
      deskripsi: [
        "Membuat standard spesifikasi Produk/Barang",
        "Mengumpulkan & mengolah data mentah menjadi data final sesuai dengan standard yang telah dibuat perusahaan",
        "Membuat arsip dari data-data yang telah diolah di spreadsheet maupun aplikasi perusahaan",
      ],
    },
    {
      id: "exp-2",
      perusahaan: "HOTEL MUSTIKA TUBAN",
      posisi: "ELECTRICAL ENGINEERING",
      periode: "01 April 2019 – 30 Juni 2019",
      deskripsi: [
        "Pemeliharaan instalasi listrik hotel",
        "Melakukan penggantian lampu dan pembersihan air conditioner",
      ],
    },
  ],
  pendidikan: [
    {
      id: "edu-1",
      institusi: "SMK Negeri 1 Tuban",
      jurusan: "Teknik Instalasi Tenaga Listrik",
      periode: "2017 – 2020",
    },
    {
      id: "edu-2",
      institusi: "Universitas Terbuka",
      jurusan: "S1 Manajemen",
      periode: "2023 – ON GOING",
    },
  ],
  keahlian: [
    "Microsoft Office",
    "Cataloger",
    "Data Analysis",
    "Standardisasi Produk",
    "Pengarsipan Data",
  ],
  foto_url: null,
  foto_position: "center center",
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
        institusi: "Pendidikan Tinggi / Menengah",
        jurusan: "Studi Terkait",
        periode: "Lulusan",
      },
    ],
    keahlian: [
      "Manajemen Tugas",
      "Analisis Kerja",
      "Administrasi Digital",
      "Komunikasi Efektif",
      "Problem Solving",
    ],
    foto_url: null,
    foto_position: "center center",
  };
}
