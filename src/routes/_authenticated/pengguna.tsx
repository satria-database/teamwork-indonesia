import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, UserPlus, Users, ShieldCheck, Mail, Lock, Eye, UserCheck } from "lucide-react";
import { supabase, EMAIL_ADMIN_PERTAMA } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/AppShell";
import { pageHead } from "@/lib/pageHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/pengguna")({ head: () => pageHead("Pengguna dan Akun", "Kelola pengguna dan akses akun NOURA."), component: Pengguna });

type Profil = { id: string; email: string; nama: string | null };
type PeranBaris = { user_id: string; role: "admin" | "viewer" };
function Pengguna() {
  const { isAdmin, user, refreshPeran } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [accountType, setAccountType] = useState<"independent" | "invited">("independent");
  const [parentUserId, setParentUserId] = useState<string>("");
  const [sandiLama, setSandiLama] = useState("");
  const [sandiBaru, setSandiBaru] = useState("");

  const { data: profil = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("email");
      if (error) throw error;
      return data as Profil[];
    },
  });

  const { data: peran = [] } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as PeranBaris[];
    },
  });

  const buatAkun = useMutation({
    mutationFn: async () => {
      // Simpan sesi admin saat ini
      const { data: sessionData } = await supabase.auth.getSession();
      const adminSession = sessionData.session;

      // Buat akun baru via signUp
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            account_type: accountType,
            ...(accountType === "invited" ? { parent_user_id: parentUserId || user?.id } : {}),
          },
        },
      });

      if (error) throw error;

      // Kembalikan sesi admin
      if (adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }

      const newUserId = data.user?.id;
      if (!newUserId) throw new Error("Gagal mendapatkan ID pengguna baru");

      // Insert peran
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: newUserId, role });
      if (roleErr) throw roleErr;

      // Insert profil
      const { error: profilErr } = await supabase
        .from("profiles")
        .insert({ id: newUserId, email: email.toLowerCase().trim(), nama: nama.trim() || null });
      if (profilErr) throw profilErr;
    },
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setNama("");
      setParentUserId("");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Akun pengguna baru berhasil dibuat!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ubahPeran = useMutation({
    mutationFn: async ({ userId, nilai }: { userId: string; nilai: "admin" | "viewer" }) => {
      const { error: hapusErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (hapusErr) throw hapusErr;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: nilai });
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      await refreshPeran();
      toast.success("Peran pengguna diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function gantiSandi(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      password: sandiBaru,
      ...(sandiLama ? ({ current_password: sandiLama } as Record<string, string>) : {}),
    });
    if (error) toast.error(error.message);
    else {
      setSandiLama("");
      setSandiBaru("");
      toast.success("Kata sandi berhasil diperbarui!");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <PageHeader
        judul="Pengguna & Keamanan"
        deskripsi="Pengaturan akun, ganti kata sandi, dan manajemen hak akses pengguna."
      />

      {/* Password Reset Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <KeyRound className="size-4 text-amber-500" />
          <span>Ganti Kata Sandi Akun</span>
        </div>
        <p className="text-xs text-slate-400">
          Pastikan kata sandi minimal 8 karakter dengan kombinasi huruf dan angka.
        </p>

        <form onSubmit={gantiSandi} className="flex flex-wrap items-end gap-3 pt-1">
          <div className="space-y-1 w-full sm:w-56">
            <Label htmlFor="lama" className="text-xs text-slate-500">
              Kata Sandi Lama
            </Label>
            <Input
              id="lama"
              type="password"
              placeholder="••••••••"
              value={sandiLama}
              onChange={(e) => setSandiLama(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>
          <div className="space-y-1 w-full sm:w-56">
            <Label htmlFor="baru" className="text-xs text-slate-500">
              Kata Sandi Baru
            </Label>
            <Input
              id="baru"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={sandiBaru}
              onChange={(e) => setSandiBaru(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>
          <Button
            type="submit"
            className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5"
          >
            Simpan Kata Sandi
          </Button>
        </form>
      </div>

      {/* Create User Card (Admin Only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <UserPlus className="size-4 text-indigo-500" />
            <span>Buat Pengguna Baru</span>
          </div>
          <p className="text-xs text-slate-400">
            Buat akun baru langsung dengan email dan kata sandi. Pilih tipe akun: mandiri (data
            terpisah mulai dari nol) atau invited (berbagi data dengan akun induk).
          </p>

          {/* Account Type Selector */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setAccountType("independent")}
              className={`flex items-start gap-2.5 p-3 rounded-2xl border-2 text-left transition-all ${
                accountType === "independent"
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <UserCheck
                className={`size-4 shrink-0 mt-0.5 ${accountType === "independent" ? "text-indigo-500" : "text-slate-400"}`}
              />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Akun Mandiri</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Data terpisah, mulai dari nol. Tidak terlihat oleh akun lain.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType("invited")}
              className={`flex items-start gap-2.5 p-3 rounded-2xl border-2 text-left transition-all ${
                accountType === "invited"
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <Eye
                className={`size-4 shrink-0 mt-0.5 ${accountType === "invited" ? "text-indigo-500" : "text-slate-400"}`}
              />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Akun Invited</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Berbagi data dengan akun induk untuk melihat dan berkolaborasi.
                </p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Nama Lengkap</Label>
              <Input
                type="text"
                placeholder="Nama pengguna"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Email</Label>
              <div className="relative">
                <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Kata Sandi</Label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Peran</Label>
              <select
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "viewer")}
              >
                <option value="viewer">Viewer (Hanya Baca)</option>
                <option value="admin">Admin (Akses Penuh)</option>
              </select>
            </div>
          </div>

          {accountType === "invited" && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Akun Induk (Sumber Data)</Label>
              <select
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden"
                value={parentUserId}
                onChange={(e) => setParentUserId(e.target.value)}
              >
                <option value="">Pilih akun induk...</option>
                {profil.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={() =>
              email.trim() &&
              password.length >= 8 &&
              (accountType === "independent" || parentUserId) &&
              buatAkun.mutate()
            }
            disabled={
              buatAkun.isPending ||
              !email.trim() ||
              password.length < 8 ||
              (accountType === "invited" && !parentUserId)
            }
            className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5"
          >
            {buatAkun.isPending ? "Membuat..." : "Buat Akun"}
          </Button>
        </div>
      )}

      {/* User Accounts List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Users className="size-4 text-emerald-500" />
            <span>Daftar Akun Terdaftar</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Admin Utama:{" "}
            <strong className="text-slate-600 dark:text-slate-300">{EMAIL_ADMIN_PERTAMA}</strong>
          </span>
        </div>

        <div className="space-y-2.5">
          {profil.map((p) => {
            const peranP = peran.find((r) => r.user_id === p.id)?.role ?? "viewer";
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                    {p.email}
                  </p>
                  {p.nama && <p className="text-[11px] text-slate-400">{p.nama}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select
                      className="h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden"
                      value={peranP}
                      onChange={(e) =>
                        ubahPeran.mutate({
                          userId: p.id,
                          nilai: e.target.value as "admin" | "viewer",
                        })
                      }
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full capitalize">
                      <ShieldCheck className="size-3 text-emerald-500" />
                      {peranP}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
