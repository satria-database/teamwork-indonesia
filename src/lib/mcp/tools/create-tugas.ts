import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_tugas",
  title: "Buat task harian",
  description: "Tambahkan task harian baru di WorkHub. Hanya berhasil untuk pengguna Admin.",
  inputSchema: {
    judul: z.string().trim().min(1).describe("Judul task"),
    catatan: z.string().trim().optional(),
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Tanggal YYYY-MM-DD"),
    prioritas: z.enum(["rendah", "sedang", "tinggi"]).default("sedang"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ judul, catatan, tanggal, prioritas }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Belum terautentikasi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tugas")
      .insert({
        judul,
        catatan: catatan ?? null,
        ...(tanggal ? { tanggal } : {}),
        prioritas: prioritas ?? "sedang",
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
