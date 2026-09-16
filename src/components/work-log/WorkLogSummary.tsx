import { useMemo } from "react";
import { CheckCircle2, CalendarDays, Activity, ListTodo } from "lucide-react";
import { type WorkLog } from "@/lib/workLogs";

interface Props {
  logs: WorkLog[];
}

export function WorkLogSummary({ logs }: Props) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stats = useMemo(() => {
    const todayLogs = logs.filter((l) => l.tanggal === todayStr);
    const totalToday = todayLogs.length;
    const selesaiToday = todayLogs.filter((l) => l.status === "selesai").length;
    const berjalanToday = todayLogs.filter((l) => l.status === "berjalan").length;
    const belumMulaiToday = todayLogs.filter((l) => l.status === "belum_mulai").length;

    const persenSelesai = totalToday > 0 ? Math.round((selesaiToday / totalToday) * 100) : 0;

    return {
      totalToday,
      selesaiToday,
      berjalanToday,
      belumMulaiToday,
      persenSelesai,
    };
  }, [logs, todayStr]);

  return (
    <div id="work-log-summary-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Pekerjaan Hari Ini */}
      <div
        id="card-summary-total"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Hari Ini
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {stats.totalToday}
            </span>
            <span className="text-xs text-slate-400">log</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {stats.totalToday === 0 ? "Belum ada pekerjaan dicatat" : "Tercatat dalam sistem"}
          </p>
        </div>
        <div className="size-11 sm:size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <CalendarDays className="size-5 sm:size-6" />
        </div>
      </div>

      {/* 2. Pekerjaan Selesai */}
      <div
        id="card-summary-selesai"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Selesai
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.selesaiToday}
            </span>
            {stats.totalToday > 0 && (
              <span className="text-xs text-emerald-600/80 font-medium">
                ({stats.persenSelesai}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {stats.selesaiToday} pekerjaan tuntas
          </p>
        </div>
        <div className="size-11 sm:size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="size-5 sm:size-6" />
        </div>
      </div>

      {/* 3. Pekerjaan Berjalan */}
      <div
        id="card-summary-berjalan"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Sedang Berjalan
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-500 dark:text-amber-400">
              {stats.berjalanToday}
            </span>
            {stats.berjalanToday > 0 && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {stats.berjalanToday > 0 ? "Dalam pengerjaan aktif" : "Tidak ada yang aktif"}
          </p>
        </div>
        <div className="size-11 sm:size-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Activity className="size-5 sm:size-6" />
        </div>
      </div>

      {/* 4. Pekerjaan Belum Mulai */}
      <div
        id="card-summary-belum-mulai"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Belum Mulai
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-700 dark:text-slate-300 truncate">
              {stats.belumMulaiToday}
            </span>
            <span className="text-xs text-slate-400">log</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {stats.belumMulaiToday === 0 ? "Semua telah dimulai" : "Menunggu pengerjaan"}
          </p>
        </div>
        <div className="size-11 sm:size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
          <ListTodo className="size-5 sm:size-6" />
        </div>
      </div>
    </div>
  );
}
