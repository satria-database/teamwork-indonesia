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
  SlidersHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/UserAvatar";
import { PhotoPrecisionControl } from "@/components/PhotoPrecisionControl";
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
  saveUnifiedLandingAvatar,
  syncLandingConfigFromCloud,
  DEFAULT_LANDING_CONFIG,
  type LandingPageConfig,
} from "@/lib/landingConfig";
import { NouraLogo } from "@/components/NouraLogo";
import satriaRedAvatar from "@/assets/images/satria_avatar_red_1790582692896.jpg";
import {
  getHighResolutionAvatarUrl,
  getAvatarSrcSet,
  optimizeAvatarImageForUpload,
} from "@/lib/avatarUtils";

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
  const [avatarPosition, setAvatarPosition] = useState<string>("50% 50%");
  const [avatarScale, setAvatarScale] = useState<number>(1);
  const [showProfilePrecision, setShowProfilePrecision] = useState(false);

  // Sync stored position & scale on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPos = localStorage.getItem("workhub_avatar_position");
      if (storedPos) setAvatarPosition(storedPos);
      const storedScale = localStorage.getItem("workhub_avatar_scale");
      if (storedScale) setAvatarScale(parseFloat(storedScale));
    }
  }, []);

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

  // Hero & CV Photo management states
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingHeroPhoto, setIsUploadingHeroPhoto] = useState(false);
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState("");

  // Contact Photo management states
  const contactFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingContactPhoto, setIsUploadingContactPhoto] = useState(false);
  const [customContactPhotoUrlInput, setCustomContactPhotoUrlInput] = useState("");

  // Kustomisasi Judul Seksi CV
  const [judulTentangSaya, setJudulTentangSaya] = useState("Tentang Saya");
  const [judulPendidikan, setJudulPendidikan] = useState("1. Riwayat Pendidikan");
  const [judulPengalaman, setJudulPengalaman] = useState("2. Pengalaman Kerja");
  const [judulKeahlian, setJudulKeahlian] = useState("3. Keahlian Utama");
  const [judulKompetensi, setJudulKompetensi] = useState("4. Spesialisasi Kompetensi");
  const [isSavingCvTitles, setIsSavingCvTitles] = useState(false);

  // Load landing config on mount and sync with cloud
  useEffect(() => {
    const local = getLandingConfig();
    setHeroConfig(local);

    syncLandingConfigFromCloud().then((synced) => {
      setHeroConfig(synced);
    });
  }, []);

  // Load CV data for editable titles & photo
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("curriculum_vitae")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.judul_tentang_saya) setJudulTentangSaya(data.judul_tentang_saya);
          if (data.judul_pendidikan) setJudulPendidikan(data.judul_pendidikan);
          if (data.judul_pengalaman) setJudulPengalaman(data.judul_pengalaman);
          if (data.judul_keahlian) setJudulKeahlian(data.judul_keahlian);
          if (data.judul_kompetensi) setJudulKompetensi(data.judul_kompetensi);
          if (data.foto_url) {
            setHeroConfig((prev) =>
              prev.heroAvatarUrl ? prev : { ...prev, heroAvatarUrl: data.foto_url },
            );
          }
        }
      });
  }, [user?.id]);

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
        if (heroConfig.heroAvatarUrl) {
          try {
            await supabase.from("curriculum_vitae").upsert(
              {
                user_id: user.id,
                foto_url: heroConfig.heroAvatarUrl,
                diperbarui_pada: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          } catch {
            // toleransi
          }
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

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 1 Pengaturan Foto Profil Terpadu untuk 3 Foto di Landing Page (Hero, CV & Hubungi Saya)
  const applyUnifiedLandingAvatar = async (newUrl: string | null) => {
    setHeroConfig((prev) => ({
      ...prev,
      heroAvatarUrl: newUrl,
      contactAvatarUrl: newUrl,
    }));
    setAvatarUrl(newUrl);

    await saveUnifiedLandingAvatar({
      avatarUrl: newUrl,
      position: heroConfig.heroAvatarPosition,
      scale: heroConfig.heroAvatarScale,
      userId: user?.id,
    });
  };

  // Upload 1 foto profil terpadu untuk 3 foto di Landing Page (Hero, CV & Hubungi Saya)
  // Menjaga kualitas HD / resolusi penuh (maks 10MB) dan tersimpan keras di storage & database
  const handleLandingPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (rawFile.size > 10 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 10MB.");
      return;
    }

    setIsUploadingHeroPhoto(true);
    setIsUploadingContactPhoto(true);
    try {
      // Optimasi file foto agar tetap HD kristal tajam, tanpa melampaui batasan storage/quota
      const { file, dataUrl } = await optimizeAvatarImageForUpload(rawFile);
      let newUrl = dataUrl;

      if (user?.id) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Format path sesuai RLS Supabase: {user.id}/...
        const path = `${user.id}/avatar_landing_${Date.now()}_${cleanName}`;
        try {
          const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, {
            cacheControl: "3600",
            upsert: true,
          });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
            if (urlData?.publicUrl) {
              newUrl = urlData.publicUrl;
            }
          } else {
            console.warn("Storage upload notice, menggunakan data URL:", uploadErr);
          }
        } catch {
          // fallback to dataUrl
        }
      }

      await applyUnifiedLandingAvatar(newUrl);
      toast.success(
        "Foto profil landing page berhasil diperbarui untuk ketiga bagian (Hero, CV & Hubungi Saya)!",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setIsUploadingHeroPhoto(false);
      setIsUploadingContactPhoto(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = "";
      if (contactFileInputRef.current) contactFileInputRef.current.value = "";
    }
  };

  // Simpan Kustomisasi Judul Seksi CV
  const handleSaveCvTitles = async () => {
    setIsSavingCvTitles(true);
    try {
      if (user?.id) {
        await supabase.from("curriculum_vitae").upsert(
          {
            user_id: user.id,
            judul_tentang_saya: judulTentangSaya,
            judul_pendidikan: judulPendidikan,
            judul_pengalaman: judulPengalaman,
            judul_keahlian: judulKeahlian,
            judul_kompetensi: judulKompetensi,
            diperbarui_pada: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }

      const updatedConfig: LandingPageConfig = {
        ...heroConfig,
        skillsHeader: judulKeahlian,
        specializationHeader: judulKompetensi,
      };
      setHeroConfig(updatedConfig);
      await saveLandingConfig(updatedConfig);

      toast.success("Judul seksi CV berhasil disimpan dan diperbarui di seluruh aplikasi!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan judul seksi.");
    } finally {
      setIsSavingCvTitles(false);
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
      if (profile.avatar_position) setAvatarPosition(profile.avatar_position);
      if (profile.avatar_scale) setAvatarScale(Number(profile.avatar_scale));
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
      await applyUnifiedLandingAvatar(null);
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
        avatar_position: avatarPosition,
        avatar_scale: avatarScale,
      });
      await saveUnifiedLandingAvatar({
        avatarUrl: avatarUrl,
        position: avatarPosition,
        scale: avatarScale,
        userId: user?.id,
      });
      toast.success("Profil berhasil diperbarui dan disinkronkan ke Landing Page!");
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
                      className="size-32 sm:size-36 shadow-xs"
                      status="online"
                      position={avatarPosition}
                      scale={avatarScale}
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
                    PNG, JPG maksimal 10MB
                  </p>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProfilePrecision(!showProfilePrecision)}
                        className="rounded-xl text-xs h-7 px-2.5 gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer shadow-2xs"
                      >
                        <SlidersHorizontal className="size-3" />
                        <span>{showProfilePrecision ? "Tutup Presisi" : "Presisikan Foto"}</span>
                      </Button>
                    )}

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleHapusFoto}
                        disabled={isDeletingAvatar}
                        className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingAvatar ? "Menghapus..." : "Hapus foto"}
                      </button>
                    )}
                  </div>
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

              {/* Panel Presisi Khusus Foto Profil Akun */}
              {showProfilePrecision && avatarUrl && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <PhotoPrecisionControl
                    imageUrl={avatarUrl}
                    position={avatarPosition}
                    scale={avatarScale}
                    onChange={(newPos, newScale) => {
                      setAvatarPosition(newPos);
                      setAvatarScale(newScale);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("workhub_avatar_position", newPos);
                        localStorage.setItem("workhub_avatar_scale", String(newScale));
                      }
                    }}
                    onSyncAll={async (newPos, newScale) => {
                      setAvatarPosition(newPos);
                      setAvatarScale(newScale);
                      handleUpdateHeroField("heroAvatarPosition", newPos);
                      handleUpdateHeroField("heroAvatarScale", newScale);
                      if (user?.id) {
                        await supabase.from("curriculum_vitae").upsert({
                          user_id: user.id,
                          foto_position: newPos,
                          foto_scale: newScale,
                          diperbarui_pada: new Date().toISOString(),
                        });
                      }
                      await updateProfile({
                        full_name: namaLengkap.trim() || "Pengguna",
                        avatar_url: avatarUrl,
                        avatar_position: newPos,
                        avatar_scale: newScale,
                      });
                      toast.success(
                        "Presisi foto berhasil diterapkan ke Foto Profil, CV, dan Hero!",
                      );
                    }}
                    title="Presisikan Foto Profil Akun"
                    subtitle="Atur posisi wajah dan zoom avatar agar pas di header, dasbor, dan sidebar."
                  />
                </div>
              )}
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
            {/* 1 Pengaturan Foto Profil Terpadu untuk 3 Foto di Landing Page (Hero, CV & Hubungi Saya) */}
            <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-blue-600 dark:text-blue-400" />
                      <span>
                        Foto Profil Landing Page (1 Pengaturan untuk Hero, CV & Hubungi Saya)
                      </span>
                    </Label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Tersinkronisasi 3 Bagian
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    1 Pengaturan Tunggal: Mengubah foto, preset, URL, posisi, atau zoom di sini akan
                    otomatis memperbarui sekaligus ketiga foto profil di halaman depan (Seksi Hero,
                    Kartu CV Portofolio, dan Seksi Kontak Hubungi Saya). Tersimpan permanen dan
                    tidak akan kembali ke semula setelah reload.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                {/* Avatar Preview */}
                <div className="relative shrink-0">
                  <div className="size-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={
                        getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                        getHighResolutionAvatarUrl(avatarUrl) ||
                        satriaRedAvatar
                      }
                      srcSet={getAvatarSrcSet(
                        getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                          getHighResolutionAvatarUrl(avatarUrl) ||
                          satriaRedAvatar,
                      )}
                      alt={heroConfig.heroName || "Foto"}
                      className="size-full select-none transition-transform"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: heroConfig.heroAvatarPosition || "50% 50%",
                        transform:
                          heroConfig.heroAvatarScale && heroConfig.heroAvatarScale !== 1
                            ? `scale(${heroConfig.heroAvatarScale})`
                            : undefined,
                        transformOrigin: heroConfig.heroAvatarPosition || "50% 50%",
                        imageRendering: "auto",
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden",
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  {isUploadingHeroPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <Loader2 className="size-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      ref={heroFileInputRef}
                      onChange={handleLandingPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={isUploadingHeroPhoto}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-3 gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera className="size-3.5" />
                      <span>
                        {isUploadingHeroPhoto ? "Mengunggah HD..." : "Upload Foto Baru (10MB)"}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        applyUnifiedLandingAvatar(satriaRedAvatar);
                        toast.success(
                          "Preset resmi Satria (Latar Merah) diterapkan untuk 3 bagian landing page!",
                        );
                      }}
                      className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs h-8 px-3 gap-1 cursor-pointer"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      <span>Preset Latar Merah</span>
                    </Button>

                    {avatarUrl && avatarUrl !== heroConfig.heroAvatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          applyUnifiedLandingAvatar(avatarUrl);
                          toast.success("Foto profil akun diterapkan ke 3 bagian landing page!");
                        }}
                        className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs h-8 px-3 cursor-pointer"
                      >
                        <span>Gunakan Foto Profil Akun</span>
                      </Button>
                    )}

                    {heroConfig.heroAvatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          applyUnifiedLandingAvatar(null);
                          toast.info("Foto profil landing page direset ke default.");
                        }}
                        className="rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8 px-2.5 cursor-pointer"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        <span>Reset Foto</span>
                      </Button>
                    )}
                  </div>

                  {/* Input URL Foto Kustom */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={customPhotoUrlInput}
                      onChange={(e) => setCustomPhotoUrlInput(e.target.value)}
                      placeholder="Atau tempel tautan URL foto resolusi tinggi (https://...)..."
                      className="rounded-xl text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!customPhotoUrlInput.trim()) {
                          toast.error("Masukkan tautan URL foto terlebih dahulu.");
                          return;
                        }
                        applyUnifiedLandingAvatar(customPhotoUrlInput.trim());
                        toast.success(
                          "Tautan foto kustom berhasil diterapkan ke 3 bagian landing page!",
                        );
                        setCustomPhotoUrlInput("");
                      }}
                      className="rounded-xl text-xs h-8 px-3 cursor-pointer shrink-0"
                    >
                      Terapkan URL
                    </Button>
                  </div>
                </div>
              </div>

              {/* Panel Presisi & Zoom Foto Terpadu untuk 3 Foto Landing Page */}
              <PhotoPrecisionControl
                imageUrl={heroConfig.heroAvatarUrl || avatarUrl || satriaRedAvatar}
                position={heroConfig.heroAvatarPosition || "50% 50%"}
                scale={heroConfig.heroAvatarScale || 1}
                onChange={async (newPos, newScale) => {
                  handleUpdateHeroField("heroAvatarPosition", newPos);
                  handleUpdateHeroField("heroAvatarScale", newScale);
                  handleUpdateHeroField("contactAvatarPosition", newPos);
                  handleUpdateHeroField("contactAvatarScale", newScale);
                  setAvatarPosition(newPos);
                  setAvatarScale(newScale);
                  await saveUnifiedLandingAvatar({
                    avatarUrl: heroConfig.heroAvatarUrl || avatarUrl,
                    position: newPos,
                    scale: newScale,
                    userId: user?.id,
                  });
                }}
                onSyncAll={async (newPos, newScale) => {
                  handleUpdateHeroField("heroAvatarPosition", newPos);
                  handleUpdateHeroField("heroAvatarScale", newScale);
                  handleUpdateHeroField("contactAvatarPosition", newPos);
                  handleUpdateHeroField("contactAvatarScale", newScale);
                  setAvatarPosition(newPos);
                  setAvatarScale(newScale);
                  await saveUnifiedLandingAvatar({
                    avatarUrl: heroConfig.heroAvatarUrl || avatarUrl,
                    position: newPos,
                    scale: newScale,
                    userId: user?.id,
                  });
                  toast.success(
                    "Presisi foto berhasil diterapkan serentak ke seluruh foto landing page!",
                  );
                }}
                title="Presisikan Posisi & Zoom Foto (3 Foto Sekaligus)"
                subtitle="Sesuaikan posisi horizontal, vertikal, dan zoom foto yang tampil seragam di Hero, CV Portofolio, dan Seksi Kontak."
              />
            </div>

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
                    <div className="size-14 rounded-full overflow-hidden shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={
                          getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                          getHighResolutionAvatarUrl(avatarUrl) ||
                          getHighResolutionAvatarUrl(profile?.avatar_url) ||
                          satriaRedAvatar
                        }
                        srcSet={getAvatarSrcSet(
                          getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                            getHighResolutionAvatarUrl(avatarUrl) ||
                            getHighResolutionAvatarUrl(profile?.avatar_url) ||
                            satriaRedAvatar,
                        )}
                        alt={heroConfig.heroName}
                        className="size-full select-none transition-transform"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: heroConfig.heroAvatarPosition || "50% 50%",
                          transform:
                            heroConfig.heroAvatarScale && heroConfig.heroAvatarScale !== 1
                              ? `scale(${heroConfig.heroAvatarScale})`
                              : undefined,
                          transformOrigin: heroConfig.heroAvatarPosition || "50% 50%",
                          imageRendering: "auto",
                          WebkitBackfaceVisibility: "hidden",
                          backfaceVisibility: "hidden",
                        }}
                        loading="eager"
                        decoding="async"
                      />
                    </div>
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

      {/* Kustomisasi Judul Seksi CV & Portofolio */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-1">
              <Sparkles className="size-3.5" />
              <span>Kustomisasi Judul Seksi CV</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Judul Seksi CV & Portofolio
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Ubah teks judul untuk Tentang Saya, Riwayat Pendidikan, Pengalaman Kerja, Keahlian
              Utama, dan Spesialisasi Kompetensi.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSaveCvTitles}
            disabled={isSavingCvTitles}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            {isSavingCvTitles ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>Simpan Judul Seksi</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Tentang Saya
            </Label>
            <Input
              value={judulTentangSaya}
              onChange={(e) => setJudulTentangSaya(e.target.value)}
              placeholder="Tentang Saya"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Riwayat Pendidikan (1)
            </Label>
            <Input
              value={judulPendidikan}
              onChange={(e) => setJudulPendidikan(e.target.value)}
              placeholder="1. Riwayat Pendidikan"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Pengalaman Kerja (2)
            </Label>
            <Input
              value={judulPengalaman}
              onChange={(e) => setJudulPengalaman(e.target.value)}
              placeholder="2. Pengalaman Kerja"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Keahlian Utama (3)
            </Label>
            <Input
              value={judulKeahlian}
              onChange={(e) => setJudulKeahlian(e.target.value)}
              placeholder="3. Keahlian Utama"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Spesialisasi Kompetensi (4)
            </Label>
            <Input
              value={judulKompetensi}
              onChange={(e) => setJudulKompetensi(e.target.value)}
              placeholder="4. Spesialisasi Kompetensi"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
          <span>
            Urutan seksi resmi: 1. Pendidikan → 2. Pengalaman Kerja → 3. Keahlian Utama → 4.
            Spesialisasi Kompetensi.
          </span>
          <Button
            type="button"
            onClick={handleSaveCvTitles}
            disabled={isSavingCvTitles}
            className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold h-8.5 px-4 gap-1.5 cursor-pointer"
          >
            {isSavingCvTitles ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>Terapkan Perubahan Judul</span>
          </Button>
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
          {/* Kolom Kiri: Form Input Kontak & Foto Profil */}
          <div className="lg:col-span-7 space-y-5">
            {/* Foto Profil Seksi Kontak ("Hubungi Saya") - Tersinkronisasi 1 Pengaturan dengan Hero & CV */}
            <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-blue-600 dark:text-blue-400" />
                      <span>Foto Profil Seksi Kontak ("Hubungi Saya")</span>
                    </Label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Tersinkronisasi 1 Pengaturan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Foto di seksi kontak ini selalu otomatis sama dan serasi dengan foto Hero dan
                    kartu CV (1 pengaturan terpadu). Jika diubah di sini atau di seksi atas, ketiga
                    foto langsung ikut berubah bersamaan.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                {/* Avatar Circle Preview */}
                <div className="relative shrink-0">
                  <div
                    className="size-20 sm:size-24 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800"
                    style={{
                      borderRadius: "50%",
                      overflow: "hidden",
                      isolation: "isolate",
                    }}
                  >
                    <img
                      src={
                        getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                        getHighResolutionAvatarUrl(heroConfig.contactAvatarUrl) ||
                        getHighResolutionAvatarUrl(avatarUrl) ||
                        satriaRedAvatar
                      }
                      srcSet={getAvatarSrcSet(
                        getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                          getHighResolutionAvatarUrl(heroConfig.contactAvatarUrl) ||
                          getHighResolutionAvatarUrl(avatarUrl) ||
                          satriaRedAvatar,
                      )}
                      alt="Foto Kontak"
                      className="size-full select-none transition-transform"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                          heroConfig.heroAvatarPosition ||
                          heroConfig.contactAvatarPosition ||
                          "50% 50%",
                        transform:
                          heroConfig.heroAvatarScale && heroConfig.heroAvatarScale !== 1
                            ? `scale(${heroConfig.heroAvatarScale})`
                            : undefined,
                        transformOrigin:
                          heroConfig.heroAvatarPosition ||
                          heroConfig.contactAvatarPosition ||
                          "50% 50%",
                        imageRendering: "auto",
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden",
                      }}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  {isUploadingContactPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="size-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      ref={contactFileInputRef}
                      onChange={handleLandingPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => contactFileInputRef.current?.click()}
                      disabled={isUploadingContactPhoto}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-3 gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera className="size-3.5" />
                      <span>
                        {isUploadingContactPhoto
                          ? "Mengunggah HD..."
                          : "Ganti Foto (3 Bagian Sekaligus)"}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        applyUnifiedLandingAvatar(satriaRedAvatar);
                        toast.success(
                          "Preset resmi Satria (Latar Merah) diterapkan untuk 3 bagian landing page!",
                        );
                      }}
                      className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs h-8 px-3 gap-1 cursor-pointer"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      <span>Preset Latar Merah</span>
                    </Button>

                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          applyUnifiedLandingAvatar(avatarUrl);
                          toast.success("Foto profil akun diterapkan untuk 3 bagian landing page!");
                        }}
                        className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs h-8 px-3 cursor-pointer"
                      >
                        <span>Gunakan Foto Profil Akun</span>
                      </Button>
                    )}

                    {(heroConfig.heroAvatarUrl || heroConfig.contactAvatarUrl) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          applyUnifiedLandingAvatar(null);
                          toast.info("Foto profil landing page direset ke default.");
                        }}
                        className="rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8 px-2.5 cursor-pointer"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        <span>Reset Foto</span>
                      </Button>
                    )}
                  </div>

                  {/* Input URL Foto Kustom Kontak */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={customContactPhotoUrlInput}
                      onChange={(e) => setCustomContactPhotoUrlInput(e.target.value)}
                      placeholder="Atau tempel tautan URL foto beresolusi tinggi (https://...)..."
                      className="rounded-xl text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!customContactPhotoUrlInput.trim()) {
                          toast.error("Masukkan tautan URL foto terlebih dahulu.");
                          return;
                        }
                        applyUnifiedLandingAvatar(customContactPhotoUrlInput.trim());
                        toast.success(
                          "Tautan foto kustom berhasil diterapkan untuk 3 bagian landing page!",
                        );
                        setCustomContactPhotoUrlInput("");
                      }}
                      className="rounded-xl text-xs h-8 px-3 cursor-pointer shrink-0"
                    >
                      Terapkan URL
                    </Button>
                  </div>
                </div>
              </div>

              {/* Panel Presisi & Zoom Foto Terpadu */}
              <PhotoPrecisionControl
                imageUrl={
                  getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                  getHighResolutionAvatarUrl(heroConfig.contactAvatarUrl) ||
                  getHighResolutionAvatarUrl(avatarUrl) ||
                  satriaRedAvatar
                }
                position={
                  heroConfig.heroAvatarPosition || heroConfig.contactAvatarPosition || "50% 50%"
                }
                scale={heroConfig.heroAvatarScale ?? heroConfig.contactAvatarScale ?? 1}
                onChange={async (newPos, newScale) => {
                  handleUpdateHeroField("contactAvatarPosition", newPos);
                  handleUpdateHeroField("contactAvatarScale", newScale);
                  handleUpdateHeroField("heroAvatarPosition", newPos);
                  handleUpdateHeroField("heroAvatarScale", newScale);
                  setAvatarPosition(newPos);
                  setAvatarScale(newScale);
                  await saveUnifiedLandingAvatar({
                    avatarUrl: heroConfig.heroAvatarUrl || heroConfig.contactAvatarUrl || avatarUrl,
                    position: newPos,
                    scale: newScale,
                    userId: user?.id,
                  });
                }}
                onSyncAll={async (newPos, newScale) => {
                  handleUpdateHeroField("contactAvatarPosition", newPos);
                  handleUpdateHeroField("contactAvatarScale", newScale);
                  handleUpdateHeroField("heroAvatarPosition", newPos);
                  handleUpdateHeroField("heroAvatarScale", newScale);
                  setAvatarPosition(newPos);
                  setAvatarScale(newScale);
                  await saveUnifiedLandingAvatar({
                    avatarUrl: heroConfig.heroAvatarUrl || heroConfig.contactAvatarUrl || avatarUrl,
                    position: newPos,
                    scale: newScale,
                    userId: user?.id,
                  });
                  toast.success("Presisi foto berhasil disinkronkan ke 3 bagian landing page!");
                }}
                title="Presisikan Posisi & Zoom Foto (3 Foto Sekaligus)"
                subtitle="Sesuaikan posisi horizontal, vertikal, dan zoom foto yang tampil pada seksi Hero, CV, dan Mari Terhubung / Hubungi Saya."
              />
            </div>

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
                  <div
                    className="size-12 rounded-full overflow-hidden shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                    style={{
                      borderRadius: "50%",
                      overflow: "hidden",
                      isolation: "isolate",
                    }}
                  >
                    <img
                      src={
                        getHighResolutionAvatarUrl(heroConfig.contactAvatarUrl) ||
                        getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                        getHighResolutionAvatarUrl(avatarUrl) ||
                        satriaRedAvatar
                      }
                      srcSet={getAvatarSrcSet(
                        getHighResolutionAvatarUrl(heroConfig.contactAvatarUrl) ||
                          getHighResolutionAvatarUrl(heroConfig.heroAvatarUrl) ||
                          getHighResolutionAvatarUrl(avatarUrl) ||
                          satriaRedAvatar,
                      )}
                      alt={heroConfig.heroName}
                      className="size-full select-none transition-transform"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                          heroConfig.contactAvatarPosition ||
                          heroConfig.heroAvatarPosition ||
                          "50% 50%",
                        transform:
                          heroConfig.contactAvatarScale && heroConfig.contactAvatarScale !== 1
                            ? `scale(${heroConfig.contactAvatarScale})`
                            : undefined,
                        transformOrigin:
                          heroConfig.contactAvatarPosition ||
                          heroConfig.heroAvatarPosition ||
                          "50% 50%",
                        imageRendering: "auto",
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden",
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
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
