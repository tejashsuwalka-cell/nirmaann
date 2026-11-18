import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx { user: User | null; session: Session | null; loading: boolean; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export const REMEMBER_KEY = "nirmaan-remember";
export const ALIVE_KEY = "nirmaan-alive";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setLoading(false); });
    (async () => {
      try {
      // "Remember me" off: end the session once the browser tab session is gone.
      if (localStorage.getItem(REMEMBER_KEY) === "0" && !sessionStorage.getItem(ALIVE_KEY)) {
        await supabase.auth.signOut();
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      } catch { setSession(null); }
      finally { setLoading(false); }
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut: async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
export const displayName = (u: User | null) => (u?.user_metadata?.["full_name"] as string | undefined) || u?.email?.split("@")[0] || "Architect";
