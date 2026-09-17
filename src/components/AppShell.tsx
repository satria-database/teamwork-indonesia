import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Users,
  Moon,
  Sun,
  Layers,
  Sparkles,
  Bell,
  Menu,
  X,
  User as UserIcon,
  Settings,
  FileBadge,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/UserAvatar";
import { NouraLogo } from "@/components/NouraLogo";
import { Switch } from "@/components/ui/switch";

const navHome = [
  { to: "/dasbor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catatan", label: "Catatan Pekerjaan", icon: NotebookPen },
  { to: "/mendatang", label: "Pekerjaan Mendatang", icon: CalendarClock },
  { to: "/notulen", label: "Notulen", icon: FileText },
  { to: "/berkas", label: "Berkas", icon: FolderOpen },
  { to: "/cv", label: "Resume / CV", icon: FileBadge },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, peran, isAdmin } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Micro-stats queries
  const { data: stats } = useQuery({
    queryKey: ["appshell_counts"],
    queryFn: async () => {
      const [catatan, mendatang, notulen] = await Promise.all([
        supabase.from("catatan_kerja").select("id", { count: "exact", head: true }),
        supabase.from("pekerjaan_mendatang").select("id", { count: "exact", head: true }),
        supabase.from("notulen").select("id", { count: "exact", head: true }),
      ]);
      return {
        catatan: catatan.count ?? 0,
        mendatang: mendatang.count ?? 0,
        notulen: notulen.count ?? 0,
      };
    },
    staleTime: 10_000,
  });

  async function keluar() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/masuk", replace: true });
  }

  // Name formatter
  const fallbackName = user?.email
    ? user.email
        .split("@")[0]!
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : "Pengguna";
  const displayName = profile?.full_name?.trim() || fallbackName;
  const userTitle = [profile?.job_title, isAdmin ? "Admin" : "Viewer"].filter(Boolean).join(" • ");

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300 font-sans">
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#f8fafc] transition-colors duration-300 dark:bg-[#0f172a] md:flex-row">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between px-3 py-2.5 border-b border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <Link to="/dasbor" className="flex items-center" aria-label="NOURA">
              <NouraLogo size="md" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-700" />
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigasi Home
            </div>
            {navHome.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <div className="size-2 rounded-full bg-blue-500" />}
                </Link>
              );
            })}
            <Link
              to="/tata-letak"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                location.pathname === "/tata-letak"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span>Tata Letak Landing Page</span>
            </Link>
            {isAdmin && (
              <Link
                to="/pengguna"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Users className="size-4" />
                <span>Pengguna & Akun</span>
              </Link>
            )}
            <Link
              to="/pengaturan"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                location.pathname === "/pengaturan"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Settings className="size-4" />
              <span>Pengaturan</span>
            </Link>
            <button
              onClick={keluar}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="size-4" />
              <span>Keluar</span>
            </button>
          </div>
        )}

        {/* Desktop Left Sidebar matching the reference design */}
        <aside className="hidden md:flex md:sticky md:top-0 h-dvh w-64 xl:w-72 shrink-0 flex-col justify-between gap-6 overflow-y-auto overscroll-contain custom-scrollbar border-r border-slate-200/70 p-5 xl:p-7 dark:border-slate-800/80">
          <div className="space-y-6">
            <Link
              to="/dasbor"
              className="flex items-center justify-center py-1 transition-opacity hover:opacity-85"
              aria-label="NOURA"
            >
              <NouraLogo size="lg" />
            </Link>
            {/* User Profile Card */}
            <div className="flex flex-col items-center text-center pt-2">
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                nama={displayName}
                className="size-20 shadow-xs"
                status="online"
              />
              <div className="mt-3 flex items-center gap-1.5 justify-center">
                <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {displayName}
                </p>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {userTitle || "Pengguna"}
              </p>
              {profile?.company_name && (
                <p className="max-w-full truncate text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {profile.company_name}
                </p>
              )}
              {profile?.vendor_name && (
                <p className="max-w-full truncate text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Vendor : {profile.vendor_name}
                </p>
              )}

              {/* 3 Stats Micro-Metrics */}
              <div className="mt-4 w-full grid grid-cols-3 gap-2 py-3 px-2 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-slate-400">
                    <NotebookPen className="size-3 text-fuchsia-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {stats?.catatan !== undefined ? stats.catatan : 0}
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-tight">Catatan</span>
                </div>
                <div className="flex flex-col items-center border-x border-slate-200/60 dark:border-slate-800/60 px-1">
                  <div className="flex items-center gap-1 text-slate-400">
                    <CalendarClock className="size-3 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {stats?.mendatang !== undefined ? stats.mendatang : 0}
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-tight">Rencana</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-slate-400">
                    <FileText className="size-3 text-indigo-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {stats?.notulen !== undefined ? stats.notulen : 0}
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-tight">Notulen</span>
                </div>
              </div>
            </div>

            {/* Navigation Group: Home */}
            <div className="space-y-1.5 pt-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Home
              </p>
              <nav className="space-y-1">
                {navHome.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`size-4 transition-colors ${
                            isActive
                              ? "text-white dark:text-slate-900"
                              : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"
                          }`}
                        />
                        <span className="tracking-tight">{item.label}</span>
                      </div>

                      {/* Active indicator dot matching the reference image */}
                      {isActive && (
                        <div className="size-1.5 rounded-full bg-blue-500 dark:bg-blue-600 animate-pulse" />
                      )}
                    </Link>
                  );
                })}

                {/* Light / Dark Mode Toggle row matching the reference image */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="size-4 text-indigo-400" />
                    ) : (
                      <Sun className="size-4 text-amber-500" />
                    )}
                    <span className="tracking-tight">{isDark ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-indigo-600 cursor-pointer"
                  />
                </div>
              </nav>
            </div>

            {/* Navigation Group: Configuration */}
            <div className="space-y-1.5 pt-2">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Configuration
              </p>
              <nav className="space-y-1">
                <Link
                  to="/tata-letak"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === "/tata-letak"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <SlidersHorizontal
                    className={`size-4 ${
                      location.pathname === "/tata-letak"
                        ? "text-white dark:text-slate-900"
                        : "text-indigo-500"
                    }`}
                  />
                  <span>Tata Letak Landing</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/pengguna"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === "/pengguna"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <Users className="size-4 text-slate-400" />
                    <span>Pengguna & Akun</span>
                  </Link>
                )}
                <Link
                  to="/pengaturan"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === "/pengaturan"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <Settings className="size-4 text-slate-400" />
                  <span>Pengaturan</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom user footer / Sign out */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/80">
            <button
              onClick={keluar}
              className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="size-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                <span>Keluar dari Akun</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-rose-400 font-mono">
                ESC
              </span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  judul,
  deskripsi,
  action,
}: {
  judul: string;
  deskripsi: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {judul}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{deskripsi}</p>
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

export function CatatanViewer() {
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
      <Layers className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span>
        Anda masuk sebagai <strong>Viewer</strong>: akses hanya baca, tidak dapat mengubah data.
      </span>
    </div>
  );
}
