import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Flag, RefreshCw, Shuffle } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  addPlayerDailyHorseRaceNetWins,
  buildScratchDateKey,
  getPlayerDailyHorseRaceNetWins,
  MAX_DAILY_HORSE_RACE_WIN_LIMIT,
} from "../utils/scratchUtils";
import {
  createHorseField,
  getFrameAt,
  simulateHorseRace,
  type HorseProfile,
  type HorseRaceFrame,
  type HorseRaceResult,
} from "../utils/horseRaceUtils";

type RacePhase = "betting" | "running" | "finished";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const BET_PRESETS = [500, 2500, 10000];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatGold(value: number) {
  return value.toLocaleString("es-PY");
}

function drawRaceTrack(
  ctx: CanvasRenderingContext2D,
  horses: HorseProfile[],
  frame: HorseRaceFrame | null,
  selectedHorseId: string | null,
  winnerId: string | null,
  elapsedMs: number
) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = false;

  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  sky.addColorStop(0, "#10332c");
  sky.addColorStop(0.34, "#164e38");
  sky.addColorStop(0.35, "#8b6a3f");
  sky.addColorStop(1, "#5f4328");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawBackground(ctx, elapsedMs);

  const trackTop = 130;
  const laneHeight = 52;
  const trackLeft = 30;
  const trackRight = CANVAS_WIDTH - 58;
  const finishX = trackRight;
  const winningHorse = winnerId ? horses.find((horse) => horse.id === winnerId) ?? null : null;

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, trackTop - 8, CANVAS_WIDTH, laneHeight * horses.length + 24);

  horses.forEach((horse, index) => {
    const y = trackTop + index * laneHeight;
    const laneTint = index % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
    ctx.fillStyle = laneTint;
    ctx.fillRect(28, y, CANVAS_WIDTH - 56, laneHeight - 4);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, y + laneHeight - 4);
    ctx.lineTo(CANVAS_WIDTH - 30, y + laneHeight - 4);
    ctx.stroke();

    const progress = frame?.positions[horse.id] ?? 0;
    const speedBob = Math.sin(elapsedMs / 80 + index * 1.7) * 4;
    const x = trackLeft + progress * (trackRight - trackLeft);
    const selected = selectedHorseId === horse.id;
    const winner = winnerId === horse.id;

    if (selected) {
      ctx.fillStyle = "rgba(34,211,238,0.15)";
      ctx.fillRect(28, y, CANVAS_WIDTH - 56, laneHeight - 4);
    }

    drawPixelHorse(ctx, x, y + 33 + speedBob, horse, selected, winner, elapsedMs);
    drawNumberBadge(ctx, 40, y + 15, horse.number, horse.accent);
  });

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(finishX, trackTop - 16);
  ctx.lineTo(finishX, trackTop + laneHeight * horses.length + 16);
  ctx.stroke();
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(finishX + 8, trackTop - 16);
  ctx.lineTo(finishX + 8, trackTop + laneHeight * horses.length + 16);
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.font = "900 18px serif";
  ctx.textAlign = "left";
  ctx.fillText("HIPODROMO DEL REINO", 42, 48);
  ctx.font = "700 11px sans-serif";
  ctx.fillStyle = "rgba(226,232,240,0.75)";
  ctx.fillText("Offline hoy - preparado para salas compartidas", 44, 68);

  if (winningHorse) {
    ctx.fillStyle = "rgba(12,10,9,0.84)";
    ctx.fillRect(600, 30, 246, 62);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.strokeRect(600, 30, 246, 62);
    ctx.fillStyle = "#facc15";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("FOTO DE LLEGADA", 616, 52);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "900 18px serif";
    ctx.fillText(`#${winningHorse.number} ${winningHorse.name}`, 616, 76);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, elapsedMs: number) {
  const drift = (elapsedMs / 28) % 220;

  ctx.fillStyle = "#2dd4bf";
  ctx.fillRect(0, 0, CANVAS_WIDTH, 94);
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.moveTo(0, 94);
  for (let x = 0; x <= CANVAS_WIDTH; x += 80) {
    ctx.quadraticCurveTo(x + 40, 54 + Math.sin((x + drift) / 80) * 14, x + 80, 92);
  }
  ctx.lineTo(CANVAS_WIDTH, 128);
  ctx.lineTo(0, 128);
  ctx.closePath();
  ctx.fill();

  for (let x = -220; x < CANVAS_WIDTH + 220; x += 220) {
    const px = x - drift;
    ctx.fillStyle = "#14532d";
    ctx.fillRect(px + 35, 80, 14, 42);
    ctx.fillStyle = "#84cc16";
    ctx.fillRect(px + 12, 56, 60, 30);
    ctx.fillRect(px + 24, 40, 38, 22);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(px + 78, 94, 46, 10);
  }

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let x = -220; x < CANVAS_WIDTH + 260; x += 110) {
    const railX = x - drift * 1.8;
    ctx.fillRect(railX, 118, 70, 4);
    ctx.fillRect(railX + 6, 100, 5, 34);
    ctx.fillRect(railX + 64, 100, 5, 34);
  }

  for (let x = -180; x < CANVAS_WIDTH + 220; x += 95) {
    const px = x - drift * 2.3;
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(px, 426, 42, 22);
    ctx.fillStyle = "#84cc16";
    ctx.fillRect(px + 8, 408, 30, 22);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(px + 12, 420, 24, 8);
  }

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillRect(0, 119, CANVAS_WIDTH, 5);
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0, 124, CANVAS_WIDTH, 14);
}

function drawPixelHorse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  horse: HorseProfile,
  selected: boolean,
  winner: boolean,
  elapsedMs: number
) {
  const leg = Math.sin(elapsedMs / 70 + horse.number) > 0 ? 1 : -1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.15, 1.15);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(-34, 16, 78, 7);

  ctx.fillStyle = horse.coat;
  ctx.fillRect(-30, -12, 60, 24);
  ctx.fillRect(18, -28, 28, 24);
  ctx.fillRect(38, -22, 12, 12);
  ctx.fillStyle = "#111827";
  ctx.fillRect(45, -18, 4, 4);
  ctx.fillStyle = horse.accent;
  ctx.fillRect(-18, -18, 24, 10);
  ctx.fillStyle = horse.rider;
  ctx.fillRect(-9, -36, 18, 18);
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(-6, -47, 12, 12);
  ctx.fillStyle = "#111827";
  ctx.fillRect(-28, 10, 8, 22 + leg * 3);
  ctx.fillRect(-10, 10, 8, 22 - leg * 3);
  ctx.fillRect(14, 10, 8, 22 - leg * 3);
  ctx.fillRect(28, 10, 8, 22 + leg * 3);
  ctx.fillStyle = horse.accent;
  ctx.fillRect(-44, -9, 16, 8);

  if (selected || winner) {
    ctx.strokeStyle = winner ? "#facc15" : "#22d3ee";
    ctx.lineWidth = 3;
    ctx.strokeRect(-36, -42, 92, 76);
  }

  ctx.restore();
}

function drawNumberBadge(ctx: CanvasRenderingContext2D, x: number, y: number, number: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 16, y - 14, 32, 28);
  ctx.strokeStyle = "rgba(0,0,0,0.65)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 16, y - 14, 32, 28);
  ctx.fillStyle = "#111827";
  ctx.font = "900 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(number), x, y + 7);
}

export function TavernHorseRace() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const raceRef = useRef<HorseRaceResult | null>(null);
  const startTimeRef = useRef(0);
  const dateKey = useMemo(() => buildScratchDateKey(), []);

  const [horses, setHorses] = useState(() => createHorseField());
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [phase, setPhase] = useState<RacePhase>("betting");
  const [bet, setBet] = useState(2500);
  const [dailyNetWins, setDailyNetWins] = useState(0);
  const [lastResult, setLastResult] = useState<HorseRaceResult | null>(null);
  const [message, setMessage] = useState("Elige caballo, ajusta apuesta y abre las puertas.");
  const [updating, setUpdating] = useState(false);

  const balance = player?.gold ?? 0;
  const selectedHorse = horses.find((horse) => horse.id === selectedHorseId) ?? null;
  const safeBet = clamp(Math.floor(Number.isFinite(bet) ? bet : 0), 1, Math.max(1, balance));
  const remainingDailyNet = Math.max(0, MAX_DAILY_HORSE_RACE_WIN_LIMIT - dailyNetWins);
  const limitReached = dailyNetWins >= MAX_DAILY_HORSE_RACE_WIN_LIMIT;
  const canRace = Boolean(player && selectedHorse && phase !== "running" && !updating && !limitReached && safeBet <= balance);

  useEffect(() => {
    if (!selectedHorseId && horses[0]) {
      setSelectedHorseId(horses[0].id);
    }
  }, [horses, selectedHorseId]);

  useEffect(() => {
    if (!player) {
      setDailyNetWins(0);
      return;
    }

    setDailyNetWins(getPlayerDailyHorseRaceNetWins(player.id, dateKey));
  }, [dateKey, player]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const frame = lastResult ? getFrameAt(lastResult, lastResult.finishTimeMs) : null;
    drawRaceTrack(ctx, horses, frame, selectedHorseId, lastResult?.winnerId ?? null, 0);
  }, [horses, lastResult, selectedHorseId]);

  useEffect(
    () => () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    },
    []
  );

  function handleBetInput(value: string) {
    const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
    setBet(Number.isFinite(parsed) ? parsed : 0);
  }

  async function refreshState() {
    setUpdating(true);
    const fresh = await refreshPlayer();
    if (fresh) {
      setDailyNetWins(getPlayerDailyHorseRaceNetWins(fresh.id, dateKey));
    }
    setUpdating(false);
  }

  function generateNewRace() {
    if (phase === "running") return;
    const nextHorses = createHorseField();
    setHorses(nextHorses);
    setSelectedHorseId(nextHorses[0]?.id ?? null);
    setLastResult(null);
    setMessage("Nuevo cartel generado. Las cuotas cambiaron.");
  }

  const finishRace = useCallback(
    async (result: HorseRaceResult, stake: number, selectedId: string) => {
      if (!player) return;

      const winner = result.horses.find((horse) => horse.id === result.winnerId) ?? result.horses[0];
      const selected = result.horses.find((horse) => horse.id === selectedId) ?? null;
      const won = result.winnerId === selectedId && selected;
      const rawPrize = won ? Math.floor(stake * selected.odds) : 0;
      const rawNet = rawPrize - stake;
      const cappedNet = rawNet > 0 ? Math.min(rawNet, remainingDailyNet) : rawNet;
      const finalPrize = rawNet > 0 ? stake + cappedNet : 0;

      const freshPlayer = await refreshPlayer();
      const goldBase = freshPlayer?.gold ?? Math.max(0, player.gold - stake);
      const updated = finalPrize > 0 ? await setPlayerGold(goldBase + finalPrize) : freshPlayer;

      if (cappedNet > 0) {
        setDailyNetWins(addPlayerDailyHorseRaceNetWins(player.id, dateKey, cappedNet));
      }

      setPhase("finished");
      setLastResult(result);
      setUpdating(false);

      if (!updated) {
        setMessage("La carrera termino, pero no se pudo actualizar el oro.");
        return;
      }

      if (won) {
        setMessage(
          rawNet > cappedNet
            ? `${winner.name} gano. Tope diario aplicado: cobras ${formatGold(finalPrize)} oro.`
            : `${winner.name} gano. Cobras ${formatGold(finalPrize)} oro.`
        );
        return;
      }

      setMessage(`${winner.name} cruzo primero. Pierdes ${formatGold(stake)} oro.`);
    },
    [dateKey, player, refreshPlayer, remainingDailyNet, setPlayerGold]
  );

  async function startRace() {
    if (!player || !selectedHorse || !canRace) return;

    setUpdating(true);
    setMessage("Cerrando apuestas...");
    const freshPlayer = await refreshPlayer();
    const currentGold = freshPlayer?.gold ?? player.gold;
    const stake = clamp(safeBet, 1, currentGold);

    if (stake > currentGold) {
      setUpdating(false);
      setMessage("No tienes oro suficiente para esa apuesta.");
      return;
    }

    const debited = await setPlayerGold(currentGold - stake);
    if (!debited) {
      setUpdating(false);
      setMessage("No se pudo descontar la apuesta. Refresca tu perfil.");
      return;
    }

    const result = simulateHorseRace(horses);
    raceRef.current = result;
    startTimeRef.current = performance.now();
    setPhase("running");
    setLastResult(null);
    setMessage("La carrera esta en marcha.");

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      await finishRace(result, stake, selectedHorse.id);
      return;
    }

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const currentRace = raceRef.current;

      if (!currentRace) return;

      const frame = getFrameAt(currentRace, elapsed);
      drawRaceTrack(ctx, currentRace.horses, frame, selectedHorse.id, null, elapsed);

      if (elapsed >= currentRace.durationMs) {
        drawRaceTrack(
          ctx,
          currentRace.horses,
          getFrameAt(currentRace, currentRace.finishTimeMs),
          selectedHorse.id,
          currentRace.winnerId,
          elapsed
        );
        void finishRace(currentRace, stake, selectedHorse.id);
        return;
      }

      animationRef.current = window.requestAnimationFrame(animate);
    };

    animationRef.current = window.requestAnimationFrame(animate);
  }

  if (isHydrating) {
    return <RaceMessage title="Carreras del Reino" description="Recuperando tu perfil antes de abrir apuestas..." />;
  }

  if (!player) {
    return <RaceMessage title="Carreras del Reino" description="Conecta tu perfil para apostar en el hipodromo." />;
  }

  if (limitReached) {
    return (
      <RaceMessage
        title="Hipodromo cerrado"
        description={`Ya ganaste ${formatGold(MAX_DAILY_HORSE_RACE_WIN_LIMIT)} de oro neto hoy en carreras.`}
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-[#07100d] p-4 shadow-[inset_0_0_60px_rgba(0,0,0,0.78)] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(34,197,94,0.16),transparent_32%),radial-gradient(circle_at_92%_12%,rgba(251,191,36,0.18),transparent_30%)]" />

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">Carreras del reino</p>
              <h3 className="mt-1 font-serif text-2xl font-black text-stone-100">Hipodromo Arcano</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <RaceStat label="Oro" value={formatGold(balance)} />
              <RaceStat label="Hoy" value={formatGold(dailyNetWins)} />
              <RaceStat label="Modo" value="Offline" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-lime-400/20 bg-black/45 p-2 shadow-[0_0_38px_rgba(34,197,94,0.08)]">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block aspect-[9/5] h-auto w-full rounded-[1.25rem]"
            />
          </div>

          <div className="mt-3 rounded-2xl border border-stone-800 bg-stone-950/70 p-3 text-sm text-stone-300">
            <span className="font-black text-amber-300">{phase === "running" ? "Narrador: " : "Estado: "}</span>
            {message}
          </div>
        </div>

        <aside className="rounded-[1.6rem] border border-stone-800 bg-stone-950/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Apuestas</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">Cada cartel genera caballos y cuotas nuevas.</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshState()}
              disabled={updating || phase === "running"}
              className="rounded-2xl border border-stone-700 p-2 text-stone-400 transition hover:border-lime-300/40 hover:text-lime-200 disabled:opacity-50"
              title="Refrescar oro"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="mt-4 grid max-h-[21rem] gap-2 overflow-y-auto pr-1">
            {horses.map((horse) => (
              <button
                key={horse.id}
                type="button"
                onClick={() => setSelectedHorseId(horse.id)}
                disabled={phase === "running"}
                className={`rounded-2xl border p-3 text-left transition ${
                  selectedHorseId === horse.id
                    ? "border-lime-300/55 bg-lime-400/10 shadow-[0_0_22px_rgba(132,204,22,0.12)]"
                    : "border-stone-800 bg-black/35 hover:border-amber-400/35"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-sm font-black text-stone-100">
                    #{horse.number} {horse.name}
                  </span>
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-200">
                    x{horse.odds}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">{horse.realm}</p>
              </button>
            ))}
          </div>

          <input
            value={bet || ""}
            onChange={(event) => handleBetInput(event.target.value)}
            disabled={phase === "running"}
            inputMode="numeric"
            className="mt-4 w-full rounded-2xl border border-stone-700 bg-black px-4 py-3 text-lg font-black text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-300/50"
            placeholder="2500"
          />

          <div className="mt-3 grid grid-cols-3 gap-2">
            {BET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBet(preset)}
                disabled={phase === "running"}
                className="rounded-xl border border-stone-800 bg-stone-900 px-2 py-2 text-xs font-black text-stone-300 transition hover:border-amber-400/35 hover:text-amber-200 disabled:opacity-50"
              >
                {formatGold(preset)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void startRace()}
            disabled={!canRace}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-stone-950 shadow-[0_0_28px_rgba(245,158,11,0.2)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500 disabled:shadow-none"
          >
            <Flag className="h-4 w-4" />
            {phase === "running" ? "Corriendo" : "Iniciar carrera"}
          </button>

          <button
            type="button"
            onClick={generateNewRace}
            disabled={phase === "running"}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-700 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-stone-300 transition hover:border-lime-300/40 hover:text-lime-200 disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4" />
            Nuevo cartel
          </button>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
              <span>Ganancia diaria</span>
              <span>{formatGold(remainingDailyNet)} libres</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-400 via-amber-300 to-orange-500"
                style={{ width: `${clamp((dailyNetWins / MAX_DAILY_HORSE_RACE_WIN_LIMIT) * 100, 0, 100)}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RaceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/75 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-black text-stone-100">{value}</p>
    </div>
  );
}

function RaceMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 text-center shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
        <Coins className="h-8 w-8 text-amber-300" />
      </div>
      <h2 className="font-serif text-2xl font-black text-stone-100">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}
