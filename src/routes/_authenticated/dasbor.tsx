import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Camera,
  Volume2,
  ListTodo,
  Search,
  SlidersHorizontal,
  ExternalLink,
  NotebookPen,
  CalendarClock,
  FileText,
  FolderOpen,
  TrendingUp,
  Sparkles,
  Layers,
  Database,
  Users,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Activity,
  Check,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  fetchWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  startWorkFromUpcoming,
  type WorkLog,
  type WorkLogPayload,
} from "@/lib/workLogs";
import {
  fetchUpcomingWorks,
  createUpcomingWork,
  type UpcomingWork,
  type UpcomingWorkPriority,
} from "@/lib/upcomingWork";
import { WorkLogFormDialog } from "@/components/work-log/WorkLogFormDialog";
import { WorkLogDetailDialog } from "@/components/work-log/WorkLogDetailDialog";
import { NouraLogo } from "@/components/NouraLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dasbor")({ component: Dasbor });

type CatatanItem = {
  id: string;
  judul: string;
  isi: string | null;
  tanggal: string;
  durasi_menit: number | null;
  created_at?: string;
};

type MendatangItem = {
  id: string;
  judul: string;
  deskripsi: string | null;
  tenggat: string | null;
  status: string;
  created_at?: string;
};

type NotulenItem = {
  id: string;
  judul: string;
  tanggal: string;
  peserta: string | null;
  isi: string | null;
  keputusan: string | null;
  created_at?: string;
};

type BerkasItem = {
  id: string;
  nama: string;
  path: string;
  ukuran: number | null;
  tipe: string | null;
  created_at?: string;
};

function formatUkuran(b: number | null) {
  if (!b || b <= 0) return "0 KB";
  const kb = b / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

const NAMA_BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const HARI_SINGKAT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Dasbor() {
  const { user, effectiveUserId } = useAuth();
  const { profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Queries for real work logs and upcoming works
  const { data: workLogs = [] } = useQuery({
    queryKey: ["work_logs"],
    queryFn: () => fetchWorkLogs(undefined, effectiveUserId),
  });

  const { data: upcomingWorks = [] } = useQuery({
    queryKey: ["upcoming_works"],
    queryFn: () => fetchUpcomingWorks(undefined, effectiveUserId),
  });

  // Dynamic greeting using user's real name and current time
  const userName = useMemo(() => {
    if (profile?.full_name?.trim()) return profile.full_name.trim();
    const metadataName = user?.user_metadata?.["full_name"] ?? user?.user_metadata?.["name"];
    if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
    if (user?.email) {
      const prefix = user.email.split("@")[0] ?? "Pengguna";
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Rekan Kerja";
  }, [profile, user]);

  const timeGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 11) return "Selamat pagi";
    if (hr >= 11 && hr < 15) return "Selamat siang";
    if (hr >= 15 && hr < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  // Quick Action Dialog States
  const [createLogOpen, setCreateLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDetailLog, setSelectedDetailLog] = useState<WorkLog | null>(null);

  const [createUpcomingOpen, setCreateUpcomingOpen] = useState(false);
  const [upcomingDetailOpen, setUpcomingDetailOpen] = useState(false);
  const [selectedUpcoming, setSelectedUpcoming] = useState<UpcomingWork | null>(null);
  const [newUpcomingJudul, setNewUpcomingJudul] = useState("");
  const [newUpcomingDeskripsi, setNewUpcomingDeskripsi] = useState("");
  const [newUpcomingPrioritas, setNewUpcomingPrioritas] = useState<UpcomingWorkPriority>("sedang");
  const [newUpcomingTenggat, setNewUpcomingTenggat] = useState("");

  const [createNotulenOpen, setCreateNotulenOpen] = useState(false);
  const [newNotulenJudul, setNewNotulenJudul] = useState("");
  const [newNotulenTanggal, setNewNotulenTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [newNotulenPeserta, setNewNotulenPeserta] = useState("");
  const [newNotulenIsi, setNewNotulenIsi] = useState("");
  const [newNotulenKeputusan, setNewNotulenKeputusan] = useState("");

  // Actionable Task Filtering ("semua" | "prioritas_tinggi" | "deadline_hari_ini" | "overdue")
  const [actionFilter, setActionFilter] = useState<
    "semua" | "prioritas_tinggi" | "deadline_hari_ini" | "overdue"
  >("semua");

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Compute unified actionable tasks sorted by: 1. Overdue, 2. Priority tertinggi, 3. Deadline terdekat
  type ActionableTask = {
    id: string;
    source: "log" | "upcoming";
    judul: string;
    deskripsi: string;
    status: "belum_mulai" | "berjalan" | "selesai";
    prioritas: "tinggi" | "sedang" | "rendah";
    deadlineDate: string;
    deadlineTime: string | null;
    progress?: number;
    isOverdue: boolean;
    isDueToday: boolean;
    rawLog?: WorkLog;
    rawUpcoming?: UpcomingWork;
  };

  const actionableTasks = useMemo(() => {
    const list: ActionableTask[] = [];
    const linkedUpcomingIds = new Set<string>();

    workLogs.forEach((log) => {
      if (log.upcoming_work_id) {
        linkedUpcomingIds.add(log.upcoming_work_id);
      }
      const isFinished = log.status === "selesai" || log.progress === 100;
      const isOverdue = Boolean(log.is_overdue || (log.tanggal < todayStr && !isFinished));
      const isDueToday = log.tanggal === todayStr;

      if (!isFinished && (isOverdue || isDueToday || log.status === "berjalan")) {
        list.push({
          id: `log-${log.id}`,
          source: "log",
          judul: log.judul,
          deskripsi: log.deskripsi || "",
          status: log.status,
          prioritas: (log.prioritas as "tinggi" | "sedang" | "rendah") || "sedang",
          deadlineDate: log.tanggal,
          deadlineTime: log.waktu_selesai || log.waktu_mulai || null,
          progress: log.progress,
          isOverdue,
          isDueToday,
          rawLog: log,
        });
      }
    });

    upcomingWorks.forEach((uw) => {
      if (linkedUpcomingIds.has(uw.id)) return;
      const isFinished = uw.status === "selesai" || uw.status === "dibatalkan";
      const isOverdue = Boolean(
        uw.is_overdue || (uw.tenggat && uw.tenggat < todayStr && !isFinished),
      );
      const isDueToday = Boolean(uw.is_due_today || (uw.tenggat && uw.tenggat === todayStr));

      if (!isFinished && (isOverdue || isDueToday || uw.status === "berjalan")) {
        list.push({
          id: `upcoming-${uw.id}`,
          source: "upcoming",
          judul: uw.judul,
          deskripsi: uw.deskripsi || "",
          status: uw.status === "berjalan" ? "berjalan" : "belum_mulai",
          prioritas: (uw.prioritas as "tinggi" | "sedang" | "rendah") || "sedang",
          deadlineDate: uw.tenggat || todayStr,
          deadlineTime: null,
          progress: uw.status === "berjalan" ? 50 : 0,
          isOverdue,
          isDueToday,
          rawUpcoming: uw,
        });
      }
    });

    // 1. Overdue first
    // 2. Priority tertinggi (tinggi > sedang > rendah)
    // 3. Deadline terdekat
    const priorityWeight: Record<string, number> = { tinggi: 3, sedang: 2, rendah: 1 };
    list.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      const pA = priorityWeight[a.prioritas] ?? 2;
      const pB = priorityWeight[b.prioritas] ?? 2;
      if (pA !== pB) return pB - pA;

      if (a.deadlineDate !== b.deadlineDate) {
        return a.deadlineDate.localeCompare(b.deadlineDate);
      }
      return (a.deadlineTime || "23:59").localeCompare(b.deadlineTime || "23:59");
    });

    return list;
  }, [workLogs, upcomingWorks, todayStr]);

  const displayedActionableTasks = useMemo(() => {
    if (actionFilter === "prioritas_tinggi") {
      return actionableTasks.filter((t) => t.prioritas === "tinggi");
    }
    if (actionFilter === "deadline_hari_ini") {
      return actionableTasks.filter((t) => t.isDueToday);
    }
    if (actionFilter === "overdue") {
      return actionableTasks.filter((t) => t.isOverdue);
    }
    return actionableTasks;
  }, [actionableTasks, actionFilter]);

  // Attention Counts (real data)
  const countPrioritasTinggi = useMemo(
    () => actionableTasks.filter((t) => t.prioritas === "tinggi").length,
    [actionableTasks],
  );
  const countDeadlineHariIni = useMemo(
    () => actionableTasks.filter((t) => t.isDueToday).length,
    [actionableTasks],
  );
  const countOverdue = useMemo(
    () => actionableTasks.filter((t) => t.isOverdue).length,
    [actionableTasks],
  );

  // Status Summary Counts (real data from all work logs)
  const statusCounts = useMemo(() => {
    let belumDimulai = 0;
    let sedangBerjalan = 0;
    let selesai = 0;
    let overdue = 0;

    workLogs.forEach((w) => {
      const isFinished = w.status === "selesai" || w.progress === 100;
      const isOv = Boolean(w.is_overdue || (w.tanggal < todayStr && !isFinished));

      if (isFinished) {
        selesai += 1;
      } else {
        if (isOv) overdue += 1;
        if (w.status === "berjalan") {
          sedangBerjalan += 1;
        } else {
          belumDimulai += 1;
        }
      }
    });

    return { belumDimulai, sedangBerjalan, selesai, overdue };
  }, [workLogs, todayStr]);

  // Today completed count for empty state
  const todayCompletedCount = useMemo(() => {
    return workLogs.filter(
      (w) => w.tanggal === todayStr && (w.status === "selesai" || w.progress === 100),
    ).length;
  }, [workLogs, todayStr]);

  const handleOpenTask = (item: ActionableTask) => {
    if (item.source === "log" && item.rawLog) {
      setSelectedDetailLog(item.rawLog);
      setDetailDialogOpen(true);
    } else if (item.source === "upcoming" && item.rawUpcoming) {
      setSelectedUpcoming(item.rawUpcoming);
      setUpcomingDetailOpen(true);
    }
  };

  // 1. Real queries fetching data from all active modules in the sidebar
  const { data: catatanList = [] } = useQuery({
    queryKey: ["catatan_kerja"],
    queryFn: async () => {
      let query = supabase.from("catatan_kerja").select("*");
      if (effectiveUserId) query = query.eq("dibuat_oleh", effectiveUserId);
      const { data, error } = await query.order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CatatanItem[];
    },
  });

  const { data: mendatangList = [] } = useQuery({
    queryKey: ["pekerjaan_mendatang"],
    queryFn: async () => {
      let query = supabase.from("pekerjaan_mendatang").select("*");
      if (effectiveUserId) query = query.eq("dibuat_oleh", effectiveUserId);
      const { data, error } = await query.order("tenggat", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MendatangItem[];
    },
  });

  const { data: notulenList = [] } = useQuery({
    queryKey: ["notulen"],
    queryFn: async () => {
      let query = supabase.from("notulen").select("*");
      if (effectiveUserId) query = query.eq("dibuat_oleh", effectiveUserId);
      const { data, error } = await query.order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NotulenItem[];
    },
  });

  const { data: berkasList = [] } = useQuery({
    queryKey: ["berkas"],
    queryFn: async () => {
      let query = supabase.from("berkas").select("*");
      if (effectiveUserId) query = query.eq("dibuat_oleh", effectiveUserId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BerkasItem[];
    },
  });

  // 2. Computed Summaries from real data (Resuming the sidebar)
  const totalCatatan = catatanList.length;
  const totalDurasiCatatan = catatanList.reduce((acc, c) => acc + (c.durasi_menit || 0), 0);

  const parsedCatatanStats = useMemo(() => {
    let catatanHariIni = 0;
    let catatanSelesaiHariIni = 0;
    let catatanBerjalan = 0;
    let totalCatatanSelesai = 0;
    let durasiHariIni = 0;
    let totalProgress = 0;

    catatanList.forEach((c) => {
      let status = "selesai";
      let progress = 100;

      if (c.isi && typeof c.isi === "string" && c.isi.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(c.isi);
          status = parsed.status || status;
          progress = typeof parsed.progress === "number" ? parsed.progress : progress;
        } catch {
          // ignore
        }
      }

      if (status === "selesai" || progress === 100) {
        totalCatatanSelesai += 1;
      }

      if (c.tanggal === todayStr) {
        catatanHariIni += 1;
        durasiHariIni += c.durasi_menit || 0;
        if (status === "selesai" || progress === 100) catatanSelesaiHariIni += 1;
      }

      if (status === "berjalan") catatanBerjalan += 1;
      totalProgress += progress;
    });

    const avgProgress = catatanList.length > 0 ? Math.round(totalProgress / catatanList.length) : 0;
    const pctSelesai =
      totalCatatan > 0 ? Math.round((totalCatatanSelesai / totalCatatan) * 100) : 0;

    return {
      catatanHariIni,
      catatanSelesaiHariIni,
      catatanBerjalan,
      totalCatatanSelesai,
      pctSelesai,
      durasiHariIni,
      avgProgress,
    };
  }, [catatanList, totalCatatan, todayStr]);

  const totalMendatang = mendatangList.length;
  const mendatangBerjalan = mendatangList.filter((m) => m.status === "berjalan").length;
  const mendatangDueOrOverdue = useMemo(() => {
    return mendatangList.filter(
      (m) =>
        m.tenggat && m.tenggat <= todayStr && m.status !== "selesai" && m.status !== "dibatalkan",
    ).length;
  }, [mendatangList, todayStr]);

  const totalNotulen = notulenList.length;
  const notulenDenganKeputusan = notulenList.filter((n) =>
    Boolean(n.keputusan && n.keputusan.trim()),
  ).length;

  const totalBerkas = berkasList.filter((b) => b.tipe !== "folder").length;
  const totalUkuranBerkas = berkasList.reduce((acc, b) => acc + (b.ukuran || 0), 0);

  const totalSeluruhEntri = totalCatatan + totalMendatang + totalNotulen + totalBerkas;

  // 3. Filter range for Completeness dual bar chart
  const [completenessRange, setCompletenessRange] = useState<"1month" | "6month" | "all">("6month");

  // Dynamic Completeness Monthly Data computed from real Catatan Pekerjaan
  const completenessData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthsToShow =
      completenessRange === "1month" ? 4 : completenessRange === "6month" ? 6 : 8;

    const curMonthIdx = new Date().getMonth();
    const result = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const mIdx = (curMonthIdx - i + 12) % 12;
      const monthName = NAMA_BULAN[mIdx];
      const mStr = String(mIdx + 1).padStart(2, "0");

      const inMonth = catatanList.filter((c) => {
        if (!c.tanggal) return false;
        return c.tanggal.includes(`-${mStr}-`) || c.tanggal.startsWith(`${currentYear}-${mStr}`);
      });

      const selesaiCount = inMonth.filter((c) => {
        if (c.isi && typeof c.isi === "string" && c.isi.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(c.isi);
            return parsed.status === "selesai" || parsed.progress === 100;
          } catch {
            return true;
          }
        }
        return true;
      }).length;
      const totalCount = inMonth.length;

      result.push({
        month: monthName,
        selesai: selesaiCount,
        total: totalCount,
      });
    }

    return result;
  }, [catatanList, completenessRange]);

  // 4. Performance Stepped Bar Chart: Real priority distribution from Catatan Pekerjaan
  const [performanceFilter, setPerformanceFilter] = useState<"Semua" | "Berjalan" | "Selesai">(
    "Semua",
  );
  const performanceBarData = useMemo(() => {
    const filtered =
      performanceFilter === "Berjalan"
        ? catatanList.filter((c) => {
            if (c.isi && typeof c.isi === "string" && c.isi.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(c.isi);
                return parsed.status === "berjalan";
              } catch {
                return false;
              }
            }
            return false;
          })
        : performanceFilter === "Selesai"
          ? catatanList.filter((c) => {
              if (c.isi && typeof c.isi === "string" && c.isi.trim().startsWith("{")) {
                try {
                  const parsed = JSON.parse(c.isi);
                  return parsed.status === "selesai" || parsed.progress === 100;
                } catch {
                  return true;
                }
              }
              return true;
            })
          : catatanList;

    // Group by unique dates (up to 4 most recent dates)
    const dateMap = new Map<string, { tinggi: number; sedang: number }>();

    filtered.forEach((c) => {
      let prioritas = "sedang";
      if (c.isi && typeof c.isi === "string" && c.isi.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(c.isi);
          prioritas = parsed.prioritas || prioritas;
        } catch {
          // ignore
        }
      }
      const dKey = c.tanggal ? c.tanggal.slice(5) : "Lainnya"; // MM-DD
      const current = dateMap.get(dKey) || { tinggi: 0, sedang: 0 };
      if (prioritas === "tinggi") {
        current.tinggi += 1;
      } else {
        current.sedang += 1;
      }
      dateMap.set(dKey, current);
    });

    const entries = Array.from(dateMap.entries()).slice(0, 4);

    if (entries.length === 0) {
      return [
        { date: "Log 1", tinggi: 0, sedang: 0 },
        { date: "Log 2", tinggi: 0, sedang: 0 },
        { date: "Log 3", tinggi: 0, sedang: 0 },
        { date: "Log 4", tinggi: 0, sedang: 0 },
      ];
    }

    return entries.map(([date, counts]) => ({
      date,
      tinggi: counts.tinggi,
      sedang: counts.sedang,
    }));
  }, [catatanList, performanceFilter]);

  // 5. Cheese Wheel (Donut Chart): Real proportion of entries across sidebar modules
  const cheeseWheelData = useMemo(() => {
    const raw = [
      { name: "Catatan Kerja", value: totalCatatan, color: "#06b6d4" }, // Cyan
      { name: "Pekerjaan Mendatang", value: totalMendatang, color: "#10b981" }, // Emerald
      { name: "Notulen Rapat", value: totalNotulen, color: "#6366f1" }, // Indigo
      { name: "Berkas Dokumen", value: totalBerkas, color: "#f59e0b" }, // Amber
    ];

    const hasData = raw.some((item) => item.value > 0);
    if (!hasData) {
      return [{ name: "Belum Ada Data", value: 1, color: "#64748b" }];
    }
    return raw.filter((item) => item.value > 0);
  }, [totalCatatan, totalMendatang, totalNotulen, totalBerkas]);

  // 7. Rising Income Area Wave: Real day of the week completion trend from catatan
  const weeklyCompletionData = useMemo(() => {
    const days = [
      { day: "M", val: 0 },
      { day: "T", val: 0 },
      { day: "W", val: 0 },
      { day: "T", val: 0 },
      { day: "F", val: 0 },
      { day: "S", val: 0 },
      { day: "S", val: 0 },
    ];

    catatanList.forEach((c) => {
      let isSelesai = true;
      if (c.isi && typeof c.isi === "string" && c.isi.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(c.isi);
          isSelesai = parsed.status === "selesai" || parsed.progress === 100;
        } catch {
          // ignore
        }
      }
      if (isSelesai && c.tanggal) {
        const d = new Date(c.tanggal);
        if (!isNaN(d.getTime())) {
          const jsDay = d.getDay();
          const mappedIdx = jsDay === 0 ? 6 : jsDay - 1;
          if (days[mappedIdx]) {
            days[mappedIdx].val += 1;
          }
        }
      }
    });

    return days;
  }, [catatanList]);

  // 8. Large Data Overview: Real cumulative annual activity across all modules
  const [searchTerm, setSearchTerm] = useState("");
  const annualActivityData = useMemo(() => {
    return NAMA_BULAN.map((mName, idx) => {
      const mStr = String(idx + 1).padStart(2, "0");
      const c = catatanList.filter((x) => x.tanggal?.includes(`-${mStr}-`)).length;
      const m = mendatangList.filter((x) => x.tenggat?.includes(`-${mStr}-`)).length;
      const n = notulenList.filter((x) => x.tanggal?.includes(`-${mStr}-`)).length;
      return {
        month: mName,
        value: c + m + n,
      };
    });
  }, [catatanList, mendatangList, notulenList]);

  // Filtered search results across modules
  const searchResultsCount = useMemo(() => {
    if (!searchTerm.trim()) return totalSeluruhEntri;
    const term = searchTerm.toLowerCase();
    const cMatch = catatanList.filter((c) => c.judul.toLowerCase().includes(term)).length;
    const mMatch = mendatangList.filter((m) => m.judul.toLowerCase().includes(term)).length;
    const nMatch = notulenList.filter((n) => n.judul.toLowerCase().includes(term)).length;
    const bMatch = berkasList.filter((b) => b.nama.toLowerCase().includes(term)).length;
    return cMatch + mMatch + nMatch + bMatch;
  }, [searchTerm, catatanList, notulenList, mendatangList, berkasList, totalSeluruhEntri]);

  // 8. Calendar interactive state (with real month/year and proper day-of-week alignment)
  const currentDate = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState<number>(currentDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number>(currentDate.getDate());

  // Check how many days in current calendar month and previous month
  const daysInCalendarMonth = useMemo(() => {
    return new Date(calendarYear, calendarMonth + 1, 0).getDate();
  }, [calendarYear, calendarMonth]);

  const daysInPrevCalendarMonth = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 0).getDate();
  }, [calendarYear, calendarMonth]);

  // First day of week for the 1st of active month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfWeek = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 1).getDay();
  }, [calendarYear, calendarMonth]);

  // Set of dates that have logs or deadlines in the active calendar month
  const datesWithItems = useMemo(() => {
    const monthStr = String(calendarMonth + 1).padStart(2, "0");
    const yearStr = String(calendarYear);
    const prefix = `${yearStr}-${monthStr}-`;
    const setOfDates = new Set<number>();

    catatanList.forEach((c) => {
      if (c.tanggal && c.tanggal.startsWith(prefix)) {
        const dayNum = parseInt(c.tanggal.split("-")[2] || "0", 10);
        if (dayNum > 0) setOfDates.add(dayNum);
      }
    });

    mendatangList.forEach((m) => {
      if (m.tenggat && m.tenggat.startsWith(prefix)) {
        const dayNum = parseInt(m.tenggat.split("-")[2] || "0", 10);
        if (dayNum > 0) setOfDates.add(dayNum);
      }
    });

    return setOfDates;
  }, [catatanList, mendatangList, calendarYear, calendarMonth]);

  // Tasks matching the selected calendar date in active month
  const itemsForSelectedDate = useMemo(() => {
    const monthStr = String(calendarMonth + 1).padStart(2, "0");
    const yearStr = String(calendarYear);
    const dayStr = String(selectedCalendarDate).padStart(2, "0");
    const fullDateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const logs = catatanList.filter((c) => c.tanggal === fullDateStr);
    const agendas = mendatangList.filter((m) => m.tenggat === fullDateStr);
    return logs.length + agendas.length;
  }, [selectedCalendarDate, calendarMonth, calendarYear, catatanList, mendatangList]);

  // Calendar cells matrix: Sunday to Saturday (Su, Mo, Tu, We, Th, Fr, Sa)
  const calendarCells = useMemo(() => {
    const cells: Array<{
      day: number;
      type: "prev" | "current" | "next";
      isToday: boolean;
      isSelected: boolean;
      hasItem: boolean;
    }> = [];

    const realToday = new Date();
    const isCurrentYearMonth =
      calendarYear === realToday.getFullYear() && calendarMonth === realToday.getMonth();
    const todayDayNumber = realToday.getDate();

    // 1. Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevCalendarMonth - i,
        type: "prev",
        isToday: false,
        isSelected: false,
        hasItem: false,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCalendarMonth; d++) {
      cells.push({
        day: d,
        type: "current",
        isToday: isCurrentYearMonth && d === todayDayNumber,
        isSelected: selectedCalendarDate === d,
        hasItem: datesWithItems.has(d),
      });
    }

    // 3. Leading days for next month to complete the row (target 35 or 42 cells)
    const targetLength = cells.length > 35 ? 42 : 35;
    const remaining = targetLength - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        type: "next",
        isToday: false,
        isSelected: false,
        hasItem: false,
      });
    }

    return cells;
  }, [
    calendarYear,
    calendarMonth,
    daysInCalendarMonth,
    daysInPrevCalendarMonth,
    firstDayOfWeek,
    selectedCalendarDate,
    datesWithItems,
  ]);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // 9. Report download function using real data
  const downloadReport = () => {
    const content = `RINGKASAN KERJA TEMAN INDONESIA
Tanggal Unduh: ${new Date().toLocaleString("id-ID")}
Akun: ${user?.email ?? "User"}

RINGKASAN MODUL SIDEBAR:
- Catatan Pekerjaan: ${totalCatatan} catatan
- Pekerjaan Mendatang: ${totalMendatang} agenda (${mendatangBerjalan} berjalan)
- Notulen Rapat: ${totalNotulen} rapat (${notulenDenganKeputusan} kesepakatan)
- Berkas Dokumen: ${totalBerkas} file (${formatUkuran(totalUkuranBerkas)})
- Total Seluruh Entri: ${totalSeluruhEntri} entri
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ringkasan-Kerja-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan ringkasan workspace berhasil diunduh!");
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 w-full">
      {/* ─────────────────────────────────────────────────────────────
          1. GREETING & QUICK ACTION BAR (WORK COMMAND CENTER)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="hidden sm:flex shrink-0 items-center px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <NouraLogo size="md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>
                  {timeGreeting}, {userName}
                </span>
                <span className="inline-block text-xl">👋</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Selamat datang di ruang kerja Noura Workhub. Berikut pekerjaan yang perlu diperhatikan
              hari ini.
            </p>
          </div>
        </div>

        {/* 2. Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingLog(null);
              setCreateLogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Catat Pekerjaan</span>
          </button>

          <button
            onClick={() => setCreateUpcomingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Pekerjaan Mendatang</span>
          </button>

          <button
            onClick={() => setCreateNotulenOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Buat Notulen</span>
          </button>

          <Link
            to="/cv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <FileText className="size-3.5 text-amber-400 dark:text-amber-600" />
            <span>Resume / CV</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ACTION CENTER: Yang Perlu Dilakukan Hari Ini & Summaries
      ───────────────────────────────────────────────────────────── */}
      <div id="section-today-tasks" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main List: Yang Perlu Dilakukan Hari Ini */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with Title and Filter Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Yang Perlu Dilakukan Hari Ini
                  </h2>
                  <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {actionableTasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pekerjaan mendesak, aktif, dan terjadwal yang membutuhkan aksi Anda
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActionFilter("semua")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    actionFilter === "semua"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Semua ({actionableTasks.length})
                </button>
                {countOverdue > 0 && (
                  <button
                    onClick={() => setActionFilter("overdue")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      actionFilter === "overdue"
                        ? "bg-rose-600 text-white font-semibold"
                        : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                    }`}
                  >
                    ⚠️ Overdue ({countOverdue})
                  </button>
                )}
                {countPrioritasTinggi > 0 && (
                  <button
                    onClick={() => setActionFilter("prioritas_tinggi")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      actionFilter === "prioritas_tinggi"
                        ? "bg-rose-600 text-white font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    🔴 Tinggi ({countPrioritasTinggi})
                  </button>
                )}
                {countDeadlineHariIni > 0 && (
                  <button
                    onClick={() => setActionFilter("deadline_hari_ini")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      actionFilter === "deadline_hari_ini"
                        ? "bg-amber-500 text-white font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    🟠 Hari Ini ({countDeadlineHariIni})
                  </button>
                )}
              </div>
            </div>

            {/* Task Item List or Empty State */}
            <div className="mt-4 space-y-2.5">
              {displayedActionableTasks.length > 0 ? (
                displayedActionableTasks.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Badge Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority */}
                        {item.prioritas === "tinggi" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                            🔴 HIGH
                          </span>
                        ) : item.prioritas === "rendah" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            🟢 LOW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            🟡 NORMAL
                          </span>
                        )}

                        {/* Overdue */}
                        {item.isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white">
                            ⚠️ OVERDUE
                          </span>
                        )}

                        {/* Status */}
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {item.status === "berjalan" ? (
                            <span className="text-cyan-600 dark:text-cyan-400 font-semibold inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-cyan-500 animate-ping" />
                              Sedang Berjalan
                            </span>
                          ) : item.status === "selesai" ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Selesai</span>
                          ) : (
                            <span>Belum Dimulai</span>
                          )}
                        </span>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          • {item.source === "log" ? "Catatan Kerja" : "Pekerjaan Mendatang"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {item.judul}
                      </h3>

                      {/* Details row: Deadline/jam + Progress */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-slate-400" />
                          <span
                            className={
                              item.isOverdue
                                ? "text-rose-600 dark:text-rose-400 font-semibold"
                                : item.isDueToday
                                  ? "text-amber-600 dark:text-amber-400 font-medium"
                                  : ""
                            }
                          >
                            {item.isOverdue
                              ? `Terlambat (${item.deadlineDate})`
                              : item.deadlineTime
                                ? `Deadline ${item.deadlineTime}`
                                : item.isDueToday
                                  ? `Deadline Hari Ini`
                                  : `Deadline ${item.deadlineDate}`}
                          </span>
                        </div>

                        {typeof item.progress === "number" && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 rounded-full transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              {item.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Button [ Buka ] */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <button
                        onClick={() => handleOpenTask(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Buka</span>
                        <ArrowRight className="size-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                /* Empty State per requirement 6 */
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  {todayCompletedCount > 0 ? (
                    <div className="space-y-2 max-w-md mx-auto">
                      <div className="text-3xl">🎉</div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Semua pekerjaan hari ini sudah selesai 🎉
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kerja luar biasa! Seluruh pekerjaan terjadwal telah tuntas dikerjakan. Anda
                        dapat mencatat pekerjaan baru atau beristirahat sejenak.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setEditingLog(null);
                            setCreateLogOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          <span>+ Tambah Pekerjaan Baru</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-md mx-auto">
                      <div className="size-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-2">
                        <ListTodo className="size-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Belum ada pekerjaan untuk hari ini.
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Mulai hari Anda dengan mencatat pekerjaan aktif atau menjadwalkan agenda
                        mendatang.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setEditingLog(null);
                            setCreateLogOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          <span>+ Tambah Pekerjaan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Diurutkan: Overdue → Prioritas Tinggi → Deadline Terdekat</span>
            <Link
              to="/catatan"
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Lihat Semua Catatan</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Side Column: Perlu Perhatian (4) & Status Pekerjaan (5) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Card: Perlu Perhatian */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Perlu Perhatian
                </h2>
                <p className="text-[11px] text-slate-400">Fokus tindakan mendesak hari ini</p>
              </div>
              <span className="size-8 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="size-4" />
              </span>
            </div>

            <div className="space-y-2">
              {/* 🔴 Prioritas Tinggi */}
              <button
                onClick={() => setActionFilter("prioritas_tinggi")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  actionFilter === "prioritas_tinggi"
                    ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Prioritas Tinggi
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                    {countPrioritasTinggi}
                  </span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </div>
              </button>

              {/* 🟠 Deadline Hari Ini */}
              <button
                onClick={() => setActionFilter("deadline_hari_ini")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  actionFilter === "deadline_hari_ini"
                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Deadline Hari Ini
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    {countDeadlineHariIni}
                  </span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </div>
              </button>

              {/* ⚠️ Overdue */}
              <button
                onClick={() => setActionFilter("overdue")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  actionFilter === "overdue"
                    ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs">⚠️</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Overdue
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                    {countOverdue}
                  </span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Card: Status Pekerjaan */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Status Pekerjaan
                  </h2>
                  <p className="text-[11px] text-slate-400">Distribusi status catatan kerja</p>
                </div>
                <span className="size-8 rounded-full bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Activity className="size-4" />
                </span>
              </div>

              <div className="space-y-1.5">
                {/* Belum Dimulai */}
                <Link
                  to="/catatan"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Belum Dimulai
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {statusCounts.belumDimulai}
                    </span>
                    <ExternalLink className="size-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                </Link>

                {/* Sedang Berjalan */}
                <Link
                  to="/catatan"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-cyan-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Sedang Berjalan
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {statusCounts.sedangBerjalan}
                    </span>
                    <ExternalLink className="size-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                </Link>

                {/* Selesai */}
                <Link
                  to="/catatan"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Selesai
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {statusCounts.selesai}
                    </span>
                    <ExternalLink className="size-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                </Link>

                {/* Overdue */}
                <Link
                  to="/catatan"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Overdue
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                      {statusCounts.overdue}
                    </span>
                    <ExternalLink className="size-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <Link
                to="/catatan"
                className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Kelola Catatan</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {/* Resume & CV Realtime Card */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Resume & CV Akun
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {profile?.full_name || userName}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">
                    {profile?.job_title || "Profesional Spesialis"} • {statusCounts.selesai}{" "}
                    Pekerjaan Selesai
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Link
                    to="/cv"
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Buka & Cetak PDF</span>
                    <ArrowRight className="size-3" />
                  </Link>
                  <Link
                    to="/pengaturan"
                    className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Ubah Profil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 1: Completeness Dual Bar & Performance Stepped Bar
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Completeness (Work Realization Dual Bar) */}
        <div className="md:col-span-6 lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with Range Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Penyelesaian Realisasi Kerja
                </h2>
                <p className="text-[11px] text-slate-400">
                  Rasio log selesai vs total catatan kerja
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                  <button
                    onClick={() => setCompletenessRange("1month")}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      completenessRange === "1month"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    4 Bulan
                  </button>
                  <button
                    onClick={() => setCompletenessRange("6month")}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      completenessRange === "6month"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    6 Bulan
                  </button>
                  <button
                    onClick={() => setCompletenessRange("all")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      completenessRange === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Semua
                  </button>
                </div>
                <button
                  onClick={downloadReport}
                  className="p-1.5 px-3 rounded-full bg-slate-900 text-white dark:bg-slate-800 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  <Download className="size-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Two Real KPI Metrics */}
            <div className="flex items-center gap-6 mt-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="size-2 rounded-full bg-cyan-400" />
                  <span>Log Selesai</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                    {parsedCatatanStats.totalCatatanSelesai}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                    {parsedCatatanStats.pctSelesai}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="size-2 rounded-full bg-fuchsia-500" />
                  <span>Total Catatan Kerja</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                    {totalCatatan}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-full">
                    {parsedCatatanStats.catatanBerjalan} berjalan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart comparing real completed vs total logs per month */}
          <div className="h-44 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completenessData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                barGap={3}
              >
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  name="Log Selesai"
                  dataKey="selesai"
                  fill="#38bdf8"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={8}
                />
                <Bar
                  name="Total Catatan"
                  dataKey="total"
                  fill="#a855f7"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Status & Prioritas Kerja (Stepped Bar Chart) */}
        <div className="md:col-span-6 lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Status & Prioritas
                </h2>
                <p className="text-[11px] text-slate-400">Distribusi beban kerja</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setPerformanceFilter((p) =>
                      p === "Semua" ? "Berjalan" : p === "Berjalan" ? "Selesai" : "Semua",
                    )
                  }
                  className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <span>{performanceFilter}</span>
                  <ChevronDown className="size-3" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="size-2 rounded-xs bg-amber-500" />
                <span>Prioritas Tinggi</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="size-2 rounded-xs bg-emerald-500" />
                <span>Sedang / Normal</span>
              </div>
            </div>
          </div>

          {/* Stepped Bar Chart from real data */}
          <div className="h-44 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceBarData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  name="Prioritas Tinggi"
                  dataKey="tinggi"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  name="Sedang / Normal"
                  dataKey="sedang"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: Today Queue & Calendar, 4 Metric Bento Cards, Modul Workload
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 4: Work Calendar & Active Agenda */}
        <div className="md:col-span-5 lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Kalender Kerja
                </h2>
                <p className="text-[11px] text-slate-400">Jadwal & aktivitas aktif</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  to="/catatan"
                  className="size-7 rounded-full bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center hover:scale-105 transition-transform"
                  title="Tulis Catatan Pekerjaan"
                >
                  <NotebookPen className="size-3.5" />
                </Link>
                <Link
                  to="/mendatang"
                  className="size-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:scale-105 transition-transform"
                  title="Lihat Pekerjaan Mendatang"
                >
                  <CalendarClock className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Calendar Widget connected to real dates */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {NAMA_BULAN[calendarMonth]} {calendarYear}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Bulan sebelumnya"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Bulan berikutnya"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(calendarMonth !== currentDate.getMonth() ||
                    calendarYear !== currentDate.getFullYear()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarYear(currentDate.getFullYear());
                        setCalendarMonth(currentDate.getMonth());
                        setSelectedCalendarDate(currentDate.getDate());
                      }}
                      className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Bulan ini
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {datesWithItems.size} tanggal aktif
                  </span>
                </div>
              </div>

              {/* Days Header: Su Mo Tu We Th Fr Sa */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mt-3">
                <span title="Minggu">Su</span>
                <span title="Senin">Mo</span>
                <span title="Selasa">Tu</span>
                <span title="Rabu">We</span>
                <span title="Kamis">Th</span>
                <span title="Jumat">Fr</span>
                <span title="Sabtu">Sa</span>
              </div>

              {/* Day numbers grid with indicator dots for dates with real entries */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs mt-2">
                {calendarCells.map((cell, idx) => {
                  if (cell.type !== "current") {
                    return (
                      <div
                        key={`cell-${cell.type}-${cell.day}-${idx}`}
                        className="size-6 mx-auto flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-600 select-none"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const isSelected = cell.isSelected;
                  const isToday = cell.isToday;
                  const hasItem = cell.hasItem;

                  return (
                    <button
                      key={`day-${cell.day}`}
                      type="button"
                      onClick={() => setSelectedCalendarDate(cell.day)}
                      className={`relative size-6 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-500/30"
                          : isToday
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-700"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasItem && !isSelected && (
                        <span className="absolute bottom-0.5 size-1 rounded-full bg-purple-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Note below calendar */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tgl {selectedCalendarDate} {NAMA_BULAN[calendarMonth]}:{" "}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                    {itemsForSelectedDate > 0
                      ? `${itemsForSelectedDate} entri agenda & log ditemukan`
                      : "Tidak ada jadwal"}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: 4 Real Value Metric Cards (Sidebar Modules) */}
        <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Metric 1: Catatan Pekerjaan */}
          <Link
            to="/catatan"
            className="group bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-pink-300 dark:hover:border-pink-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-2xl bg-linear-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center shadow-sm">
                <NotebookPen className="size-5" />
              </div>
              <ExternalLink className="size-3.5 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Catatan Pekerjaan
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {totalCatatan}
                </span>
                <span className="text-xs text-slate-400">
                  log ({parsedCatatanStats.catatanHariIni} hari ini)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-pink-500 mt-1 flex-wrap">
                <span>
                  {parsedCatatanStats.catatanBerjalan > 0
                    ? `${parsedCatatanStats.catatanBerjalan} berjalan • `
                    : ""}
                  {parsedCatatanStats.catatanSelesaiHariIni} selesai hari ini
                </span>
              </div>
            </div>
          </Link>

          {/* Metric 2: Pekerjaan Mendatang */}
          <Link
            to="/mendatang"
            className="group bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-sm">
                <CalendarClock className="size-5" />
              </div>
              <ExternalLink className="size-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pekerjaan Mendatang
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {totalMendatang}
                </span>
                <span className="text-xs text-slate-400">agenda</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-1 flex-wrap">
                <span>
                  {mendatangBerjalan} sedang proses • {mendatangDueOrOverdue} siap dikerjakan
                </span>
              </div>
            </div>
          </Link>

          {/* Metric 3: Notulen Rapat */}
          <Link
            to="/notulen"
            className="group bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-2xl bg-linear-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-sm">
                <FileText className="size-5" />
              </div>
              <ExternalLink className="size-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Notulen Rapat
              </p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                {totalNotulen} Rapat
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mt-1">
                <span>{notulenDenganKeputusan} Kesepakatan</span>
              </div>
            </div>
          </Link>

          {/* Metric 4: Berkas Dokumen */}
          <Link
            to="/berkas"
            className="group bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm">
                <FolderOpen className="size-5" />
              </div>
              <ExternalLink className="size-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Berkas Dokumen
              </p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                {totalBerkas} Dokumen
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                <span>{formatUkuran(totalUkuranBerkas)} Total Ukuran</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: Cheese Wheel Donut, Weekly Productivity, Storage Vault, Annual Overview
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 7: Cheese Wheel (Donut Chart of Workspace Composition) */}
        <div className="md:col-span-6 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Komposisi Workspace
              </h2>
              <p className="text-[11px] text-slate-400">Proporsi data per modul</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Donut Chart from real module data */}
          <div className="h-36 w-full relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cheeseWheelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {cheeseWheelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Real Legend */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap text-[11px] font-medium text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-cyan-400" />
              <span>Catatan ({totalCatatan})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Mendatang ({totalMendatang})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Berkas ({totalBerkas})</span>
            </div>
          </div>
        </div>

        {/* Card 8: Weekly Productivity (Area Wave Chart of Completed Work) */}
        <div className="md:col-span-6 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Realisasi Kerja
              </h2>
              <p className="text-[11px] text-slate-400">Senin - Minggu</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Area wave line of completed work by day */}
          <div className="h-20 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyCompletionData}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="risingIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#risingIncomeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
              {parsedCatatanStats.totalCatatanSelesai} Log Selesai
            </p>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 mt-0.5">
              <TrendingUp className="size-3" />
              <span>{parsedCatatanStats.pctSelesai}% Penyelesaian</span>
            </div>
          </div>
        </div>

        {/* Card 9: Berkas Dokumen (Storage & Files Summary) */}
        <div className="md:col-span-6 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Penyimpanan
              </h2>
              <p className="text-[11px] text-slate-400">Berkas & Arsip</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Stepped Bars visualizer matching module distribution */}
          <div className="h-20 w-full flex items-end justify-center gap-2 mt-2 px-2">
            <div
              className="w-5 bg-linear-to-t from-amber-400 to-amber-300 rounded-xs transition-all"
              style={{ height: totalBerkas > 0 ? "80%" : "20%" }}
              title="Berkas Terunggah"
            />
            <div
              className="w-5 bg-linear-to-t from-cyan-500 to-cyan-400 rounded-xs transition-all"
              style={{ height: totalCatatan > 0 ? "90%" : "25%" }}
              title="Catatan"
            />
            <div
              className="w-5 bg-linear-to-t from-emerald-500 to-emerald-400 rounded-xs transition-all"
              style={{ height: totalMendatang > 0 ? "70%" : "20%" }}
              title="Mendatang"
            />
            <div
              className="w-5 bg-linear-to-t from-indigo-500 to-indigo-400 rounded-xs transition-all"
              style={{ height: totalNotulen > 0 ? "60%" : "20%" }}
              title="Notulen"
            />
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
              {formatUkuran(totalUkuranBerkas)}
            </p>
            <div className="flex items-center justify-between text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              <span>{totalBerkas} Dokumen Tersimpan</span>
              <Link to="/berkas" className="hover:underline">
                Kelola →
              </Link>
            </div>
          </div>
        </div>

        {/* Card 10: Annual Activity Overview (Large Coral Area Chart) */}
        <div className="md:col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Ikhtisar Aktivitas Kerja
                </h2>
                <p className="text-[11px] text-slate-400">
                  Akumulasi entri dari seluruh modul sidebar
                </p>
              </div>

              {/* Real Search across modules */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="size-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari entri kerja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-full text-slate-700 dark:text-slate-200 focus:outline-hidden w-28 sm:w-36"
                  />
                </div>
                <Link
                  to="/catatan"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Lihat Semua</span>
                  <ExternalLink className="size-2.5" />
                </Link>
              </div>
            </div>

            {/* Sub-label showing real summary */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tahun {currentDate.getFullYear()} •{" "}
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {searchResultsCount} Total Entri Ditemukan
                </span>
              </div>
            </div>
          </div>

          {/* Spline Area Chart with Tooltip Badge connected to real counts */}
          <div className="h-32 w-full mt-2 relative">
            {/* Dynamic Status Badge */}
            <div className="absolute top-1 right-6 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-md flex items-center gap-2 pointer-events-none">
              <div className="size-5 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Sparkles className="size-3" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-white">
                  <span>{totalSeluruhEntri} Entri Aktif</span>
                  <span className="text-[9px] text-emerald-500 font-semibold">
                    {parsedCatatanStats.pctSelesai}% Selesai
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Supabase Cloud • Retensi Aman
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={annualActivityData}
                margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dataOverviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="natural"
                  dataKey="value"
                  name="Entri Tercatat"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dataOverviewGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DIALOGS FOR QUICK ACTIONS & WORK INTERACTIONS
      ───────────────────────────────────────────────────────────── */}
      {/* 1. Catat Pekerjaan Form Dialog */}
      <WorkLogFormDialog
        open={createLogOpen}
        onOpenChange={(open) => {
          setCreateLogOpen(open);
          if (!open) setEditingLog(null);
        }}
        initialData={editingLog}
        onSubmit={async (payload, id) => {
          try {
            if (id) {
              await updateWorkLog(id, payload);
              toast.success("Catatan pekerjaan berhasil diperbarui");
            } else {
              await createWorkLog(payload, effectiveUserId);
              toast.success("Catatan pekerjaan berhasil ditambahkan");
            }
            qc.invalidateQueries({ queryKey: ["work_logs"] });
            qc.invalidateQueries({ queryKey: ["catatan_kerja"] });
            qc.invalidateQueries({ queryKey: ["upcoming_works"] });
            qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
            qc.invalidateQueries({ queryKey: ["appshell_counts"] });
            setEditingLog(null);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Gagal menyimpan catatan pekerjaan");
          }
        }}
      />

      {/* 2. Detail Work Log Dialog */}
      <WorkLogDetailDialog
        log={selectedDetailLog}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={(log) => {
          setDetailDialogOpen(false);
          setEditingLog(log);
          setCreateLogOpen(true);
        }}
        onDelete={async (log) => {
          try {
            await deleteWorkLog(log);
            qc.invalidateQueries({ queryKey: ["work_logs"] });
            qc.invalidateQueries({ queryKey: ["catatan_kerja"] });
            qc.invalidateQueries({ queryKey: ["appshell_counts"] });
            toast.success("Catatan pekerjaan berhasil dihapus");
            setDetailDialogOpen(false);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Gagal menghapus catatan");
          }
        }}
      />

      {/* 3. Detail Upcoming Work Dialog */}
      <Dialog open={upcomingDetailOpen} onOpenChange={setUpcomingDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {selectedUpcoming?.prioritas === "tinggi" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                  🔴 PRIORITAS TINGGI
                </span>
              ) : selectedUpcoming?.prioritas === "rendah" ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  🟢 PRIORITAS RENDAH
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  🟡 PRIORITAS NORMAL
                </span>
              )}
              {selectedUpcoming?.is_overdue && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                  ⚠️ OVERDUE
                </span>
              )}
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {selectedUpcoming?.judul}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tenggat Waktu: {selectedUpcoming?.tenggat || "Tidak ditentukan"}
            </DialogDescription>
          </DialogHeader>

          {selectedUpcoming?.deskripsi ? (
            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {selectedUpcoming.deskripsi}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Tidak ada deskripsi tambahan.</p>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => {
                setUpcomingDetailOpen(false);
                navigate({ to: "/mendatang" });
              }}
              className="w-full sm:w-auto text-xs"
            >
              Buka di Pekerjaan Mendatang
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUpcoming) return;
                try {
                  await startWorkFromUpcoming(selectedUpcoming, effectiveUserId);
                  qc.invalidateQueries({ queryKey: ["work_logs"] });
                  qc.invalidateQueries({ queryKey: ["upcoming_works"] });
                  qc.invalidateQueries({ queryKey: ["catatan_kerja"] });
                  qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
                  qc.invalidateQueries({ queryKey: ["appshell_counts"] });
                  toast.success("Pekerjaan dimulai dan dicatat ke Catatan Kerja!");
                  setUpcomingDetailOpen(false);
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : "Gagal memulai pekerjaan");
                }
              }}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white text-xs gap-1.5"
            >
              <Play className="size-3.5" />
              <span>Mulai Kerjakan Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Quick Action: Tambah Pekerjaan Mendatang */}
      <Dialog open={createUpcomingOpen} onOpenChange={setCreateUpcomingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Tambah Pekerjaan Mendatang
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Jadwalkan agenda atau rencana pekerjaan yang perlu diselesaikan.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newUpcomingJudul.trim()) {
                toast.error("Judul pekerjaan wajib diisi");
                return;
              }
              try {
                await createUpcomingWork(
                  {
                    judul: newUpcomingJudul.trim(),
                    deskripsi: newUpcomingDeskripsi.trim(),
                    prioritas: newUpcomingPrioritas,
                    tenggat: newUpcomingTenggat || null,
                    status: "direncanakan",
                  },
                  effectiveUserId,
                );
                qc.invalidateQueries({ queryKey: ["upcoming_works"] });
                qc.invalidateQueries({ queryKey: ["pekerjaan_mendatang"] });
                qc.invalidateQueries({ queryKey: ["appshell_counts"] });
                toast.success("Pekerjaan mendatang berhasil dijadwalkan!");
                setNewUpcomingJudul("");
                setNewUpcomingDeskripsi("");
                setNewUpcomingPrioritas("sedang");
                setNewUpcomingTenggat("");
                setCreateUpcomingOpen(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Gagal menjadwalkan pekerjaan");
              }
            }}
            className="space-y-3.5 mt-2"
          >
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Judul Pekerjaan *
              </label>
              <Input
                value={newUpcomingJudul}
                onChange={(e) => setNewUpcomingJudul(e.target.value)}
                placeholder="Contoh: Analisis Data Hasil Riset"
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Prioritas
                </label>
                <Select
                  value={newUpcomingPrioritas}
                  onValueChange={(v) => setNewUpcomingPrioritas(v as UpcomingWorkPriority)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tinggi">🔴 Tinggi</SelectItem>
                    <SelectItem value="sedang">🟡 Sedang</SelectItem>
                    <SelectItem value="rendah">🟢 Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tenggat Waktu
                </label>
                <Input
                  type="date"
                  value={newUpcomingTenggat}
                  onChange={(e) => setNewUpcomingTenggat(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Deskripsi (Opsional)
              </label>
              <Textarea
                value={newUpcomingDeskripsi}
                onChange={(e) => setNewUpcomingDeskripsi(e.target.value)}
                placeholder="Keterangan atau rincian agenda..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateUpcomingOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Simpan Agenda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Quick Action: Buat Notulen Rapat */}
      <Dialog open={createNotulenOpen} onOpenChange={setCreateNotulenOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Buat Notulen Rapat
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Dokumentasikan hasil diskusi, peserta rapat, dan keputusan penting.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newNotulenJudul.trim()) {
                toast.error("Judul rapat wajib diisi");
                return;
              }
              try {
                const { error } = await supabase.from("notulen").insert({
                  judul: newNotulenJudul.trim(),
                  tanggal: newNotulenTanggal || new Date().toISOString().slice(0, 10),
                  peserta: newNotulenPeserta.trim() || null,
                  isi: newNotulenIsi.trim() || null,
                  keputusan: newNotulenKeputusan.trim() || null,
                  dibuat_oleh: effectiveUserId,
                });
                if (error) throw error;
                qc.invalidateQueries({ queryKey: ["notulen"] });
                qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
                qc.invalidateQueries({ queryKey: ["appshell_counts"] });
                toast.success("Notulen rapat berhasil disimpan!");
                setNewNotulenJudul("");
                setNewNotulenPeserta("");
                setNewNotulenIsi("");
                setNewNotulenKeputusan("");
                setCreateNotulenOpen(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Gagal menyimpan notulen");
              }
            }}
            className="space-y-3 mt-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Rapat *
                </label>
                <Input
                  value={newNotulenJudul}
                  onChange={(e) => setNewNotulenJudul(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Mingguan"
                  className="text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tanggal Rapat
                </label>
                <Input
                  type="date"
                  value={newNotulenTanggal}
                  onChange={(e) => setNewNotulenTanggal(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Peserta Rapat
              </label>
              <Input
                value={newNotulenPeserta}
                onChange={(e) => setNewNotulenPeserta(e.target.value)}
                placeholder="Contoh: Budi, Ani, Hendra"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Ringkasan Pembahasan
              </label>
              <Textarea
                value={newNotulenIsi}
                onChange={(e) => setNewNotulenIsi(e.target.value)}
                placeholder="Poin-poin pembahasan..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Keputusan & Tindak Lanjut
              </label>
              <Textarea
                value={newNotulenKeputusan}
                onChange={(e) => setNewNotulenKeputusan(e.target.value)}
                placeholder="Hasil kesepakatan dan langkah selanjutnya..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateNotulenOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Simpan Notulen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
