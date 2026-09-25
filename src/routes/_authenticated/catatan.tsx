import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  NotebookPen,
  Clock,
  Sparkles,
  SlidersHorizontal,
  FolderKanban,
  CheckCircle2,
  Upload,
  History,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CatatanViewer, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  type WorkLog,
  type WorkLogPayload,
  fetchWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  startWorkFromUpcoming,
} from "@/lib/workLogs";
import { fetchUpcomingWorks, type UpcomingWork } from "@/lib/upcomingWork";
import { WorkLogSummary } from "@/components/work-log/WorkLogSummary";
import { WorkLogFilter } from "@/components/work-log/WorkLogFilter";
import { WorkLogListRow } from "@/components/work-log/WorkLogListRow";
import { WorkLogFormDialog } from "@/components/work-log/WorkLogFormDialog";
import { WorkLogDetailDialog } from "@/components/work-log/WorkLogDetailDialog";
import { ScheduledWorkSection } from "@/components/work-log/ScheduledWorkSection";
import { WorkLogImportDialog } from "@/components/work-log/WorkLogImportDialog";
import { downloadWorkLogTemplate } from "@/lib/workLogImport";

export const Route = createFileRoute("/_authenticated/catatan")({ component: Catatan });

function Catatan() {
  const { isAdmin, user, effectiveUserId } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [prioritasFilter, setPrioritasFilter] = useState("semua");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [tanggalFilter, setTanggalFilter] = useState("");

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [detailLog, setDetailLog] = useState<WorkLog | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Fetch Work Logs
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: [
      "work_logs",
      {
        search,
        status: statusFilter,
        prioritas: prioritasFilter,
        kategori: kategoriFilter,
        tanggal: tanggalFilter,
      },
    ],
    queryFn: () =>
      fetchWorkLogs(
        {
          search,
          status: statusFilter,
          prioritas: prioritasFilter,
          kategori: kategoriFilter,
          tanggal: tanggalFilter,
        },
        effectiveUserId ?? undefined,
      ),
  });

  // Fetch Scheduled Upcoming Works (target date <= today and not finished)
  const { data: scheduledUpcoming = [] } = useQuery({
    queryKey: ["upcoming_works", "due_or_overdue"],
    queryFn: () => fetchUpcomingWorks({ onlyDueOrOverdue: true }, effectiveUserId ?? undefined),
  });

  // Mutate: Create or Edit Work Log
  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }: { payload: WorkLogPayload; id?: string }) => {
      if (id) {
        await updateWorkLog(id, payload);
      } else {
        await createWorkLog(payload, effectiveUserId ?? undefined);
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["work_logs"] });
      qc.invalidateQueries({ queryKey: ["upcoming_works"] });
      qc.invalidateQueries({ queryKey: ["catatan_kerja"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
      qc.invalidateQueries({ queryKey: ["appshell_counts"] });
      toast.success(
        variables.id
          ? "Catatan pekerjaan berhasil diperbarui"
          : "Catatan pekerjaan baru berhasil disimpan",
      );
      setEditingLog(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan catatan pekerjaan");
    },
  });

  // Mutate: Delete Work Log
  const deleteMutation = useMutation({
    mutationFn: async (log: WorkLog) => {
      await deleteWorkLog(log);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_logs"] });
      qc.invalidateQueries({ queryKey: ["upcoming_works"] });
      qc.invalidateQueries({ queryKey: ["catatan_kerja"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      qc.invalidateQueries({ queryKey: ["appshell_counts"] });
      toast.success("Catatan pekerjaan berhasil dihapus");
      if (detailLog) setDetailLog(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus catatan pekerjaan");
    },
  });

  // Start Work from Upcoming Work item
  const handleStartUpcomingWork = async (upcoming: UpcomingWork) => {
    try {
      const createdLog = await startWorkFromUpcoming(upcoming, user?.id);
      qc.invalidateQueries({ queryKey: ["work_logs"] });
      qc.invalidateQueries({ queryKey: ["upcoming_works"] });
      qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
      toast.success(`Pekerjaan "${upcoming.judul}" berhasil dimasukkan ke Log Kerja!`);
      handleOpenEditModal(createdLog);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memulai pekerjaan terjadwal");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("semua");
    setPrioritasFilter("semua");
    setKategoriFilter("semua");
    setTanggalFilter("");
  };

  const handleOpenCreateModal = () => {
    setEditingLog(null);
    setFormOpen(true);
  };

  const handleOpenEditModal = (log: WorkLog) => {
    setEditingLog(log);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          judul="Catatan Pekerjaan"
          deskripsi="Daily Work Log pekerjaan yang belum mulai, sedang berjalan, dan telah selesai dikerjakan."
        />

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="rounded-full text-xs font-semibold h-10"
              >
                <Upload data-icon="inline-start" /> Upload Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadWorkLogTemplate()}
                className="rounded-full text-xs font-semibold h-10"
              >
                <Download data-icon="inline-start" /> Template
              </Button>
            </>
          )}
          {isAdmin && (
            <Button
              id="btn-tambah-catatan-pekerjaan"
              onClick={handleOpenCreateModal}
              className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5 h-10 shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Plus className="size-4 mr-1.5" />
              Catat Pekerjaan
            </Button>
          )}
        </div>
      </div>

      {/* Viewer Warning if not Admin */}
      {!isAdmin && <CatatanViewer />}

      {/* 1. Summary Cards */}
      <WorkLogSummary logs={logs} />

      {/* 2. Scheduled Work Section (from Pekerjaan Mendatang) */}
      <ScheduledWorkSection
        scheduledWorks={scheduledUpcoming}
        existingLogs={logs}
        onStartWork={handleStartUpcomingWork}
        onViewDetailForLog={setDetailLog}
        isAdmin={isAdmin}
      />

      {/* 3. Filter & Search Bar */}
      <WorkLogFilter
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        prioritas={prioritasFilter}
        onPrioritasChange={setPrioritasFilter}
        kategori={kategoriFilter}
        onKategoriChange={setKategoriFilter}
        tanggal={tanggalFilter}
        onTanggalChange={setTanggalFilter}
        onReset={handleResetFilters}
      />

      {/* 4. List of Work Logs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <NotebookPen className="size-4 text-fuchsia-500" />
            <span>Daftar Log Pekerjaan</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({logs.length} ditampilkan)
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingLogs && (
          <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            Memuat catatan pekerjaan...
          </div>
        )}

        {/* List of Work Logs with Dropdown Detail */}
        {!isLoadingLogs && logs.length > 0 && (
          <div className="space-y-2">
            {logs.map((log) => (
              <WorkLogListRow
                key={log.id}
                log={log}
                onEdit={handleOpenEditModal}
                onDelete={(l) => deleteMutation.mutate(l)}
                isAdmin={isAdmin}
                defaultExpanded={false}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingLogs && logs.length === 0 && (
          <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="size-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 mx-auto flex items-center justify-center">
              <NotebookPen className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum ada catatan pekerjaan
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mulai rekam pekerjaan harian Anda, pantau progres waktu pengerjaan, dan lampirkan
              berkas hasil kerja.
            </p>
            {isAdmin && (
              <Button
                onClick={handleOpenCreateModal}
                className="mt-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5"
              >
                <Plus className="size-4 mr-1.5" />
                Buat Catatan Pertama
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 5. Create / Edit Form Modal */}
      <WorkLogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingLog}
        onSubmit={async (payload, id) => {
          await saveMutation.mutateAsync(id ? { payload, id } : { payload });
        }}
      />

      <WorkLogImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        {...(user?.id ? { userId: user.id } : {})}
        onImported={() => qc.invalidateQueries({ queryKey: ["work_logs"] })}
      />

      {/* 6. Work Log Detail Modal */}
      <WorkLogDetailDialog
        log={detailLog}
        open={Boolean(detailLog)}
        onOpenChange={(open) => !open && setDetailLog(null)}
        onEdit={(log) => {
          setDetailLog(null);
          handleOpenEditModal(log);
        }}
        onDelete={(log) => {
          setDetailLog(null);
          deleteMutation.mutate(log);
        }}
        onViewUpcomingPlan={(upcomingId) => {
          navigate({ to: "/mendatang" });
        }}
      />
    </div>
  );
}
