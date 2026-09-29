import { cn } from "@/lib/utils";

interface NouraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function NouraLogo({ className, size = "md" }: NouraLogoProps) {
  const sizeClasses = {
    sm: "text-base tracking-[0.18em]",
    md: "text-lg sm:text-xl tracking-[0.2em]",
    lg: "text-2xl sm:text-3xl tracking-[0.22em]",
    xl: "text-3xl sm:text-5xl tracking-[0.25em]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center select-none font-sans font-light text-[#333333] dark:text-white transition-colors",
        sizeClasses[size],
        className,
      )}
    >
      <span className="text-blue-600 dark:text-blue-400">N</span>O
      <span className="text-blue-600 dark:text-blue-400">UR</span>
      <span className="relative inline-flex">
        A
        <span
          className="absolute rounded-full"
          style={{
            backgroundColor: "#B5A691",
            width: "0.13em",
            height: "0.13em",
            top: "0.4em",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </span>
    </span>
  );
}
