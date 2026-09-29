import { createFileRoute, Link } from "@tanstack/react-router";
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
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ExternalLink,
  Check,
  Printer,
  User,
  ArrowRight,
  Mail,
  Phone,
  Clock3,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/UserAvatar";
import { PageHeader } from "@/components/AppShell";
import { pageHead } from "@/lib/pageHead";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import {
  getLandingConfig,
  saveLandingConfig,
  syncLandingConfigFromCloud,
  DEFAULT_LANDING_CONFIG,
  type LandingPageConfig,
} from "@/lib/landingConfig";
import { NouraLogo } from "@/components/NouraLogo";
import satriaRedAvatar from "@/assets/images/satria_avatar_red_1790582692896.jpg";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => pageHead("Pengaturan", "Atur profil dan preferensi akun NOURA."),
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

  // Hero Landing Page (Sesuai Lampiran 2) State
  const [heroConfig, setHeroConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Load landing config on mount and sync with cloud
  useEffect(() => {
    const local = getLandingConfig();
    setHeroConfig(local);

    syncLandingConfigFromCloud().then((synced) => {
      setHeroConfig(synced);
    });
  }, []);

  const handleUpdateHeroField = <K extends keyof LandingPageConfig>(
    field: K,
    value: LandingPageConfig[K],
  ) => {
    setHeroConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddResponsibility = () => {
    setHeroConfig((prev) => ({
      ...prev,
      heroJobResponsibilities: [
        ...(prev.heroJobResponsibilities || []),
        "Tugas atau tanggung jawab baru...",
      ],
    }));
  };

  const handleUpdateResponsibility = (index: number, val: string) => {
    setHeroConfig((prev) => {
      const next = [...(prev.heroJobResponsibilities || [])];
      next[index] = val;
      return { ...prev, heroJobResponsibilities: next };
    });
  };

  const handleRemoveResponsibility = (index: number) => {
    setHeroConfig((prev) => {
      const next = (prev.heroJobResponsibilities || []).filter((_, i) => i !== index);
      return { ...prev, heroJobResponsibilities: next };
    });
  };

  const handleMoveResponsibility = (index: number, direction: "up" | "down") => {
    setHeroConfig((prev) => {
      const list = [...(prev.heroJobResponsibilities || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index]!;
      list[index] = list[target]!;
      list[target] = temp;
      return { ...prev, heroJobResponsibilities: list };
    });
  };

  const handleResetHeroDefaults = () => {
    setHeroConfig((prev) => ({
      ...prev,
      heroTitle: DEFAULT_LANDING_CONFIG.heroTitle,
      heroName: DEFAULT_LANDING_CONFIG.heroName,
      heroIsVerified: DEFAULT_LANDING_CONFIG.heroIsVerified,
      heroCurrentJobTitle: DEFAULT_LANDING_CONFIG.heroCurrentJobTitle,
      heroCurrentCompany: DEFAULT_LANDING_CONFIG.heroCurrentCompany,
      heroCurrentProject: DEFAULT_LANDING_CONFIG.heroCurrentProject,
      heroJobSectionTitle: DEFAULT_LANDING_CONFIG.heroJobSectionTitle,
      heroJobResponsibilities: [...DEFAULT_LANDING_CONFIG.heroJobResponsibilities],
    }));
    toast.info("Teks hero dikembalikan ke default Lampiran 2.");
  };

  const handleSaveHeroConfig = async () => {
    setIsSavingHero(true);
    try {
      await saveLandingConfig(heroConfig);

      // Sinkronkan ke database profiles jika pengguna login
      if (user?.id) {
        try {
          await supabase
            .from("profiles")
            .update({
              full_name: heroConfig.heroName,
              job_title: heroConfig.heroCurrentJobTitle,
              company_name: heroConfig.heroCurrentCompany,
              vendor_name: heroConfig.heroCurrentProject,
            })
            .eq("id", user.id);
        } catch {
          // toleransi jika kolom profiles belum termigrasi
        }
      }

      toast.success("Pengaturan Hero Landing Page berhasil disimpan!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.";
      toast.error(msg);
    } finally {
      setIsSavingHero(false);
    }
  };

  const [isSavingContact, setIsSavingContact] = useState(false);

  const handleSaveContactConfig = async () => {
    setIsSavingContact(true);
    try {
      await saveLandingConfig(heroConfig);
      toast.success("Pengaturan Kontak Mari Terhubung berhasil disimpan!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan konfigurasi kontak.";
      toast.error(msg);
    } finally {
      setIsSavingContact(false);
    }
  };

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

      {/* Hero & Portofolio Halaman Depan (Sesuai Lampiran 2) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
              <Sparkles className="size-3.5" />
              <span>Kustomisasi Tampilan Depan</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Hero & Portofolio Halaman Depan
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Kelola teks identitas, jabatan, perusahaan, status verifikasi, dan rincian pekerjaan
              yang tampil di halaman muka (sesuai Lampiran 2).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetHeroDefaults}
              className="rounded-xl text-xs font-semibold h-8.5 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <RotateCcw className="size-3.5 mr-1.5 text-slate-400" />
              <span>Reset Default Lampiran 2</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-8.5 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <Link to="/" target="_blank">
                <ExternalLink className="size-3.5 mr-1.5 text-slate-400" />
                <span>Lihat Tampilan Depan</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
          {/* Kolom Kiri: Form Pengaturan Hero */}
          <div className="lg:col-span-7 space-y-5">
            {/* Judul Hero Display */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Display Utama
              </Label>
              <Input
                value={heroConfig.heroTitle}
                onChange={(e) => handleUpdateHeroField("heroTitle", e.target.value)}
                placeholder="Workspace & Portofolio"
                className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
              />
            </div>

            {/* Nama & Status Terverifikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-8 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap (Ditampilkan di Hero)
                </Label>
                <Input
                  value={heroConfig.heroName}
                  onChange={(e) => handleUpdateHeroField("heroName", e.target.value)}
                  placeholder="SATRIA NUR ARDIANSYAH"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm font-semibold"
                />
              </div>

              <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Lencana Verifikasi
                  </p>
                  <p className="text-[10px] text-slate-400">Centang hijau</p>
                </div>
                <Switch
                  checked={heroConfig.heroIsVerified !== false}
                  onCheckedChange={(checked) => handleUpdateHeroField("heroIsVerified", checked)}
                />
              </div>
            </div>

            {/* Jabatan Saat Ini */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jabatan Saat Ini
              </Label>
              <Input
                value={heroConfig.heroCurrentJobTitle}
                onChange={(e) => handleUpdateHeroField("heroCurrentJobTitle", e.target.value)}
                placeholder="Cataloger Elins"
                className="rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium"
              />
            </div>

            {/* Perusahaan & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Perusahaan Saat Ini
                </Label>
                <Input
                  value={heroConfig.heroCurrentCompany}
                  onChange={(e) => handleUpdateHeroField("heroCurrentCompany", e.target.value)}
                  placeholder="PT Sonar Persada Manunggal"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project / Klien
                </Label>
                <Input
                  value={heroConfig.heroCurrentProject}
                  onChange={(e) => handleUpdateHeroField("heroCurrentProject", e.target.value)}
                  placeholder="Project | PT Semen Indonesia Group"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>
            </div>

            {/* Judul Seksi Tugas/Rincian */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Seksi Rincian Pekerjaan
              </Label>
              <Input
                value={heroConfig.heroJobSectionTitle}
                onChange={(e) => handleUpdateHeroField("heroJobSectionTitle", e.target.value)}
                placeholder="Job saat ini :"
                className="rounded-xl border-slate-200 dark:border-slate-800 text-sm font-semibold"
              />
            </div>

            {/* Rincian Tanggung Jawab / Job Deskripsi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daftar Poin Pekerjaan / Tanggung Jawab (
                  {(heroConfig.heroJobResponsibilities || []).length} poin)
                </Label>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddResponsibility}
                  className="rounded-xl text-xs h-7.5 px-2.5 gap-1 border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400 hover:bg-blue-50 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Poin</span>
                </Button>
              </div>

              <div className="space-y-2.5">
                {(heroConfig.heroJobResponsibilities || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Poin #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveResponsibility(idx, "up")}
                          disabled={idx === 0}
                          className="size-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Pindah ke atas"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveResponsibility(idx, "down")}
                          disabled={idx === (heroConfig.heroJobResponsibilities || []).length - 1}
                          className="size-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsibility(idx)}
                          className="size-6 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950 flex items-center justify-center text-rose-500 cursor-pointer ml-1"
                          title="Hapus poin ini"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <Textarea
                      rows={2}
                      value={item}
                      onChange={(e) => handleUpdateResponsibility(idx, e.target.value)}
                      placeholder="Uraikan detail pekerjaan/tugas Anda..."
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-900 resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tombol Simpan Perubahan Hero */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
              <Button
                type="button"
                onClick={handleSaveHeroConfig}
                disabled={isSavingHero}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isSavingHero ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileCheck className="size-4" />
                )}
                <span>Simpan Pengaturan Hero</span>
              </Button>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Interaktif Langsung */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pratinjau Live di Halaman Depan
                </span>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Mini Card Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {heroConfig.heroTitle || "Workspace & Portofolio"}
                </h3>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={
                        heroConfig.heroAvatarUrl ||
                        avatarUrl ||
                        profile?.avatar_url ||
                        satriaRedAvatar
                      }
                      alt={heroConfig.heroName}
                      className="size-14 rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase">
                        {heroConfig.heroName || "SATRIA NUR ARDIANSYAH"}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Jabatan saat ini :</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {heroConfig.heroCurrentJobTitle || "Cataloger Elins"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {heroConfig.heroCurrentCompany || "PT Sonar Persada Manunggal"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {heroConfig.heroCurrentProject || "Project | PT Semen Indonesia Group"}
                    </p>
                  </div>
                </div>

                {/* 3 Tombol Mini */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="rounded-full bg-blue-600 text-white text-[11px] font-semibold py-1.5 px-3 text-center">
                    Jelajahi Workspace →
                  </div>
                  <div className="rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium py-1.5 px-3 text-center">
                    Lihat Portofolio CV
                  </div>
                  <div className="rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium py-1.5 px-3 text-center">
                    Format Cetak PDF
                  </div>
                </div>

                <div className="w-10 h-0.5 bg-blue-600 rounded-full" />

                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    {heroConfig.heroJobSectionTitle || "Job saat ini :"}
                  </p>
                  <ul className="space-y-1.5">
                    {(heroConfig.heroJobResponsibilities || []).slice(0, 3).map((job, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 leading-snug"
                      >
                        <span className="size-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                        <span className="line-clamp-2">{job}</span>
                      </li>
                    ))}
                    {(heroConfig.heroJobResponsibilities || []).length > 3 && (
                      <li className="text-[10px] text-slate-400 italic">
                        + {(heroConfig.heroJobResponsibilities || []).length - 3} poin lainnya...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seksi Kontak Mari Terhubung (Hubungi Saya) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
              <MessageSquare className="size-3.5" />
              <span>Seksi Kontak Landing Page</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Seksi Kontak ("Mari Terhubung / Hubungi Saya")
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Kelola teks judul, email, nomor WhatsApp, LinkedIn, dan jam operasional yang tampil di
              bagian paling bawah halaman depan.
            </p>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tampilkan Seksi Kontak
              </p>
              <p className="text-[10px] text-slate-400">Aktifkan di landing page</p>
            </div>
            <Switch
              checked={heroConfig.showContactSection !== false}
              onCheckedChange={(checked) => handleUpdateHeroField("showContactSection", checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
          {/* Kolom Kiri: Form Input Kontak */}
          <div className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Label Badge Seksi
                </Label>
                <Input
                  value={heroConfig.contactBadge}
                  onChange={(e) => handleUpdateHeroField("contactBadge", e.target.value)}
                  placeholder="HUBUNGI SAYA"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Judul Utama Seksi
                </Label>
                <Input
                  value={heroConfig.contactTitle}
                  onChange={(e) => handleUpdateHeroField("contactTitle", e.target.value)}
                  placeholder="Mari Terhubung"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi / Subjudul
              </Label>
              <Textarea
                value={heroConfig.contactSubtitle}
                onChange={(e) => handleUpdateHeroField("contactSubtitle", e.target.value)}
                placeholder="Saya terbuka untuk berbagai peluang kolaborasi..."
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs min-h-[75px] leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Kontak
                </Label>
                <Input
                  value={heroConfig.contactEmail}
                  onChange={(e) => handleUpdateHeroField("contactEmail", e.target.value)}
                  placeholder="satria62317@gmail.com"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor WhatsApp
                </Label>
                <Input
                  value={heroConfig.contactWhatsApp}
                  onChange={(e) => handleUpdateHeroField("contactWhatsApp", e.target.value)}
                  placeholder="081216130661"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  LinkedIn (URL atau username)
                </Label>
                <Input
                  value={heroConfig.contactLinkedIn}
                  onChange={(e) => handleUpdateHeroField("contactLinkedIn", e.target.value)}
                  placeholder="linkedin.com/in/satria-nur16"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jam Operasional
              </Label>
              <Input
                value={heroConfig.contactOperatingHours}
                onChange={(e) => handleUpdateHeroField("contactOperatingHours", e.target.value)}
                placeholder="Senin – Jumat 08.00 – 17.00 WIB (Waktu Indonesia Barat)"
                className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSaveContactConfig}
                disabled={isSavingContact}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-5 gap-2 cursor-pointer shadow-sm"
              >
                {isSavingContact ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span>Simpan Pengaturan Kontak</span>
              </Button>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Mini Kontak */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pratinjau Live Seksi Kontak
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                  Tanpa Centang / Titik Hijau
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <img
                    src={heroConfig.heroAvatarUrl || avatarUrl || satriaRedAvatar}
                    alt={heroConfig.heroName}
                    className="size-12 rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate">
                      {heroConfig.heroName || "SATRIA NUR ARDIANSYAH"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {heroConfig.heroCurrentJobTitle || "Cataloger Elins"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {heroConfig.heroCurrentCompany || "PT Sonar Persada Manunggal"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="size-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <Mail className="size-3.5" />
                    </div>
                    <div className="min-w-0 text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Email: </span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {heroConfig.contactEmail || "satria62317@gmail.com"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="size-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Phone className="size-3.5" />
                    </div>
                    <div className="min-w-0 text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        WhatsApp:{" "}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {heroConfig.contactWhatsApp || "081216130661"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="size-6 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shrink-0 text-white">
                      <span className="text-[10px] font-bold">in</span>
                    </div>
                    <div className="min-w-0 text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        LinkedIn:{" "}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {heroConfig.contactLinkedIn || "linkedin.com/in/satria-nur16"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <Clock3 className="size-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">
                    {heroConfig.contactOperatingHours || "Senin – Jumat 08.00 – 17.00 WIB"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
