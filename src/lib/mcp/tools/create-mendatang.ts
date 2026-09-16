import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_pekerjaan_mendatang",
  title: "Buat pekerjaan mendatang",
  description: "Tambahkan rencana pekerjaan mendatang di WorkHub. Hanya berhasil untuk Admin.",
  inputSchema: {
    judul: z.string().trim().min(1),
    deskripsi: z.string().trim().optional(),
    tenggat: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    status: z.enum(["direncanakan", "berjalan", "selesai"]).default("direncanakan"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ judul, deskripsi, tenggat, status }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Belum terautentikasi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("pekerjaan_mendatang")
      .insert({
        judul,
        deskripsi: deskripsi ?? null,
        tenggat: tenggat ?? null,
        status: status ?? "direncanakan",
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
