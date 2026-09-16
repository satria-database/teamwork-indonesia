import { useState } from "react";

export function UserAvatar({
  className = "size-16",
  status = "online",
  avatarUrl,
  nama,
}: {
  className?: string;
  status?: "online" | "offline" | "busy";
  avatarUrl?: string | null;
  nama?: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className={`relative overflow-hidden rounded-full border-2 border-indigo-100 dark:border-slate-700 bg-amber-50 dark:bg-slate-800 shadow-sm flex items-center justify-center ${className}`}
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={nama || "Foto Profil"}
            className="size-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Stylized Modern Avatar SVG matching the reference image */
          <svg
            viewBox="0 0 100 100"
            className="size-full object-cover"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circle gradient */}
            <circle cx="50" cy="50" r="50" fill="#F3F4F6" />
            {/* Shoulders / Shirt */}
            <path d="M20 92C20 76 33 67 50 67C67 67 80 76 80 92V100H20V92Z" fill="#3B4252" />
            <path d="M38 68L50 78L62 68V80L50 88L38 80V68Z" fill="#EBCB8B" />
            {/* Neck */}
            <rect x="43" y="55" width="14" height="15" rx="4" fill="#F6C8A4" />
            {/* Head & Face */}
            <ellipse cx="50" cy="42" rx="17" ry="21" fill="#F6C8A4" />
            {/* Hair */}
            <path
              d="M32 38C32 25 39 16 50 16C61 16 68 25 68 38C68 41 66 38 64 34C60 28 54 26 50 26C45 26 40 28 36 34C34 38 32 41 32 38Z"
              fill="#2E3440"
            />
            {/* Ears */}
            <circle cx="33" cy="42" r="3.5" fill="#F6C8A4" />
            <circle cx="67" cy="42" r="3.5" fill="#F6C8A4" />
            {/* Glasses Frame */}
            <rect
              x="36"
              y="36"
              width="11"
              height="9"
              rx="2"
              fill="none"
              stroke="#2E3440"
              strokeWidth="2.5"
            />
            <rect
              x="53"
              y="36"
              width="11"
              height="9"
              rx="2"
              fill="none"
              stroke="#2E3440"
              strokeWidth="2.5"
            />
            <line x1="47" y1="40" x2="53" y2="40" stroke="#2E3440" strokeWidth="2.5" />
            {/* Eyes */}
            <circle cx="41.5" cy="40.5" r="1.5" fill="#2E3440" />
            <circle cx="58.5" cy="40.5" r="1.5" fill="#2E3440" />
            {/* Smile */}
            <path
              d="M45 52C47 54 53 54 55 52"
              stroke="#D08770"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
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
