import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRecords from "./tools/list-records";
import createTugas from "./tools/create-tugas";
import completeTugas from "./tools/complete-tugas";
import createCatatan from "./tools/create-catatan";
import createMendatang from "./tools/create-mendatang";
import createNotulen from "./tools/create-notulen";

// Issuer OAuth harus host Supabase langsung (bukan proxy). Nilai ini di-inline
// saat build oleh Vite.
const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ??
  "https://olvogyukyydooiuzljml.supabase.co";

export default defineMcp({
  name: "lovable-workhub",
  title: "Lovable WorkHub",
  version: "0.1.0",
  instructions:
    "Alat untuk WorkHub: membaca dan menambah task harian, catatan pekerjaan, pekerjaan mendatang, notulen, dan daftar berkas. Menulis data hanya berhasil bila pengguna berperan Admin.",
  auth: auth.oauth.issuer({
    issuer: `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listRecords,
    createTugas,
    completeTugas,
    createCatatan,
    createMendatang,
    createNotulen,
  ] as unknown as Parameters<typeof defineMcp>[0]["tools"],
});
