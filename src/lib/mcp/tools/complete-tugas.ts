import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "set_tugas_selesai",
  title: "Tandai task selesai",
  description: "Ubah status selesai sebuah task harian. Hanya berhasil untuk pengguna Admin.",
  inputSchema: {
    id: z.string().uuid().describe("ID task"),
    selesai: z.boolean().default(true),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, selesai }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Belum terautentikasi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tugas")
      .update({ selesai: selesai ?? true })
      .eq("id", id)
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0)
      return {
        content: [{ type: "text", text: "Task tidak ditemukan atau tidak boleh diubah." }],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { row: data[0] },
    };
  },
});
