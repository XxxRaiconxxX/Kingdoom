import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseAuthRedirectUrl, supabase } from "../utils/supabaseClient";

type SupabaseAuthContextValue = {
  session: Session | null;
  authUser: User | null;
  isAuthHydrating: boolean;
  isAuthSubmitting: boolean;
  authError: string;
  requestMagicLink: (email: string) => Promise<boolean>;
  signOutAuth: () => Promise<boolean>;
  clearAuthError: () => void;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthHydrating, setIsAuthHydrating] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session ?? null);
      setAuthUser(data.session?.user ?? null);
      setIsAuthHydrating(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setAuthUser(nextSession?.user ?? null);
      setAuthError("");
      setIsAuthHydrating(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const requestMagicLink = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setAuthError("Escribe un correo para enviarte el magic link.");
      return false;
    }

    setIsAuthSubmitting(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: getSupabaseAuthRedirectUrl(),
      },
    });

    setIsAuthSubmitting(false);

    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  }, []);

  const signOutAuth = useCallback(async () => {
    setIsAuthSubmitting(true);
    setAuthError("");

    const { error } = await supabase.auth.signOut();

    setIsAuthSubmitting(false);

    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const value = useMemo(
    () => ({
      session,
      authUser,
      isAuthHydrating,
      isAuthSubmitting,
      authError,
      requestMagicLink,
      signOutAuth,
      clearAuthError,
    }),
    [
      authError,
      authUser,
      clearAuthError,
      isAuthHydrating,
      isAuthSubmitting,
      requestMagicLink,
      session,
      signOutAuth,
    ]
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);

  if (!context) {
    throw new Error("useSupabaseAuth debe usarse dentro de SupabaseAuthProvider");
  }

  return context;
}
