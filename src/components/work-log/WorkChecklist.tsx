import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ListChecks,
  Plus,
  ChevronDown,
  Check,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  type ChecklistItem,
  fetchChecklists,
  createChecklist,
  updateChecklist,
  toggleChecklist,
  deleteChecklist,
  syncWorkLogProgress,
} from "@/lib/checklists";

interface WorkChecklistProps {
  workLogId: string;
  isAdmin: boolean;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkChecklist({ workLogId, isAdmin }: WorkChecklistProps) {
  const qc = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["work_checklists", workLogId],
    queryFn: () => fetchChecklists(workLogId),
    retry: false,
  });

  const completedCount = items.filter((item) => item.is_completed).length;
  const totalCount = items.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["work_checklists", workLogId] });
    qc.invalidateQueries({ queryKey: ["work_logs"] });
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      await toggleChecklist(id, isCompleted);
      await syncWorkLogProgress(workLogId);
    },
    onSuccess: () => {
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message || "Gagal mengubah status checklist"),
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const sortOrder = items.length;
      await createChecklist(workLogId, title, sortOrder);
      await syncWorkLogProgress(workLogId);
    },
    onSuccess: () => {
      invalidateAll();
      setNewTitle("");
      setShowAddForm(false);
      toast.success("Checklist berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message || "Gagal menambah checklist"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await updateChecklist(id, { title });
    },
    onSuccess: () => {
      invalidateAll();
      setEditingId(null);
      toast.success("Checklist berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message || "Gagal memperbarui checklist"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteChecklist(id);
      await syncWorkLogProgress(workLogId);
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteConfirmId(null);
      toast.success("Checklist berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message || "Gagal menghapus checklist"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
      const index = sorted.findIndex((item) => item.id === id);
      if (index === -1) return;
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return;

      const itemA = sorted[index]!;
      const itemB = sorted[swapIndex]!;

      await updateChecklist(itemA.id, { sort_order: itemB.sort_order });
      await updateChecklist(itemB.id, { sort_order: itemA.sort_order });
    },
    onSuccess: () => {
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message || "Gagal mengatur urutan"),
  });

  const handleAddSubmit = () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error("Nama checklist tidak boleh kosong");
      return;
    }
    createMutation.mutate(title);
  };

  const handleEditSubmit = (item: ChecklistItem) => {
    const title = editTitle.trim();
    if (!title) {
      toast.error("Nama checklist tidak boleh kosong");
      return;
    }
    if (title === item.title) {
      setEditingId(null);
      return;
    }
    updateMutation.mutate({ id: item.id, title });
  };

  return (
    <div className="space-y-1">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <ListChecks className="size-3.5 text-fuchsia-500" />
          <span>Checklist Pekerjaan</span>
          <ChevronDown
            className={`size-3 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
          />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {completedCount} / {totalCount} selesai
          </span>
          {isAdmin && !isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="h-6 px-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1"
            >
              <Plus className="size-3" />
              Tambah
            </Button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-2">
          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  progress === 100
                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                    : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {progress}%
              </span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-3 text-[11px] text-slate-400">
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
              Memuat checklist...
            </div>
          )}

          {/* Empty State */}
          {!isLoading && totalCount === 0 && !showAddForm && (
            <p className="text-xs italic text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
              Belum ada checklist untuk pekerjaan ini.
            </p>
          )}

          {/* Add Form */}
          {showAddForm && isAdmin && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/70 dark:border-slate-800">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubmit();
                  }
                  if (e.key === "Escape") {
                    setShowAddForm(false);
                    setNewTitle("");
                  }
                }}
                placeholder="Nama checklist baru..."
                autoFocus
                className="h-8 text-xs rounded-lg"
              />
              <Button
                size="sm"
                onClick={handleAddSubmit}
                disabled={createMutation.isPending}
                className="h-8 px-3 text-xs rounded-lg shrink-0"
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Simpan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle("");
                }}
                className="h-8 px-2 text-xs rounded-lg shrink-0 text-slate-500"
              >
                Batal
              </Button>
            </div>
          )}

          {/* Checklist Items */}
          {!isLoading &&
            items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 group"
              >
                {/* Checkbox */}
                <div className="pt-0.5">
                  <Checkbox
                    checked={item.is_completed}
                    disabled={!isAdmin || toggleMutation.isPending}
                    onCheckedChange={(checked) => {
                      toggleMutation.mutate({
                        id: item.id,
                        isCompleted: checked === true,
                      });
                    }}
                    className={`data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 ${!isAdmin ? "opacity-60" : ""}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEditSubmit(item);
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        className="h-7 text-xs rounded-lg"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEditSubmit(item)}
                        disabled={updateMutation.isPending}
                        className="h-7 px-2 text-xs rounded-lg shrink-0"
                      >
                        <Check className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="h-7 px-2 text-xs rounded-lg shrink-0 text-slate-500"
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`text-xs font-medium ${
                          item.is_completed
                            ? "text-slate-400 dark:text-slate-500 line-through"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span className="text-slate-400 dark:text-slate-500 mr-1">
                          {index + 1}.
                        </span>
                        {item.title}
                      </p>

                      {/* Status & Timestamp */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {item.is_completed ? (
                          <>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Selesai
                            </span>
                            {item.completed_at && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                  <Clock className="size-2.5" />
                                  {formatTimestamp(item.completed_at)}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-medium">
                            Belum Mulai
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && editingId !== item.id && deleteConfirmId !== item.id && (
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="size-6 p-0 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Pindah ke atas"
                    >
                      <ArrowUp className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })}
                      disabled={index === items.length - 1 || reorderMutation.isPending}
                      className="size-6 p-0 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Pindah ke bawah"
                    >
                      <ArrowDown className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditTitle(item.title);
                      }}
                      className="size-6 p-0 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Edit checklist"
                    >
                      <Edit2 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="size-6 p-0 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Hapus checklist"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirmId === item.id && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="h-7 px-2 text-[11px] rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "Hapus"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(null)}
                      className="h-7 px-2 text-[11px] rounded-lg text-slate-500"
                    >
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
