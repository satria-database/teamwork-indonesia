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
  Eye,
  Tag as TagIcon,
  FolderKanban,
  Sparkles,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type WorkLog } from "@/lib/workLogs";

interface Props {
  log: WorkLog;
  onViewDetail: (log: WorkLog) => void;
  onEdit: (log: WorkLog) => void;
  onDelete: (log: WorkLog) => void;
  isAdmin?: boolean;
}

export function WorkLogCard({ log, onViewDetail, onEdit, onDelete, isAdmin = true }: Props) {
  const getStatusPill = () => {
    if (log.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200/70 dark:border-rose-800/70">
          <AlertTriangle className="size-3 text-rose-500" />
          Terlambat
        </span>
      );
    }

    switch (log.status) {
      case "selesai":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/70">
            <CheckCircle2 className="size-3" />
            Selesai
          </span>
        );
      case "berjalan":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-800/70">
            <Activity className="size-3 animate-pulse text-amber-500" />
            Sedang Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            <AlertCircle className="size-3" />
            Belum Mulai
          </span>
        );
    }
  };

  const getPriorityPill = () => {
    switch (log.prioritas) {
      case "tinggi":
        return (
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            Tinggi
          </span>
        );
      case "rendah":
        return (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            Rendah
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            Sedang
          </span>
        );
    }
  };

  return (
    <div
      id={`work-log-card-${log.id}`}
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 group"
    >
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusPill()}
            {getPriorityPill()}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
              <FolderKanban className="size-3" />
              {log.kategori}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Calendar className="size-3.5" />
            <span>{log.tanggal}</span>
          </div>
        </div>

        {/* Source Badge if from Upcoming Work */}
        {log.upcoming_work_id && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
            <Sparkles className="size-3 text-amber-500" />
            <span>Berawal dari Pekerjaan Mendatang</span>
          </div>
        )}

        {/* Title & Description */}
        <div className="cursor-pointer" onClick={() => onViewDetail(log)}>
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors flex items-center gap-1.5">
            <span>{log.judul}</span>
            {log.link_url && <ExternalLink className="size-3 text-slate-400 inline shrink-0" />}
          </h3>

          {log.deskripsi && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {log.deskripsi}
            </p>
          )}

          {/* Catatan Hasil Preview if filled */}
          {log.catatan_hasil && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5 line-clamp-1">
              <FileCheck className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="font-medium text-slate-700 dark:text-slate-200">Hasil:</span>
              <span className="truncate">{log.catatan_hasil}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Progres</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {log.progress}%
            </span>
          </div>
          <Progress value={log.progress} className="h-1.5" />
        </div>

        {/* Meta details: Time & Duration */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 border-t border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            {log.waktu_mulai ? (
              <>
                <Clock className="size-3.5 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {log.waktu_mulai}
                  {log.waktu_selesai ? ` - ${log.waktu_selesai}` : ""}
                </span>
              </>
            ) : (
              <span>{log.tanggal}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {log.attachments && log.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Paperclip className="size-3 text-slate-400" />
                <span>{log.attachments.length} berkas</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {log.tags && log.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <TagIcon className="size-3 text-slate-300" />
            {log.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetail(log)}
          className="rounded-full text-xs font-semibold h-8 px-3 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
        >
          <Eye className="size-3 mr-1" /> Detail
        </Button>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(log)}
                className="rounded-full size-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Edit Log"
              >
                <Edit2 className="size-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(log)}
                className="rounded-full size-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Hapus Log"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
