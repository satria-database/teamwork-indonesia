import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_notulen",
  title: "Buat notulen",
  description: "Tambahkan notulen rapat baru di WorkHub. Hanya berhasil untuk pengguna Admin.",
  inputSchema: {
    judul: z.string().trim().min(1),
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    peserta: z.string().trim().optional(),
    isi: z.string().trim().optional(),
    keputusan: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ judul, tanggal, peserta, isi, keputusan }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Belum terautentikasi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("notulen")
      .insert({
        judul,
        ...(tanggal ? { tanggal } : {}),
        peserta: peserta ?? null,
        isi: isi ?? null,
        keputusan: keputusan ?? null,
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
