import { useState, useEffect } from "react";
import { getHighResolutionAvatarUrl, getAvatarSrcSet } from "@/lib/avatarUtils";
import satriaRedAvatar from "@/assets/images/satria_avatar_red_1790582692896.jpg";

export function UserAvatar({
  className = "size-16",
  status = "online",
  avatarUrl,
  nama,
  position,
  scale,
}: {
  className?: string;
  status?: "online" | "offline" | "busy";
  avatarUrl?: string | null;
  nama?: string | null;
  position?: string | null;
  scale?: number | null;
}) {
  const [imgError, setImgError] = useState(false);

  // Gunakan URL resolusi penuh asli (anti-thumbnail / anti-blur / minimal 1024x1024)
  const effectiveRawUrl = avatarUrl || satriaRedAvatar;
  const highResUrl = getHighResolutionAvatarUrl(effectiveRawUrl) || effectiveRawUrl;
  const srcSet = getAvatarSrcSet(highResUrl);

  // Reset imgError if avatarUrl changes
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  // Client-side fallback for stored position and scale to prevent SSR hydration mismatch
  const [clientPosition, setClientPosition] = useState<string | null>(null);
  const [clientScale, setClientScale] = useState<number | null>(null);

  useEffect(() => {
    if (!position && typeof window !== "undefined") {
      const stored = localStorage.getItem("workhub_avatar_position");
      if (stored) setClientPosition(stored);
    }
    if ((scale === null || scale === undefined) && typeof window !== "undefined") {
      const stored = localStorage.getItem("workhub_avatar_scale");
      if (stored) setClientScale(parseFloat(stored));
    }
  }, [position, scale]);

  const effectivePosition = position || clientPosition || "50% 50%";
  const effectiveScale =
    scale !== null && scale !== undefined && !isNaN(scale)
      ? Number(scale)
      : clientScale !== null && !isNaN(clientScale)
        ? clientScale
        : 1;

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`relative border-2 border-indigo-100 dark:border-slate-700 bg-amber-50 dark:bg-slate-800 shadow-sm flex items-center justify-center ${className}`}
        style={{
          borderRadius: "50%",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {highResUrl && !imgError ? (
          <img
            src={highResUrl}
            srcSet={srcSet}
            alt={nama || "Foto Profil"}
            className="size-full select-none"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: effectivePosition,
              transform: effectiveScale !== 1 ? `scale(${effectiveScale})` : undefined,
              transformOrigin: effectivePosition,
              imageRendering: "auto",
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
            loading="eager"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
            onError={() => {
              if (highResUrl !== satriaRedAvatar) {
                // Fallback ke aset HD lokal 1024x1024 jika url kustom bermasalah
                setImgError(false);
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          <img
            src={satriaRedAvatar}
            srcSet={`${satriaRedAvatar} 1x, ${satriaRedAvatar} 2x`}
            alt={nama || "Foto Profil"}
            className="size-full select-none"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 50%",
            }}
            loading="eager"
            decoding="async"
          />
        )}
      </div>

      {status === "online" && (
        <span
          className="absolute bottom-0 right-0 block size-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs"
          title="Online"
        />
      )}
    </div>
  );
}
