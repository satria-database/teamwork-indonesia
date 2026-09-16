import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  UploadCloud,
  FileIcon,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Tag as TagIcon,
  FileCheck,
} from "lucide-react";
import {
  type WorkLog,
  type WorkLogPayload,
  type WorkAttachment,
  type WorkLogStatus,
  type WorkLogPriority,
  KATEGORI_DEFAULT,
  TAGS_SUGGESTION,
  uploadAttachmentFile,
  deleteAttachmentFile,
} from "@/lib/workLogs";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: WorkLog | null;
  onSubmit: (payload: WorkLogPayload, id?: string) => Promise<void>;
}

export function WorkLogFormDialog({ open, onOpenChange, initialData, onSubmit }: Props) {
  const { user } = useAuth();

  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");
  const [status, setStatus] = useState<WorkLogStatus>("belum_mulai");
  const [progress, setProgress] = useState(0);
  const [kategori, setKategori] = useState("Development");
  const [customKategori, setCustomKategori] = useState("");
  const [isCustomKat, setIsCustomKat] = useState(false);
  const [prioritas, setPrioritas] = useState<WorkLogPriority>("sedang");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [catatanHasil, setCatatanHasil] = useState("");
  const [upcomingWorkId, setUpcomingWorkId] = useState<string | null>(null);
  const [upcomingWorkJudul, setUpcomingWorkJudul] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<WorkAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setWaktuSekarang = (type: "mulai" | "selesai") => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (type === "mulai") {
      setWaktuMulai(timeStr);
    } else {
      setWaktuSelesai(timeStr);
    }
  };

  // Initialize or reset form values
  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setDeskripsi(initialData.deskripsi || "");
      setTanggal(initialData.tanggal);
      setWaktuMulai(initialData.waktu_mulai || "");
      setWaktuSelesai(initialData.waktu_selesai || "");
      setStatus(initialData.status);
      setProgress(initialData.progress || 0);

      if (KATEGORI_DEFAULT.includes(initialData.kategori)) {
        setKategori(initialData.kategori);
        setIsCustomKat(false);
        setCustomKategori("");
      } else {
        setKategori("Lainnya");
        setIsCustomKat(true);
        setCustomKategori(initialData.kategori);
      }

      setPrioritas(initialData.prioritas || "sedang");
      setTags(initialData.tags || []);
      setLinkUrl(initialData.link_url || "");
      setCatatanHasil(initialData.catatan_hasil || "");
      setUpcomingWorkId(initialData.upcoming_work_id || null);
      setUpcomingWorkJudul(initialData.upcoming_work_judul || null);
      setAttachments(initialData.attachments || []);
    } else {
      setJudul("");
      setDeskripsi("");
      setTanggal(new Date().toISOString().slice(0, 10));
      setWaktuMulai("");
      setWaktuSelesai("");
      setStatus("belum_mulai");
      setProgress(0);
      setKategori("Development");
      setIsCustomKat(false);
      setCustomKategori("");
      setPrioritas("sedang");
      setTags([]);
      setLinkUrl("");
      setCatatanHasil("");
      setUpcomingWorkId(null);
      setUpcomingWorkJudul(null);
      setAttachments([]);
    }
  }, [initialData, open]);

  // Handle status sync
  const handleStatusChange = (newStatus: WorkLogStatus) => {
    setStatus(newStatus);
    if (newStatus === "selesai") {
      setProgress(100);
    } else if (newStatus === "belum_mulai") {
      setProgress(0);
    } else if (newStatus === "berjalan" && progress === 0) {
      setProgress(25);
    }
  };

  // Handle progress sync
  const handleProgressChange = (val: number) => {
    setProgress(val);
    if (val === 100) {
      setStatus("selesai");
    } else if (val === 0) {
      setStatus("belum_mulai");
    } else {
      setStatus("berjalan");
    }
  };

  // Add Tag
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // File Upload
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments: WorkAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const uploaded = await uploadAttachmentFile(file, user?.id);
        newAttachments.push(uploaded);
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
      toast.success(`${files.length} berkas berhasil diunggah.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah berkas");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Remove Attachment
  const handleRemoveAttachment = async (att: WorkAttachment) => {
    try {
      await deleteAttachmentFile(att.path);
    } catch {
      // ignore
    }
    setAttachments((prev) => prev.filter((item) => item.id !== att.id));
  };

  // Submit Handler
  const handleSave = async () => {
    if (!judul.trim()) {
      toast.error("Judul pekerjaan wajib diisi!");
      return;
    }

    const finalKategori = isCustomKat && customKategori.trim() ? customKategori.trim() : kategori;

    setIsSaving(true);
    try {
      const payload: WorkLogPayload = {
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        tanggal,
        waktu_mulai: waktuMulai || null,
        waktu_selesai: waktuSelesai || null,
        durasi_menit: 0,
        status,
        progress,
        kategori: finalKategori,
        prioritas,
        tags,
        link_url: linkUrl.trim() || null,
        catatan_hasil: catatanHasil.trim() || null,
        upcoming_work_id: upcomingWorkId,
        upcoming_work_judul: upcomingWorkJudul,
        attachments,
      };

      await onSubmit(payload, initialData?.id);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pekerjaan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="work-log-form-modal"
        className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">
              WL
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {initialData ? "Edit Catatan Pekerjaan" : "Tambah Catatan Pekerjaan Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Catat uraian pekerjaan, waktu pengerjaan, status, dan lampiran berkas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Source from Upcoming Work Notice */}
          {upcomingWorkId && (
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500 shrink-0" />
              <span>
                Terhubung dengan Rencana Mendatang:{" "}
                <strong>{upcomingWorkJudul || "Rencana"}</strong>
              </span>
            </div>
          )}

          {/* 1. Judul Pekerjaan */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Judul Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <Input
              id="form-input-judul"
              placeholder="Contoh: Slicing UI Catatan Kerja & Optimasi Laporan"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus-visible:ring-fuchsia-500"
            />
          </div>

          {/* 2. Deskripsi Pekerjaan */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi / Uraian Pekerjaan
            </label>
            <Textarea
              id="form-input-deskripsi"
              placeholder="Rincian lingkup tugas, kendala, atau poin yang dikerjakan..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs leading-relaxed focus-visible:ring-fuchsia-500"
            />
          </div>

          {/* 3. Catatan Hasil Pekerjaan (Work Result) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck className="size-3.5 text-emerald-500" />
              <span>Catatan Hasil / Output Pekerjaan</span>
            </label>
            <Textarea
              id="form-input-catatan-hasil"
              placeholder="Ringkasan hasil akhir, link pull request, output berkas, atau catatan serah terima..."
              value={catatanHasil}
              onChange={(e) => setCatatanHasil(e.target.value)}
              rows={2}
              className="rounded-xl border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 text-xs leading-relaxed focus-visible:ring-emerald-500"
            />
          </div>

          {/* 4. Grid Tanggal & Waktu */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Waktu Pengerjaan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Tanggal</label>
                <Input
                  id="form-input-tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-500">Waktu Mulai</label>
                  <button
                    type="button"
                    onClick={() => setWaktuSekarang("mulai")}
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                  >
                    Sekarang
                  </button>
                </div>
                <Input
                  id="form-input-waktu-mulai"
                  type="time"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-500">Waktu Selesai</label>
                  <button
                    type="button"
                    onClick={() => setWaktuSekarang("selesai")}
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                  >
                    Sekarang
                  </button>
                </div>
                <Input
                  id="form-input-waktu-selesai"
                  type="time"
                  value={waktuSelesai}
                  onChange={(e) => setWaktuSelesai(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 5. Status, Prioritas & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => handleStatusChange(val as WorkLogStatus)}
              >
                <SelectTrigger
                  id="form-select-status"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9"
                >
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="belum_mulai">Belum Mulai</SelectItem>
                  <SelectItem value="berjalan">Sedang Berjalan</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioritas */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Prioritas
              </label>
              <Select
                value={prioritas}
                onValueChange={(val) => setPrioritas(val as WorkLogPriority)}
              >
                <SelectTrigger
                  id="form-select-prioritas"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9"
                >
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="rendah">Rendah</SelectItem>
                  <SelectItem value="sedang">Sedang</SelectItem>
                  <SelectItem value="tinggi">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kategori */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Kategori
              </label>
              <Select
                value={isCustomKat ? "Lainnya" : kategori}
                onValueChange={(val) => {
                  if (val === "Lainnya") {
                    setIsCustomKat(true);
                  } else {
                    setIsCustomKat(false);
                    setKategori(val);
                  }
                }}
              >
                <SelectTrigger
                  id="form-select-kategori"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9"
                >
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {KATEGORI_DEFAULT.map((kat) => (
                    <SelectItem key={kat} value={kat}>
                      {kat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Category Input if selected */}
          {isCustomKat && (
            <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Nama Kategori Kustom:
              </label>
              <Input
                placeholder="Masukkan kategori kustom..."
                value={customKategori}
                onChange={(e) => setCustomKategori(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-8.5"
              />
            </div>
          )}

          {/* 6. Slider Progress */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Progres Pengerjaan
              </span>
              <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400 text-sm">
                {progress}%
              </span>
            </div>
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={5}
              onValueChange={([val]) => {
                if (val !== undefined) handleProgressChange(val);
              }}
              className="py-1 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Belum Mulai)</span>
              <span>50% (Separuh Jalan)</span>
              <span>100% (Selesai Tuntas)</span>
            </div>
          </div>

          {/* 7. Link URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Tautan / Link Pekerjaan (Opsional)
            </label>
            <Input
              id="form-input-link"
              type="url"
              placeholder="https://github.com/... atau https://figma.com/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9 focus-visible:ring-fuchsia-500"
            />
          </div>

          {/* 8. Tags */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TagIcon className="size-3.5 text-slate-400" />
              <span>Tag / Label</span>
            </label>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Tambah tag lalu tekan Enter atau klik Tambah"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-8.5"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(tagInput)}
                className="rounded-xl text-xs h-8.5 px-3 border-slate-200"
              >
                Tambah
              </Button>
            </div>

            {/* Suggested Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400">Saran:</span>
              {TAGS_SUGGESTION.slice(0, 6).map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => handleAddTag(sug)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-fuchsia-50 hover:text-fuchsia-600 transition-colors"
                >
                  +{sug}
                </button>
              ))}
            </div>

            {/* Active Tags */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/60"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 9. Lampiran File */}
          <div className="space-y-2 pt-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Lampiran Berkas Hasil Kerja</span>
              {isUploading && (
                <span className="text-xs text-fuchsia-600 animate-pulse">Mengunggah...</span>
              )}
            </label>

            {/* Upload Area */}
            <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 rounded-2xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-all bg-slate-50/50 dark:bg-slate-800/30">
              <UploadCloud className="size-6 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tarik berkas ke sini atau{" "}
                <span className="text-fuchsia-600">pilih dari folder</span>
              </p>
              <p className="text-[10px] text-slate-400">PDF, PNG, JPG, ZIP, Dokumen hingga 10MB</p>
              <input
                type="file"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={handleUploadFile}
              />
            </label>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="size-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "File"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att)}
                      className="size-6 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold px-4 h-9"
          >
            Batal
          </Button>
          <Button
            type="button"
            id="btn-submit-work-log"
            disabled={isSaving || isUploading || !judul.trim()}
            onClick={handleSave}
            className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5 h-9 shadow-xs"
          >
            {isSaving ? "Menyimpan..." : initialData ? "Perbarui Log" : "Simpan Log Pekerjaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
