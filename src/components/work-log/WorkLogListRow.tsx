import { useState } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  Activity,
  AlertCircle,
  Edit2,
  Trash2,
  Tag as TagIcon,
  FolderKanban,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAttachmentUrl, type WorkLog } from "@/lib/workLogs";
import { WorkChecklist } from "@/components/work-log/WorkChecklist";
import { toast } from "sonner";

interface Props {
  log: WorkLog;
  onEdit: (log: WorkLog) => void;
  onDelete: (log: WorkLog) => void;
  isAdmin?: boolean;
  defaultExpanded?: boolean;
}

export function WorkLogListRow({
  log,
  onEdit,
  onDelete,
  isAdmin = true,
  defaultExpanded = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  const handleDownloadAttachment = async (path: string, filename: string) => {
    try {
      setDownloadingPath(path);
      const url = await getAttachmentUrl(path);
      if (!url) {
        toast.error("Gagal mendapatkan link berkas");
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh berkas");
    } finally {
      setDownloadingPath(null);
    }
  };

  const getStatusBadge = () => {
    if (log.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/70 dark:border-rose-800/70 shrink-0">
          <AlertTriangle className="size-2.5 sm:size-3 text-rose-500" />
          Terlambat
        </span>
      );
    }

    switch (log.status) {
      case "selesai":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/70 shrink-0">
            <CheckCircle2 className="size-2.5 sm:size-3" />
            Selesai
          </span>
        );
      case "berjalan":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-800/70 shrink-0">
            <Activity className="size-2.5 sm:size-3 animate-pulse text-amber-500" />
            Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
            <AlertCircle className="size-2.5 sm:size-3" />
            Belum Mulai
          </span>
        );
    }
  };

  const getPriorityBadge = () => {
    switch (log.prioritas) {
      case "tinggi":
        return (
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200/80 dark:border-rose-800 shrink-0">
            Tinggi
          </span>
        );
      case "rendah":
        return (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
            Rendah
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800 shrink-0">
            Sedang
          </span>
        );
    }
  };

  return (
    <div
      id={`work-log-item-${log.id}`}
      className={`rounded-xl border transition-all duration-150 bg-white dark:bg-slate-900 overflow-hidden ${
        isExpanded
          ? "border-slate-300 dark:border-slate-700 shadow-xs"
          : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* 1. Header Bar / Collapsed Row (Compact) */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="py-2.5 px-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Left Section: Chevron + Badges + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Chevron Dropdown Indicator Button */}
          <button
            type="button"
            className={`size-6 sm:size-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
              isExpanded
                ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700"
            }`}
            aria-label={isExpanded ? "Tutup detail" : "Buka dropdown detail"}
          >
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <div className="min-w-0 flex-1 space-y-0.5">
            {/* Badges & Category */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {getStatusBadge()}
              {getPriorityBadge()}
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                <FolderKanban className="size-2.5 sm:size-3" />
                {log.kategori}
              </span>

              {log.upcoming_work_id && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/50">
                  <Sparkles className="size-2.5 text-amber-500" />
                  Rencana
                </span>
              )}
            </div>

            {/* Title */}
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                {log.judul}
              </h3>
              {log.link_url && (
                <span title="Terdapat tautan terkait">
                  <ExternalLink className="size-3 text-slate-400 shrink-0" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Date, Duration, Progress & Actions (Compact) */}
        <div
          className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 pt-1.5 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tanggal & Waktu */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs">
              <Calendar className="size-3 text-slate-400" />
              <span>{log.tanggal}</span>
            </div>

            {log.waktu_mulai && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="size-3 text-slate-400" />
                  <span>
                    {log.waktu_mulai}
                    {log.waktu_selesai ? ` - ${log.waktu_selesai}` : ""}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar & percentage */}
          <div className="flex items-center gap-1.5">
            <div className="w-12 hidden sm:block">
              <Progress value={log.progress} className="h-1" />
            </div>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                log.progress === 100
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              }`}
            >
              {log.progress}%
            </span>
          </div>

          {/* Attachments Indicator */}
          {log.attachments && log.attachments.length > 0 && (
            <div
              className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0"
              title={`${log.attachments.length} lampiran`}
            >
              <Paperclip className="size-2.5 text-slate-400" />
              <span>{log.attachments.length}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="rounded-lg text-xs font-medium h-7 px-2.5 gap-1 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>{isExpanded ? "Tutup" : "Detail"}</span>
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>

            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(log)}
                  className="rounded-lg size-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit Catatan"
                >
                  <Edit2 className="size-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(log)}
                  className="rounded-lg size-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Hapus Catatan"
                >
                  <Trash2 className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Expanded Dropdown Detail Section (Compact Spacing & Gaps) */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-3 sm:p-4 space-y-3 animate-in fade-in-50 duration-150">
          {/* Uraian / Deskripsi Pekerjaan */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Uraian / Deskripsi Pekerjaan
            </h4>
            {log.deskripsi ? (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
                {log.deskripsi}
              </p>
            ) : (
              <p className="text-xs italic text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                Tidak ada deskripsi rinci untuk pekerjaan ini.
              </p>
            )}
          </div>

          {/* Catatan Hasil Kerja (Work Result) if any */}
          {log.catatan_hasil && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FileCheck className="size-3" />
                Catatan Hasil / Output Pekerjaan
              </h4>
              <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-line">
                {log.catatan_hasil}
              </div>
            </div>
          )}

          {/* Checklist Pekerjaan */}
          <WorkChecklist workLogId={log.id} isAdmin={isAdmin} />

          {/* Detail Waktu Pengerjaan (Compact Grid) */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Waktu Pengerjaan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Tanggal</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {log.tanggal}
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Waktu Mulai</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {log.waktu_mulai || "-"}
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Waktu Selesai</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {log.waktu_selesai || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Lampiran Berkas if any */}
          {log.attachments && log.attachments.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Paperclip className="size-3" />
                Lampiran Berkas ({log.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {log.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="size-3.5 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Math.round(att.size / 1024)} KB
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={downloadingPath === att.path}
                      onClick={() => handleDownloadAttachment(att.path, att.name)}
                      className="size-6 p-0 rounded text-slate-500 hover:text-indigo-600 shrink-0"
                      title="Unduh / Buka Berkas"
                    >
                      <Download className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Link & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {/* Tags */}
            {log.tags && log.tags.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                <TagIcon className="size-2.5 text-slate-400 mr-0.5" />
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* External URL */}
            {log.link_url && (
              <a
                href={log.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-800/60"
              >
                <ExternalLink className="size-3" />
                Buka Tautan Eksternal
              </a>
            )}
          </div>

          {/* Bottom Actions inside Dropdown Detail */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-7 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2"
              >
                Tutup Detail
              </Button>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(log)}
                  className="rounded-lg text-xs font-medium h-7 px-2.5 gap-1 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                >
                  <Edit2 className="size-3" />
                  Edit Catatan
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(log)}
                  className="rounded-lg text-xs font-medium h-7 px-2.5 gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="size-3" />
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
