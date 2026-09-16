import { supabase } from "@/lib/supabase";
import { updateUpcomingWork } from "@/lib/upcomingWork";

export type WorkLogStatus = "belum_mulai" | "berjalan" | "selesai";
export type WorkLogPriority = "rendah" | "sedang" | "tinggi";

export interface WorkAttachment {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at?: string | undefined;
  url?: string | undefined;
}

export interface WorkLogTimerState {
  is_running: boolean;
  started_at: string | null; // ISO timestamp string
  accumulated_seconds: number;
}

export interface WorkLog {
  id: string;
  user_id?: string | undefined;
  upcoming_work_id?: string | null | undefined;
  upcoming_work_judul?: string | null | undefined;
  judul: string;
  deskripsi: string;
  tanggal: string; // YYYY-MM-DD
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  durasi_menit: number;
  status: WorkLogStatus;
  progress: number; // 0 - 100
  kategori: string;
  category_id?: string | null | undefined;
  prioritas: WorkLogPriority;
  tags: string[];
  link_url: string | null;
  catatan_hasil?: string | null | undefined; // work_result
  attachments: WorkAttachment[];
  timer_state?: WorkLogTimerState | null | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  // Computed helpers
  is_overdue?: boolean | undefined;
}

export interface WorkLogPayload {
  judul: string;
  deskripsi?: string;
  tanggal: string;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  durasi_menit: number;
  status: WorkLogStatus;
  progress: number;
  kategori?: string;
  category_id?: string | null;
  prioritas: WorkLogPriority;
  tags?: string[];
  link_url?: string | null;
  catatan_hasil?: string | null | undefined;
  upcoming_work_id?: string | null | undefined;
  upcoming_work_judul?: string | null | undefined;
  attachments?: WorkAttachment[];
  timer_state?: WorkLogTimerState | null | undefined;
}

export const KATEGORI_DEFAULT = [
  "UI/UX",
  "Development",
  "Meeting",
  "Administrasi",
  "Dokumentasi",
  "Lainnya",
];

export const TAGS_SUGGESTION = [
  "Frontend",
  "Backend",
  "Database",
  "Supabase",
  "UI/UX",
  "BugFix",
  "API",
  "Review",
  "Deployment",
  "Dokumentasi",
];

/**
 * Checks if work_logs table is available in Supabase
 */
let hasWorkLogsTable: boolean | null = null;
async function checkWorkLogsTable(): Promise<boolean> {
  if (hasWorkLogsTable !== null) return hasWorkLogsTable;
  try {
    const { error } = await supabase.from("work_logs").select("id").limit(1);
    hasWorkLogsTable = !error;
    return hasWorkLogsTable;
  } catch {
    hasWorkLogsTable = false;
    return false;
  }
}

/**
 * Parses raw database record into typed WorkLog
 */
export function parseWorkLog(row: {
  id: string;
  judul: string;
  isi?: string | null;
  deskripsi?: string | null;
  tanggal?: string;
  work_date?: string;
  durasi_menit?: number | null;
  dibuat_oleh?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  status?: string;
  progress?: number;
  prioritas?: string;
  kategori?: string;
  category_id?: string | null;
  tags?: string[];
  link_url?: string | null;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  work_result?: string | null;
  catatan_hasil?: string | null;
  upcoming_work_id?: string | null;
  upcoming_work_judul?: string | null;
  attachments?: WorkAttachment[];
  timer_state?: WorkLogTimerState | null;
}): WorkLog {
  const tanggal = row.tanggal || row.work_date || new Date().toISOString().slice(0, 10);
  const durasi_menit = Number(row.durasi_menit ?? 0);
  const user_id = row.user_id || row.dibuat_oleh || undefined;

  let deskripsi = row.deskripsi || "";
  let status: WorkLogStatus = (row.status as WorkLogStatus) || "selesai";
  let progress = typeof row.progress === "number" ? row.progress : 100;
  let kategori = row.kategori || "Development";
  let prioritas: WorkLogPriority = (row.prioritas as WorkLogPriority) || "sedang";
  let tags: string[] = Array.isArray(row.tags) ? row.tags : [];
  let link_url: string | null = row.link_url || null;
  let catatan_hasil: string | null = row.catatan_hasil || row.work_result || null;
  let waktu_mulai: string | null = row.waktu_mulai || row.start_time || null;
  let waktu_selesai: string | null = row.waktu_selesai || row.end_time || null;
  let upcoming_work_id: string | null = row.upcoming_work_id || null;
  let upcoming_work_judul: string | null = row.upcoming_work_judul || null;
  let attachments: WorkAttachment[] = Array.isArray(row.attachments) ? row.attachments : [];
  let timer_state: WorkLogTimerState | null = row.timer_state || null;

  // Parse structured payload if stored in 'isi'
  if (row.isi && typeof row.isi === "string") {
    const trimmed = row.isi.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          deskripsi = parsed.deskripsi ?? deskripsi;
          status = parsed.status ?? status;
          progress = typeof parsed.progress === "number" ? parsed.progress : progress;
          kategori = parsed.kategori ?? kategori;
          prioritas = parsed.prioritas ?? prioritas;
          tags = Array.isArray(parsed.tags) ? parsed.tags : tags;
          link_url = parsed.link_url ?? link_url;
          catatan_hasil = parsed.catatan_hasil ?? catatan_hasil;
          waktu_mulai = parsed.waktu_mulai ?? waktu_mulai;
          waktu_selesai = parsed.waktu_selesai ?? waktu_selesai;
          upcoming_work_id = parsed.upcoming_work_id ?? upcoming_work_id;
          upcoming_work_judul = parsed.upcoming_work_judul ?? upcoming_work_judul;
          attachments = Array.isArray(parsed.attachments) ? parsed.attachments : attachments;
          timer_state = parsed.timer_state ?? timer_state;
        }
      } catch {
        deskripsi = row.isi;
      }
    } else {
      deskripsi = row.isi;
    }
  }

  // Consistent status & progress
  if (status === "selesai" && progress < 100) {
    progress = 100;
  } else if (status === "belum_mulai" && progress > 0) {
    progress = 0;
  }

  const today = new Date().toISOString().slice(0, 10);
  const is_overdue = tanggal < today && status !== "selesai";

  return {
    id: row.id,
    user_id,
    upcoming_work_id,
    upcoming_work_judul,
    judul: row.judul,
    deskripsi,
    tanggal,
    waktu_mulai,
    waktu_selesai,
    durasi_menit,
    status,
    progress,
    kategori,
    category_id: row.category_id,
    prioritas,
    tags,
    link_url,
    catatan_hasil,
    attachments,
    timer_state,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_overdue,
  };
}

/**
 * Fetch all work logs with filters
 */
export async function fetchWorkLogs(
  filters?: {
    search?: string;
    status?: string;
    kategori?: string;
    prioritas?: string;
    tanggal?: string;
  },
  userId?: string,
): Promise<WorkLog[]> {
  const useWorkLogs = await checkWorkLogsTable();
  let list: WorkLog[] = [];

  if (useWorkLogs) {
    let query = supabase
      .from("work_logs")
      .select("*, work_categories(nama), work_log_attachments(*)")
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (filters?.tanggal) {
      query = query.eq("work_date", filters.tanggal);
    }
    if (filters?.status && filters.status !== "semua" && filters.status !== "terlambat") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    list = (data || []).map((row) =>
      parseWorkLog({
        ...row,
        kategori: row.work_categories?.nama || "Development",
        attachments: (row.work_log_attachments || []).map(
          (att: {
            id: string;
            nama: string;
            path: string;
            ukuran: number;
            tipe: string;
            created_at: string;
          }) => ({
            id: att.id,
            name: att.nama,
            path: att.path,
            size: att.ukuran,
            type: att.tipe,
            created_at: att.created_at,
          }),
        ),
      }),
    );
  } else {
    // Primary fallback: 'catatan_kerja'
    let query = supabase
      .from("catatan_kerja")
      .select("*")
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("dibuat_oleh", userId);
    }
    if (filters?.tanggal) {
      query = query.eq("tanggal", filters.tanggal);
    }

    const { data, error } = await query;
    if (error) throw error;

    list = (data || []).map((row) => parseWorkLog(row));
  }

  const today = new Date().toISOString().slice(0, 10);

  // Client-side filtering for search & dynamic fields
  if (filters?.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.judul.toLowerCase().includes(q) ||
        item.deskripsi.toLowerCase().includes(q) ||
        (item.catatan_hasil && item.catatan_hasil.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.kategori.toLowerCase().includes(q),
    );
  }

  if (filters?.status && filters.status !== "semua") {
    if (filters.status === "terlambat") {
      list = list.filter((item) => item.is_overdue);
    } else {
      list = list.filter((item) => item.status === filters.status);
    }
  }

  if (filters?.kategori && filters.kategori !== "semua") {
    list = list.filter((item) => item.kategori === filters.kategori);
  }

  if (filters?.prioritas && filters.prioritas !== "semua") {
    list = list.filter((item) => item.prioritas === filters.prioritas);
  }

  return list;
}

/**
 * Create a new work log
 */
export async function createWorkLog(payload: WorkLogPayload, userId?: string): Promise<WorkLog> {
  const useWorkLogs = await checkWorkLogsTable();

  if (useWorkLogs) {
    const { data, error } = await supabase
      .from("work_logs")
      .insert({
        user_id: userId,
        judul: payload.judul,
        deskripsi: payload.deskripsi || "",
        work_date: payload.tanggal,
        start_time: payload.waktu_mulai || null,
        end_time: payload.waktu_selesai || null,
        durasi_menit: payload.durasi_menit || 0,
        status: payload.status,
        progress: payload.progress,
        prioritas: payload.prioritas,
        link_url: payload.link_url || null,
        work_result: payload.catatan_hasil || null,
        upcoming_work_id: payload.upcoming_work_id || null,
        category_id: payload.category_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (payload.attachments && payload.attachments.length > 0) {
      const attsToInsert = payload.attachments.map((att) => ({
        work_log_id: data.id,
        user_id: userId,
        nama: att.name,
        path: att.path,
        ukuran: att.size,
        tipe: att.type,
      }));
      await supabase.from("work_log_attachments").insert(attsToInsert);
    }

    // Sync upcoming work if connected
    if (payload.upcoming_work_id) {
      const targetStatus =
        payload.status === "selesai" && payload.progress >= 100 ? "selesai" : "berjalan";
      try {
        await updateUpcomingWork(payload.upcoming_work_id, { status: targetStatus });
      } catch (err) {
        console.warn("Sync upcoming work error:", err);
      }
    }

    return parseWorkLog({ ...data, kategori: payload.kategori, attachments: payload.attachments });
  } else {
    // Save to 'catatan_kerja' with JSON metadata in 'isi'
    const structuredIsi = JSON.stringify({
      deskripsi: payload.deskripsi || "",
      status: payload.status,
      progress: payload.progress,
      kategori: payload.kategori || "Development",
      prioritas: payload.prioritas,
      tags: payload.tags || [],
      link_url: payload.link_url || null,
      catatan_hasil: payload.catatan_hasil || null,
      waktu_mulai: payload.waktu_mulai || null,
      waktu_selesai: payload.waktu_selesai || null,
      upcoming_work_id: payload.upcoming_work_id || null,
      upcoming_work_judul: payload.upcoming_work_judul || null,
      attachments: payload.attachments || [],
      timer_state: payload.timer_state || null,
    });

    const { data, error } = await supabase
      .from("catatan_kerja")
      .insert({
        judul: payload.judul,
        isi: structuredIsi,
        tanggal: payload.tanggal,
        durasi_menit: payload.durasi_menit || 0,
        dibuat_oleh: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Sync upcoming work if connected
    if (payload.upcoming_work_id) {
      const targetStatus =
        payload.status === "selesai" && payload.progress >= 100 ? "selesai" : "berjalan";
      try {
        await updateUpcomingWork(payload.upcoming_work_id, { status: targetStatus });
      } catch (err) {
        console.warn("Sync upcoming work error:", err);
      }
    }

    return parseWorkLog(data);
  }
}

/**
 * Update an existing work log
 */
export async function updateWorkLog(id: string, payload: Partial<WorkLogPayload>): Promise<void> {
  const useWorkLogs = await checkWorkLogsTable();

  if (useWorkLogs) {
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.judul !== undefined) updateObj["judul"] = payload.judul;
    if (payload.deskripsi !== undefined) updateObj["deskripsi"] = payload.deskripsi;
    if (payload.tanggal !== undefined) updateObj["work_date"] = payload.tanggal;
    if (payload.waktu_mulai !== undefined) updateObj["start_time"] = payload.waktu_mulai;
    if (payload.waktu_selesai !== undefined) updateObj["end_time"] = payload.waktu_selesai;
    if (payload.durasi_menit !== undefined) updateObj["durasi_menit"] = payload.durasi_menit;
    if (payload.status !== undefined) updateObj["status"] = payload.status;
    if (payload.progress !== undefined) updateObj["progress"] = payload.progress;
    if (payload.prioritas !== undefined) updateObj["prioritas"] = payload.prioritas;
    if (payload.link_url !== undefined) updateObj["link_url"] = payload.link_url;
    if (payload.catatan_hasil !== undefined) updateObj["work_result"] = payload.catatan_hasil;
    if (payload.category_id !== undefined) updateObj["category_id"] = payload.category_id;
    if (payload.upcoming_work_id !== undefined)
      updateObj["upcoming_work_id"] = payload.upcoming_work_id;

    const { error } = await supabase.from("work_logs").update(updateObj).eq("id", id);
    if (error) throw error;

    if (
      payload.upcoming_work_id &&
      payload.status === "selesai" &&
      (payload.progress ?? 0) >= 100
    ) {
      try {
        await updateUpcomingWork(payload.upcoming_work_id, { status: "selesai" });
      } catch (err) {
        console.warn("Sync upcoming work error:", err);
      }
    }
  } else {
    const { data: existing, error: fetchErr } = await supabase
      .from("catatan_kerja")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    const parsedOld = parseWorkLog(existing);
    const merged: WorkLogPayload = {
      judul: payload.judul ?? parsedOld.judul,
      deskripsi: payload.deskripsi ?? parsedOld.deskripsi,
      tanggal: payload.tanggal ?? parsedOld.tanggal,
      durasi_menit: payload.durasi_menit ?? parsedOld.durasi_menit,
      status: payload.status ?? parsedOld.status,
      progress: payload.progress ?? parsedOld.progress,
      kategori: payload.kategori ?? parsedOld.kategori,
      prioritas: payload.prioritas ?? parsedOld.prioritas,
      tags: payload.tags ?? parsedOld.tags,
      link_url: payload.link_url ?? parsedOld.link_url,
      catatan_hasil:
        payload.catatan_hasil !== undefined ? payload.catatan_hasil : parsedOld.catatan_hasil,
      waktu_mulai: payload.waktu_mulai ?? parsedOld.waktu_mulai,
      waktu_selesai: payload.waktu_selesai ?? parsedOld.waktu_selesai,
      upcoming_work_id: payload.upcoming_work_id ?? parsedOld.upcoming_work_id,
      upcoming_work_judul: payload.upcoming_work_judul ?? parsedOld.upcoming_work_judul,
      attachments: payload.attachments ?? parsedOld.attachments,
      timer_state: payload.timer_state !== undefined ? payload.timer_state : parsedOld.timer_state,
    };

    const structuredIsi = JSON.stringify({
      deskripsi: merged.deskripsi,
      status: merged.status,
      progress: merged.progress,
      kategori: merged.kategori,
      prioritas: merged.prioritas,
      tags: merged.tags,
      link_url: merged.link_url,
      catatan_hasil: merged.catatan_hasil,
      waktu_mulai: merged.waktu_mulai,
      waktu_selesai: merged.waktu_selesai,
      upcoming_work_id: merged.upcoming_work_id,
      upcoming_work_judul: merged.upcoming_work_judul,
      attachments: merged.attachments,
      timer_state: merged.timer_state,
    });

    const { error } = await supabase
      .from("catatan_kerja")
      .update({
        judul: merged.judul,
        isi: structuredIsi,
        tanggal: merged.tanggal,
        durasi_menit: merged.durasi_menit,
      })
      .eq("id", id);

    if (error) throw error;

    // Sync upcoming work if connected
    if (merged.upcoming_work_id) {
      if (merged.status === "selesai" && merged.progress >= 100) {
        try {
          await updateUpcomingWork(merged.upcoming_work_id, { status: "selesai" });
        } catch (err) {
          console.warn("Sync upcoming work error:", err);
        }
      } else if (merged.status === "berjalan") {
        try {
          await updateUpcomingWork(merged.upcoming_work_id, { status: "berjalan" });
        } catch (err) {
          console.warn("Sync upcoming work error:", err);
        }
      }
    }
  }
}

/**
 * Delete a work log and associated attachments
 */
export async function deleteWorkLog(item: WorkLog): Promise<void> {
  const useWorkLogs = await checkWorkLogsTable();

  if (item.attachments && item.attachments.length > 0) {
    for (const att of item.attachments) {
      try {
        await deleteAttachmentFile(att.path);
      } catch (err) {
        console.warn("Could not delete attachment file:", err);
      }
    }
  }

  if (useWorkLogs) {
    const { error } = await supabase.from("work_logs").delete().eq("id", item.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("catatan_kerja").delete().eq("id", item.id);
    if (error) throw error;
  }
}

/**
 * Persist timer state to Supabase so it remains 100% accurate across refreshes
 */
export async function saveWorkLogTimerState(
  logId: string,
  timerState: WorkLogTimerState,
  currentDurasiMenit: number,
): Promise<void> {
  await updateWorkLog(logId, {
    timer_state: timerState,
    durasi_menit: currentDurasiMenit,
    ...(timerState.is_running ? { status: "berjalan" as const } : {}),
  });
}

/**
 * One-click helper: Start work from an upcoming plan
 * Automatically creates a work log with linked upcoming_work_id and starts the timer
 */
export async function startWorkFromUpcoming(
  upcoming: {
    id: string;
    judul: string;
    deskripsi?: string;
    prioritas?: WorkLogPriority;
  },
  userId?: string,
): Promise<WorkLog> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
    2,
    "0",
  )}`;

  const payload: WorkLogPayload = {
    judul: upcoming.judul,
    deskripsi: upcoming.deskripsi || "",
    tanggal: today,
    waktu_mulai: startTime,
    durasi_menit: 0,
    status: "berjalan",
    progress: 10,
    kategori: "Development",
    prioritas: upcoming.prioritas || "sedang",
    upcoming_work_id: upcoming.id,
    upcoming_work_judul: upcoming.judul,
    timer_state: {
      is_running: true,
      started_at: now.toISOString(),
      accumulated_seconds: 0,
    },
  };

  const created = await createWorkLog(payload, userId);

  // Update upcoming work to 'berjalan'
  try {
    await updateUpcomingWork(upcoming.id, { status: "berjalan" });
  } catch (err) {
    console.warn("Failed to mark upcoming as running:", err);
  }

  return created;
}

/**
 * Upload attachment to Supabase Storage
 */
export async function uploadAttachmentFile(file: File, userId?: string): Promise<WorkAttachment> {
  const userFolder = userId ?? "umum";
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userFolder}/${Date.now()}-${cleanName}`;

  // Try bucket 'berkas'
  const bucket = "berkas";
  const uploadRes = await supabase.storage.from(bucket).upload(path, file);

  if (uploadRes.error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${uploadRes.error.message}`);
  }

  // Generate signed URL
  const { data: urlData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    path: `${bucket}::${path}`,
    size: file.size,
    type: file.type || "application/octet-stream",
    url: urlData?.signedUrl,
    created_at: new Date().toISOString(),
  };
}

/**
 * Get signed URL for attachment download/view
 */
export async function getAttachmentUrl(pathWithBucket: string): Promise<string | null> {
  let bucket = "berkas";
  let path = pathWithBucket;

  if (pathWithBucket.includes("::")) {
    const parts = pathWithBucket.split("::");
    bucket = parts[0] ?? "berkas";
    path = parts[1] ?? pathWithBucket;
  } else if (pathWithBucket.startsWith("work-attachments/")) {
    path = pathWithBucket.replace("work-attachments/", "");
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Delete attachment file from storage
 */
export async function deleteAttachmentFile(pathWithBucket: string): Promise<void> {
  let bucket = "berkas";
  let path = pathWithBucket;

  if (pathWithBucket.includes("::")) {
    const parts = pathWithBucket.split("::");
    bucket = parts[0] ?? "berkas";
    path = parts[1] ?? pathWithBucket;
  } else if (pathWithBucket.startsWith("work-attachments/")) {
    path = pathWithBucket.replace("work-attachments/", "");
  }

  await supabase.storage.from(bucket).remove([path]);
}
