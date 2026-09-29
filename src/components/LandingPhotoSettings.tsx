import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, Crop, ExternalLink, ImageIcon, Loader2, RotateCcw } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { AdjustedAvatar } from "@/components/AdjustedAvatar";
import { PhotoAdjustDialog } from "@/components/PhotoAdjustDialog";
import { uploadAvatarFile } from "@/lib/profiles";
import { saveLandingConfig, type LandingPageConfig, type PhotoAdjust } from "@/lib/landingConfig";

type PhotoField = "heroAvatarUrl" | "cvAvatarUrl" | "contactAvatarUrl";
type AdjustField = "heroAvatarAdjust" | "cvAvatarAdjust" | "contactAvatarAdjust";

const ADJUST_FIELD: Record<PhotoField, AdjustField> = {
  heroAvatarUrl: "heroAvatarAdjust",
  cvAvatarUrl: "cvAvatarAdjust",
  contactAvatarUrl: "contactAvatarAdjust",
};

const PHOTO_SLOTS: {
  field: PhotoField;
  title: string;
  description: string;
  shape: "rounded-full" | "rounded-2xl";
}[] = [
  {
    field: "heroAvatarUrl",
    title: "Foto Hero",
    description: "Foto bulat di bagian paling atas halaman depan.",
    shape: "rounded-full",
  },
  {
    field: "cvAvatarUrl",
    title: "Foto Curriculum Vitae",
    description: "Foto kotak pada kartu Curriculum Vitae.",
    shape: "rounded-2xl",
  },
  {
    field: "contactAvatarUrl",
    title: "Foto Mari Terhubung",
    description: "Foto bulat pada kartu kontak di bagian bawah.",
    shape: "rounded-full",
  },
];

interface LandingPhotoSettingsProps {
  user: User | null;
  config: LandingPageConfig;
  onConfigChange: (next: LandingPageConfig) => void;
  fallbackUrls: Record<PhotoField, string>;
}

export function LandingPhotoSettings({
  user,
  config,
  onConfigChange,
  fallbackUrls,
}: LandingPhotoSettingsProps) {
  const [busyField, setBusyField] = useState<PhotoField | null>(null);
  const [adjustingField, setAdjustingField] = useState<PhotoField | null>(null);
  const inputRefs = useRef<Partial<Record<PhotoField, HTMLInputElement | null>>>({});

  const persist = async (field: PhotoField, value: string | null) => {
    const next = { ...config, [field]: value, [ADJUST_FIELD[field]]: null };
    onConfigChange(next);
    await saveLandingConfig(next);
  };

  const handleSaveAdjust = async (field: PhotoField, adjust: PhotoAdjust) => {
    const next = { ...config, [ADJUST_FIELD[field]]: adjust };
    onConfigChange(next);
    try {
      await saveLandingConfig(next);
      toast.success("Posisi foto berhasil disimpan.");
    } catch {
      toast.error("Gagal menyimpan posisi foto.");
    }
  };

  const adjustingSlot = PHOTO_SLOTS.find((s) => s.field === adjustingField);

  const handleFileChange = async (field: PhotoField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu untuk mengganti foto.");
      return;
    }

    setBusyField(field);
    const toastId = `upload-${field}`;
    try {
      toast.loading("Mengunggah foto...", { id: toastId });
      const url = await uploadAvatarFile(user, file);
      await persist(field, url);
      toast.success("Foto berhasil diperbarui di halaman depan.", { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengunggah foto.";
      toast.error(message, { id: toastId });
    } finally {
      setBusyField(null);
    }
  };

  const handleReset = async (field: PhotoField) => {
    setBusyField(field);
    try {
      await persist(field, null);
      toast.success("Foto dikembalikan ke default.");
    } catch {
      toast.error("Gagal mengembalikan foto.");
    } finally {
      setBusyField(null);
    }
  };

  return (
    <section
      aria-labelledby="landing-photo-settings-title"
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
            <ImageIcon className="size-3.5" />
            <span>Foto Halaman Depan</span>
          </div>
          <h2
            id="landing-photo-settings-title"
            className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight"
          >
            Foto Profil Halaman Depan
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Ganti ketiga foto profil yang tampil di halaman depan. Perubahan langsung tersimpan.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-semibold h-8.5 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer self-start sm:self-auto"
        >
          <Link to="/" target="_blank">
            <ExternalLink className="size-3.5 mr-1.5 text-slate-400" />
            <span>Lihat Tampilan Depan</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
        {PHOTO_SLOTS.map((slot) => {
          const customUrl = config[slot.field];
          const previewUrl = customUrl || fallbackUrls[slot.field];
          const isBusy = busyField === slot.field;

          return (
            <div
              key={slot.field}
              className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
              <div className="relative">
                <AdjustedAvatar
                  src={previewUrl}
                  alt={`Pratinjau ${slot.title}`}
                  adjust={config[ADJUST_FIELD[slot.field]]}
                  className={`size-24 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 ${slot.shape}`}
                />
                {isBusy && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-slate-900/40 ${slot.shape}`}
                  >
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{slot.title}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                  {slot.description}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide mt-1.5 text-slate-500 dark:text-slate-400">
                  {customUrl ? "Foto khusus" : "Mengikuti default"}
                </p>
              </div>

              <input
                ref={(el) => {
                  inputRefs.current[slot.field] = el;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label={`Unggah ${slot.title}`}
                onChange={(e) => handleFileChange(slot.field, e)}
              />

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button
                  type="button"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => inputRefs.current[slot.field]?.click()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-3 gap-1.5 cursor-pointer"
                >
                  <Camera className="size-3.5" />
                  <span>Ganti Foto</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => setAdjustingField(slot.field)}
                  className="rounded-xl text-xs font-semibold h-8 px-3 gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Crop className="size-3.5" />
                  <span>Atur Posisi</span>
                </Button>
                {customUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleReset(slot.field)}
                    className="rounded-xl text-xs font-semibold h-8 px-3 gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
        Format PNG, JPG, WEBP, atau GIF dengan ukuran maksimal 2MB.
      </p>

      {adjustingSlot && (
        <PhotoAdjustDialog
          key={adjustingSlot.field}
          open
          onOpenChange={(open) => !open && setAdjustingField(null)}
          title={adjustingSlot.title}
          shape={adjustingSlot.shape}
          src={config[adjustingSlot.field] || fallbackUrls[adjustingSlot.field]}
          initialAdjust={config[ADJUST_FIELD[adjustingSlot.field]]}
          onSave={(adjust) => handleSaveAdjust(adjustingSlot.field, adjust)}
        />
      )}
    </section>
  );
}
