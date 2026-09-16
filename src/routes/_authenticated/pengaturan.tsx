import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Camera,
  Save,
  Lock,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/UserAvatar";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  component: PengaturanPage,
});

function PengaturanPage() {
  const { user } = useAuth();
  const {
    profile,
    isLoading: isProfileLoading,
    updateProfile,
    isUpdating,
    uploadAvatar,
    isUploading,
    deleteAvatar,
    isDeletingAvatar,
  } = useProfile();
  const { mode: theme, setMode: setTheme } = useTheme();

  // Form states for Profil
  const [namaLengkap, setNamaLengkap] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [perusahaan, setPerusahaan] = useState("");
  const [vendor, setVendor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password modal states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Populate initial profile data
  useEffect(() => {
    if (profile) {
      setNamaLengkap(profile.full_name || "");
      setJabatan(profile.job_title || "");
      setPerusahaan(profile.company_name || "");
      setVendor(profile.vendor_name || "");
      setAvatarUrl(profile.avatar_url || null);
    } else if (user?.email) {
      const defaultName = user.email
        .split("@")[0]!
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setNamaLengkap(defaultName);
    }
  }, [profile, user]);

  // Handle avatar file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto profil maksimal 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate format
    const validFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validFormats.includes(file.type)) {
      toast.error("Format foto tidak didukung. Harap gunakan format PNG atau JPG.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      toast.loading("Mengunggah foto profil...", { id: "upload-avatar" });
      const newUrl = await uploadAvatar(file);
      setAvatarUrl(newUrl);
      toast.success("Foto profil berhasil dipilih. Klik 'Simpan Perubahan' untuk memperbarui.", {
        id: "upload-avatar",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengunggah foto profil.";
      toast.error(message, { id: "upload-avatar" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle delete avatar
  const handleHapusFoto = async () => {
    try {
      toast.loading("Menghapus foto profil...", { id: "delete-avatar" });
      await deleteAvatar(avatarUrl);
      setAvatarUrl(null);
      toast.success("Foto profil berhasil dihapus.", { id: "delete-avatar" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus foto profil.";
      toast.error(message, { id: "delete-avatar" });
    }
  };

  // Handle save profile form
  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }

    try {
      await updateProfile({
        full_name: namaLengkap.trim(),
        job_title: jabatan.trim() || null,
        company_name: perusahaan.trim() || null,
        vendor_name: vendor.trim() || null,
        avatar_url: avatarUrl,
      });
      toast.success("Profil berhasil diperbarui");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui profil.";
      toast.error(message);
    }
  };

  // Handle change password
  const handleUbahPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordBaru) {
      toast.error("Password baru wajib diisi.");
      return;
    }
    if (passwordBaru.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordBaru,
      });
      if (error) throw error;
      toast.success("Password berhasil diperbarui.");
      setPasswordDialogOpen(false);
      setPasswordBaru("");
      setKonfirmasiPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui password.";
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 w-full">
      {/* Page Header matching image.png */}
      <PageHeader
        judul="Pengaturan"
        deskripsi="Kelola profil, akun, keamanan, dan preferensi Anda."
      />

      {/* Top Grid: Profil & Akun Keamanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Profil (Form Edit Profil) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Profil
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Informasi profil Anda yang akan ditampilkan di aplikasi.
              </p>
            </div>

            <form id="form-profil" onSubmit={handleSimpanProfil} className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Foto Profil */}
                <div className="sm:col-span-4 flex flex-col items-center sm:items-start">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
                    Foto Profil
                  </Label>

                  <div className="relative group">
                    <UserAvatar
                      avatarUrl={avatarUrl}
                      nama={namaLengkap}
                      className="size-28 sm:size-32 shadow-xs"
                      status="online"
                    />

                    {/* Tombol Kamera untuk upload/ganti foto */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute bottom-1 right-1 size-8 sm:size-9 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Ubah Foto Profil"
                    >
                      {isUploading ? (
                        <Loader2 className="size-4 animate-spin text-slate-600 dark:text-slate-300" />
                      ) : (
                        <Camera className="size-4" />
                      )}
                    </button>

                    {/* Hidden input file */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 text-center sm:text-left">
                    PNG, JPG maksimal 2MB
                  </p>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleHapusFoto}
                      disabled={isDeletingAvatar}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:underline mt-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingAvatar ? "Menghapus..." : "Hapus foto"}
                    </button>
                  )}
                </div>

                {/* Kolom Kanan: Form Field */}
                <div className="sm:col-span-8 space-y-4">
                  {/* Nama Lengkap */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="namaLengkap"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nama Lengkap
                    </Label>
                    <Input
                      id="namaLengkap"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Contoh: Satria62317"
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-1"
                      required
                    />
                  </div>

                  {/* Jabatan */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="jabatan"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Jabatan
                    </Label>
                    <Input
                      id="jabatan"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Contoh: UI/UX Designer"
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-1"
                    />
                  </div>

                  {/* Nama Perusahaan */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="perusahaan"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nama Perusahaan
                    </Label>
                    <Input
                      id="perusahaan"
                      value={perusahaan}
                      onChange={(e) => setPerusahaan(e.target.value)}
                      placeholder="Contoh: PT. Terra Karya Indonesia"
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-1"
                    />
                  </div>

                  {/* Nama Vendor / Perusahaan OS (Opsional) */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="vendor"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nama Vendor / Perusahaan OS (Opsional)
                    </Label>
                    <Input
                      id="vendor"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Contoh: PT. Inovasi Solusi"
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Tombol Simpan Perubahan di kanan bawah card */}
          <div className="flex justify-end pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/60">
            <Button
              type="submit"
              form="form-profil"
              disabled={isUpdating}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileCheck className="size-4" />
              )}
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </div>

        {/* Card 2: Akun & Keamanan */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Akun & Keamanan
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Kelola informasi akun dan keamanan login Anda.
              </p>
            </div>

            {/* Email field (Read-only from Supabase Auth) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <Input
                readOnly
                disabled
                value={user?.email || "satria62317@gmail.com"}
                className="bg-slate-50/90 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 rounded-xl text-sm cursor-not-allowed font-medium select-all"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Email tidak dapat diubah.
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/70 pt-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Ubah Password
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                Gunakan password yang kuat untuk menjaga keamanan akun.
              </p>

              <button
                type="button"
                onClick={() => setPasswordDialogOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="size-4 text-slate-500 dark:text-slate-400" />
                <span>Ubah Password</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Preferensi */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Preferensi
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Atur tampilan dan preferensi aplikasi sesuai kebutuhan Anda.
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">Theme</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Pilih tema tampilan aplikasi.
          </p>

          {/* Theme Switcher Options matching image.png */}
          <div className="grid grid-cols-3 sm:w-84 gap-3 mt-4">
            {/* Light Option */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                theme === "light"
                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Sun
                className={`size-5 sm:size-6 ${theme === "light" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
              />
              <span className="text-xs font-semibold mt-2 tracking-tight">Light</span>
            </button>

            {/* Dark Option */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Moon
                className={`size-5 sm:size-6 ${theme === "dark" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
              />
              <span className="text-xs font-semibold mt-2 tracking-tight">Dark</span>
            </button>

            {/* System Option */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                theme === "system"
                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Laptop
                className={`size-5 sm:size-6 ${theme === "system" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
              />
              <span className="text-xs font-semibold mt-2 tracking-tight">System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright note */}
      <div className="text-center pt-3 pb-2">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          WorkHub © 2026 • Semua hak dilindungi
        </p>
      </div>

      {/* Dialog Ubah Password */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Ubah Password Akun</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan password baru Anda (minimal 6 karakter).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUbahPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="passwordBaru"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password Baru
              </Label>
              <Input
                id="passwordBaru"
                type="password"
                placeholder="••••••••"
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="konfirmasiPassword"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Konfirmasi Password Baru
              </Label>
              <Input
                id="konfirmasiPassword"
                type="password"
                placeholder="••••••••"
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
              >
                {isChangingPassword ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                <span>Simpan Password</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
