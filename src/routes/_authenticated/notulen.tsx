import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Users, Calendar, CheckSquare, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CatatanViewer, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/notulen")({ component: Notulen });

type Item = {
  id: string;
  judul: string;
  tanggal: string;
  peserta: string | null;
  isi: string | null;
  keputusan: string | null;
};

function Notulen() {
  const { isAdmin, user, effectiveUserId } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    judul: "",
    tanggal: new Date().toISOString().slice(0, 10),
    peserta: "",
    isi: "",
    keputusan: "",
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["notulen"],
    queryFn: async () => {
      let query = supabase.from("notulen").select("*");
      if (effectiveUserId) query = query.eq("dibuat_oleh", effectiveUserId);
      const { data, error } = await query.order("tanggal", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });

  const tambah = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notulen").insert({ ...form, dibuat_oleh: effectiveUserId });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({
        judul: "",
        tanggal: new Date().toISOString().slice(0, 10),
        peserta: "",
        isi: "",
        keputusan: "",
      });
      qc.invalidateQueries({ queryKey: ["notulen"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      qc.invalidateQueries({ queryKey: ["appshell_counts"] });
      toast.success("Notulen rapat tersimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notulen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notulen"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      qc.invalidateQueries({ queryKey: ["appshell_counts"] });
      toast.success("Notulen dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <PageHeader
        judul="Notulen Rapat"
        deskripsi="Dokumentasi agenda rapat, daftar peserta, notula pembahasan, dan keputusan tindak lanjut."
      />

      {!isAdmin && <CatatanViewer />}

      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Plus className="size-4 text-purple-500" />
            <span>Tulis Notulen Rapat Baru</span>
          </div>

          <Input
            placeholder="Judul atau topik rapat (contoh: Rapat Koordinasi Sprint Q4 & Launching)"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <Input
                type="date"
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              />
            </div>
            <div className="sm:col-span-8">
              <Input
                placeholder="Peserta hadir (contoh: Satria, Sarah, Tim Design, PM)"
                value={form.peserta}
                onChange={(e) => setForm({ ...form, peserta: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-xs"
              />
            </div>
          </div>

          <Textarea
            placeholder="Poin-poin pembahasan utama yang dibahas dalam rapat..."
            value={form.isi}
            onChange={(e) => setForm({ ...form, isi: e.target.value })}
            rows={3}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
          />

          <Textarea
            placeholder="Keputusan rapat & pembagian tugas tindak lanjut (action items)..."
            value={form.keputusan}
            onChange={(e) => setForm({ ...form, keputusan: e.target.value })}
            rows={2}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
          />

          <div className="flex justify-end pt-1">
            <Button
              onClick={() => form.judul.trim() && tambah.mutate()}
              disabled={tambah.isPending || !form.judul.trim()}
              className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold px-5"
            >
              {tambah.isPending ? "Menyimpan..." : "Simpan Notulen"}
            </Button>
          </div>
        </div>
      )}

      {/* Minutes List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            Memuat notulen rapat...
          </div>
        )}

        {data.map((n) => (
          <div
            key={n.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-start gap-4 hover:border-purple-200 dark:hover:border-purple-900/60 transition-all"
          >
            <div className="size-10 rounded-2xl bg-linear-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{n.judul}</h3>

              <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {n.tanggal}
                </span>
                {n.peserta && (
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Users className="size-3 text-purple-500" />
                    {n.peserta}
                  </span>
                )}
              </div>

              {n.isi && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {n.isi}
                </div>
              )}

              {n.keputusan && (
                <div className="mt-2.5 flex items-start gap-2 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300">
                  <CheckSquare className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold">Keputusan & Tindak Lanjut:</span>{" "}
                    <span className="whitespace-pre-wrap">{n.keputusan}</span>
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => hapus.mutate(n.id)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full size-8"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}

        {!isLoading && data.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <FileText className="size-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada notulen rapat
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Catat hasil rapat dan keputusan penting tim menggunakan formulir di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
