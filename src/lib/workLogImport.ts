import * as XLSX from "xlsx";
import type { WorkLogPayload, WorkLogPriority, WorkLogStatus } from "@/lib/workLogs";

export type ImportRow = { row: number; payload?: WorkLogPayload; error?: string };

const headers: Record<string, string> = {
  judul: "judul",
  title: "judul",
  deskripsi: "deskripsi",
  description: "deskripsi",
  tanggal: "tanggal",
  date: "tanggal",
  waktu_mulai: "waktu_mulai",
  "waktu mulai": "waktu_mulai",
  waktu_selesai: "waktu_selesai",
  "waktu selesai": "waktu_selesai",
  durasi_menit: "durasi_menit",
  durasi: "durasi_menit",
  status: "status",
  progress: "progress",
  kategori: "kategori",
  category: "kategori",
  prioritas: "prioritas",
  priority: "prioritas",
  tags: "tags",
  link_url: "link_url",
  link: "link_url",
  catatan_hasil: "catatan_hasil",
  hasil: "catatan_hasil",
};

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}
function excelDate(value: unknown) {
  if (typeof value === "number")
    return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  const valueText = text(value);
  const parsed = new Date(valueText);
  return Number.isNaN(parsed.getTime()) ? valueText : parsed.toISOString().slice(0, 10);
}

export function parseImportRows(rows: Record<string, unknown>[]): ImportRow[] {
  return rows.map((raw, index) => {
    const normalized = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [
        headers[key.toLowerCase().trim()] ?? key.toLowerCase().trim(),
        value,
      ]),
    );
    const judul = text(normalized.judul);
    const tanggal = excelDate(normalized.tanggal);
    const status = (text(normalized.status) || "belum_mulai") as WorkLogStatus;
    const prioritas = (text(normalized.prioritas) || "sedang") as WorkLogPriority;
    const progress = Number(normalized.progress ?? (status === "selesai" ? 100 : 0));
    const durasi = Number(normalized.durasi_menit ?? 0);
    const errors: string[] = [];
    if (!judul) errors.push("judul wajib diisi");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) errors.push("tanggal harus YYYY-MM-DD");
    if (!["belum_mulai", "berjalan", "selesai"].includes(status)) errors.push("status tidak valid");
    if (!["rendah", "sedang", "tinggi"].includes(prioritas)) errors.push("prioritas tidak valid");
    if (!Number.isInteger(progress) || progress < 0 || progress > 100)
      errors.push("progress harus 0-100");
    if (!Number.isInteger(durasi) || durasi < 0) errors.push("durasi harus bilangan positif");
    const payload: WorkLogPayload = {
      judul,
      deskripsi: text(normalized.deskripsi),
      tanggal,
      waktu_mulai: text(normalized.waktu_mulai) || null,
      waktu_selesai: text(normalized.waktu_selesai) || null,
      durasi_menit: durasi,
      status,
      progress,
      kategori: text(normalized.kategori) || "Lainnya",
      prioritas,
      tags: text(normalized.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      link_url: text(normalized.link_url) || null,
      catatan_hasil: text(normalized.catatan_hasil) || null,
    };
    return errors.length
      ? { row: index + 2, error: errors.join(", ") }
      : { row: index + 2, payload };
  });
}

export async function readWorkLogWorkbook(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) throw new Error("Sheet Excel tidak ditemukan");
  return parseImportRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }));
}

export function downloadWorkLogTemplate() {
  const rows = [
    {
      judul: "Contoh pekerjaan",
      deskripsi: "Migrasi data lama",
      tanggal: "2022-07-20",
      waktu_mulai: "08:00",
      waktu_selesai: "10:00",
      durasi_menit: 120,
      status: "selesai",
      progress: 100,
      kategori: "Dokumentasi",
      prioritas: "sedang",
      tags: "arsip,2022",
      link_url: "",
      catatan_hasil: "Selesai",
    },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Template");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Gunakan status: belum_mulai, berjalan, selesai"],
      ["Gunakan prioritas: rendah, sedang, tinggi"],
      ["Tanggal: YYYY-MM-DD"],
    ]),
    "Petunjuk",
  );
  XLSX.writeFile(workbook, "template-catatan-pekerjaan.xlsx");
}
