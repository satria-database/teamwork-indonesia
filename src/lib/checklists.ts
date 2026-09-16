import { supabase } from "@/lib/supabase";
import { updateWorkLog } from "@/lib/workLogs";

export interface ChecklistItem {
  id: string;
  work_log_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Checks if work_checklists table is available in Supabase
 */
let hasChecklistsTable: boolean | null = null;
export async function checkChecklistsTable(): Promise<boolean> {
  if (hasChecklistsTable !== null) return hasChecklistsTable;
  try {
    const { error } = await supabase.from("work_checklists").select("id").limit(1);
    hasChecklistsTable = !error;
    return hasChecklistsTable;
  } catch {
    hasChecklistsTable = false;
    return false;
  }
}

/**
 * Fetch all checklist items for a work log, ordered by sort_order
 */
export async function fetchChecklists(workLogId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from("work_checklists")
    .select("*")
    .eq("work_log_id", workLogId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ChecklistItem[];
}

/**
 * Create a new checklist item
 */
export async function createChecklist(
  workLogId: string,
  title: string,
  sortOrder: number,
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from("work_checklists")
    .insert({
      work_log_id: workLogId,
      title,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChecklistItem;
}

/**
 * Update a checklist item (title or sort_order)
 */
export async function updateChecklist(
  id: string,
  updates: { title?: string; sort_order?: number },
): Promise<void> {
  const updateObj: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) updateObj["title"] = updates.title;
  if (updates.sort_order !== undefined) updateObj["sort_order"] = updates.sort_order;

  const { error } = await supabase.from("work_checklists").update(updateObj).eq("id", id);
  if (error) throw error;
}

/**
 * Toggle a checklist item's completion status
 */
export async function toggleChecklist(id: string, isCompleted: boolean): Promise<void> {
  const updateObj: Record<string, unknown> = {
    is_completed: isCompleted,
    updated_at: new Date().toISOString(),
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("work_checklists").update(updateObj).eq("id", id);
  if (error) throw error;
}

/**
 * Delete a checklist item
 */
export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase.from("work_checklists").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Recalculate progress from checklist items and sync to work log
 * Returns the calculated progress (0-100)
 */
export async function syncWorkLogProgress(workLogId: string): Promise<number> {
  const { data, error } = await supabase
    .from("work_checklists")
    .select("is_completed")
    .eq("work_log_id", workLogId);

  if (error) throw error;

  const items = data || [];
  const total = items.length;
  const completed = items.filter((item: { is_completed: boolean }) => item.is_completed).length;

  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  await updateWorkLog(workLogId, { progress });

  return progress;
}
