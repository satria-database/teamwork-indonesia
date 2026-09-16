import { supabase } from "@/lib/supabase";

export type UpcomingWorkStatus = "direncanakan" | "berjalan" | "selesai" | "dibatalkan";
export type UpcomingWorkPriority = "rendah" | "sedang" | "tinggi";

export interface UpcomingWork {
  id: string;
  user_id?: string | undefined;
  judul: string;
  deskripsi: string;
  prioritas: UpcomingWorkPriority;
  tenggat: string | null; // YYYY-MM-DD
  status: UpcomingWorkStatus;
  created_at?: string | undefined;
  // Computed fields
  is_due_today: boolean;
  is_overdue: boolean;
  linked_work_log_id?: string | undefined;
}

export interface UpcomingWorkPayload {
  judul: string;
  deskripsi?: string;
  prioritas?: UpcomingWorkPriority;
  tenggat?: string | null;
  status?: UpcomingWorkStatus;
}

/**
 * Parses deskripsi and extracts metadata if stored as JSON
 */
export function parseUpcomingWorkDeskripsi(raw: string | null): {
  deskripsi: string;
  prioritas: UpcomingWorkPriority;
} {
  if (!raw) return { deskripsi: "", prioritas: "sedang" };
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return {
          deskripsi: parsed.deskripsi || parsed.text || "",
          prioritas: (parsed.prioritas as UpcomingWorkPriority) || "sedang",
        };
      }
    } catch {
      // fallback to plain string
    }
  }
  return { deskripsi: raw, prioritas: "sedang" };
}

/**
 * Formats deskripsi with priority metadata
 */
export function formatUpcomingWorkDeskripsi(
  deskripsi: string,
  prioritas: UpcomingWorkPriority,
): string {
  return JSON.stringify({
    deskripsi,
    prioritas,
  });
}

/**
 * Parses raw row from Supabase into UpcomingWork
 */
export function parseUpcomingWorkRow(row: {
  id: string;
  judul: string;
  deskripsi?: string | null;
  tenggat?: string | null;
  status: string;
  dibuat_oleh?: string | null;
  user_id?: string | null;
  created_at?: string;
}): UpcomingWork {
  const { deskripsi, prioritas } = parseUpcomingWorkDeskripsi(row.deskripsi ?? null);
  const today = new Date().toISOString().slice(0, 10);

  let is_due_today = false;
  let is_overdue = false;

  if (row.tenggat) {
    if (row.tenggat === today) {
      is_due_today = true;
    } else if (row.tenggat < today && row.status !== "selesai" && row.status !== "dibatalkan") {
      is_overdue = true;
    }
  }

  let status: UpcomingWorkStatus = "direncanakan";
  if (row.status === "selesai" || row.status === "completed") {
    status = "selesai";
  } else if (row.status === "berjalan" || row.status === "in_progress") {
    status = "berjalan";
  } else if (row.status === "dibatalkan" || row.status === "cancelled") {
    status = "dibatalkan";
  } else {
    status = "direncanakan";
  }

  return {
    id: row.id,
    user_id: row.user_id || row.dibuat_oleh || undefined,
    judul: row.judul,
    deskripsi,
    prioritas,
    tenggat: row.tenggat || null,
    status,
    created_at: row.created_at,
    is_due_today,
    is_overdue,
  };
}

/**
 * Fetch all upcoming work plans
 */
export async function fetchUpcomingWorks(
  filters?: {
    search?: string;
    status?: string;
    prioritas?: string;
    onlyDueOrOverdue?: boolean;
  },
  userId?: string,
): Promise<UpcomingWork[]> {
  let query = supabase
    .from("pekerjaan_mendatang")
    .select("*")
    .order("tenggat", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("dibuat_oleh", userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  let list = (data || []).map(parseUpcomingWorkRow);

  const today = new Date().toISOString().slice(0, 10);

  if (filters?.onlyDueOrOverdue) {
    list = list.filter(
      (item) =>
        item.tenggat &&
        item.tenggat <= today &&
        item.status !== "selesai" &&
        item.status !== "dibatalkan",
    );
  }

  if (filters?.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (item) => item.judul.toLowerCase().includes(q) || item.deskripsi.toLowerCase().includes(q),
    );
  }

  if (filters?.status && filters.status !== "semua") {
    list = list.filter((item) => item.status === filters.status);
  }

  if (filters?.prioritas && filters.prioritas !== "semua") {
    list = list.filter((item) => item.prioritas === filters.prioritas);
  }

  return list;
}

/**
 * Create a new upcoming work plan
 */
export async function createUpcomingWork(
  payload: UpcomingWorkPayload,
  userId?: string,
): Promise<UpcomingWork> {
  const deskripsiPayload = formatUpcomingWorkDeskripsi(
    payload.deskripsi || "",
    payload.prioritas || "sedang",
  );

  const { data, error } = await supabase
    .from("pekerjaan_mendatang")
    .insert({
      judul: payload.judul,
      deskripsi: deskripsiPayload,
      tenggat: payload.tenggat || null,
      status: payload.status || "direncanakan",
      dibuat_oleh: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return parseUpcomingWorkRow(data);
}

/**
 * Update an upcoming work plan
 */
export async function updateUpcomingWork(
  id: string,
  payload: Partial<UpcomingWorkPayload>,
): Promise<void> {
  // Fetch existing first to preserve deskripsi / prioritas if only one changed
  const { data: existing, error: fetchErr } = await supabase
    .from("pekerjaan_mendatang")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;

  const parsed = parseUpcomingWorkRow(existing);
  const newDeskripsi = payload.deskripsi !== undefined ? payload.deskripsi : parsed.deskripsi;
  const newPrioritas = payload.prioritas !== undefined ? payload.prioritas : parsed.prioritas;

  const updateObj: Record<string, unknown> = {
    deskripsi: formatUpcomingWorkDeskripsi(newDeskripsi, newPrioritas),
  };

  if (payload.judul !== undefined) updateObj["judul"] = payload.judul;
  if (payload.tenggat !== undefined) updateObj["tenggat"] = payload.tenggat || null;
  if (payload.status !== undefined) updateObj["status"] = payload.status;

  const { error } = await supabase.from("pekerjaan_mendatang").update(updateObj).eq("id", id);

  if (error) throw error;
}

/**
 * Delete an upcoming work plan
 */
export async function deleteUpcomingWork(id: string): Promise<void> {
  const { error } = await supabase.from("pekerjaan_mendatang").delete().eq("id", id);
  if (error) throw error;
}
