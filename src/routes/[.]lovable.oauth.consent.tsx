import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { oauth, type OauthPayload } from "@/lib/oauthConsent";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Izinkan Akses Aplikasi — WorkHub" },
      {
        name: "description",
        content: "Setujui atau tolak permintaan aplikasi untuk mengakses data WorkHub Anda.",
      },
      { property: "og:title", content: "Izinkan Akses Aplikasi — WorkHub" },
      {
        property: "og:description",
        content: "Setujui atau tolak permintaan aplikasi untuk mengakses data WorkHub Anda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id:
      typeof s["authorization_id"] === "string" ? (s["authorization_id"] as string) : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("authorization_id tidak ada");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/masuk", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Permintaan tidak bisa dimuat</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as OauthPayload | null;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nama = details?.client?.name ?? "Aplikasi";

  async function putuskan(setuju: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = setuju
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Server otorisasi tidak mengembalikan alamat tujuan.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Hubungkan {nama} ke WorkHub</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {nama} akan dapat membaca dan menambah data WorkHub atas nama Anda, sesuai peran akun Anda.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button disabled={busy} onClick={() => putuskan(true)}>
          Izinkan
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => putuskan(false)}>
          Tolak
        </Button>
      </div>
    </main>
  );
}
