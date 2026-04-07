import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Backpack,
  Coins,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";

const AdminControlSheet = lazy(() =>
  import("./AdminControlSheet").then((module) => ({
    default: module.AdminControlSheet,
  }))
);
const PlayerInventorySheet = lazy(() =>
  import("./PlayerInventorySheet").then((module) => ({
    default: module.PlayerInventorySheet,
  }))
);

export function PlayerProfilePanel() {
  const {
    player,
    isAdmin,
    isHydrating,
    isSubmittingProfile,
    profileError,
    connectPlayer,
    clearPlayer,
    refreshPlayer,
    setProfileError,
  } = usePlayerSession();
  const [usernameInput, setUsernameInput] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const connectedPlayer = await connectPlayer(usernameInput);

    if (connectedPlayer) {
      setUsernameInput("");
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await refreshPlayer();
    setIsRefreshing(false);
  }

  return (
    <section className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-5 shadow-2xl shadow-black/20 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
            Perfil del reino
          </p>
          <h2 className="text-2xl font-black text-stone-100 md:text-3xl">
            Tu sesion de jugador
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-stone-400">
            Conecta una sola vez tu nombre registrado y el mercado junto con la
            taberna usaran ese mismo perfil para leer y descontar tu oro.
          </p>
        </div>

        {player ? (
          <div className="rounded-[1.5rem] border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Perfil activo
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        {isHydrating ? (
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-stone-800 bg-stone-950/45 px-4 py-4 text-sm text-stone-300">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            Restaurando tu sesion guardada...
          </div>
        ) : player ? (
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Jugador conectado
                    </p>
                    <p className="mt-1 text-xl font-black text-stone-100">
                      {player.username}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setIsAdminOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:border-amber-400/35 hover:bg-amber-500/14"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsInventoryOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
                  >
                    <Backpack className="h-3.5 w-3.5" />
                    Inventario
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearPlayer();
                      setUsernameInput(player.username);
                    }}
                    className="rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Oro disponible
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-300">
                      {player.gold}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="rounded-xl border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Actualizar saldo"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4 md:grid-cols-[1fr_auto]"
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">
                Nombre del jugador registrado
              </span>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(event) => {
                  setUsernameInput(event.target.value);
                  if (profileError) {
                    setProfileError("");
                  }
                }}
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                placeholder="Tu nombre exacto en la base de datos"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmittingProfile}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
            >
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  Conectar perfil
                </>
              )}
            </button>

            {profileError ? (
              <div className="md:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {profileError}
              </div>
            ) : null}
          </form>
        )}
      </div>

      <AnimatePresence>
        {isAdminOpen && player && isAdmin ? (
          <Suspense
            fallback={
              <ProfileSheetFallback message="Abriendo el centro de control del reino..." />
            }
          >
            <AdminControlSheet onClose={() => setIsAdminOpen(false)} />
          </Suspense>
        ) : null}
        {isInventoryOpen && player ? (
          <Suspense
            fallback={
              <ProfileSheetFallback message="Abriendo el inventario del jugador..." />
            }
          >
            <PlayerInventorySheet onClose={() => setIsInventoryOpen(false)} />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function ProfileSheetFallback({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6">
      <div className="w-full max-w-sm rounded-[2rem] border border-stone-800 bg-stone-950 px-5 py-6 text-center shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
          Cargando
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </div>
  );
}
