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
  fetchPlayerByAuthUserId,
  fetchPlayerByUsername,
  linkPlayerToAuthUser,
  updatePlayerGold,
} from "../utils/players";
import { useSupabaseAuth } from "./SupabaseAuthContext";

const PLAYER_STORAGE_KEY = "kingdoom.active-player";

type PlayerSessionContextValue = {
  player: PlayerAccount | null;
  isAdmin: boolean;
  isHydrating: boolean;
  isSubmittingProfile: boolean;
  profileError: string;
  inventoryRefreshToken: number;
  connectPlayer: (username: string) => Promise<PlayerAccount | null>;
  clearPlayer: () => void;
  refreshPlayer: () => Promise<PlayerAccount | null>;
  setPlayerGold: (nextGold: number) => Promise<PlayerAccount | null>;
  notifyInventoryChanged: () => void;
  setProfileError: (message: string) => void;
};

const PlayerSessionContext = createContext<PlayerSessionContextValue | null>(null);

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const { authUser, isAuthHydrating } = useSupabaseAuth();
  const [player, setPlayer] = useState<PlayerAccount | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
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

      if (!authUser) {
        setProfileError(
          "Primero inicia sesion en Cuenta segura beta para vincular y proteger tu perfil del reino."
        );
        return null;
      }

      if (!normalizedUsername) {
        setProfileError("Escribe tu nombre de jugador para conectar el perfil.");
        return null;
      }

      setIsSubmittingProfile(true);
      setProfileError("");

      const foundPlayer = await fetchPlayerByUsername(normalizedUsername);

      if (authUser && foundPlayer) {
        const linkedPlayer = await fetchPlayerByAuthUserId(authUser.id);

        if (linkedPlayer && linkedPlayer.id !== foundPlayer.id) {
          setIsSubmittingProfile(false);
          setProfileError(
            `Tu cuenta segura ya esta vinculada a ${linkedPlayer.username}. Usa ese perfil o desvinculalo antes de cambiar.`
          );
          return null;
        }

        if (foundPlayer.authUserId && foundPlayer.authUserId !== authUser.id) {
          setIsSubmittingProfile(false);
          setProfileError(
            `El jugador ${foundPlayer.username} ya esta vinculado a otra cuenta segura.`
          );
          return null;
        }

        if (!foundPlayer.authUserId) {
          const linkResult = await linkPlayerToAuthUser(foundPlayer.id, authUser.id);

          if (linkResult.status === "claimed" || linkResult.status === "error") {
            setIsSubmittingProfile(false);
            setProfileError(linkResult.message);
            return null;
          }

          const refreshedLinkedPlayer = await fetchPlayerByAuthUserId(authUser.id);

          if (refreshedLinkedPlayer) {
            setIsSubmittingProfile(false);
            setPlayer(refreshedLinkedPlayer);
            window.localStorage.setItem(
              PLAYER_STORAGE_KEY,
              refreshedLinkedPlayer.username
            );
            return refreshedLinkedPlayer;
          }
        }
      }

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
    [authUser]
  );

  const refreshPlayer = useCallback(async () => {
    if (!player) {
      return null;
    }

    const freshPlayer = authUser
      ? await fetchPlayerByAuthUserId(authUser.id)
      : await fetchPlayerByUsername(player.username);

    if (!freshPlayer) {
      clearPlayer();
      setProfileError(
        "No se pudo refrescar tu perfil. Vuelve a conectarlo para seguir jugando."
      );
      return null;
    }

    setPlayer(freshPlayer);
    return freshPlayer;
  }, [authUser, clearPlayer, player]);

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
    let isCancelled = false;

    async function hydrateStoredPlayer() {
      if (isAuthHydrating) {
        return;
      }

      if (authUser) {
        const linkedPlayer = await fetchPlayerByAuthUserId(authUser.id);

        if (isCancelled) {
          return;
        }

        if (linkedPlayer) {
          setPlayer(linkedPlayer);
          window.localStorage.setItem(PLAYER_STORAGE_KEY, linkedPlayer.username);
          setIsHydrating(false);
          return;
        }
      }

      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
      setIsHydrating(false);
    }

    hydrateStoredPlayer();

    return () => {
      isCancelled = true;
    };
  }, [authUser, isAuthHydrating]);

  useEffect(() => {
    if (isAuthHydrating) {
      return;
    }

    if (!authUser && player) {
      clearPlayer();
      setIsHydrating(false);
    }
  }, [authUser, clearPlayer, isAuthHydrating, player]);

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
      isSubmittingProfile,
      profileError,
      inventoryRefreshToken,
      connectPlayer,
      clearPlayer,
      refreshPlayer,
      setPlayerGold,
      notifyInventoryChanged,
      setProfileError,
    }),
    [
      clearPlayer,
      connectPlayer,
      inventoryRefreshToken,
      isHydrating,
      player,
      isSubmittingProfile,
      notifyInventoryChanged,
      profileError,
      refreshPlayer,
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
