import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  RotateCcw,
  Check,
  Eye,
  Layers,
  FileText,
  User,
  Sparkles,
  NotebookPen,
  CalendarClock,
  FolderOpen,
  Pin,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Cpu,
} from "lucide-react";
import {
  LandingPageConfig,
  DEFAULT_LANDING_CONFIG,
  getSafeLandingConfig,
  ALL_LANDING_SECTIONS,
  type LandingSectionId,
} from "@/lib/landingConfig";
import type { WorkLog } from "@/lib/workLogs";
import { toast } from "sonner";

interface LandingConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: LandingPageConfig;
  onSave: (newConfig: LandingPageConfig) => void;
  availableWorkLogs?: WorkLog[];
  workLogs?: WorkLog[];
  activeUserEmail?: string;
  activeUserName?: string;
}

export function LandingConfigModal({
  open,
  onOpenChange,
  config: initialConfig,
  onSave,
  availableWorkLogs = [],
  workLogs = [],
  activeUserEmail,
  activeUserName,
}: LandingConfigModalProps) {
  const getSafeConfig = (cfg?: LandingPageConfig | null): LandingPageConfig => {
    return getSafeLandingConfig(cfg || DEFAULT_LANDING_CONFIG);
  };

  const [draft, setDraft] = useState<LandingPageConfig>(() => getSafeConfig(initialConfig));
  const [activeTab, setActiveTab] = useState<"sections" | "order" | "logs" | "cv">("sections");

  useEffect(() => {
    if (open) {
      setDraft(getSafeConfig(initialConfig));
    }
  }, [open, initialConfig]);

  const allAvailableLogs = availableWorkLogs.length > 0 ? availableWorkLogs : workLogs;

  const handleSave = () => {
    onSave(getSafeConfig(draft));
    toast.success("Konfigurasi tampilan landing page berhasil disimpan!");
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft(DEFAULT_LANDING_CONFIG);
    toast.info("Pengaturan dikembalikan ke konfigurasi default.");
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const safeDraft = getSafeConfig(draft);
    const order = [...safeDraft.sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const temp = order[index];
    const target = order[targetIndex];
    if (!temp || !target) return;
    order[index] = target;
    order[targetIndex] = temp;
    setDraft({ ...safeDraft, sectionOrder: order });
  };

  const toggleSectionVisibility = (id: LandingSectionId, val: boolean) => {
    const safe = getSafeConfig(draft);
    switch (id) {
      case "hero":
        setDraft({ ...safe, showHeroSection: val });
        break;
      case "metrics":
        setDraft({ ...safe, showMetricsBanner: val });
        break;
      case "dashboard":
        setDraft({ ...safe, showDashboardSection: val });
        break;
      case "cv":
        setDraft({ ...safe, showCVSection: val });
        break;
      case "skills":
        setDraft({ ...safe, showSkillsSection: val });
        break;
    }
  };

  const isSectionVisible = (id: LandingSectionId): boolean => {
    const safe = getSafeConfig(draft);
    switch (id) {
      case "hero":
        return safe.showHeroSection;
      case "metrics":
        return safe.showMetricsBanner;
      case "dashboard":
        return safe.showDashboardSection;
      case "cv":
        return safe.showCVSection;
      case "skills":
        return safe.showSkillsSection;
      default:
        return true;
    }
  };

  const toggleSelectedWorkLog = (id: string) => {
    setDraft((prev) => {
      const safePrev = getSafeConfig(prev);
      const exists = safePrev.selectedWorkLogIds.includes(id);
      const updated = exists
        ? safePrev.selectedWorkLogIds.filter((item) => item !== id)
        : [...safePrev.selectedWorkLogIds, id];
      return { ...safePrev, selectedWorkLogIds: updated };
    });
  };

  const currentDraft = getSafeConfig(draft);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-3xl max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Konfigurasi Tampilan Landing Page
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pilih modul, bagian, catatan kerja, dan sumber resume yang ingin ditampilkan di
                halaman depan publik.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Banner Fitur Lengkap di Sidebar */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <SlidersHorizontal className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Tersedia menu khusus di sidebar: <strong>Tata Letak Landing</strong> untuk mengatur
              susunan, teks hero, dan urutan.
            </span>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 text-xs font-semibold h-7.5 px-2.5 gap-1 shrink-0 cursor-pointer hover:bg-indigo-100"
          >
            <Link to="/tata-letak">
              <span>Buka Sidebar</span>
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "sections" | "order" | "logs" | "cv")}
          className="mt-2"
        >
          <TabsList className="grid grid-cols-4 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-4">
            <TabsTrigger
              value="order"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Susunan</span>
            </TabsTrigger>
            <TabsTrigger
              value="sections"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
            >
              <Layers className="size-3.5" />
              <span>Visibilitas</span>
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
            >
              <NotebookPen className="size-3.5" />
              <span>Catatan</span>
            </TabsTrigger>
            <TabsTrigger
              value="cv"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
            >
              <User className="size-3.5" />
              <span>Resume</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 0: SUSUNAN & URUTAN BAGIAN */}
          <TabsContent value="order" className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Urutan Tampilan Bagian (Atas ke Bawah)
                </span>
                <span className="text-[11px] text-slate-400">Gunakan panah naik/turun</span>
              </div>

              <div className="space-y-2">
                {currentDraft.sectionOrder.map((sectionId, idx) => {
                  const meta = ALL_LANDING_SECTIONS.find((s) => s.id === sectionId);
                  const isVisible = isSectionVisible(sectionId);
                  return (
                    <div
                      key={sectionId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isVisible
                          ? "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs"
                          : "bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {meta?.label || sectionId}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{meta?.desc || ""}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          className="size-7 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Pindahkan ke atas"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === currentDraft.sectionOrder.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          className="size-7 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Pindahkan ke bawah"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                        <Switch
                          checked={isVisible}
                          onCheckedChange={(val) => toggleSectionVisibility(sectionId, val)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 1: VISIBILITAS BAGIAN */}
          <TabsContent value="sections" className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Visibilitas Blok Landing Page
              </span>

              {/* 1. Ringkasan Dasbor Operasional */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-indigo-500" />
                    <span>Sistem Dasbor Workspace & Produktivitas</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan tab interaktif: Catatan Kerja, Jadwal Mendatang, Notulen Rapat, dan
                    Berkas.
                  </p>
                </div>
                <Switch
                  checked={currentDraft.showDashboardSection}
                  onCheckedChange={(val) =>
                    setDraft((prev) => ({ ...getSafeConfig(prev), showDashboardSection: val }))
                  }
                />
              </div>

              {/* 2. Metrik Angka Hero */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Eye className="size-3.5 text-emerald-500" />
                    <span>Kartu Metrik Statistik Angka (Hero)</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan 4 kartu ringkasan total Catatan, Tugas Mendatang, Notulen, dan
                    Berkas.
                  </p>
                </div>
                <Switch
                  checked={currentDraft.showMetricsBanner}
                  onCheckedChange={(val) =>
                    setDraft((prev) => ({ ...getSafeConfig(prev), showMetricsBanner: val }))
                  }
                />
              </div>

              {/* 3. Curriculum Vitae & Portofolio */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="size-3.5 text-blue-500" />
                    <span>Bagian Curriculum Vitae & Portofolio</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan ringkasan profil, pengalaman kerja, riwayat pendidikan, dan kontak.
                  </p>
                </div>
                <Switch
                  checked={currentDraft.showCVSection}
                  onCheckedChange={(val) =>
                    setDraft((prev) => ({ ...getSafeConfig(prev), showCVSection: val }))
                  }
                />
              </div>

              {/* 5. Keahlian & Spesialisasi */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-amber-500" />
                    <span>Bagian Keahlian & Kompetensi Teknis</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan daftar keahlian spreadsheet, database, cataloging, dan analytical
                    tools.
                  </p>
                </div>
                <Switch
                  checked={currentDraft.showSkillsSection}
                  onCheckedChange={(val) =>
                    setDraft((prev) => ({ ...getSafeConfig(prev), showSkillsSection: val }))
                  }
                />
              </div>
            </div>

            {/* Tab yang aktif pada Ringkasan Dasbor */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Pilihan Tab Dasbor yang Diaktifkan
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer">
                  <Switch
                    checked={currentDraft.visibleDashboardTabs.catatan}
                    onCheckedChange={(val) =>
                      setDraft((prev) => {
                        const safe = getSafeConfig(prev);
                        return {
                          ...safe,
                          visibleDashboardTabs: { ...safe.visibleDashboardTabs, catatan: val },
                        };
                      })
                    }
                  />
                  <span>Catatan Kerja</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer">
                  <Switch
                    checked={currentDraft.visibleDashboardTabs.rencana}
                    onCheckedChange={(val) =>
                      setDraft((prev) => {
                        const safe = getSafeConfig(prev);
                        return {
                          ...safe,
                          visibleDashboardTabs: { ...safe.visibleDashboardTabs, rencana: val },
                        };
                      })
                    }
                  />
                  <span>Mendatang</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer">
                  <Switch
                    checked={currentDraft.visibleDashboardTabs.notulen}
                    onCheckedChange={(val) =>
                      setDraft((prev) => {
                        const safe = getSafeConfig(prev);
                        return {
                          ...safe,
                          visibleDashboardTabs: { ...safe.visibleDashboardTabs, notulen: val },
                        };
                      })
                    }
                  />
                  <span>Notulen</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer">
                  <Switch
                    checked={currentDraft.visibleDashboardTabs.berkas}
                    onCheckedChange={(val) =>
                      setDraft((prev) => {
                        const safe = getSafeConfig(prev);
                        return {
                          ...safe,
                          visibleDashboardTabs: { ...safe.visibleDashboardTabs, berkas: val },
                        };
                      })
                    }
                  />
                  <span>Berkas</span>
                </label>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: KONFIGURASI CATATAN KERJA */}
          <TabsContent value="logs" className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Filter & Batasan Log Pekerjaan
              </span>

              {/* Filter Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Filter Status Pekerjaan yang Muncul
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "semua", label: "Semua Catatan" },
                      { id: "selesai", label: "Hanya Selesai" },
                      { id: "berjalan", label: "Hanya Berjalan" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({ ...getSafeConfig(prev), workLogsFilter: opt.id }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        currentDraft.workLogsFilter === opt.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jumlah Catatan yang Ditampilkan */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Batas Jumlah Catatan yang Ditampilkan
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({ ...getSafeConfig(prev), workLogsLimit: num }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        currentDraft.workLogsLimit === num
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {num} Item
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilih Catatan Tertentu untuk Disematkan / Ditampilkan */}
              {allAvailableLogs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Pin className="size-3.5 text-indigo-500" />
                      <span>Sematkan Catatan Pekerjaan Pilihan Spesifik</span>
                    </Label>
                    <span className="text-[10px] text-slate-400">
                      {currentDraft.selectedWorkLogIds.length === 0
                        ? "Otomatis (Berdasarkan tanggal terbaru)"
                        : `${currentDraft.selectedWorkLogIds.length} Disematkan`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Bila tidak ada yang dipilih, sistem otomatis mengambil{" "}
                    {currentDraft.workLogsLimit} log terbaru.
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    {allAvailableLogs.map((log) => {
                      const isSelected = currentDraft.selectedWorkLogIds.includes(log.id);
                      return (
                        <div
                          key={log.id}
                          onClick={() => toggleSelectedWorkLog(log.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${
                            isSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800"
                              : "border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-750"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {log.judul}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {log.tanggal} • {log.kategori} • {log.durasi_menit} Menit
                            </p>
                          </div>
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={`text-[10px] shrink-0 ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "text-slate-500 border-slate-300"
                            }`}
                          >
                            {isSelected ? "Dipilih ✓" : "Pilih"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: RESUME & CV */}
          <TabsContent value="cv" className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Sumber Data Resume & Profil Publik
              </span>

              {/* Pilihan Sumber Profil */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Akun Profil yang Ditampilkan di Landing Page
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), cvSource: "active_user" }))
                    }
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      currentDraft.cvSource === "active_user"
                        ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Akun Pengguna Aktif
                      </span>
                      {currentDraft.cvSource === "active_user" && (
                        <Check className="size-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Menggunakan data resume & profil dari akun login saat ini (
                      {activeUserName || activeUserEmail || "Akun Anda"}).
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), cvSource: "default_satria" }))
                    }
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      currentDraft.cvSource === "default_satria"
                        ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Satria Nur Ardiansyah
                      </span>
                      {currentDraft.cvSource === "default_satria" && (
                        <Check className="size-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Menggunakan data resume asli Technical Data Supporting & SMK N 1 Tuban.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-elemen Resume yang Muncul */}
              <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Elemen Resume yang Ditampilkan
                </span>

                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Capaian Terverifikasi Dasbor</Label>
                    <p className="text-[11px] text-slate-500">
                      Tampilkan riwayat log pekerjaan selesai yang diverifikasi oleh sistem dasbor.
                    </p>
                  </div>
                  <Switch
                    checked={currentDraft.showVerifiedAchievementsInCV}
                    onCheckedChange={(val) =>
                      setDraft((prev) => ({
                        ...getSafeConfig(prev),
                        showVerifiedAchievementsInCV: val,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Riwayat Pengalaman Kerja</Label>
                    <p className="text-[11px] text-slate-500">
                      Tampilkan daftar riwayat perusahaan dan jabatan.
                    </p>
                  </div>
                  <Switch
                    checked={currentDraft.showCVExperience}
                    onCheckedChange={(val) =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), showCVExperience: val }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Riwayat Pendidikan</Label>
                    <p className="text-[11px] text-slate-500">
                      Tampilkan institusi dan program studi.
                    </p>
                  </div>
                  <Switch
                    checked={currentDraft.showCVEducation}
                    onCheckedChange={(val) =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), showCVEducation: val }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Pills Keahlian & Spesialisasi</Label>
                    <p className="text-[11px] text-slate-500">
                      Tampilkan tag keahlian teknis pada kartu CV.
                    </p>
                  </div>
                  <Switch
                    checked={currentDraft.showCVSkills}
                    onCheckedChange={(val) =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), showCVSkills: val }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Kontak & Lokasi</Label>
                    <p className="text-[11px] text-slate-500">
                      Tampilkan email, nomor telepon/WhatsApp, dan alamat domisili.
                    </p>
                  </div>
                  <Switch
                    checked={currentDraft.showCVContactInfo}
                    onCheckedChange={(val) =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), showCVContactInfo: val }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Tentang Saya / Ringkasan Profil</Label>
                    <p className="text-[11px] text-slate-500">
                      Tampilkan paragraf ringkasan profil dan latar belakang.
                    </p>
                  </div>
                  <Switch
                    checked={currentDraft.showCVAbout}
                    onCheckedChange={(val) =>
                      setDraft((prev) => ({ ...getSafeConfig(prev), showCVAbout: val }))
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-700 h-9 gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset ke Default</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-4 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="size-3.5" />
              <span>Terapkan Konfigurasi</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
