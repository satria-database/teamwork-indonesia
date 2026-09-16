import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_catatan_kerja",
  title: "Buat catatan pekerjaan",
  description: "Tambahkan catatan pekerjaan baru di WorkHub. Hanya berhasil untuk pengguna Admin.",
  inputSchema: {
    judul: z.string().trim().min(1),
    isi: z.string().trim().optional(),
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    durasi_menit: z.number().int().min(0).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ judul, isi, tanggal, durasi_menit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Belum terautentikasi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("catatan_kerja")
      .insert({
        judul,
        isi: isi ?? null,
        ...(tanggal ? { tanggal } : {}),
        durasi_menit: durasi_menit ?? null,
        dibuat_oleh: ctx.getUserId(),
      })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { row: data?.[0] ?? null },
    };
  },
});
