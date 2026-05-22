import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { PlayerAccount } from "../types";
import {
  fetchPlayerByUsername,
  isPlayerLinkedToAuthUser,
  linkPlayerToAuthUser,
  updatePlayerGold,
} from "../utils/players";
import { supabase } from "../utils/supabaseClient";

const PLAYER_STORAGE_KEY = "kingdoom.active-player";

type PlayerSessionContextValue = {
  player: PlayerAccount | null;
  isAdmin: boolean;
  isHydrating: boolean;
  isSecureSessionReady: boolean;
  secureAuthUserId: string | null;
  secureSessionError: string;
  isPlayerSecureLinked: boolean;
  isLinkingSecureAccount: boolean;
  isSubmittingProfile: boolean;
  profileError: string;
  inventoryRefreshToken: number;
  connectPlayer: (username: string) => Promise<PlayerAccount | null>;
  clearPlayer: () => void;
  refreshPlayer: () => Promise<PlayerAccount | null>;
  linkCurrentPlayerToSecureSession: () => Promise<{
    status: "success" | "warning" | "error";
    message: string;
  }>;
  setPlayerGold: (nextGold: number) => Promise<PlayerAccount | null>;
  notifyInventoryChanged: () => void;
  setProfileError: (message: string) => void;
};

const PlayerSessionContext = createContext<PlayerSessionContextValue | null>(null);

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerAccount | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSecureSessionReady, setIsSecureSessionReady] = useState(false);
  const [secureAuthUserId, setSecureAuthUserId] = useState<string | null>(null);
  const [secureSessionError, setSecureSessionError] = useState("");
  const [isPlayerSecureLinked, setIsPlayerSecureLinked] = useState(false);
  const [isLinkingSecureAccount, setIsLinkingSecureAccount] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [inventoryRefreshToken, setInventoryRefreshToken] = useState(0);

  const clearPlayer = useCallback(() => {
    setPlayer(null);
    setProfileError("");
    setInventoryRefreshToken(0);
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
  }, []);

  const notifyInventoryChanged = useCallback(() => {
    setInventoryRefreshToken((current) => current + 1);
  }, []);

  const connectPlayer = useCallback(
    async (username: string) => {
      const normalizedUsername = username.trim();

      if (!normalizedUsername) {
        setProfileError("Escribe tu nombre de jugador para conectar el perfil.");
        return null;
      }

      setIsSubmittingProfile(true);
      setProfileError("");

      const foundPlayer = await fetchPlayerByUsername(normalizedUsername);

      setIsSubmittingProfile(false);

      if (!foundPlayer) {
        setProfileError(
          "Jugador no encontrado. Verifica el nombre exacto registrado en la base de datos."
        );
        return null;
      }

      setPlayer(foundPlayer);
      window.localStorage.setItem(PLAYER_STORAGE_KEY, foundPlayer.username);
      return foundPlayer;
    },
    []
  );

  const linkCurrentPlayerToSecureSession = useCallback(async () => {
    if (!player) {
      return {
        status: "error" as const,
        message: "Conecta primero un jugador antes de vincular la cuenta segura.",
      };
    }

    if (!secureAuthUserId) {
      return {
        status: "error" as const,
        message:
          secureSessionError ||
          "La sesion segura de Supabase aun no esta disponible en este navegador.",
      };
    }

    setIsLinkingSecureAccount(true);
    const result = await linkPlayerToAuthUser(player.id, secureAuthUserId);
    setIsLinkingSecureAccount(false);

    if (result.status === "linked") {
      const refreshed = await fetchPlayerByUsername(player.username);
      if (refreshed) {
        setPlayer(refreshed);
      }
      setIsPlayerSecureLinked(true);
      return {
        status: "success" as const,
        message: result.message,
      };
    }

    return {
      status:
        result.status === "claimed" || result.status === "unavailable"
          ? ("warning" as const)
          : ("error" as const),
      message: result.message,
    };
  }, [player, secureAuthUserId, secureSessionError]);

  const refreshPlayer = useCallback(async () => {
    if (!player) {
      return null;
    }

    const freshPlayer = await fetchPlayerByUsername(player.username);

    if (!freshPlayer) {
      clearPlayer();
      setProfileError(
        "No se pudo refrescar tu perfil. Vuelve a conectarlo para seguir jugando."
      );
      return null;
    }

    setPlayer(freshPlayer);
    return freshPlayer;
  }, [clearPlayer, player]);

  const setPlayerGold = useCallback(
    async (nextGold: number) => {
      if (!player) {
        return null;
      }

      const safeGold = Math.max(0, nextGold);
      const updated = await updatePlayerGold(player.id, safeGold);

      if (!updated) {
        setProfileError(
          "No se pudo actualizar el oro del jugador. Intenta refrescar el perfil."
        );
        return null;
      }

      const nextPlayer = { ...player, gold: safeGold };
      setPlayer(nextPlayer);
      return nextPlayer;
    },
    [player]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSecureSession() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setSecureSessionError(
          `No se pudo revisar la sesion segura de Supabase en este navegador. ${sessionError.message ?? ""}`.trim()
        );
        setIsSecureSessionReady(true);
        return;
      }

      if (session?.user?.id) {
        setSecureAuthUserId(session.user.id);
        setSecureSessionError("");
        setIsSecureSessionReady(true);
        return;
      }

      const { data, error } = await supabase.auth.signInAnonymously();

      if (!isMounted) {
        return;
      }

      if (error || !data.user?.id) {
        setSecureAuthUserId(null);
        setSecureSessionError(
          [
            "No se pudo iniciar la sesion segura necesaria para las acciones protegidas del staff.",
            error?.message ?? "",
            "Activa Anonymous sign-ins en Supabase Auth > Providers para habilitar la vinculacion segura desde la web.",
          ]
            .filter(Boolean)
            .join(" ")
        );
        setIsSecureSessionReady(true);
        return;
      }

      setSecureAuthUserId(data.user.id);
      setSecureSessionError("");
      setIsSecureSessionReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setSecureAuthUserId(session?.user?.id ?? null);
      setSecureSessionError(
        session?.user?.id
          ? ""
          : "La sesion segura de Supabase se desconecto en este navegador."
      );
      setIsSecureSessionReady(true);
    });

    void bootstrapSecureSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateStoredPlayer() {
      const storedUsername = window.localStorage.getItem(PLAYER_STORAGE_KEY)?.trim();

      if (!storedUsername) {
        setIsHydrating(false);
        return;
      }

      const storedPlayer = await fetchPlayerByUsername(storedUsername);

      if (isCancelled) {
        return;
      }

      if (storedPlayer) {
        setPlayer(storedPlayer);
        setIsHydrating(false);
        return;
      }

      setIsHydrating(false);
    }

    hydrateStoredPlayer();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveSecureLinkState() {
      if (!player || !secureAuthUserId) {
        setIsPlayerSecureLinked(false);
        return;
      }

      const linked = await isPlayerLinkedToAuthUser(player.id, secureAuthUserId);

      if (!cancelled) {
        setIsPlayerSecureLinked(linked);
      }
    }

    void resolveSecureLinkState();

    return () => {
      cancelled = true;
    };
  }, [player, secureAuthUserId]);

  useEffect(() => {
    if (!player) {
      return;
    }

    const handleFocus = () => {
      void refreshPlayer();
    };

    const intervalId = window.setInterval(() => {
      void refreshPlayer();
    }, 10000);

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(intervalId);
    };
  }, [player, refreshPlayer]);

  const value = useMemo(
    () => ({
      player,
      isAdmin: Boolean(player?.isAdmin),
      isHydrating,
      isSecureSessionReady,
      secureAuthUserId,
      secureSessionError,
      isPlayerSecureLinked,
      isLinkingSecureAccount,
      isSubmittingProfile,
      profileError,
      inventoryRefreshToken,
      connectPlayer,
      clearPlayer,
      refreshPlayer,
      linkCurrentPlayerToSecureSession,
      setPlayerGold,
      notifyInventoryChanged,
      setProfileError,
    }),
    [
      clearPlayer,
      connectPlayer,
      inventoryRefreshToken,
      isHydrating,
      isLinkingSecureAccount,
      isPlayerSecureLinked,
      isSecureSessionReady,
      player,
      isSubmittingProfile,
      notifyInventoryChanged,
      profileError,
      refreshPlayer,
      linkCurrentPlayerToSecureSession,
      secureAuthUserId,
      secureSessionError,
      setPlayerGold,
    ]
  );

  return (
    <PlayerSessionContext.Provider value={value}>
      {children}
    </PlayerSessionContext.Provider>
  );
}

export function usePlayerSession() {
  const context = useContext(PlayerSessionContext);

  if (!context) {
    throw new Error("usePlayerSession debe usarse dentro de PlayerSessionProvider");
  }

  return context;
}
