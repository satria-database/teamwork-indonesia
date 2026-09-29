import { supabase } from "@/lib/supabase";

export type OauthPayload = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string };
};

type OauthResult = Promise<{ data: OauthPayload | null; error: Error | null }>;

type OauthNs = {
  getAuthorizationDetails: (id: string) => OauthResult;
  approveAuthorization: (id: string) => OauthResult;
  denyAuthorization: (id: string) => OauthResult;
};

export const oauth = () => (supabase.auth as unknown as { oauth: OauthNs }).oauth;
