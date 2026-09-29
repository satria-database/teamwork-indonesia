import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_PHOTO_ADJUST, type PhotoAdjust } from "@/lib/landingConfig";

export function getPhotoAdjustStyle(adjust?: PhotoAdjust | null): CSSProperties {
  const { x, y, zoom } = adjust ?? DEFAULT_PHOTO_ADJUST;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${x}% ${y}%`,
  };
}

interface AdjustedAvatarProps {
  src: string | undefined;
  alt: string;
  adjust?: PhotoAdjust | null | undefined;
  className?: string;
  fallbackPosition?: string;
}

export function AdjustedAvatar({
  src,
  alt,
  adjust,
  className,
  fallbackPosition,
}: AdjustedAvatarProps) {
  const style =
    adjust || !fallbackPosition
      ? getPhotoAdjustStyle(adjust)
      : { objectPosition: fallbackPosition };

  return (
    <div className={cn("overflow-hidden shrink-0", className)}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="size-full object-cover select-none"
        style={style}
      />
    </div>
  );
}
