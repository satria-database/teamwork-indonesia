import { Search, RotateCcw, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KATEGORI_DEFAULT } from "@/lib/workLogs";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  prioritas: string;
  onPrioritasChange: (val: string) => void;
  kategori: string;
  onKategoriChange: (val: string) => void;
  tanggal: string;
  onTanggalChange: (val: string) => void;
  onReset: () => void;
}

export function WorkLogFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
  prioritas,
  onPrioritasChange,
  kategori,
  onKategoriChange,
  tanggal,
  onTanggalChange,
  onReset,
}: Props) {
  const isFiltered =
    Boolean(search.trim()) ||
    status !== "semua" ||
    prioritas !== "semua" ||
    kategori !== "semua" ||
    Boolean(tanggal);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      id="work-log-filter-bar"
      className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-2.5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            id="filter-search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari judul, uraian, atau hasil kerja..."
            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus-visible:ring-fuchsia-500 h-10"
          />
        </div>

        {/* Filter Status */}
        <div className="col-span-1 lg:col-span-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger
              id="filter-status-select"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="belum_mulai">Belum Mulai</SelectItem>
              <SelectItem value="berjalan">Sedang Berjalan</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="terlambat">Terlambat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Prioritas */}
        <div className="col-span-1 lg:col-span-2">
          <Select value={prioritas} onValueChange={onPrioritasChange}>
            <SelectTrigger
              id="filter-prioritas-select"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
            >
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

        {/* Filter Kategori */}
        <div className="col-span-1 lg:col-span-2">
          <Select value={kategori} onValueChange={onKategoriChange}>
            <SelectTrigger
              id="filter-kategori-select"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
            >
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="semua">Semua Kategori</SelectItem>
              {KATEGORI_DEFAULT.map((kat) => (
                <SelectItem key={kat} value={kat}>
                  {kat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Tanggal */}
        <div className="col-span-1 lg:col-span-2 relative">
          <Input
            id="filter-tanggal-input"
            type="date"
            value={tanggal}
            onChange={(e) => onTanggalChange(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
          />
        </div>
      </div>

      {/* Filter Quick Pills & Reset */}
      {isFiltered && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Filter aktif:</span>
            {search && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                &quot;{search}&quot;
              </span>
            )}
            {status !== "semua" && (
              <span className="px-2 py-0.5 rounded-md bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-300 capitalize text-[11px]">
                Status: {status.replace("_", " ")}
              </span>
            )}
            {prioritas !== "semua" && (
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 capitalize text-[11px]">
                Prioritas: {prioritas}
              </span>
            )}
            {kategori !== "semua" && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-[11px]">
                Kategori: {kategori}
              </span>
            )}
            {tanggal && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 text-[11px]">
                Tgl: {tanggal}
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg h-7 px-2.5 gap-1 shrink-0"
          >
            <RotateCcw className="size-3" />
            Reset Filter
          </Button>
        </div>
      )}
    </div>
  );
}
