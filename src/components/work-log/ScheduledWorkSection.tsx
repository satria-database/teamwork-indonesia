import { useState } from "react";
import {
  CalendarClock,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Calendar,
  Sparkles,
  NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type UpcomingWork } from "@/lib/upcomingWork";
import { type WorkLog } from "@/lib/workLogs";

interface Props {
  scheduledWorks: UpcomingWork[];
  existingLogs: WorkLog[];
  onStartWork: (upcoming: UpcomingWork) => Promise<void>;
  onViewDetailForLog: (log: WorkLog) => void;
  isAdmin?: boolean;
}

export function ScheduledWorkSection({
  scheduledWorks,
  existingLogs,
  onStartWork,
  onViewDetailForLog,
  isAdmin = true,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (scheduledWorks.length === 0) {
    return null;
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleStart = async (upcoming: UpcomingWork) => {
    setLoadingId(upcoming.id);
    try {
      await onStartWork(upcoming);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      id="scheduled-work-section"
      className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-amber-500/10 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/30 rounded-3xl p-5 sm:p-6 border border-amber-200/70 dark:border-amber-800/60 shadow-xs space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <CalendarClock className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                Pekerjaan Terjadwal
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                {scheduledWorks.length} Siap Dikerjakan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rencana pekerjaan yang targetnya hari ini atau telah melewati tenggat. Klik
              &quot;Mulai Pekerjaan&quot; untuk langsung merekam log kerja dan waktu pengerjaan.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Scheduled Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {scheduledWorks.map((item) => {
          // Find if a work log already exists for this upcoming work
          const linkedLog = existingLogs.find((l) => l.upcoming_work_id === item.id);
          const isToday = item.tenggat === todayStr;
          const isOverdue = Boolean(item.tenggat && item.tenggat < todayStr);

          return (
            <div
              key={item.id}
              id={`scheduled-item-${item.id}`}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-amber-100 dark:border-slate-800/80 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700/70 transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Due Date Indicator */}
                  {isToday ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Calendar className="size-3" />
                      Target Hari Ini
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <AlertTriangle className="size-3 text-rose-500" />
                      Terlambat (Tenggat: {item.tenggat})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      <Calendar className="size-3" />
                      Tenggat: {item.tenggat}
                    </span>
                  )}

                  {/* Priority Badge */}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.prioritas === "tinggi"
                        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                        : item.prioritas === "rendah"
                          ? "text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          : "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    Prioritas {item.prioritas}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {item.judul}
                </h4>

                {item.deskripsi && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.deskripsi}
                  </p>
                )}
              </div>

              {/* Bottom Status / Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {linkedLog ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Activity className="size-3.5 animate-pulse" />
                      <span>Sedang dikerjakan ({linkedLog.progress}%)</span>
                    </div>

                    {isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => onViewDetailForLog(linkedLog)}
                        className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold h-8 px-3.5 gap-1.5 shadow-2xs"
                      >
                        <NotebookPen className="size-3" />
                        Lihat Log Kerja
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-[11px] text-slate-400">Rencana siap direalisasikan</div>

                    {isAdmin && (
                      <Button
                        size="sm"
                        disabled={loadingId === item.id}
                        onClick={() => handleStart(item)}
                        className="rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold h-8 px-4 gap-1.5 shadow-xs transition-all"
                      >
                        <Play className="size-3 fill-current" />
                        {loadingId === item.id ? "Memulai..." : "Mulai Pekerjaan"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
