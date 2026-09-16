import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "kt_theme_mode";
const LEGACY_KEY = "kt_theme";

function initialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  if (legacy === "dark") return "dark";
  if (legacy === "light") return "light";
  return "system";
}

let mode: ThemeMode = initialMode();
const listeners = new Set<() => void>();

const media =
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function isDarkResolved(m: ThemeMode = mode): boolean {
  if (m === "dark") return true;
  if (m === "light") return false;
  return media?.matches ?? false;
}

function applyToDocument() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDarkResolved());
}

function setMode(next: ThemeMode) {
  mode = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.localStorage.setItem(LEGACY_KEY, isDarkResolved() ? "dark" : "light");
  }
  applyToDocument();
  listeners.forEach((l) => l());
}

// Terapkan saat modul dimuat & ikuti perubahan tema sistem
applyToDocument();
media?.addEventListener("change", () => {
  if (mode === "system") {
    applyToDocument();
    listeners.forEach((l) => l());
  }
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const currentMode = useSyncExternalStore(
    subscribe,
    () => mode,
    () => "light" as ThemeMode,
  );
  const isDark = useSyncExternalStore(
    subscribe,
    () => isDarkResolved(),
    () => false,
  );

  return {
    mode: currentMode,
    isDark,
    setMode,
    toggleTheme: () => setMode(isDark ? "light" : "dark"),
  };
}
