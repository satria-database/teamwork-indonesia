import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadWorkLogTemplate, readWorkLogWorkbook, type ImportRow } from "@/lib/workLogImport";
import { createWorkLog } from "@/lib/workLogs";
import { supabase } from "@/lib/supabase";

export function WorkLogImportDialog({
  open,
  onOpenChange,
  userId,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [busy, setBusy] = useState(false);
  const valid = rows.filter((row) => row.payload);
  const invalid = rows.filter((row) => row.error);
  const chooseFile = async (selected?: File) => {
    if (!selected) return;
    try {
      setFile(selected);
      setRows(await readWorkLogWorkbook(selected));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File Excel tidak dapat dibaca");
    }
  };
  const importRows = async () => {
    if (!file || !valid.length || !userId) return;
    setBusy(true);
    let imported = 0;
    try {
      for (const row of valid) {
        await createWorkLog(row.payload!, userId);
        imported++;
      }
      await supabase.from("work_log_import_history").insert({
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        row_count: rows.length,
        success_count: imported,
        failure_count: invalid.length,
        status: invalid.length ? "partial" : "success",
        errors: invalid,
      });
      toast.success(
        `${imported} catatan berhasil diimpor${invalid.length ? `, ${invalid.length} baris dilewati` : ""}`,
      );
      onImported();
      onOpenChange(false);
      setFile(null);
      setRows([]);
    } catch (error) {
      await supabase.from("work_log_import_history").insert({
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        row_count: rows.length,
        success_count: imported,
        failure_count: rows.length - imported,
        status: "failed",
        errors: [{ error: error instanceof Error ? error.message : "Gagal impor" }],
      });
      toast.error(error instanceof Error ? error.message : "Gagal mengimpor data");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Excel Catatan Pekerjaan</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadWorkLogTemplate}>
              <Download data-icon="inline-start" /> Template Excel
            </Button>
            <Button onClick={() => inputRef.current?.click()}>
              <Upload data-icon="inline-start" /> Pilih File
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
          </div>
          {file && (
            <div className="rounded-xl border p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="size-4" />
                {file.name}
              </div>
              <p className="mt-2 text-muted-foreground">
                {valid.length} valid, {invalid.length} gagal
              </p>
              {invalid.slice(0, 5).map((row) => (
                <p key={row.row} className="text-xs text-destructive">
                  Baris {row.row}: {row.error}
                </p>
              ))}
            </div>
          )}
          <Button disabled={busy || !valid.length} onClick={importRows}>
            {busy ? "Mengimpor..." : `Impor ${valid.length} Baris Valid`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
