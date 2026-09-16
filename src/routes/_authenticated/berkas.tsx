import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Download,
  Trash2,
  UploadCloud,
  File,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  MoreVertical,
  Edit2,
  Move,
  Search,
  HardDrive,
  Loader2,
  Home,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CatatanViewer, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/berkas")({
  component: Berkas,
});

export type BerkasItem = {
  id: string;
  nama: string;
  path: string;
  ukuran: number | null;
  tipe: string | null;
  is_folder?: boolean | null;
  folder_id?: string | null;
  dibuat_oleh?: string | null;
  created_at: string;
};

function ukuranTeks(b: number | null) {
  if (!b) return "0 KB";
  const kb = b / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

function getFileIcon(type: string | null) {
  if (!type) return <File className="size-5 text-slate-500" />;
  if (type.startsWith("image/")) return <ImageIcon className="size-5 text-cyan-500" />;
  if (type.includes("pdf") || type.includes("document") || type.includes("text"))
    return <FileText className="size-5 text-indigo-500" />;
  if (type.includes("sheet") || type.includes("csv") || type.includes("excel"))
    return <FileSpreadsheet className="size-5 text-emerald-500" />;
  if (type.includes("json") || type.includes("javascript") || type.includes("typescript"))
    return <FileCode className="size-5 text-amber-500" />;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("7z"))
    return <FileArchive className="size-5 text-rose-500" />;
  return <File className="size-5 text-purple-500" />;
}

function isFolderItem(item: BerkasItem): boolean {
  return (
    item.is_folder === true ||
    item.tipe === "folder" ||
    Boolean(item.path?.startsWith("folder:")) ||
    Boolean(item.path?.startsWith("folder/"))
  );
}

function getItemParentId(item: BerkasItem): string | null {
  if (item.folder_id !== undefined && item.folder_id !== null) {
    return item.folder_id;
  }
  if (item.path?.startsWith("folder:")) {
    const withoutPrefix = item.path.replace("folder:", "");
    const parts = withoutPrefix.split("/");
    if (parts.length > 1 && parts[0] !== "root") {
      return parts[0]!;
    }
  }
  return null;
}

function Berkas() {
  const { isAdmin, user, effectiveUserId } = useAuth();
  const qc = useQueryClient();

  // Navigation state: current folder ID (null = Root)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");

  // Upload state
  const [unggah, setUnggah] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Modal: Buat Folder Baru
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [namaFolderBaru, setNamaFolderBaru] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Modal: Ubah Nama (Rename)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<BerkasItem | null>(null);
  const [namaBaru, setNamaBaru] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Modal: Pindahkan Item (Move)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<BerkasItem | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Modal: Konfirmasi Hapus Folder
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<BerkasItem | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // Query: Ambil semua data berkas & folder
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["berkas"],
    queryFn: async () => {
      let query = supabase.from("berkas").select("*");
      if (effectiveUserId) query = query.eq("dibuat_oleh", effectiveUserId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BerkasItem[];
    },
  });

  // Current folder object
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return allItems.find((item) => item.id === currentFolderId) || null;
  }, [allItems, currentFolderId]);

  // Breadcrumb path calculation
  const breadcrumbPath = useMemo(() => {
    const path: BerkasItem[] = [];
    let curr = currentFolder;
    while (curr) {
      path.unshift(curr);
      const parentId = getItemParentId(curr);
      if (!parentId) break;
      curr = allItems.find((item) => item.id === parentId) || null;
    }
    return path;
  }, [allItems, currentFolder]);

  // Items in current view (filtered by currentFolderId)
  const currentItems = useMemo(() => {
    return allItems.filter((item) => {
      const parentId = getItemParentId(item);
      return parentId === currentFolderId;
    });
  }, [allItems, currentFolderId]);

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return currentItems;
    const term = searchTerm.toLowerCase();
    // Jika mencari, cari di seluruh item agar mudah ditemukan
    return allItems.filter((item) => item.nama.toLowerCase().includes(term));
  }, [allItems, currentItems, searchTerm]);

  // Separate folders and files
  const folders = useMemo(() => {
    return filteredItems
      .filter((item) => isFolderItem(item))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [filteredItems]);

  const files = useMemo(() => {
    return filteredItems
      .filter((item) => !isFolderItem(item))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [filteredItems]);

  // Overall Statistics
  const totalFoldersCount = useMemo(() => {
    return allItems.filter((item) => isFolderItem(item)).length;
  }, [allItems]);

  const totalFilesCount = useMemo(() => {
    return allItems.filter((item) => !isFolderItem(item)).length;
  }, [allItems]);

  const totalSizeCount = useMemo(() => {
    return allItems
      .filter((item) => !isFolderItem(item))
      .reduce((acc, curr) => acc + (curr.ukuran || 0), 0);
  }, [allItems]);

  // Handler: Buat Folder Baru
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = namaFolderBaru.trim();
    if (!trimmed) {
      toast.error("Nama folder wajib diisi.");
      return;
    }

    // Check duplicate in same directory
    const isDuplicate = currentItems.some(
      (item) => isFolderItem(item) && item.nama.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      toast.error(`Folder dengan nama "${trimmed}" sudah ada di direktori ini.`);
      return;
    }

    setIsCreatingFolder(true);
    try {
      const pathValue = currentFolderId
        ? `folder:${currentFolderId}/${trimmed}`
        : `folder:root/${trimmed}`;

      // Coba insert dengan kolom folder_id & is_folder
      const { error } = await supabase.from("berkas").insert({
        nama: trimmed,
        path: pathValue,
        ukuran: null,
        tipe: "folder",
        is_folder: true,
        folder_id: currentFolderId,
        dibuat_oleh: effectiveUserId,
      });

      if (error && error.code === "42703") {
        // Fallback jika migrasi belum dijalankan di database
        const { error: fbError } = await supabase.from("berkas").insert({
          nama: trimmed,
          path: pathValue,
          ukuran: null,
          tipe: "folder",
          dibuat_oleh: effectiveUserId,
        });
        if (fbError) throw fbError;
      } else if (error) {
        throw error;
      }

      qc.invalidateQueries({ queryKey: ["berkas"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      toast.success(`Folder "${trimmed}" berhasil dibuat!`);
      setNamaFolderBaru("");
      setFolderDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Handler: Upload berkas ke folder aktif
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setUnggah(true);

    let successCount = 0;
    try {
      for (const file of Array.from(fileList)) {
        const userFolder = effectiveUserId ?? "umum";
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userFolder}/${Date.now()}-${cleanName}`;

        const { error: upErr } = await supabase.storage.from("berkas").upload(path, file);
        if (upErr) throw upErr;

        const { error } = await supabase.from("berkas").insert({
          nama: file.name,
          path,
          ukuran: file.size,
          tipe: file.type || "application/octet-stream",
          is_folder: false,
          folder_id: currentFolderId,
          dibuat_oleh: effectiveUserId,
        });

        if (error && error.code === "42703") {
          // Fallback tanpa kolom folder_id
          const { error: fbErr } = await supabase.from("berkas").insert({
            nama: file.name,
            path,
            ukuran: file.size,
            tipe: file.type || "application/octet-stream",
            dibuat_oleh: effectiveUserId,
          });
          if (fbErr) throw fbErr;
        } else if (error) {
          throw error;
        }

        successCount++;
      }

      qc.invalidateQueries({ queryKey: ["berkas"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      toast.success(
        successCount === 1
          ? "Berkas berhasil diunggah!"
          : `${successCount} berkas berhasil diunggah!`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah berkas");
    } finally {
      setUnggah(false);
      if (manualFileInputRef.current) {
        manualFileInputRef.current.value = "";
      }
    }
  };

  // Handler: Unduh Berkas
  const unduh = async (item: BerkasItem) => {
    try {
      const { data, error } = await supabase.storage.from("berkas").createSignedUrl(item.path, 60);
      if (error || !data?.signedUrl) {
        toast.error("Gagal membuat tautan unduhan berkas");
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Gagal mengunduh berkas");
    }
  };

  // Handler: Hapus Berkas Tunggal
  const hapusBerkas = useMutation({
    mutationFn: async (item: BerkasItem) => {
      await supabase.storage.from("berkas").remove([item.path]);
      const { error } = await supabase.from("berkas").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["berkas"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      toast.success("Berkas berhasil dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Handler: Hapus Folder beserta seluruh isinya
  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    setIsDeletingFolder(true);

    try {
      // Temukan semua sub-item (rekursif)
      const toDeleteIds: string[] = [];
      const storagePathsToRemove: string[] = [];

      function collectDescendants(parentId: string) {
        toDeleteIds.push(parentId);
        const children = allItems.filter((i) => getItemParentId(i) === parentId);
        for (const child of children) {
          if (isFolderItem(child)) {
            collectDescendants(child.id);
          } else {
            toDeleteIds.push(child.id);
            if (child.path && !child.path.startsWith("folder:")) {
              storagePathsToRemove.push(child.path);
            }
          }
        }
      }

      collectDescendants(folderToDelete.id);

      // 1. Hapus berkas fisik dari storage
      if (storagePathsToRemove.length > 0) {
        await supabase.storage.from("berkas").remove(storagePathsToRemove);
      }

      // 2. Hapus data dari tabel berkas
      const { error } = await supabase.from("berkas").delete().in("id", toDeleteIds);
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["berkas"] });
      qc.invalidateQueries({ queryKey: ["ringkasan_kerja"] });
      toast.success(`Folder "${folderToDelete.nama}" berhasil dihapus.`);

      // Jika folder yang dihapus sedang dibuka, kembali ke parent atau root
      if (currentFolderId === folderToDelete.id) {
        setCurrentFolderId(getItemParentId(folderToDelete));
      }

      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus folder.");
    } finally {
      setIsDeletingFolder(false);
    }
  };

  // Handler: Ubah Nama (Rename)
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToRename) return;
    const trimmed = namaBaru.trim();
    if (!trimmed) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }

    setIsRenaming(true);
    try {
      const { error } = await supabase
        .from("berkas")
        .update({ nama: trimmed })
        .eq("id", itemToRename.id);
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["berkas"] });
      toast.success("Nama berhasil diperbarui!");
      setRenameDialogOpen(false);
      setItemToRename(null);
      setNamaBaru("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah nama.");
    } finally {
      setIsRenaming(false);
    }
  };

  // Handler: Pindahkan Item (Move)
  const handleMove = async () => {
    if (!itemToMove) return;
    if (targetFolderId === itemToMove.id) {
      toast.error("Tidak dapat memindahkan item ke dalam dirinya sendiri.");
      return;
    }

    setIsMoving(true);
    try {
      const isFolder = isFolderItem(itemToMove);
      const newPath = isFolder
        ? targetFolderId
          ? `folder:${targetFolderId}/${itemToMove.nama}`
          : `folder:root/${itemToMove.nama}`
        : itemToMove.path;

      const { error } = await supabase
        .from("berkas")
        .update({
          folder_id: targetFolderId,
          path: newPath,
        })
        .eq("id", itemToMove.id);

      if (error && error.code === "42703") {
        // Fallback
        const { error: fbErr } = await supabase
          .from("berkas")
          .update({ path: newPath })
          .eq("id", itemToMove.id);
        if (fbErr) throw fbErr;
      } else if (error) {
        throw error;
      }

      qc.invalidateQueries({ queryKey: ["berkas"] });
      toast.success(`"${itemToMove.nama}" berhasil dipindahkan!`);
      setMoveDialogOpen(false);
      setItemToMove(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memindahkan item.");
    } finally {
      setIsMoving(false);
    }
  };

  // Available destination folders for move dialog
  const availableMoveFolders = useMemo(() => {
    if (!itemToMove) return [];
    // Jangan izinkan folder dipindahkan ke dirinya sendiri atau subfolder anaknya
    const forbiddenIds = new Set<string>();
    if (isFolderItem(itemToMove)) {
      function markDescendants(id: string) {
        forbiddenIds.add(id);
        allItems
          .filter((i) => isFolderItem(i) && getItemParentId(i) === id)
          .forEach((child) => markDescendants(child.id));
      }
      markDescendants(itemToMove.id);
    }

    return allItems.filter((i) => isFolderItem(i) && !forbiddenIds.has(i.id));
  }, [allItems, itemToMove]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8">
      {/* Header Halaman */}
      <PageHeader
        judul="Berkas Dokumen"
        deskripsi="Penyimpanan dokumen, aset desain, dan arsip kerja terstruktur dalam folder."
      />

      {!isAdmin && <CatatanViewer />}

      {/* Ringkasan Statistik Berkas & Folder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Folder className="size-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Folder</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {totalFoldersCount} <span className="text-xs font-normal text-slate-400">Folder</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Berkas</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {totalFilesCount} <span className="text-xs font-normal text-slate-400">Berkas</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HardDrive className="size-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Kapasitas Terpakai
            </p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight font-mono">
              {ukuranTeks(totalSizeCount)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar & Breadcrumbs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-slate-600 dark:text-slate-300">
            {currentFolderId && (
              <button
                type="button"
                onClick={() => setCurrentFolderId(getItemParentId(currentFolder!))}
                className="inline-flex items-center justify-center size-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors mr-1 cursor-pointer"
                title="Kembali ke folder sebelumnya"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setCurrentFolderId(null);
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                currentFolderId === null
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Home className="size-4" />
              <span>Semua Berkas</span>
            </button>

            {breadcrumbPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1.5">
                <ChevronRight className="size-4 text-slate-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFolderId(folder.id);
                    setSearchTerm("");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors truncate max-w-[160px] cursor-pointer ${
                    index === breadcrumbPath.length - 1
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                  title={folder.nama}
                >
                  <FolderOpen className="size-3.5 shrink-0" />
                  <span className="truncate">{folder.nama}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons (Folder Baru & Unggah Berkas) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isAdmin && (
              <>
                <Button
                  type="button"
                  onClick={() => setFolderDialogOpen(true)}
                  variant="outline"
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-xs"
                >
                  <FolderPlus className="size-4 text-amber-500" />
                  <span>Folder Baru</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => manualFileInputRef.current?.click()}
                  disabled={unggah}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-xs"
                >
                  {unggah ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UploadCloud className="size-4" />
                  )}
                  <span>Unggah Berkas</span>
                </Button>

                <input
                  ref={manualFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleUploadFiles(e.target.files);
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Search Bar & Stats in Directory */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari folder atau nama berkas..."
              className="pl-9 rounded-xl text-xs h-9 bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-3 w-full sm:w-auto justify-end">
            <span>
              {folders.length} folder • {files.length} berkas
            </span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {isAdmin && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
          }}
          className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border-2 border-dashed transition-all text-center ${
            dragOver
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-2.5">
            <UploadCloud className="size-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            {unggah
              ? "Sedang Mengunggah Berkas..."
              : currentFolder
                ? `Tarik & Lepas Berkas ke Folder "${currentFolder.nama}"`
                : "Tarik & Lepas Berkas ke Sini"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Mendukung file PDF, dokumen Word, lembar kerja Excel, gambar JPG/PNG, atau arsip ZIP.
          </p>

          <label className="mt-3.5 inline-block">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleUploadFiles(e.target.files);
              }}
              disabled={unggah}
            />
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 cursor-pointer transition-colors shadow-xs">
              <Plus className="size-3.5" />
              Pilih Berkas Manual
            </span>
          </label>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-sm text-slate-400">
          <Loader2 className="size-6 animate-spin mx-auto mb-2 text-indigo-500" />
          Memuat berkas dan folder...
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* SECTION 1: DAFTAR FOLDER */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Folder</span>
                  <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                    {folders.length}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {folders.map((folder) => {
                  // Count items inside this folder
                  const childCount = allItems.filter(
                    (i) => getItemParentId(i) === folder.id,
                  ).length;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setCurrentFolderId(folder.id);
                        setSearchTerm("");
                      }}
                      className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Folder className="size-5 fill-amber-400/30" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {folder.nama}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {childCount === 0 ? "Kosong" : `${childCount} item`}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentFolderId(folder.id);
                                  setSearchTerm("");
                                }}
                                className="cursor-pointer gap-2 text-xs font-medium"
                              >
                                <FolderOpen className="size-3.5" />
                                <span>Buka Folder</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setItemToRename(folder);
                                  setNamaBaru(folder.nama);
                                  setRenameDialogOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-medium"
                              >
                                <Edit2 className="size-3.5" />
                                <span>Ubah Nama</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setItemToMove(folder);
                                  setTargetFolderId(getItemParentId(folder));
                                  setMoveDialogOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-medium"
                              >
                                <Move className="size-3.5" />
                                <span>Pindahkan</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setFolderToDelete(folder);
                                  setDeleteFolderDialogOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-medium text-rose-600 focus:text-rose-600"
                              >
                                <Trash2 className="size-3.5" />
                                <span>Hapus Folder</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: DAFTAR BERKAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>Berkas Dokumen</span>
                <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                  {files.length}
                </span>
              </h3>
            </div>

            {files.length > 0 ? (
              <div className="space-y-2.5">
                {files.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all"
                  >
                    <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getFileIcon(b.tipe)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm text-slate-800 dark:text-slate-100">
                        {b.nama}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-[11px]">{ukuranTeks(b.ukuran)}</span>
                        <span>•</span>
                        <span className="truncate">{b.tipe || "Dokumen"}</span>
                        <span>•</span>
                        <span>
                          {new Date(b.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unduh(b)}
                        title="Unduh Berkas"
                        className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl size-8.5 cursor-pointer"
                      >
                        <Download className="size-4" />
                      </Button>

                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl size-8.5 cursor-pointer"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem
                              onClick={() => unduh(b)}
                              className="cursor-pointer gap-2 text-xs font-medium"
                            >
                              <Download className="size-3.5" />
                              <span>Unduh</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setItemToRename(b);
                                setNamaBaru(b.nama);
                                setRenameDialogOpen(true);
                              }}
                              className="cursor-pointer gap-2 text-xs font-medium"
                            >
                              <Edit2 className="size-3.5" />
                              <span>Ubah Nama</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setItemToMove(b);
                                setTargetFolderId(getItemParentId(b));
                                setMoveDialogOpen(true);
                              }}
                              className="cursor-pointer gap-2 text-xs font-medium"
                            >
                              <Move className="size-3.5" />
                              <span>Pindahkan</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => hapusBerkas.mutate(b)}
                              className="cursor-pointer gap-2 text-xs font-medium text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : folders.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
                <HardDrive className="size-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {currentFolder ? "Folder ini masih kosong" : "Belum ada berkas tersimpan"}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {currentFolder
                    ? "Unggah berkas atau buat subfolder untuk mengatur dokumen di dalam folder ini."
                    : "Buat folder baru atau tarik dan lepas file dokumen ke kotak di atas."}
                </p>
                {isAdmin && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <Button
                      onClick={() => setFolderDialogOpen(true)}
                      variant="outline"
                      className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <FolderPlus className="size-4 text-amber-500" />
                      Buat Folder
                    </Button>
                    <Button
                      onClick={() => manualFileInputRef.current?.click()}
                      className="rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="size-4" />
                      Unggah Berkas
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Tidak ada berkas langsung di level ini. Klik salah satu folder di atas untuk melihat
                isinya.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIALOG 1: BUAT FOLDER BARU */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderPlus className="size-5 text-amber-500" />
              <span>Buat Folder Baru</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {currentFolder
                ? `Folder ini akan dibuat di dalam folder "${currentFolder.nama}".`
                : "Folder ini akan dibuat di direktori utama (Semua Berkas)."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="namaFolderBaru"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Nama Folder
              </Label>
              <Input
                id="namaFolderBaru"
                value={namaFolderBaru}
                onChange={(e) => setNamaFolderBaru(e.target.value)}
                placeholder="Contoh: Dokumen Legal, Desain UI, Laporan..."
                className="rounded-xl text-sm"
                autoFocus
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFolderDialogOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isCreatingFolder}
                className="rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
              >
                {isCreatingFolder ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <FolderPlus className="size-3.5 mr-1.5" />
                )}
                <span>Buat Folder</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: UBAH NAMA (RENAME) */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit2 className="size-4 text-indigo-500" />
              <span>
                Ubah Nama {itemToRename && isFolderItem(itemToRename) ? "Folder" : "Berkas"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan nama baru untuk {itemToRename?.nama}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRename} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="namaBaru"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Nama Baru
              </Label>
              <Input
                id="namaBaru"
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
                className="rounded-xl text-sm"
                autoFocus
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isRenaming}
                className="rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
              >
                {isRenaming ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                <span>Simpan Perubahan</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: PINDAHKAN ITEM (MOVE) */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Move className="size-4 text-indigo-500" />
              <span>Pindahkan "{itemToMove?.nama}"</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih folder tujuan untuk memindahkan item ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilih Folder Tujuan:
            </Label>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2">
              {/* Opsi Root */}
              <button
                type="button"
                onClick={() => setTargetFolderId(null)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                  targetFolderId === null
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Home className="size-4 text-indigo-500 shrink-0" />
                <span>Semua Berkas (Folder Utama)</span>
              </button>

              {/* Opsi Folder Lain */}
              {availableMoveFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTargetFolderId(f.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                    targetFolderId === f.id
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Folder className="size-4 text-amber-500 shrink-0" />
                  <span className="truncate">{f.nama}</span>
                </button>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveDialogOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleMove}
                disabled={isMoving}
                className="rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
              >
                {isMoving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                <span>Pindahkan Sekarang</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: KONFIRMASI HAPUS FOLDER */}
      <Dialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
        <DialogContent className="sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Hapus Folder?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed pt-1">
              Apakah Anda yakin ingin menghapus folder{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                "{folderToDelete?.nama}"
              </strong>
              ? Seluruh subfolder dan berkas di dalamnya juga akan terhapus secara permanen dari
              penyimpanan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteFolderDialogOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDeleteFolder}
              disabled={isDeletingFolder}
              className="rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isDeletingFolder ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              <span>Hapus Folder & Isinya</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
