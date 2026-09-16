import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type Peran = "admin" | "viewer";
export type AccountType = "invited" | "independent";

type AuthValue = {
  user: User | null;
  session: Session | null;
  peran: Peran | null;
  isAdmin: boolean;
  loading: boolean;
  refreshPeran: () => Promise<void>;
  accountType: AccountType;
  parentUserId: string | null;
  /** ID pengguna yang datanya terlihat: sendiri untuk independent, parent untuk invited */
  effectiveUserId: string | null;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  peran: null,
  isAdmin: false,
  loading: true,
  refreshPeran: async () => {},
  accountType: "independent",
  parentUserId: null,
  effectiveUserId: null,
});

async function ambilPeran(userId: string): Promise<Peran | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .order("role", { ascending: true });
  if (!data || data.length === 0) return null;
  return data.some((r: { role: string }) => r.role === "admin") ? "admin" : "viewer";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [peran, setPeran] = useState<Peran | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setPeran(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) return;
    let aktif = true;
    ambilPeran(uid).then((p) => {
      if (aktif) setPeran(p);
    });
    return () => {
      aktif = false;
    };
  }, [session?.user.id]);

  const value = useMemo<AuthValue>(() => {
    const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
    const accountType: AccountType =
      (meta?.account_type as AccountType) === "invited" ? "invited" : "independent";
    const parentUserId = (meta?.parent_user_id as string | null) ?? null;
    const ownId = session?.user.id ?? null;
    const effectiveUserId = accountType === "invited" ? parentUserId : ownId;

    return {
      user: session?.user ?? null,
      session,
      peran,
      isAdmin: peran === "admin",
      loading,
      refreshPeran: async () => {
        if (session?.user.id) setPeran(await ambilPeran(session.user.id));
      },
      accountType,
      parentUserId,
      effectiveUserId,
    };
  }, [session, peran, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
