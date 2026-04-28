import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Crosshair, Gem, Play, RotateCcw, Shield, Skull, Swords } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import type { PointerEvent, ReactNode } from "react";

type DifficultyId = "frontier" | "siege" | "abyss";
type MapId = "northGate" | "emberRoad" | "lostBridge";
type TowerId = "sentinel" | "rune" | "ballista" | "frost";
type Phase = "ready" | "playing" | "between" | "victory" | "defeat";

type Difficulty = {
  id: DifficultyId;
  label: string;
  reward: number;
  startGold: number;
  lives: number;
  hpScale: number;
  speedScale: number;
};

type TowerBlueprint = {
  id: TowerId;
  label: string;
  short: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  color: string;
  accent: string;
  splash?: number;
  slow?: number;
};

type MapDefinition = {
  id: MapId;
  label: string;
  hint: string;
  path: Array<[number, number]>;
};

type EnemyKind = {
  label: string;
  hp: number;
  speed: number;
  reward: number;
  color: string;
  size: number;
};

type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  pathIndex: number;
  slowUntil: number;
};

type Tower = {
  col: number;
  row: number;
  blueprint: TowerBlueprint;
  cooldown: number;
};

type Projectile = {
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
  color: string;
  splash?: number;
  slow?: number;
};

type Runtime = {
  phase: Phase;
  wave: number;
  lives: number;
  buildGold: number;
  score: number;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  spawnLeft: number;
  spawnTimer: number;
  nextEnemyId: number;
  message: string;
  victoryReported: boolean;
};

type Hud = {
  phase: Phase;
  wave: number;
  lives: number;
  buildGold: number;
  score: number;
  enemies: number;
  message: string;
};

const COLS = 18;
const ROWS = 10;
const CELL = 40;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;
const MAX_WAVE = 5;

const DIFFICULTIES: Difficulty[] = [
  {
    id: "frontier",
    label: "Frontera",
    reward: 850,
    startGold: 185,
    lives: 18,
    hpScale: 0.88,
    speedScale: 0.92,
  },
  {
    id: "siege",
    label: "Asedio",
    reward: 1500,
    startGold: 165,
    lives: 14,
    hpScale: 1.08,
    speedScale: 1,
  },
  {
    id: "abyss",
    label: "Abismo",
    reward: 2600,
    startGold: 145,
    lives: 11,
    hpScale: 1.32,
    speedScale: 1.12,
  },
];

const MAPS: MapDefinition[] = [
  {
    id: "northGate",
    label: "Puerta Norte",
    hint: "Ruta larga, ideal para aprender.",
    path: [
      [-1, 5],
      [3, 5],
      [3, 2],
      [8, 2],
      [8, 7],
      [14, 7],
      [14, 4],
      [18, 4],
    ],
  },
  {
    id: "emberRoad",
    label: "Ruta Ignea",
    hint: "Menos curvas, mas presion.",
    path: [
      [-1, 7],
      [4, 7],
      [4, 4],
      [9, 4],
      [9, 1],
      [13, 1],
      [13, 6],
      [18, 6],
    ],
  },
  {
    id: "lostBridge",
    label: "Puente Perdido",
    hint: "Camino central para defensas mixtas.",
    path: [
      [-1, 3],
      [2, 3],
      [2, 6],
      [6, 6],
      [6, 3],
      [11, 3],
      [11, 6],
      [15, 6],
      [15, 2],
      [18, 2],
    ],
  },
];

const TOWERS: TowerBlueprint[] = [
  {
    id: "sentinel",
    label: "Centinela",
    short: "Arco",
    cost: 45,
    range: 112,
    damage: 18,
    fireRate: 0.65,
    color: "#f59e0b",
    accent: "#fff7ad",
  },
  {
    id: "rune",
    label: "Runa",
    short: "Mana",
    cost: 72,
    range: 98,
    damage: 34,
    fireRate: 1.1,
    color: "#22d3ee",
    accent: "#a5f3fc",
    splash: 38,
  },
  {
    id: "ballista",
    label: "Ballesta",
    short: "Crit",
    cost: 96,
    range: 150,
    damage: 55,
    fireRate: 1.65,
    color: "#fb7185",
    accent: "#ffe4e6",
  },
  {
    id: "frost",
    label: "Escarcha",
    short: "Lento",
    cost: 82,
    range: 122,
    damage: 20,
    fireRate: 0.95,
    color: "#93c5fd",
    accent: "#dbeafe",
    slow: 1.35,
  },
];

const ENEMY_KINDS: EnemyKind[] = [
  { label: "Goblin", hp: 58, speed: 45, reward: 9, color: "#84cc16", size: 13 },
  { label: "Sombra", hp: 42, speed: 68, reward: 11, color: "#a855f7", size: 11 },
  { label: "Orco", hp: 118, speed: 34, reward: 16, color: "#ef4444", size: 15 },
  { label: "Troll", hp: 220, speed: 25, reward: 28, color: "#f97316", size: 18 },
];

const STATUS_LABEL: Record<Phase, string> = {
  ready: "Preparando defensa",
  playing: "Oleada activa",
  between: "Refuerza torres",
  victory: "Victoria 5/5",
  defeat: "Base tomada",
};

const DEFAULT_HUD: Hud = {
  phase: "ready",
  wave: 0,
  lives: 0,
  buildGold: 0,
  score: 0,
  enemies: 0,
  message: "Selecciona mapa y dificultad.",
};

function pointToCanvas([col, row]: [number, number]) {
  return {
    x: col * CELL + CELL / 2,
    y: row * CELL + CELL / 2,
  };
}

function buildPathCells(path: Array<[number, number]>) {
  const cells = new Set<string>();

  for (let index = 0; index < path.length - 1; index += 1) {
    const [aCol, aRow] = path[index];
    const [bCol, bRow] = path[index + 1];
    const minCol = Math.max(0, Math.min(aCol, bCol));
    const maxCol = Math.min(COLS - 1, Math.max(aCol, bCol));
    const minRow = Math.max(0, Math.min(aRow, bRow));
    const maxRow = Math.min(ROWS - 1, Math.max(aRow, bRow));

    for (let col = minCol; col <= maxCol; col += 1) {
      for (let row = minRow; row <= maxRow; row += 1) {
        cells.add(`${col}:${row}`);
      }
    }
  }

  return cells;
}

function createRuntime(difficulty: Difficulty): Runtime {
  return {
    phase: "ready",
    wave: 0,
    lives: difficulty.lives,
    buildGold: difficulty.startGold,
    score: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    spawnLeft: 0,
    spawnTimer: 0,
    nextEnemyId: 1,
    message: "Protege la base hasta la oleada 5.",
    victoryReported: false,
  };
}

function snapshot(runtime: Runtime): Hud {
  return {
    phase: runtime.phase,
    wave: runtime.wave,
    lives: runtime.lives,
    buildGold: runtime.buildGold,
    score: runtime.score,
    enemies: runtime.enemies.length,
    message: runtime.message,
  };
}

function distance(aX: number, aY: number, bX: number, bY: number) {
  return Math.hypot(aX - bX, aY - bY);
}

function rewardKey(playerId: string, difficultyId: DifficultyId) {
  const dateKey = new Date().toISOString().slice(0, 10);
  return `kingdoom:tower-defense:${playerId}:${dateKey}:${difficultyId}`;
}

export function TavernTowerDefense() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const lastFrameRef = useRef(0);
  const lastHudRef = useRef(0);
  const difficultyRef = useRef(DIFFICULTIES[0]);
  const mapRef = useRef(MAPS[0]);
  const selectedTowerRef = useRef<TowerBlueprint>(TOWERS[0]);
  const pathCellsRef = useRef(buildPathCells(MAPS[0].path));
  const victoryTokenRef = useRef(0);
  const { player, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [difficultyId, setDifficultyId] = useState<DifficultyId>("frontier");
  const [mapId, setMapId] = useState<MapId>("northGate");
  const [selectedTowerId, setSelectedTowerId] = useState<TowerId>("sentinel");
  const [hud, setHud] = useState<Hud>(DEFAULT_HUD);
  const [notice, setNotice] = useState("");
  const [victoryToken, setVictoryToken] = useState(0);

  const difficulty = useMemo(
    () => DIFFICULTIES.find((item) => item.id === difficultyId) ?? DIFFICULTIES[0],
    [difficultyId]
  );
  const currentMap = useMemo(
    () => MAPS.find((item) => item.id === mapId) ?? MAPS[0],
    [mapId]
  );
  const selectedTower = useMemo(
    () => TOWERS.find((item) => item.id === selectedTowerId) ?? TOWERS[0],
    [selectedTowerId]
  );

  const resetGame = useCallback(() => {
    difficultyRef.current = difficulty;
    mapRef.current = currentMap;
    pathCellsRef.current = buildPathCells(currentMap.path);
    const nextRuntime = createRuntime(difficulty);
    runtimeRef.current = nextRuntime;
    setHud(snapshot(nextRuntime));
    setNotice("");
  }, [currentMap, difficulty]);

  useEffect(() => {
    selectedTowerRef.current = selectedTower;
  }, [selectedTower]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const startWave = useCallback(() => {
    const runtime = runtimeRef.current;

    if (!runtime || (runtime.phase !== "ready" && runtime.phase !== "between")) {
      return;
    }

    runtime.phase = "playing";
    runtime.wave += 1;
    runtime.spawnLeft = 7 + runtime.wave * 3;
    runtime.spawnTimer = 0;
    runtime.message = `Oleada ${runtime.wave}/${MAX_WAVE} en marcha.`;
    setHud(snapshot(runtime));
  }, []);

  const placeTower = useCallback((canvasX: number, canvasY: number) => {
    const runtime = runtimeRef.current;

    if (!runtime || runtime.phase === "victory" || runtime.phase === "defeat") {
      return;
    }

    const col = Math.floor(canvasX / CELL);
    const row = Math.floor(canvasY / CELL);
    const selected = selectedTowerRef.current;

    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) {
      return;
    }

    if (pathCellsRef.current.has(`${col}:${row}`)) {
      runtime.message = "No puedes construir sobre la ruta.";
      setHud(snapshot(runtime));
      return;
    }

    if (runtime.towers.some((tower) => tower.col === col && tower.row === row)) {
      runtime.message = "Ya hay una torre en esa casilla.";
      setHud(snapshot(runtime));
      return;
    }

    if (runtime.buildGold < selected.cost) {
      runtime.message = `Faltan ${selected.cost - runtime.buildGold} recursos.`;
      setHud(snapshot(runtime));
      return;
    }

    runtime.buildGold -= selected.cost;
    runtime.towers.push({ col, row, blueprint: selected, cooldown: 0 });
    runtime.message = `${selected.label} desplegada.`;
    setHud(snapshot(runtime));
  }, []);

  const handleCanvasPointer = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
      placeTower(x, y);
    },
    [placeTower]
  );

  const spawnEnemy = useCallback((runtime: Runtime) => {
    const difficultyValue = difficultyRef.current;
    const pathStart = pointToCanvas(mapRef.current.path[0]);
    const pool = runtime.wave >= 5
      ? ENEMY_KINDS
      : ENEMY_KINDS.slice(0, Math.min(3, 1 + Math.ceil(runtime.wave / 2)));
    const kind = pool[Math.floor(Math.random() * pool.length)];
    const hp = Math.round(kind.hp * difficultyValue.hpScale * (1 + runtime.wave * 0.18));

    runtime.enemies.push({
      id: runtime.nextEnemyId,
      kind,
      x: pathStart.x,
      y: pathStart.y,
      hp,
      maxHp: hp,
      pathIndex: 1,
      slowUntil: 0,
    });
    runtime.nextEnemyId += 1;
  }, []);

  const updateRuntime = useCallback(
    (runtime: Runtime, delta: number, now: number) => {
      if (runtime.phase !== "playing") {
        return;
      }

      runtime.spawnTimer -= delta;
      if (runtime.spawnLeft > 0 && runtime.spawnTimer <= 0) {
        spawnEnemy(runtime);
        runtime.spawnLeft -= 1;
        runtime.spawnTimer = Math.max(0.38, 0.95 - runtime.wave * 0.08);
      }

      const path = mapRef.current.path.map(pointToCanvas);
      const difficultyValue = difficultyRef.current;

      runtime.enemies = runtime.enemies.filter((enemy) => {
        const target = path[enemy.pathIndex];

        if (!target) {
          runtime.lives -= 1;
          return false;
        }

        const slowScale = enemy.slowUntil > now ? 0.52 : 1;
        const step = enemy.kind.speed * difficultyValue.speedScale * slowScale * delta;
        const gap = distance(enemy.x, enemy.y, target.x, target.y);

        if (gap <= step) {
          enemy.x = target.x;
          enemy.y = target.y;
          enemy.pathIndex += 1;
        } else {
          enemy.x += ((target.x - enemy.x) / gap) * step;
          enemy.y += ((target.y - enemy.y) / gap) * step;
        }

        return true;
      });

      runtime.towers.forEach((tower) => {
        tower.cooldown -= delta;

        if (tower.cooldown > 0) {
          return;
        }

        const towerX = tower.col * CELL + CELL / 2;
        const towerY = tower.row * CELL + CELL / 2;
        const target = runtime.enemies
          .filter((enemy) => distance(towerX, towerY, enemy.x, enemy.y) <= tower.blueprint.range)
          .sort((a, b) => b.pathIndex - a.pathIndex)[0];

        if (!target) {
          return;
        }

        runtime.projectiles.push({
          x: towerX,
          y: towerY,
          targetId: target.id,
          damage: tower.blueprint.damage,
          speed: 340,
          color: tower.blueprint.accent,
          splash: tower.blueprint.splash,
          slow: tower.blueprint.slow,
        });
        tower.cooldown = tower.blueprint.fireRate;
      });

      runtime.projectiles = runtime.projectiles.filter((projectile) => {
        const target = runtime.enemies.find((enemy) => enemy.id === projectile.targetId);

        if (!target) {
          return false;
        }

        const gap = distance(projectile.x, projectile.y, target.x, target.y);
        const step = projectile.speed * delta;

        if (gap > step) {
          projectile.x += ((target.x - projectile.x) / gap) * step;
          projectile.y += ((target.y - projectile.y) / gap) * step;
          return true;
        }

        const splash = projectile.splash;
        const hitTargets = splash
          ? runtime.enemies.filter((enemy) => distance(target.x, target.y, enemy.x, enemy.y) <= splash)
          : [target];

        hitTargets.forEach((enemy) => {
          enemy.hp -= projectile.damage;
          if (projectile.slow) {
            enemy.slowUntil = now + projectile.slow;
          }
        });

        return false;
      });

      runtime.enemies = runtime.enemies.filter((enemy) => {
        if (enemy.hp > 0) {
          return true;
        }

        runtime.buildGold += enemy.kind.reward;
        runtime.score += enemy.kind.reward * 10;
        return false;
      });

      if (runtime.lives <= 0) {
        runtime.phase = "defeat";
        runtime.message = "La base cayo. Reorganiza las torres.";
        return;
      }

      if (runtime.spawnLeft <= 0 && runtime.enemies.length === 0) {
        if (runtime.wave >= MAX_WAVE) {
          runtime.phase = "victory";
          runtime.message = "Oleada 5/5 completada.";
          if (!runtime.victoryReported) {
            runtime.victoryReported = true;
            victoryTokenRef.current += 1;
            setVictoryToken(victoryTokenRef.current);
          }
          return;
        }

        runtime.phase = "between";
        runtime.buildGold += 32 + runtime.wave * 12;
        runtime.message = "Oleada contenida. Refuerza la defensa.";
      }
    },
    [spawnEnemy]
  );

  const drawRuntime = useCallback((ctx: CanvasRenderingContext2D, runtime: Runtime | null) => {
    const map = mapRef.current;
    const selected = selectedTowerRef.current;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#052e16");
    gradient.addColorStop(0.54, "#02170d");
    gradient.addColorStop(1, "#12070b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255,255,255,0.025)";
    for (let col = 0; col < COLS; col += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        if ((col + row) % 2 === 0) {
          ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
        }
      }
    }

    const path = map.path.map(pointToCanvas);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(120, 53, 15, 0.78)";
    ctx.lineWidth = 34;
    ctx.beginPath();
    path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = "rgba(20, 184, 166, 0.24)";
    pathCellsRef.current.forEach((key) => {
      const [col, row] = key.split(":").map(Number);
      ctx.fillRect(col * CELL + 5, row * CELL + 5, CELL - 10, CELL - 10);
    });

    const base = path[path.length - 1];
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(base.x - 16, base.y - 18, 32, 36);
    ctx.fillStyle = "#111827";
    ctx.fillRect(base.x - 8, base.y - 4, 16, 22);

    if (runtime) {
      runtime.towers.forEach((tower) => {
        const x = tower.col * CELL + CELL / 2;
        const y = tower.row * CELL + CELL / 2;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x - 15, y + 10, 30, 7);
        ctx.fillStyle = tower.blueprint.color;
        ctx.fillRect(x - 13, y - 13, 26, 26);
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(x - 8, y - 7, 16, 14);
        ctx.fillStyle = tower.blueprint.accent;
        ctx.fillRect(x - 4, y - 18, 8, 10);
      });

      runtime.enemies.forEach((enemy) => {
        const size = enemy.kind.size;
        ctx.fillStyle = "rgba(0,0,0,0.38)";
        ctx.fillRect(enemy.x - size, enemy.y + size - 2, size * 2, 5);
        ctx.fillStyle = enemy.kind.color;
        ctx.fillRect(enemy.x - size, enemy.y - size, size * 2, size * 2);
        ctx.fillStyle = "#020617";
        ctx.fillRect(enemy.x - size + 4, enemy.y - 4, 4, 4);
        ctx.fillRect(enemy.x + size - 8, enemy.y - 4, 4, 4);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(enemy.x - 14, enemy.y - size - 10, 28, 4);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(enemy.x - 14, enemy.y - size - 10, Math.max(0, 28 * (enemy.hp / enemy.maxHp)), 4);
      });

      runtime.projectiles.forEach((projectile) => {
        ctx.fillStyle = projectile.color;
        ctx.fillRect(projectile.x - 3, projectile.y - 3, 6, 6);
      });
    }

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let col = 0; col <= COLS; col += 1) {
      ctx.beginPath();
      ctx.moveTo(col * CELL, 0);
      ctx.lineTo(col * CELL, HEIGHT);
      ctx.stroke();
    }
    for (let row = 0; row <= ROWS; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL);
      ctx.lineTo(WIDTH, row * CELL);
      ctx.stroke();
    }

    ctx.fillStyle = selected.color;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(10, 10, 120, 28);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`Torre: ${selected.short}`, 18, 29);
  }, []);

  useEffect(() => {
    let frameId = 0;
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
    };

    const tick = (time: number) => {
      const runtime = runtimeRef.current;
      const delta = lastFrameRef.current ? Math.min(0.05, (time - lastFrameRef.current) / 1000) : 0;
      lastFrameRef.current = time;

      if (runtime) {
        updateRuntime(runtime, delta, time / 1000);
        if (time - lastHudRef.current > 120) {
          lastHudRef.current = time;
          setHud(snapshot(runtime));
        }
      }

      drawRuntime(ctx, runtime);
      frameId = window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [drawRuntime, updateRuntime]);

  useEffect(() => {
    if (!victoryToken) {
      return;
    }

    async function awardVictoryGold() {
      if (!player) {
        setNotice(`Victoria lograda. Conecta tu perfil para cobrar ${difficulty.reward} oro.`);
        return;
      }

      const key = rewardKey(player.id, difficulty.id);

      if (window.localStorage.getItem(key)) {
        setNotice("Victoria registrada. La recompensa de hoy para esta dificultad ya fue cobrada.");
        return;
      }

      const freshPlayer = await refreshPlayer();
      const basis = freshPlayer ?? player;
      const updated = await setPlayerGold(basis.gold + difficulty.reward);

      if (!updated) {
        setNotice("No se pudo acreditar el oro. Refresca tu perfil e intenta otra victoria.");
        return;
      }

      window.localStorage.setItem(key, "claimed");
      setNotice(`Recompensa cobrada: +${difficulty.reward.toLocaleString("es-PY")} oro.`);
    }

    void awardVictoryGold();
  }, [difficulty, player, refreshPlayer, setPlayerGold, victoryToken]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-[#03170c] shadow-2xl shadow-emerald-950/30">
      <div className="border-b border-emerald-500/15 bg-gradient-to-r from-emerald-950 via-green-950 to-stone-950 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">
              Defensa de Aethelgardia
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-50 sm:text-3xl">
              Guardia de la muralla
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-stone-300">
            <StatusChip label="Oleada" value={`${hud.wave}/${MAX_WAVE}`} />
            <StatusChip label="Base" value={hud.lives} />
            <StatusChip label="Recursos" value={hud.buildGold} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-500/20 bg-black/45 p-2">
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              onPointerDown={handleCanvasPointer}
              className="block aspect-[18/10] w-full cursor-crosshair rounded-[1.15rem] bg-black touch-none"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {TOWERS.map((tower) => (
              <button
                key={tower.id}
                type="button"
                onClick={() => setSelectedTowerId(tower.id)}
                className={`kd-touch rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                  selectedTowerId === tower.id
                    ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-50"
                    : "border-stone-800 bg-stone-950/60 text-stone-300 hover:border-emerald-500/25"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black">{tower.label}</span>
                  <span className="rounded-full border border-amber-400/25 px-2 py-1 text-[10px] font-black text-amber-200">
                    {tower.cost}
                  </span>
                </span>
                <span className="mt-2 block text-[11px] uppercase tracking-[0.14em] text-stone-500">
                  Dmg {tower.damage} / Rango {tower.range}
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <Panel title="Partida" icon={<Shield className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-2">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficultyId(item.id)}
                  disabled={hud.phase === "playing"}
                  className={`kd-touch rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    difficultyId === item.id
                      ? "border-amber-300/50 bg-amber-500/15 text-amber-50"
                      : "border-stone-800 bg-stone-950/55 text-stone-300"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-black">
                    {item.label}
                    <span className="text-xs text-amber-300">+{item.reward}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Mapa" icon={<Crosshair className="h-4 w-4" />}>
            <div className="space-y-2">
              {MAPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMapId(item.id)}
                  disabled={hud.phase === "playing"}
                  className={`kd-touch w-full rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    mapId === item.id
                      ? "border-emerald-300/45 bg-emerald-500/12 text-emerald-50"
                      : "border-stone-800 bg-stone-950/55 text-stone-300"
                  }`}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-1 block text-xs text-stone-500">{item.hint}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Control" icon={<Swords className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={startWave}
                disabled={hud.phase !== "ready" && hud.phase !== "between"}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-3 py-3 text-sm font-black text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
              >
                <Play className="h-4 w-4" />
                Oleada
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-700 bg-stone-950/70 px-3 py-3 text-sm font-black text-stone-200 transition active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" />
                Reiniciar
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-stone-800 bg-black/35 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                {STATUS_LABEL[hud.phase]}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-300">{hud.message}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-stone-400">
                <span className="inline-flex items-center gap-2">
                  <Skull className="h-4 w-4 text-rose-300" />
                  {hud.enemies} enemigos
                </span>
                <span className="inline-flex items-center gap-2">
                  <Gem className="h-4 w-4 text-cyan-300" />
                  {hud.score} pts
                </span>
              </div>
            </div>
            {notice ? (
              <div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm font-bold leading-6 text-amber-100">
                <Coins className="mr-2 inline h-4 w-4" />
                {notice}
              </div>
            ) : null}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function StatusChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-black/35 px-3 py-2">
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
