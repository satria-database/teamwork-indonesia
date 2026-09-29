import { useRef, useState } from "react";
import { Loader2, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdjustedAvatar } from "@/components/AdjustedAvatar";
import { DEFAULT_PHOTO_ADJUST, type PhotoAdjust } from "@/lib/landingConfig";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const PREVIEW_SIZE = 240;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, step = 0.5) => Math.round(value / step) * step;

interface PhotoAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  src: string;
  shape: "rounded-full" | "rounded-2xl";
  initialAdjust?: PhotoAdjust | null | undefined;
  onSave: (adjust: PhotoAdjust) => Promise<void>;
}

export function PhotoAdjustDialog({
  open,
  onOpenChange,
  title,
  src,
  shape,
  initialAdjust,
  onSave,
}: PhotoAdjustDialogProps) {
  const [adjust, setAdjust] = useState<PhotoAdjust>(initialAdjust ?? DEFAULT_PHOTO_ADJUST);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origin: PhotoAdjust } | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) setAdjust(initialAdjust ?? DEFAULT_PHOTO_ADJUST);
    onOpenChange(next);
  };

  const update = (patch: Partial<PhotoAdjust>) =>
    setAdjust((prev) => ({
      x: clamp(round(patch.x ?? prev.x), 0, 100),
      y: clamp(round(patch.y ?? prev.y), 0, 100),
      zoom: clamp(Math.round((patch.zoom ?? prev.zoom) * 100) / 100, MIN_ZOOM, MAX_ZOOM),
    }));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: adjust };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const sensitivity = 100 / (PREVIEW_SIZE * Math.max(drag.origin.zoom - 0.5, 0.5));
    update({
      x: drag.origin.x - (e.clientX - drag.startX) * sensitivity,
      y: drag.origin.y - (e.clientY - drag.startY) * sensitivity,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, Partial<PhotoAdjust>> = {
      ArrowLeft: { x: adjust.x + step },
      ArrowRight: { x: adjust.x - step },
      ArrowUp: { y: adjust.y + step },
      ArrowDown: { y: adjust.y - step },
      "+": { zoom: adjust.zoom + 0.05 },
      "=": { zoom: adjust.zoom + 0.05 },
      "-": { zoom: adjust.zoom - 0.05 },
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      update(move);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(adjust);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Atur Posisi {title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Geser foto untuk memindahkan, gunakan slider untuk zoom dan posisi presisi. Tombol panah
            keyboard menggeser 1% (tahan Shift untuk 5%).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 py-2">
          <div
            role="application"
            tabIndex={0}
            aria-label={`Area pengaturan posisi ${title}. Seret atau gunakan tombol panah.`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={handleKeyDown}
            onWheel={(e) => update({ zoom: adjust.zoom - e.deltaY * 0.001 })}
            className="relative cursor-grab active:cursor-grabbing touch-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded-2xl"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          >
            <AdjustedAvatar
              src={src}
              alt={`Pratinjau ${title}`}
              adjust={adjust}
              className={`size-full ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 ${shape}`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 overflow-hidden ${shape}`}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
          <p className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Move className="size-3" />
            Seret foto untuk mengatur posisi
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <AdjustSlider
            label="Zoom"
            value={adjust.zoom}
            display={`${Math.round(adjust.zoom * 100)}%`}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            onChange={(zoom) => update({ zoom })}
            leading={<ZoomOut className="size-3.5 text-slate-400" />}
            trailing={<ZoomIn className="size-3.5 text-slate-400" />}
          />
          <AdjustSlider
            label="Horizontal"
            value={adjust.x}
            display={`${adjust.x}%`}
            min={0}
            max={100}
            step={0.5}
            onChange={(x) => update({ x })}
          />
          <AdjustSlider
            label="Vertikal"
            value={adjust.y}
            display={`${adjust.y}%`}
            min={0}
            max={100}
            step={0.5}
            onChange={(y) => update({ y })}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdjust(DEFAULT_PHOTO_ADJUST)}
            className="rounded-xl text-xs gap-1.5 border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="size-3.5" />
            Tengahkan
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Simpan Posisi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AdjustSliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

function AdjustSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  leading,
  trailing,
}: AdjustSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">{display}</span>
      </div>
      <div className="flex items-center gap-2">
        {leading}
        <Slider
          aria-label={label}
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v ?? value)}
        />
        {trailing}
      </div>
    </div>
  );
}
