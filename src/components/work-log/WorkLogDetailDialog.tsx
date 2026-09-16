import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  ExternalLink,
  Download,
  Tag as TagIcon,
  Edit2,
  Trash2,
  FileIcon,
  CheckCircle2,
  Activity,
  AlertCircle,
  FolderKanban,
  Sparkles,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { type WorkLog, type WorkAttachment, getAttachmentUrl } from "@/lib/workLogs";
import { toast } from "sonner";

interface Props {
  log: WorkLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (log: WorkLog) => void;
  onDelete: (log: WorkLog) => void;
  onViewUpcomingPlan?: (upcomingId: string) => void;
}

export function WorkLogDetailDialog({
  log,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onViewUpcomingPlan,
}: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!log) return null;

  const handleDownloadAttachment = async (att: WorkAttachment) => {
    setDownloading(att.id);
    try {
      const signedUrl = await getAttachmentUrl(att.path);
      if (!signedUrl) {
        toast.error("Gagal mendapatkan tautan berkas.");
        return;
      }
      window.open(signedUrl, "_blank");
    } catch {
      toast.error("Gagal mengunduh berkas.");
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = () => {
    if (log.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="size-3.5 text-rose-500" /> Terlambat
        </span>
      );
    }

    switch (log.status) {
      case "selesai":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="size-3.5" /> Selesai
          </span>
        );
      case "berjalan":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Activity className="size-3.5" /> Sedang Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <AlertCircle className="size-3.5" /> Belum Mulai
          </span>
        );
    }
  };

  const getPriorityBadge = () => {
    switch (log.prioritas) {
      case "tinggi":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            Prioritas Tinggi
          </span>
        );
      case "rendah":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Prioritas Rendah
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Prioritas Sedang
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="work-log-detail-modal"
        className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {getStatusBadge()}
            {getPriorityBadge()}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <FolderKanban className="size-3" /> {log.kategori}
            </span>
          </div>

          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {log.judul}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detail lengkap catatan pekerjaan harian
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Source Banner if connected to Upcoming Work */}
          {log.upcoming_work_id && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                <Sparkles className="size-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold">Berawal dari Pekerjaan Mendatang</span>
                  {log.upcoming_work_judul && (
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                      Rencana: &quot;{log.upcoming_work_judul}&quot;
                    </p>
                  )}
                </div>
              </div>
              {onViewUpcomingPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onViewUpcomingPlan(log.upcoming_work_id!);
                  }}
                  className="rounded-full h-7 px-3 text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50"
                >
                  Lihat Rencana Asli
                </Button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Kemajuan Pengerjaan
              </span>
              <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400 text-sm">
                {log.progress}%
              </span>
            </div>
            <Progress value={log.progress} className="h-2" />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-2xs">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Tanggal
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Calendar className="size-3.5 text-indigo-500" />
                <span>{log.tanggal}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-2xs">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Rentang Waktu
              </span>
              <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {log.waktu_mulai || log.waktu_selesai ? (
                  <span>
                    {log.waktu_mulai || "--:--"} s/d {log.waktu_selesai || "--:--"}
                  </span>
                ) : (
                  <span className="text-slate-400">Belum ditentukan</span>
                )}
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          {log.deskripsi ? (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi / Uraian Pekerjaan
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {log.deskripsi}
              </div>
            </div>
          ) : null}

          {/* Catatan Hasil (Work Result) */}
          {log.catatan_hasil && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck className="size-3.5 text-emerald-500" />
                <span>Catatan Hasil Pengerjaan (Work Result)</span>
              </h4>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {log.catatan_hasil}
              </div>
            </div>
          )}

          {/* Link URL */}
          {log.link_url && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tautan Pekerjaan
              </h4>
              <a
                href={log.link_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-fuchsia-600 dark:text-fuchsia-400 hover:underline break-all"
              >
                <span>{log.link_url}</span>
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            </div>
          )}

          {/* Tags */}
          {log.tags && log.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tag</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    <TagIcon className="size-3 text-slate-400" />#{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lampiran Berkas */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Lampiran Berkas</span>
              <span className="text-slate-400 font-normal">
                ({log.attachments?.length || 0} berkas)
              </span>
            </h4>

            {log.attachments && log.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {log.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                        <FileIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "File"}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={downloading === att.id}
                      onClick={() => handleDownloadAttachment(att)}
                      className="size-8 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                      title="Unduh berkas"
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Tidak ada lampiran berkas.</p>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(log)}
              className="rounded-full text-xs font-semibold h-9 px-4 gap-1.5 flex-1 sm:flex-none border-slate-200 dark:border-slate-800"
            >
              <Edit2 className="size-3.5" /> Edit Log
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(log)}
              className="rounded-full text-xs font-semibold h-9 px-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
            >
              <Trash2 className="size-3.5" /> Hapus
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-semibold h-9 px-4"
            >
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
