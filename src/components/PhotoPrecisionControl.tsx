import React, { useState } from "react";
import {
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getHighResolutionAvatarUrl, getAvatarSrcSet } from "@/lib/avatarUtils";

export interface PhotoPrecisionControlProps {
  imageUrl?: string | null;
  position?: string | null;
  scale?: number | null;
  onChange: (position: string, scale: number) => void;
  onSyncAll?: (position: string, scale: number) => void;
  title?: string;
  subtitle?: string;
  showSyncAllButton?: boolean;
  className?: string;
  compact?: boolean;
}

export function PhotoPrecisionControl({
  imageUrl,
  position = "50% 50%",
  scale = 1,
  onChange,
  onSyncAll,
  title = "Presisikan Posisi & Zoom Foto",
  subtitle = "Atur fokus wajah, zoom, dan posisi agar foto profil tampil tajam dan tidak terpotong.",
  showSyncAllButton = true,
  className = "",
  compact = false,
}: PhotoPrecisionControlProps) {
  const currentPos = position || "50% 50%";
  const currentScale = scale && !isNaN(scale) ? Number(scale) : 1;

  const [previewShape, setPreviewShape] = useState<"circle" | "portrait" | "square">("circle");
  const [syncedSuccess, setSyncedSuccess] = useState(false);

  // Parse X and Y percentages from position string
  const parsePos = (posStr: string): { x: number; y: number } => {
    const match = posStr.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
    if (match) {
      return { x: Math.round(Number(match[1])), y: Math.round(Number(match[2])) };
    }
    // Fallback named positions
    if (posStr.includes("top")) return { x: 50, y: 15 };
    if (posStr.includes("bottom")) return { x: 50, y: 85 };
    return { x: 50, y: 50 };
  };

  const { x, y } = parsePos(currentPos);

  const handleXChange = (newX: number) => {
    const updated = `${Math.max(0, Math.min(100, newX))}% ${y}%`;
    onChange(updated, currentScale);
  };

  const handleYChange = (newY: number) => {
    const updated = `${x}% ${Math.max(0, Math.min(100, newY))}%`;
    onChange(updated, currentScale);
  };

  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(0.7, Math.min(2.5, Number(newScale.toFixed(2))));
    onChange(currentPos, clamped);
  };

  const applyPreset = (presetPos: string, presetScale?: number) => {
    onChange(presetPos, presetScale !== undefined ? presetScale : currentScale);
  };

  const handleSyncAll = () => {
    if (onSyncAll) {
      onSyncAll(currentPos, currentScale);
      setSyncedSuccess(true);
      setTimeout(() => setSyncedSuccess(false), 3000);
    }
  };

  if (!imageUrl) {
    return (
      <div
        className={`p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center ${className}`}
      >
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Upload atau pilih foto profil terlebih dahulu untuk mempresisikan tampilan.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-indigo-100/90 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/60 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="size-3.5" />
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              <Check className="size-2.5" />
              HD Anti-Pecah
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Preview Frame Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPreviewShape("circle")}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              previewShape === "circle"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Lingkaran
          </button>
          <button
            type="button"
            onClick={() => setPreviewShape("portrait")}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              previewShape === "portrait"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            CV (3:4)
          </button>
          <button
            type="button"
            onClick={() => setPreviewShape("square")}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              previewShape === "square"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Kotak
          </button>
        </div>
      </div>

      {/* Main Grid: Live Preview & Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Interactive Preview */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Live Preview Presisi
          </div>

          <div
            className={`relative bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500/80 shadow-md transition-all ${
              previewShape === "circle"
                ? "size-32"
                : previewShape === "portrait"
                  ? "w-28 h-36 rounded-xl"
                  : "size-32 rounded-2xl"
            }`}
            style={{
              borderRadius: previewShape === "circle" ? "50%" : undefined,
              overflow: "hidden",
              isolation: "isolate",
            }}
          >
            <img
              src={getHighResolutionAvatarUrl(imageUrl) || imageUrl}
              srcSet={getAvatarSrcSet(getHighResolutionAvatarUrl(imageUrl) || imageUrl)}
              alt="Preview Presisi"
              className="size-full select-none transition-transform duration-75"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: currentPos,
                transform: currentScale !== 1 ? `scale(${currentScale})` : undefined,
                transformOrigin: currentPos,
                imageRendering: "auto",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }}
              loading="eager"
              decoding="async"
              draggable={false}
            />

            {/* Subtle Crosshair indicator overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 hover:opacity-40 transition-opacity">
              <div
                className="absolute size-3 rounded-full border border-white bg-indigo-500/80 shadow-xs -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>X: {x}%</span>
            <span>•</span>
            <span>Y: {y}%</span>
            <span>•</span>
            <span>Zoom: {Math.round(currentScale * 100)}%</span>
          </div>
        </div>

        {/* Right: Fine Sliders & Controls */}
        <div className="md:col-span-8 space-y-3.5">
          {/* Zoom / Scale Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <ZoomIn className="size-3.5 text-indigo-500" />
                <span>Zoom & Skala Wajah</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                <span>{Math.round(currentScale * 100)}%</span>
                <span className="text-slate-400">({currentScale.toFixed(2)}x)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleScaleChange(currentScale - 0.1)}
                disabled={currentScale <= 0.75}
                className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="size-3" />
              </button>

              <input
                type="range"
                min="0.75"
                max="2.5"
                step="0.05"
                value={currentScale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleScaleChange(currentScale + 0.1)}
                disabled={currentScale >= 2.45}
                className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="size-3" />
              </button>

              <button
                type="button"
                onClick={() => handleScaleChange(1)}
                className="px-2 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset ke ukuran asli 100%"
              >
                <RotateCcw className="size-2.5" />
                100%
              </button>
            </div>
          </div>

          {/* Posisi Vertikal (Y) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Posisi Vertikal (Atas — Bawah)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {y <= 25 ? "Fokus Atas" : y >= 75 ? "Fokus Bawah" : "Tengah"} ({y}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={y}
              onChange={(e) => handleYChange(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
              <span>0% (Atas / Kepala)</span>
              <span>50% (Tengah)</span>
              <span>100% (Bawah / Dada)</span>
            </div>
          </div>

          {/* Posisi Horizontal (X) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Posisi Horizontal (Kiri — Kanan)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {x <= 35 ? "Geser Kiri" : x >= 65 ? "Geser Kanan" : "Tengah"} ({x}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={x}
              onChange={(e) => handleXChange(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
              <span>0% (Kiri)</span>
              <span>50% (Tengah)</span>
              <span>100% (Kanan)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Preset Presisi Instan:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "Fokus Wajah", pos: "50% 20%", scale: 1.15 },
                { label: "Tengah Sempurna", pos: "50% 50%", scale: 1.0 },
                { label: "Close-up Wajah", pos: "50% 15%", scale: 1.35 },
                { label: "Fokus Dada", pos: "50% 65%", scale: 1.0 },
                { label: "Geser Kiri", pos: "35% 50%", scale: 1.0 },
                { label: "Geser Kanan", pos: "65% 50%", scale: 1.0 },
                { label: "Reset Standar", pos: "50% 50%", scale: 1.0 },
              ].map((p) => {
                const isActive = currentPos === p.pos && Math.abs(currentScale - p.scale) < 0.05;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.pos, p.scale)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs font-semibold"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sync All Button */}
      {showSyncAllButton && onSyncAll && (
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Ingin presisi posisi & zoom ini diterapkan ke seluruh profil akun, CV, dan Hero halaman
            depan?
          </p>

          <Button
            type="button"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncedSuccess}
            className={`rounded-xl text-xs font-semibold h-8 px-3.5 gap-1.5 shrink-0 transition-all cursor-pointer ${
              syncedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            }`}
          >
            {syncedSuccess ? (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Berhasil Diterapkan ke Semua!</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Terapkan Presisi ke Semua Foto</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
