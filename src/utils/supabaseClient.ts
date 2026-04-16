import { createClient, type EmailOtpType } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
const mobileAuthRedirectUrl =
  import.meta.env.VITE_MOBILE_AUTH_REDIRECT_URL?.trim() || "com.reborn.app://auth/callback";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example)."
  );
}

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function buildWebRedirectUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, "");

  if (publicAppUrl) {
    return new URL(normalizedPath, ensureTrailingSlash(publicAppUrl)).toString();
  }

  if (typeof window !== "undefined") {
    return new URL(normalizedPath || ".", window.location.href).toString();
  }

  return normalizedPath ? `/${normalizedPath}` : "/";
}

export function isCapacitorNativeRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  const capacitor = (window as CapacitorWindow).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.() || window.location.protocol === "capacitor:");
}

export function getSupabaseAuthRedirectUrl(path = "auth/callback") {
  if (isCapacitorNativeRuntime()) {
    return mobileAuthRedirectUrl;
  }

  return buildWebRedirectUrl(path);
}

export function getSupabaseAuthRedirectOptions(path = "auth/callback") {
  const redirectUrl = getSupabaseAuthRedirectUrl(path);

  return {
    redirectTo: redirectUrl,
    emailRedirectTo: redirectUrl,
  };
}

export async function handleSupabaseAuthRedirect(url: string) {
  if (!url) {
    return false;
  }

  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const searchParams = parsedUrl.searchParams;

  const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return true;
  }

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return true;
  }

  if (tokenHash && otpType) {
    await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });
    return true;
  }

  return false;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
