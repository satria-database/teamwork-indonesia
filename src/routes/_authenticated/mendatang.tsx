import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  CalendarClock,
  Calendar,
  AlertCircle,
  Play,
  CheckCircle2,
  Activity,
  Edit2,
  Search,
  RotateCcw,
  Sparkles,
  Link2,
  ArrowRight,
  FolderKanban,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CatatanViewer, PageHeader } from "@/components/AppShell";
import { pageHead } from "@/lib/pageHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type UpcomingWork,
  type UpcomingWorkPayload,
  type UpcomingWorkStatus,
  type UpcomingWorkPriority,
  fetchUpcomingWorks,
  createUpcomingWork,
  updateUpcomingWork,
  deleteUpcomingWork,
} from "@/lib/upcomingWork";
import { fetchWorkLogs, startWorkFromUpcoming, type WorkLog } from "@/lib/workLogs";

export const Route = createFileRoute("/_authenticated/mendatang")({
  head: () =>
    pageHead("Pekerjaan Mendatang", "Pantau rencana pekerjaan yang akan datang di NOURA."),
  component: Mendatang,
});

function Mendatang() {
  const { isAdmin, user, effectiveUserId } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [prioritasFilter, setPrioritasFilter] = useState("semua");

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UpcomingWork | null>(null);

  // Form Fields
  const [formJudul, setFormJudul] = useState("");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formTenggat, setFormTenggat] = useState("");
  const [formPrioritas, setFormPrioritas] = useState<UpcomingWorkPriority>("sedang");
  const [formStatus, setFormStatus] = useState<UpcomingWorkStatus>("direncanakan");
  const [isSaving, setIsSaving] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Fetch Upcoming Works
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pekerjaan_mendatang", { search, status: statusFilter, prioritas: prioritasFilter }],
    queryFn: () =>
      fetchUpcomingWorks(
        {
          search,
          status: statusFilter,
          prioritas: prioritasFilter,
        },
        effectiveUserId ?? undefined,
      ),
  });

  // Fetch Work Logs to see relationships
  const { data: workLogs = [] } = useQuery({
    queryKey: ["work_logs", "relation_lookup"],
    queryFn: () => fetchWorkLogs(undefined, effectiveUserId ?? undefined),
  });

  // Summary Metrics
  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const total = items.length;
    const berjalan = items.filter((i) => i.status === "berjalan").length;
    const selesai = items.filter((i) => i.status === "selesai").length;
    const dueOrOverdue = items.filter(
      (i) => i.tenggat && i.tenggat <= today && i.status !== "selesai" && i.status !== "dibatalkan",
    ).length;

    return { total, berjalan, selesai, dueOrOverdue };
  }, [items]);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormJudul("");
    setFormDeskripsi("");
    setFormTenggat("");
    setFormPrioritas("sedang");
    setFormStatus("direncanakan");
    setFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: UpcomingWork) => {
    setEditingItem(item);
    setFormJudul(item.judul);
    setFormDeskripsi(item.deskripsi);
    setFormTenggat(item.tenggat || "");
    setFormPrioritas(item.prioritas);
    setFormStatus(item.status);
    setFormOpen(true);
  };

  // Save Form (Create / Edit)
  const handleSave = async () => {
    if (!formJudul.trim()) {
      toast.error("Judul rencana pekerjaan wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateUpcomingWork(editingItem.id, {
          judul: formJudul.trim(),
          deskripsi: formDeskripsi.trim(),
          tenggat: formTenggat || null,
          prioritas: formPrioritas,
          status: formStatus,
        });
        toast.success("Rencana pekerjaan berhasil diperbarui");
      } else {
        await createUpcomingWork(
          {
            judul: formJudul.trim(),
            deskripsi: formDeskripsi.trim(),
            tenggat: formTenggat || null,
            prioritas: formPrioritas,
            status: formStatus,
          },
          effectiveUserId ?? undefined,
        );
        toast.success("Rencana pekerjaan baru berhasil ditambahkan");
      }

      qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
      qc.invalidateQueries({ queryKey: ["upcoming_works"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      qc.invalidateQueries({ queryKey: ["appshell_counts"] });
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan rencana pekerjaan");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleDelete = async (item: UpcomingWork) => {
    if (!confirm(`Hapus rencana pekerjaan "${item.judul}"?`)) return;
    try {
      await deleteUpcomingWork(item.id);
      qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
      qc.invalidateQueries({ queryKey: ["upcoming_works"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      qc.invalidateQueries({ queryKey: ["appshell_counts"] });
      toast.success("Rencana pekerjaan berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus rencana");
    }
  };

  // Quick Start Work from Upcoming Plan
  const handleStartWork = async (item: UpcomingWork) => {
    setStartingId(item.id);
    try {
      await startWorkFromUpcoming(item, effectiveUserId ?? undefined);
      qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
      qc.invalidateQueries({ queryKey: ["upcoming_works"] });
      qc.invalidateQueries({ queryKey: ["work_logs"] });
      toast.success(`Pekerjaan "${item.judul}" dimulai! Mengalihkan ke Catatan Pekerjaan...`);
      navigate({ to: "/catatan" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memulai pekerjaan");
    } finally {
      setStartingId(null);
    }
  };

  const getStatusBadge = (s: UpcomingWorkStatus) => {
    switch (s) {
      case "selesai":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60";
      case "berjalan":
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60";
      case "dibatalkan":
        return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200";
      default:
        return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          judul="Pekerjaan Mendatang"
          deskripsi="Rencana pekerjaan, target tenggat waktu, dan backlog tugas yang siap direalisasikan ke Catatan Pekerjaan."
        />

        {isAdmin && (
          <Button
            id="btn-tambah-rencana"
            onClick={handleOpenCreate}
            className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5 h-10 shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-4 mr-1.5" />
            Tambah Rencana
          </Button>
        )}
      </div>

      {!isAdmin && <CatatanViewer />}

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Rencana
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {summary.total}
              </span>
              <span className="text-xs text-slate-400">rencana</span>
            </div>
          </div>
          <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarClock className="size-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
              Sedang Berjalan
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-500">
                {summary.berjalan}
              </span>
              <span className="text-xs text-slate-400">aktif</span>
            </div>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Activity className="size-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
              Rencana Selesai
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
                {summary.selesai}
              </span>
              <span className="text-xs text-slate-400">tuntas</span>
            </div>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
              Target Hari Ini / Lewat
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600">
                {summary.dueOrOverdue}
              </span>
              <span className="text-xs text-slate-400">perlu aksi</span>
            </div>
          </div>
          <div className="size-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari rencana pekerjaan..."
            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-10"
          />
        </div>

        <div className="w-full sm:w-44">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="direncanakan">Direncanakan</SelectItem>
              <SelectItem value="berjalan">Sedang Berjalan</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-44">
          <Select value={prioritasFilter} onValueChange={setPrioritasFilter}>
            <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10">
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="semua">Semua Prioritas</SelectItem>
              <SelectItem value="tinggi">Prioritas Tinggi</SelectItem>
              <SelectItem value="sedang">Prioritas Sedang</SelectItem>
              <SelectItem value="rendah">Prioritas Rendah</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(search || statusFilter !== "semua" || prioritasFilter !== "semua") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("semua");
              setPrioritasFilter("semua");
            }}
            className="text-xs text-rose-500 rounded-xl h-10 px-3 shrink-0"
          >
            <RotateCcw className="size-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* 3. Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            Memuat rencana pekerjaan...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center">
              <CalendarClock className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum ada rencana pekerjaan
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Susun target rencana kerja mendatang. Saat tenggat waktu tiba, rencana akan otomatis
              muncul di halaman Catatan Pekerjaan untuk langsung direalisasikan.
            </p>
            {isAdmin && (
              <Button
                onClick={handleOpenCreate}
                className="mt-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5"
              >
                <Plus className="size-4 mr-1.5" />
                Tambah Rencana Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const linkedLogs = workLogs.filter((wl) => wl.upcoming_work_id === item.id);
              const latestLog = linkedLogs[0];

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                            item.prioritas === "tinggi"
                              ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200"
                              : item.prioritas === "rendah"
                                ? "text-slate-500 bg-slate-100 border-slate-200"
                                : "text-blue-600 bg-blue-50 border-blue-200"
                          }`}
                        >
                          Prioritas {item.prioritas}
                        </span>
                      </div>

                      {/* Tenggat */}
                      {item.tenggat && (
                        <div
                          className={`flex items-center gap-1 text-[11px] font-medium ${
                            item.is_overdue
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : item.is_due_today
                                ? "text-amber-600 dark:text-amber-400 font-semibold"
                                : "text-slate-400"
                          }`}
                        >
                          <Calendar className="size-3.5" />
                          <span>{item.tenggat}</span>
                          {item.is_overdue && <span>(Lewat)</span>}
                          {item.is_due_today && <span>(Hari Ini)</span>}
                        </div>
                      )}
                    </div>

                    {/* Title & Deskripsi */}
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                        {item.judul}
                      </h3>
                      {item.deskripsi && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>

                    {/* Linked Work Log Banner if started */}
                    {latestLog && (
                      <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                          <Link2 className="size-3.5 shrink-0" />
                          <div>
                            <span className="font-semibold">Realisasi Log:</span>{" "}
                            <span className="capitalize">{latestLog.status}</span> (
                            {latestLog.progress}%)
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: "/catatan" })}
                          className="text-[11px] h-6 px-2 text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Buka Catatan <ArrowRight className="size-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit Rencana"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            className="size-8 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                            title="Hapus Rencana"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>

                    {isAdmin && item.status !== "selesai" && (
                      <Button
                        size="sm"
                        disabled={startingId === item.id}
                        onClick={() => handleStartWork(item)}
                        className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold h-8 px-4 gap-1.5 shadow-2xs"
                      >
                        <Play className="size-3 fill-current" />
                        <span>
                          {startingId === item.id
                            ? "Memulai..."
                            : item.status === "berjalan"
                              ? "Lanjutkan di Catatan"
                              : "Mulai Pekerjaan"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Form Dialog (Create / Edit) */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingItem ? "Edit Rencana Pekerjaan" : "Tambah Rencana Pekerjaan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Tentukan judul, deskripsi tugas, target tanggal penyelesaian, dan prioritas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Judul Rencana <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Integrasi payment gateway Midtrans"
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9.5"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi / Lingkup Tugas
              </label>
              <Textarea
                placeholder="Uraian rencana apa saja yang perlu disiapkan..."
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                rows={3}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Tenggat
                </label>
                <Input
                  type="date"
                  value={formTenggat}
                  onChange={(e) => setFormTenggat(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Prioritas
                </label>
                <Select
                  value={formPrioritas}
                  onValueChange={(v) => setFormPrioritas(v as UpcomingWorkPriority)}
                >
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="rendah">Rendah</SelectItem>
                    <SelectItem value="sedang">Sedang</SelectItem>
                    <SelectItem value="tinggi">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as UpcomingWorkStatus)}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="direncanakan">Direncanakan</SelectItem>
                  <SelectItem value="berjalan">Sedang Berjalan</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
              className="rounded-full text-xs h-9 px-4"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSaving || !formJudul.trim()}
              onClick={handleSave}
              className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold h-9 px-5"
            >
              {isSaving ? "Menyimpan..." : editingItem ? "Perbarui Rencana" : "Simpan Rencana"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
