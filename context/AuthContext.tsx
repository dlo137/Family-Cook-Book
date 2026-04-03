/**
 * context/AuthContext.tsx — Auth State Provider
 *
 * RELATED FILES:
 *   - lib/supabase.ts          → Supabase client used here
 *   - app/_layout.tsx          → Wrap your <Stack> with <AuthProvider>
 *   - services/IAPService.ts   → Call IAPService.init() AFTER auth is ready
 *
 * USAGE in _layout.tsx:
 *   import { AuthProvider } from "@/context/AuthContext";
 *   <AuthProvider><Stack /></AuthProvider>
 *
 * USAGE in any screen:
 *   import { useAuth } from "@/context/AuthContext";
 *   const { session, user, loading } = useAuth();
 *
 * ⚠️ LAUNCH CRASH NOTE:
 *   We call supabase.auth.getSession() inside useEffect (not at module level)
 *   to avoid reading AsyncStorage before the JS runtime is fully ready.
 *   Never move the getSession() call outside of a useEffect or event handler.
 */

import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Safe: runs after mount, not at module load time
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
