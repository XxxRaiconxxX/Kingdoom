import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { FilterPill } from "../components/FilterPill";
import { RankingCard } from "../components/RankingCard";
import { SectionHeader } from "../components/SectionHeader";
import {
  fetchWeeklyRanking,
  formatCountdown,
  formatRankingWindow,
} from "../utils/weeklyRanking";
import type { RankingPlayer, RankingWindow } from "../types";

const WeeklyRankingPodium = lazy(() =>
  import("../components/WeeklyRankingPodium").then((module) => ({
    default: module.WeeklyRankingPodium,
  }))
);

export function RankingSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [rankingMessage, setRankingMessage] = useState("");
  const [rankingWindow, setRankingWindow] = useState<RankingWindow | null>(null);
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [factionFilter, setFactionFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadRanking() {
      setIsLoading(true);
      const ranking = await fetchWeeklyRanking();

      if (cancelled) {
        return;
      }

      setPlayers(ranking.players);
      setRankingWindow(ranking.window);
      setRankingMessage(ranking.message);
      setTimeLeft(formatCountdown(ranking.window.weekEndsAt));
      setIsLoading(false);
    }

    void loadRanking();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!rankingWindow) {
      return;
    }

    setTimeLeft(formatCountdown(rankingWindow.weekEndsAt));

    const intervalId = window.setInterval(() => {
      setTimeLeft(formatCountdown(rankingWindow.weekEndsAt));
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [rankingWindow]);

  const factions = useMemo(
    () => Array.from(new Set(players.map((player) => player.faction))),
    [players]
  );

  const filteredPlayers = useMemo(
    () => players.filter((player) => (factionFilter === "all" ? true : player.faction === factionFilter)),
    [factionFilter, players]
  );

  const podiumPlayers = useMemo(() => filteredPlayers.slice(0, 3), [filteredPlayers]);
  const rankingLabel = rankingWindow ? formatRankingWindow(rankingWindow) : "";

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 md:p-7">
        <SectionHeader
          eyebrow="Temporada semanal"
          title="Ranking de actividad"
          description="El podio premia a quienes mas participan en misiones y eventos oficiales durante la semana actual."
          rightSlot={
            <div className="rounded-[1.4rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Cierra en
              </p>
              <p className="mt-1 text-lg font-black text-stone-100">{timeLeft || "--"}</p>
            </div>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
          <span className="rounded-full border border-stone-700 bg-stone-950/55 px-3 py-2">
            {rankingLabel || "Semana actual"}
          </span>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-300">
            Misiones + eventos
          </span>
        </div>
        {rankingMessage ? (
          <p className="mt-4 text-sm leading-6 text-stone-400">{rankingMessage}</p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 text-sm text-stone-400">
          Cargando la temporada semanal...
        </div>
      ) : (
        <>
          <Suspense
            fallback={
              <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 text-sm text-stone-400">
                Preparando el podio semanal...
              </div>
            }
          >
            <WeeklyRankingPodium players={podiumPlayers} />
          </Suspense>

          <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
            <SectionHeader
              eyebrow="Filtro tactico"
              title="Enfocar por faccion"
              description="El ranking se reordena solo para la faccion elegida, sin tocar la tabla general."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterPill
                label="Todas las facciones"
                active={factionFilter === "all"}
                onClick={() => setFactionFilter("all")}
              />
              {factions.map((faction) => (
                <FilterPill
                  key={faction}
                  label={faction}
                  active={factionFilter === faction}
                  onClick={() => setFactionFilter(faction)}
                />
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6"
            style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}
          >
            <SectionHeader
              eyebrow="Tabla completa"
              title="Participacion acumulada"
              description="Cada punto refleja presencia en misiones, eventos y racha de actividad dentro de la semana."
            />
            <div className="mt-5 space-y-4">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <RankingCard key={player.id} player={player} index={index} />
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-stone-700 bg-stone-950/45 p-5 text-sm leading-6 text-stone-400">
                  No hay jugadores cargados para esa faccion en la temporada actual.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
