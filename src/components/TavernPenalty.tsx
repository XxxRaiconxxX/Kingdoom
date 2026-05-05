import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Crosshair, RefreshCw, Shield, Trophy, Zap } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import keeperSprites from "../assets/penalty-keeper-sprites.png";
import {
  addPlayerDailyPenaltyNetWins,
  buildScratchDateKey,
  getPlayerDailyPenaltyNetWins,
  MAX_DAILY_PENALTY_WIN_LIMIT,
} from "../utils/scratchUtils";
import type { ReactNode } from "react";

type DirectionId =
  | "left_low"
  | "left_mid"
  | "left_high"
  | "center_high"
  | "right_low"
  | "right_mid"
  | "right_high";

type Phase = "betting" | "aiming" | "charging" | "resolved";
type Result = "goal" | "save" | "post" | null;
type KeeperPose = "idle" | "leftLow" | "leftMid" | "leftHigh" | "centerHigh" | "rightLow" | "rightMid" | "rightHigh";

type Direction = {
  id: DirectionId;
  label: string;
  x: number;
  y: number;
  keeperX: number;
  keeperY: number;
};

type ShotState = {
  shot: DirectionId | null;
  keeper: DirectionId | null;
  result: Result;
  startedAt: number;
  keeperDelay: number;
};

type SpriteRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dw: number;
  dh: number;
};

const WIDTH = 720;
const HEIGHT = 420;
const CONTACT_MS = 800;
const BALL_MS = 820;
const RESULT_MS = 900;
const ROUND_MULTIPLIERS = [2, 4, 8, 12] as const;
const MAX_ROUNDS = ROUND_MULTIPLIERS.length;

const DIRECTIONS: Direction[] = [
  { id: "left_low", label: "Izq. baja", x: 210, y: 254, keeperX: 238, keeperY: 244 },
  { id: "left_mid", label: "Izq. media", x: 206, y: 190, keeperX: 232, keeperY: 190 },
  { id: "left_high", label: "Izq. alta", x: 212, y: 122, keeperX: 236, keeperY: 136 },
  { id: "center_high", label: "Centro alto", x: 360, y: 112, keeperX: 360, keeperY: 134 },
  { id: "right_low", label: "Der. baja", x: 510, y: 254, keeperX: 482, keeperY: 244 },
  { id: "right_mid", label: "Der. media", x: 514, y: 190, keeperX: 488, keeperY: 190 },
  { id: "right_high", label: "Der. alta", x: 508, y: 122, keeperX: 484, keeperY: 136 },
];

const DEFAULT_SHOT: ShotState = {
  shot: null,
  keeper: null,
  result: null,
  startedAt: 0,
  keeperDelay: 70,
};

function getDirection(id: DirectionId | null) {
  return DIRECTIONS.find((direction) => direction.id === id) ?? DIRECTIONS[3];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function chooseKeeperDirection(shot: DirectionId): DirectionId {
  const canReadShot = Math.random() < 0.28;

  if (canReadShot) {
    return shot;
  }

  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)].id;
}

function resolvePenalty(shot: DirectionId, keeper: DirectionId): Result {
  const pressureMiss = Math.random() < 0.08;

  if (pressureMiss) {
    return "post";
  }

  return shot === keeper ? "save" : "goal";
}

const KEEPER_SPRITES: Record<KeeperPose, SpriteRect> = {
  idle: { sx: 8, sy: 0, sw: 120, sh: 210, dw: 80, dh: 140 },
  leftHigh: { sx: 136, sy: 0, sw: 250, sh: 190, dw: 168, dh: 128 },
  leftMid: { sx: 394, sy: 0, sw: 250, sh: 188, dw: 168, dh: 126 },
  leftLow: { sx: 652, sy: 0, sw: 264, sh: 86, dw: 178, dh: 58 },
  centerHigh: { sx: 924, sy: 0, sw: 108, sh: 208, dw: 78, dh: 150 },
  rightLow: { sx: 1040, sy: 0, sw: 270, sh: 86, dw: 182, dh: 58 },
  rightMid: { sx: 1318, sy: 0, sw: 248, sh: 180, dw: 168, dh: 122 },
  rightHigh: { sx: 1574, sy: 0, sw: 244, sh: 184, dw: 166, dh: 126 },
};

function getRoundMultiplier(roundIndex: number) {
  return ROUND_MULTIPLIERS[clamp(roundIndex, 0, ROUND_MULTIPLIERS.length - 1)];
}

function drawPixelPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: { shirt: string; accent: string; lean?: number; kick?: number; scale?: number }
) {
  const scale = options.scale ?? 1;
  const lean = options.lean ?? 0;
  const kick = options.kick ?? 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(lean);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-20, 46, 40, 8);
  ctx.fillStyle = "#2b160c";
  ctx.fillRect(-9, -50, 18, 16);
  ctx.fillStyle = "#f59f69";
  ctx.fillRect(-14, -36, 28, 28);
  ctx.fillStyle = "#111827";
  ctx.fillRect(-9, -28, 5, 5);
  ctx.fillRect(4, -28, 5, 5);
  ctx.fillRect(-5, -17, 10, 3);
  ctx.fillStyle = options.shirt;
  ctx.fillRect(-18, -8, 36, 42);
  ctx.fillStyle = "#111";
  ctx.fillRect(-16, 34, 12, 32);
  ctx.fillRect(4, 34, 12, 32);
  ctx.fillStyle = options.accent;
  ctx.fillRect(-17, 54, 14, 6);
  ctx.fillRect(3, 54, 14, 6);
  ctx.fillStyle = "#050505";
  ctx.fillRect(-20, 64, 18, 6);
  ctx.fillRect(2 + kick * 18, 64 - kick * 12, 23, 6);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-27, 2, 10, 18);
  ctx.fillRect(17, 2, 10, 18);
  ctx.restore();
}

function getKeeperPose(direction: DirectionId | null): KeeperPose {
  switch (direction) {
    case "left_low":
      return "leftLow";
    case "left_mid":
      return "leftMid";
    case "left_high":
      return "leftHigh";
    case "center_high":
      return "centerHigh";
    case "right_low":
      return "rightLow";
    case "right_mid":
      return "rightMid";
    case "right_high":
      return "rightHigh";
    default:
      return "idle";
  }
}

function drawKeeperSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  pose: KeeperPose,
  x: number,
  y: number,
  alpha = 1
) {
  const sprite = KEEPER_SPRITES[pose];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(
      image,
      sprite.sx,
      sprite.sy,
      sprite.sw,
      sprite.sh,
      x - sprite.dw / 2,
      y - sprite.dh / 2,
      sprite.dw,
      sprite.dh
    );
  } else {
    drawPixelPlayer(ctx, x, y + 38, {
      shirt: "#21c33b",
      accent: "#2563eb",
      scale: 0.88,
    });
  }

  ctx.restore();
}

function drawKeeper(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  direction: DirectionId | null,
  progress: number
) {
  const target = getDirection(direction);
  const idleX = 360;
  const idleY = 186;
  const x = idleX + (target.keeperX - idleX) * progress;
  const y = idleY + (target.keeperY - idleY) * progress;
  const stretch = direction === "center_high" ? -36 * progress : 0;
  const pose = progress > 0.18 ? getKeeperPose(direction) : "idle";

  drawKeeperSprite(ctx, image, pose, x, y + stretch, 0.98);

  if (progress > 0.2) {
    ctx.save();
    ctx.globalAlpha = 0.28 * progress;
    ctx.strokeStyle = "#bef264";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(360, 194);
    ctx.lineTo(x, y + stretch);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, shot: DirectionId | null, elapsed: number, result: Result) {
  const start = { x: 360, y: 348 };
  const target = getDirection(shot);
  const flightProgress = clamp((elapsed - BALL_MS) / 390, 0, 1);
  const eased = easeOutCubic(flightProgress);
  const missOffset = result === "post" ? (target.x < 360 ? -38 : 38) : 0;
  const x = start.x + (target.x + missOffset - start.x) * eased;
  const y = start.y + (target.y - start.y) * eased - Math.sin(eased * Math.PI) * 42;
  const size = 15 - eased * 5;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + size + 7, size, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 4, y - 4, 8, 8);
  ctx.fillRect(x + 5, y + 2, 4, 4);
  ctx.fillRect(x - 8, y + 3, 4, 4);
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  shotState: ShotState,
  phase: Phase,
  now: number,
  keeperImage: HTMLImageElement | null,
  roundIndex: number
) {
  const elapsed = shotState.startedAt ? now - shotState.startedAt : 0;
  const runProgress = phase === "charging" ? clamp(elapsed / CONTACT_MS, 0, 1) : 0;
  const keeperProgress =
    phase === "charging" || phase === "resolved"
      ? clamp((elapsed - CONTACT_MS - shotState.keeperDelay) / 260, 0, 1)
      : 0;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#06140f");
  sky.addColorStop(0.48, "#102619");
  sky.addColorStop(1, "#07110b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let x = 0; x < WIDTH; x += 24) {
    for (let y = 0; y < HEIGHT; y += 24) {
      if ((x + y) % 48 === 0) {
        ctx.fillRect(x, y, 24, 24);
      }
    }
  }

  ctx.fillStyle = "#102d18";
  ctx.fillRect(0, 276, WIDTH, 144);
  ctx.fillStyle = "rgba(250, 204, 21, 0.12)";
  ctx.fillRect(0, 0, WIDTH, 12);
  ctx.fillRect(0, HEIGHT - 12, WIDTH, 12);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 3;
  ctx.strokeRect(160, 72, 400, 214);
  ctx.strokeRect(210, 112, 300, 174);
  ctx.beginPath();
  ctx.moveTo(160, 286);
  ctx.lineTo(560, 286);
  ctx.stroke();
  ctx.strokeStyle = "rgba(250, 204, 21, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(360, 350, 42, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(154, 64, 412, 14);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(154, 64, 412, 9);
  ctx.fillRect(154, 64, 9, 222);
  ctx.fillRect(557, 64, 9, 222);

  DIRECTIONS.forEach((direction, index) => {
    ctx.fillStyle = shotState.shot === direction.id ? "rgba(250, 204, 21, 0.24)" : "rgba(255,255,255,0.05)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.roundRect(direction.x - 42, direction.y - 17, 84, 34, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shotState.shot === direction.id ? "#fde68a" : "rgba(255,255,255,0.28)";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), direction.x, direction.y + 4);
  });

  drawKeeper(ctx, keeperImage, shotState.keeper, keeperProgress);

  const shooterX = 360 - 72 + runProgress * 58;
  const shooterY = 342;
  drawPixelPlayer(ctx, shooterX, shooterY, {
    shirt: "#d99b2b",
    accent: "#facc15",
    lean: -0.08 + runProgress * 0.18,
    kick: elapsed >= CONTACT_MS ? clamp((elapsed - CONTACT_MS) / 180, 0, 1) : 0,
    scale: 0.82,
  });

  if (phase === "charging" || phase === "resolved") {
    drawBall(ctx, shotState.shot, elapsed, shotState.result);
  } else {
    drawBall(ctx, null, BALL_MS, null);
  }

  if (elapsed > CONTACT_MS && elapsed < CONTACT_MS + 130) {
    const flash = 1 - (elapsed - CONTACT_MS) / 130;
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(360, 348, 24 + (1 - flash) * 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(24, 22, 176, 40);
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`RONDA ${Math.min(roundIndex + 1, MAX_ROUNDS)}/${MAX_ROUNDS}`, 38, 46);
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(`x${getRoundMultiplier(roundIndex)}`, 142, 46);
  ctx.restore();
}

export function TavernPenalty() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keeperImageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const timeoutRefs = useRef<number[]>([]);
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<Phase>("betting");
  const [bet, setBet] = useState(100);
  const [roundIndex, setRoundIndex] = useState(0);
  const [lockedBet, setLockedBet] = useState(0);
  const [shotState, setShotState] = useState<ShotState>(DEFAULT_SHOT);
  const [message, setMessage] = useState("Supera 4 penales seguidos para llegar al x12.");
  const [dailyNetWins, setDailyNetWins] = useState(0);
  const [updating, setUpdating] = useState(false);

  const balance = player?.gold ?? 0;
  const dateKey = useMemo(() => buildScratchDateKey(), []);
  const maxAllowedBet = Math.max(1, balance);
  const safeBet = clamp(Math.round(bet || 0), 1, maxAllowedBet);
  const canShoot = Boolean(player && phase === "aiming" && safeBet > 0 && safeBet <= balance && !updating);
  const currentMultiplier = getRoundMultiplier(roundIndex);
  const remainingDailyNet = Math.max(0, MAX_DAILY_PENALTY_WIN_LIMIT - dailyNetWins);
  const limitReached = dailyNetWins >= MAX_DAILY_PENALTY_WIN_LIMIT;
  const activeStake = lockedBet || safeBet;
  const potentialNetWin = activeStake * (currentMultiplier - 1);
  const potentialPrize = activeStake + Math.min(potentialNetWin, remainingDailyNet);
  const completedRoundBonus = phase === "resolved" && shotState.result === "goal" ? 1 : 0;
  const progressPercent = ((roundIndex + completedRoundBonus) / MAX_ROUNDS) * 100;

  useEffect(() => {
    if (!player) {
      setDailyNetWins(0);
      return;
    }

    setDailyNetWins(getPlayerDailyPenaltyNetWins(player.id, dateKey));
  }, [dateKey, player]);

  useEffect(() => {
    const image = new Image();
    image.src = keeperSprites;
    image.onload = () => {
      keeperImageRef.current = image;
    };
    keeperImageRef.current = image;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return undefined;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    const tick = (time: number) => {
      drawScene(ctx, shotState, phase, time, keeperImageRef.current, roundIndex);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [phase, roundIndex, shotState]);

  useEffect(
    () => () => {
      timeoutRefs.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  function queue(callback: () => void, delay: number) {
    const id = window.setTimeout(callback, delay);
    timeoutRefs.current.push(id);
  }

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    if (player) {
      setDailyNetWins(getPlayerDailyPenaltyNetWins(player.id, dateKey));
    }
    setUpdating(false);
  }

  function startAiming() {
    if (!player || safeBet > balance || updating || limitReached) {
      return;
    }

    setBet(safeBet);
    setLockedBet(safeBet);
    setRoundIndex(0);
    setPhase("aiming");
    setShotState(DEFAULT_SHOT);
    setMessage("Ronda 1. Marca una zona del arco.");
  }

  function selectDirection(direction: DirectionId) {
    if (phase !== "aiming") {
      return;
    }

    setShotState((current) => ({ ...current, shot: direction }));
    setMessage(`Zona marcada. Premio actual x${currentMultiplier}.`);
  }

  function shoot() {
    if (!canShoot || !shotState.shot || !player) {
      return;
    }

    timeoutRefs.current.forEach((id) => window.clearTimeout(id));
    timeoutRefs.current = [];
    const shot = shotState.shot;
    const keeper = chooseKeeperDirection(shot);
    const result = resolvePenalty(shot, keeper);
    const keeperDelay = 30 + Math.random() * 120;
    const startedAt = performance.now();

    setPhase("charging");
    setMessage("Carrera...");
    setShotState({
      shot,
      keeper,
      result,
      startedAt,
      keeperDelay,
    });

    queue(() => setMessage("Contacto limpio."), CONTACT_MS);
    queue(() => setMessage("El portero reacciona."), CONTACT_MS + keeperDelay);
    queue(async () => {
      setUpdating(true);
      const stake = lockedBet || safeBet;

      if (result === "goal" && roundIndex < MAX_ROUNDS - 1) {
        setPhase("resolved");
        setMessage(`Gol. Racha x${currentMultiplier}. Siguiente ronda: x${getRoundMultiplier(roundIndex + 1)}.`);
        setUpdating(false);
        return;
      }

      const rawNetWin = result === "goal" ? stake * (currentMultiplier - 1) : 0;
      const cappedNetWin = Math.min(rawNetWin, remainingDailyNet);
      const prize = result === "goal" ? stake + cappedNetWin : 0;
      const freshPlayer = await refreshPlayer();
      const goldBase = freshPlayer?.gold ?? player.gold;
      const nextGold = goldBase - stake + prize;
      const updated = await setPlayerGold(nextGold);

      if (!updated) {
        setMessage("No se pudo actualizar el oro. Refresca tu perfil.");
        setUpdating(false);
        setPhase("resolved");
        return;
      }

      setPhase("resolved");
      if (result === "goal") {
        if (cappedNetWin > 0) {
          const nextDailyWins = addPlayerDailyPenaltyNetWins(player.id, dateKey, cappedNetWin);
          setDailyNetWins(nextDailyWins);
        }
        setMessage(
          cappedNetWin < rawNetWin
            ? `Cobras ${prize.toLocaleString("es-PY")} oro por el limite diario.`
            : `Tanda perfecta. Cobras ${prize.toLocaleString("es-PY")} oro.`
        );
      } else if (result === "post") {
        setMessage("Al poste. Pierdes la apuesta de la tanda.");
      } else {
        setMessage("Atajada. Pierdes la apuesta de la tanda.");
      }
      setUpdating(false);
    }, RESULT_MS);
  }

  function continueRun() {
    if (phase !== "resolved" || shotState.result !== "goal" || roundIndex >= MAX_ROUNDS - 1) {
      return;
    }

    const nextRound = roundIndex + 1;
    setRoundIndex(nextRound);
    setPhase("aiming");
    setShotState(DEFAULT_SHOT);
    setMessage(`Ronda ${nextRound + 1}. Multiplicador x${getRoundMultiplier(nextRound)}.`);
  }

  async function cashOutRun() {
    if (!player || phase !== "resolved" || shotState.result !== "goal" || updating) {
      return;
    }

    setUpdating(true);
    const stake = lockedBet || safeBet;
    const rawNetWin = stake * (currentMultiplier - 1);
    const cappedNetWin = Math.min(rawNetWin, remainingDailyNet);
    const prize = stake + cappedNetWin;
    const freshPlayer = await refreshPlayer();
    const goldBase = freshPlayer?.gold ?? player.gold;
    const updated = await setPlayerGold(goldBase - stake + prize);

    if (!updated) {
      setMessage("No se pudo cobrar. Refresca tu perfil.");
      setUpdating(false);
      return;
    }

    if (cappedNetWin > 0) {
      const nextDailyWins = addPlayerDailyPenaltyNetWins(player.id, dateKey, cappedNetWin);
      setDailyNetWins(nextDailyWins);
    }
    setMessage(
      cappedNetWin < rawNetWin
        ? `Cobro limitado: ${prize.toLocaleString("es-PY")} oro.`
        : `Cobro seguro: ${prize.toLocaleString("es-PY")} oro.`
    );
    setUpdating(false);
    setRoundIndex(MAX_ROUNDS - 1);
  }

  function resetRound() {
    timeoutRefs.current.forEach((id) => window.clearTimeout(id));
    timeoutRefs.current = [];
    setPhase("betting");
    setRoundIndex(0);
    setLockedBet(0);
    setShotState(DEFAULT_SHOT);
    setMessage("Supera 4 penales seguidos para llegar al x12.");
  }

  if (isHydrating) {
    return <PenaltyMessage title="Penal del Reino" description="Recuperando tu perfil del reino..." />;
  }

  if (!player) {
    return <PenaltyMessage title="Penal del Reino" description="Conecta tu perfil para apostar en la tanda." />;
  }

  if (limitReached && phase === "betting") {
    return (
      <PenaltyMessage
        title="Limite diario alcanzado"
        description={`Ya ganaste ${MAX_DAILY_PENALTY_WIN_LIMIT.toLocaleString("es-PY")} de oro neto hoy en Penales. La tanda vuelve manana.`}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-amber-500/20 bg-[#07110b] shadow-2xl shadow-amber-950/20">
      <div className="border-b border-amber-500/15 bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.22),transparent_30%),linear-gradient(120deg,#0d1710,#11130d_50%,#1a0707)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
              Penalty arcade
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-50 sm:text-3xl">
              Tanda x12
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-stone-300">
            <StatusChip label="Oro" value={balance.toLocaleString("es-PY")} />
            <StatusChip label="Ronda" value={`${roundIndex + 1}/${MAX_ROUNDS}`} />
            <StatusChip label="Premio" value={`${potentialPrize.toLocaleString("es-PY")}`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-3">
          <div className="rounded-[1.4rem] border border-amber-500/20 bg-stone-950/70 p-3">
            <div className="grid grid-cols-4 gap-2">
              {ROUND_MULTIPLIERS.map((multiplier, index) => {
                const active = index === roundIndex;
                const done = index < roundIndex || (phase === "resolved" && shotState.result === "goal" && index <= roundIndex);

                return (
                  <div
                    key={multiplier}
                    className={`rounded-2xl border px-2 py-2 text-center text-xs font-black transition ${
                      done
                        ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                        : active
                          ? "border-amber-300/45 bg-amber-500/15 text-amber-100"
                          : "border-stone-800 bg-black/35 text-stone-500"
                    }`}
                  >
                    x{multiplier}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-300 transition-all duration-500"
                style={{ width: `${clamp(progressPercent, 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-amber-500/20 bg-black/55 p-2">
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              className="block aspect-[12/7] w-full rounded-[1.15rem] bg-black"
            />
            {phase === "aiming" ? (
              <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-1 p-[12%_20%_27%]">
                <AimButton label="Alta izq." onClick={() => selectDirection("left_high")} active={shotState.shot === "left_high"} />
                <AimButton label="Centro" onClick={() => selectDirection("center_high")} active={shotState.shot === "center_high"} />
                <AimButton label="Alta der." onClick={() => selectDirection("right_high")} active={shotState.shot === "right_high"} />
                <AimButton label="Media izq." onClick={() => selectDirection("left_mid")} active={shotState.shot === "left_mid"} />
                <span />
                <AimButton label="Media der." onClick={() => selectDirection("right_mid")} active={shotState.shot === "right_mid"} />
                <AimButton label="Baja izq." onClick={() => selectDirection("left_low")} active={shotState.shot === "left_low"} />
                <span />
                <AimButton label="Baja der." onClick={() => selectDirection("right_low")} active={shotState.shot === "right_low"} />
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              Estado
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">{message}</p>
          </div>
        </div>

        <aside className="space-y-3">
          <Panel title="Apuesta" icon={<Coins className="h-4 w-4" />}>
            <div className="mb-3 rounded-2xl border border-amber-500/15 bg-black/35 px-3 py-2">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">
                <span>Ganancia diaria</span>
                <span className="text-amber-300">
                  {dailyNetWins.toLocaleString("es-PY")} / {MAX_DAILY_PENALTY_WIN_LIMIT.toLocaleString("es-PY")}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-900">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${clamp((dailyNetWins / MAX_DAILY_PENALTY_WIN_LIMIT) * 100, 0, 100)}%` }}
                />
              </div>
            </div>
            <input
              type="number"
              min={1}
              max={maxAllowedBet}
              value={bet}
              onChange={(event) => setBet(Number(event.target.value))}
              disabled={phase !== "betting"}
              className="w-full rounded-2xl border border-stone-700 bg-black px-4 py-3 text-lg font-black text-stone-100 outline-none transition focus:border-amber-400/60 disabled:opacity-60"
            />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBet(amount)}
                  disabled={phase !== "betting" || amount > balance}
                  className="kd-touch rounded-xl border border-stone-800 bg-stone-950 px-2 py-2 text-xs font-black text-stone-300 disabled:opacity-40"
                >
                  {amount}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Control" icon={<Crosshair className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-2">
              {phase === "betting" ? (
                <button
                  type="button"
                  onClick={startAiming}
                  disabled={safeBet > balance || updating}
                  className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
                >
                  <Zap className="h-4 w-4" />
                  Preparar tiro
                </button>
              ) : null}
              {phase === "aiming" ? (
                <button
                  type="button"
                  onClick={shoot}
                  disabled={!canShoot || !shotState.shot}
                  className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
                >
                  <Trophy className="h-4 w-4" />
                  Disparar
                </button>
              ) : null}
              {phase === "resolved" && shotState.result === "goal" && roundIndex < MAX_ROUNDS - 1 ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={continueRun}
                    className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-3 py-3 text-sm font-black text-black transition active:scale-[0.98]"
                  >
                    Seguir
                  </button>
                  <button
                    type="button"
                    onClick={() => void cashOutRun()}
                    disabled={updating}
                    className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-3 py-3 text-sm font-black text-amber-100 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    Cobrar
                  </button>
                </div>
              ) : null}
              {phase === "resolved" ? (
                <button
                  type="button"
                  onClick={resetRound}
                  className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black transition active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Otro penal
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={updating}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm font-black text-stone-200 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />
                Refrescar oro
              </button>
            </div>
          </Panel>

        </aside>
      </div>
    </div>
  );
}

function AimButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-2xl border text-[0px] transition active:scale-95 ${
        active
          ? "border-amber-200 bg-amber-300/30 shadow-[0_0_24px_rgba(250,204,21,0.28)]"
          : "border-white/10 bg-white/[0.03] hover:border-amber-300/50 hover:bg-amber-300/10"
      }`}
    />
  );
}

function StatusChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-black/35 px-3 py-2">
      <span className="block text-[9px] text-stone-500">{label}</span>
      <span className="mt-1 block text-sm text-amber-200">{value}</span>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/60 p-3">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function PenaltyMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-950/70 p-6 text-center">
      <p className="text-lg font-black text-stone-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}
