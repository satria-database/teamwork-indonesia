import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Sparkles,
  Link2,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type WorkLog, type WorkLogTimerState, saveWorkLogTimerState } from "@/lib/workLogs";
import { toast } from "sonner";

interface Props {
  activeLog?: WorkLog | null;
  onFinishTimer: (data: {
    judul: string;
    durasiMenit: number;
    waktuMulai: string;
    waktuSelesai: string;
    logId?: string | undefined;
  }) => void;
  onCancelActiveLog?: () => void;
}

export function WorkLogTimer({ activeLog, onFinishTimer, onCancelActiveLog }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [lastSyncLogId, setLastSyncLogId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondsRef = useRef(0);
  secondsRef.current = seconds;

  // Initialize and synchronize with Supabase-backed activeLog
  useEffect(() => {
    if (!activeLog) {
      if (lastSyncLogId) {
        setTaskTitle("");
        setSeconds(0);
        setIsActive(false);
        setStartTime(null);
        setLastSyncLogId(null);
      }
      return;
    }

    setTaskTitle(activeLog.judul);
    setLastSyncLogId(activeLog.id);

    if (activeLog.waktu_mulai) {
      setStartTime(activeLog.waktu_mulai);
    } else {
      const now = new Date();
      setStartTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      );
    }

    // Check if there is an active timer state from Supabase
    if (activeLog.timer_state) {
      const ts = activeLog.timer_state;
      if (ts.is_running && ts.started_at) {
        const startedTimeMs = new Date(ts.started_at).getTime();
        const diffSeconds = Math.max(0, Math.floor((Date.now() - startedTimeMs) / 1000));
        const total = (ts.accumulated_seconds || 0) + diffSeconds;
        setSeconds(total);
        setIsActive(true);
      } else {
        const total = ts.accumulated_seconds || (activeLog.durasi_menit || 0) * 60;
        setSeconds(total);
        setIsActive(false);
      }
    } else if (activeLog.durasi_menit > 0) {
      setSeconds(activeLog.durasi_menit * 60);
      setIsActive(activeLog.status === "berjalan");
    } else {
      setSeconds(0);
      setIsActive(activeLog.status === "berjalan");
    }
  }, [activeLog, lastSyncLogId]);

  // Timer interval loop
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Start / Resume Handler
  const handleStart = async () => {
    const now = new Date();
    const formattedTime =
      startTime ||
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setStartTime(formattedTime);
    setIsActive(true);

    if (activeLog?.id) {
      try {
        const timerState: WorkLogTimerState = {
          is_running: true,
          started_at: now.toISOString(),
          accumulated_seconds: secondsRef.current,
        };
        await saveWorkLogTimerState(activeLog.id, timerState, Math.round(secondsRef.current / 60));
      } catch (err) {
        console.warn("Error syncing timer to Supabase:", err);
      }
    }
  };

  // Pause Handler
  const handlePause = async () => {
    setIsActive(false);
    if (activeLog?.id) {
      try {
        const timerState: WorkLogTimerState = {
          is_running: false,
          started_at: null,
          accumulated_seconds: secondsRef.current,
        };
        await saveWorkLogTimerState(activeLog.id, timerState, Math.round(secondsRef.current / 60));
        toast.info("Timer dijeda dan disimpan ke database.");
      } catch (err) {
        console.warn("Error syncing pause to Supabase:", err);
      }
    }
  };

  // Resume Handler
  const handleResume = async () => {
    await handleStart();
  };

  // Reset Handler
  const handleReset = async () => {
    setIsActive(false);
    const prevSeconds = seconds;
    setSeconds(0);
    setStartTime(null);

    if (activeLog?.id) {
      try {
        const timerState: WorkLogTimerState = {
          is_running: false,
          started_at: null,
          accumulated_seconds: 0,
        };
        await saveWorkLogTimerState(activeLog.id, timerState, 0);
      } catch (err) {
        console.warn("Error resetting timer on Supabase:", err);
      }
    }

    if (onCancelActiveLog) {
      onCancelActiveLog();
    }
  };

  // Selesai Handler
  const handleFinish = async () => {
    setIsActive(false);
    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
      2,
      "0",
    )}`;
    const durasiMenit = Math.max(1, Math.round(seconds / 60));

    if (activeLog?.id) {
      try {
        const timerState: WorkLogTimerState = {
          is_running: false,
          started_at: null,
          accumulated_seconds: seconds,
        };
        await saveWorkLogTimerState(activeLog.id, timerState, durasiMenit);
      } catch (err) {
        console.warn("Error finalizing timer on Supabase:", err);
      }
    }

    onFinishTimer({
      judul: taskTitle.trim() || (activeLog ? activeLog.judul : "Pekerjaan Harian"),
      durasiMenit,
      waktuMulai: startTime || endTime,
      waktuSelesai: endTime,
      logId: activeLog?.id,
    });

    setSeconds(0);
    setStartTime(null);
    setTaskTitle("");
    if (onCancelActiveLog) onCancelActiveLog();
  };

  // Formatter for HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(
      secs,
    ).padStart(2, "0")}`;
  };

  const durasiMenitDisplay = Math.max(1, Math.round(seconds / 60));

  return (
    <div
      id="work-log-live-timer"
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs relative overflow-hidden"
    >
      {/* Visual Accent Glow when timer is running */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 animate-pulse" />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Section: Task Info & Input */}
        <div className="space-y-2 max-w-xl flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-200/70 dark:border-fuchsia-800/60">
              <Clock className={`size-3.5 ${isActive ? "animate-spin" : ""}`} />
              <span>{isActive ? "Timer Sedang Berjalan" : "Timer Pekerjaan"}</span>
            </div>

            {activeLog && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                <Link2 className="size-3" />
                Terhubung ke Log
              </span>
            )}

            {activeLog?.upcoming_work_judul && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60">
                <Sparkles className="size-3" />
                Dari Rencana Mendatang
              </span>
            )}
          </div>

          <div className="pt-1">
            <Input
              id="input-timer-task-title"
              placeholder="Ketik judul pekerjaan yang sedang dikerjakan..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              disabled={isActive && Boolean(activeLog)}
              className="text-base font-semibold border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 focus-visible:ring-fuchsia-500 h-11"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Mulai:{" "}
              <strong className="text-slate-700 dark:text-slate-300 font-medium">
                {startTime || "--:--"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Durasi otomatis:{" "}
              <strong className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
                {durasiMenitDisplay} menit
              </strong>
            </span>
            <span>•</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Tersinkron ke Supabase
            </span>
          </div>
        </div>

        {/* Right Section: Large Digital Display & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 self-start lg:self-auto">
          {/* Digital Clock Output */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono text-3xl sm:text-4xl font-bold tracking-wider text-slate-900 dark:text-slate-100 min-w-[170px] text-center shadow-inner">
            {formatTime(seconds)}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isActive && seconds === 0 && (
              <Button
                id="btn-timer-start"
                onClick={handleStart}
                className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold px-5 h-11 shadow-sm gap-2"
              >
                <Play className="size-4 fill-current" />
                Mulai
              </Button>
            )}

            {isActive && (
              <>
                <Button
                  id="btn-timer-pause"
                  variant="outline"
                  onClick={handlePause}
                  className="rounded-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold px-4 h-11 gap-1.5"
                >
                  <Pause className="size-4 fill-current" />
                  Pause
                </Button>

                <Button
                  id="btn-timer-finish"
                  onClick={handleFinish}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 h-11 gap-1.5 shadow-xs"
                >
                  <Square className="size-4 fill-current" />
                  Selesai
                </Button>
              </>
            )}

            {!isActive && seconds > 0 && (
              <>
                <Button
                  id="btn-timer-resume"
                  onClick={handleResume}
                  className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold px-5 h-11 gap-2 shadow-xs"
                >
                  <Play className="size-4 fill-current" />
                  Lanjutkan
                </Button>

                <Button
                  id="btn-timer-finish-paused"
                  onClick={handleFinish}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 h-11 gap-1.5 shadow-xs"
                >
                  <Square className="size-4 fill-current" />
                  Selesai
                </Button>

                <Button
                  id="btn-timer-reset"
                  variant="ghost"
                  onClick={handleReset}
                  className="rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold size-11 p-0"
                  title="Reset Timer"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
