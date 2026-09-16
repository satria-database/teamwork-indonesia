import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const TABEL = {
  tugas: "tugas",
  catatan_kerja: "catatan_kerja",
  pekerjaan_mendatang: "pekerjaan_mendatang",
  notulen: "notulen",
  berkas: "berkas",
} as const;

export default defineTool({
  name: "list_records",
  title: "Daftar data WorkHub",
  description:
    "Ambil daftar data dari WorkHub: task harian (tugas), catatan pekerjaan (catatan_kerja), pekerjaan mendatang, notulen, atau berkas.",
  inputSchema: {
    jenis: z.enum(Object.keys(TABEL) as [keyof typeof TABEL, ...(keyof typeof TABEL)[]]),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ jenis, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Belum terautentikasi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from(TABEL[jenis])
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
