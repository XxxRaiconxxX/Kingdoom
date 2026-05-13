export type HorseId = string;

export type HorseProfile = {
  id: HorseId;
  number: number;
  name: string;
  realm: string;
  coat: string;
  rider: string;
  accent: string;
  odds: number;
  baseSpeed: number;
  stamina: number;
  burst: number;
  stability: number;
};

export type HorseRaceFrame = {
  time: number;
  positions: Record<HorseId, number>;
  stamina: Record<HorseId, number>;
};

export type HorseRaceResult = {
  raceId: string;
  horses: HorseProfile[];
  frames: HorseRaceFrame[];
  placements: HorseId[];
  winnerId: HorseId;
  finishTimeMs: number;
  durationMs: number;
};

const HORSE_NAMES = [
  "Bruma Real",
  "Lanza Norte",
  "Sol de Vyralis",
  "Aether Rojo",
  "Niebla de Kaelum",
  "Corona Errante",
  "Furia de Aurelia",
  "Relampago Negro",
  "Oro Viejo",
  "Centella Gris",
  "Sombra Noble",
  "Viento del Sur",
];

const REALMS = ["Arcania", "Vyralis", "Kaelum-Gard", "Aurelia", "OakHaven", "Frontera"];

const COATS = ["#f8fafc", "#eab308", "#ef4444", "#2563eb", "#7c3aed", "#0f766e", "#92400e", "#111827"];
const RIDERS = ["#dc2626", "#9333ea", "#f59e0b", "#22c55e", "#38bdf8", "#f472b6"];
const ACCENTS = ["#facc15", "#06b6d4", "#f97316", "#a3e635", "#fb7185", "#c084fc"];

export const HORSE_RACE_LANES = 6;
export const HORSE_RACE_DURATION_MS = 16000;
export const HORSE_RACE_FRAME_MS = 100;

export function createHorseField(random: () => number = Math.random): HorseProfile[] {
  const names = shuffle(HORSE_NAMES, random);

  return Array.from({ length: HORSE_RACE_LANES }, (_, index) => {
    const baseSpeed = 0.78 + random() * 0.26;
    const stamina = 0.72 + random() * 0.28;
    const burst = 0.68 + random() * 0.36;
    const stability = 0.7 + random() * 0.3;
    const rating = baseSpeed * 0.42 + stamina * 0.26 + burst * 0.2 + stability * 0.12;
    const odds = clamp(roundToHalf(4.9 - rating * 2.6 + random() * 0.6), 1.5, 4.8);

    return {
      id: `horse-${Date.now()}-${index}-${Math.floor(random() * 9999)}`,
      number: index + 1,
      name: names[index] ?? `Caballo ${index + 1}`,
      realm: REALMS[Math.floor(random() * REALMS.length)] ?? "Arcania",
      coat: COATS[index % COATS.length],
      rider: RIDERS[index % RIDERS.length],
      accent: ACCENTS[index % ACCENTS.length],
      odds,
      baseSpeed,
      stamina,
      burst,
      stability,
    };
  }).sort((a, b) => a.odds - b.odds);
}

export function simulateHorseRace(
  horses: HorseProfile[],
  random: () => number = Math.random
): HorseRaceResult {
  const positions = Object.fromEntries(horses.map((horse) => [horse.id, 0])) as Record<HorseId, number>;
  const staminaState = Object.fromEntries(horses.map((horse) => [horse.id, 1])) as Record<HorseId, number>;
  const laneEvents = Object.fromEntries(horses.map((horse) => [horse.id, random()])) as Record<HorseId, number>;
  const frames: HorseRaceFrame[] = [];
  let winnerId = horses[0]?.id ?? "";
  let finishedAt = HORSE_RACE_DURATION_MS;

  for (let time = 0; time <= HORSE_RACE_DURATION_MS; time += HORSE_RACE_FRAME_MS) {
    const racePhase = time / HORSE_RACE_DURATION_MS;
    const crossingCandidates: Array<{ id: HorseId; crossingTime: number; rawPosition: number }> = [];

    for (const horse of horses) {
      const previousPosition = positions[horse.id] ?? 0;
      const opening = racePhase < 0.18 ? horse.burst * 0.005 : 0;
      const fatigue = Math.max(0.58, 1 - racePhase * (1.08 - horse.stamina) * 0.58);
      const sprint = racePhase > 0.74 ? horse.burst * 0.008 : 0;
      const chaos = (random() - 0.5) * 0.009 * horse.stability;
      const stumble = laneEvents[horse.id] < 0.09 && racePhase > 0.38 && racePhase < 0.48 ? -0.008 : 0;
      const stride = horse.baseSpeed * 0.0064 * fatigue + opening + sprint + chaos + stumble;
      const safeStride = Math.max(0.004, stride);
      const rawPosition = previousPosition + safeStride;

      positions[horse.id] = clamp(rawPosition, 0, 1);
      staminaState[horse.id] = clamp(fatigue, 0, 1);

      if (previousPosition < 1 && rawPosition >= 1 && finishedAt === HORSE_RACE_DURATION_MS) {
        const crossingTime = time - HORSE_RACE_FRAME_MS + ((1 - previousPosition) / safeStride) * HORSE_RACE_FRAME_MS;
        crossingCandidates.push({ id: horse.id, crossingTime, rawPosition });
      }
    }

    if (crossingCandidates.length > 0 && finishedAt === HORSE_RACE_DURATION_MS) {
      crossingCandidates.sort((a, b) => a.crossingTime - b.crossingTime || b.rawPosition - a.rawPosition);
      winnerId = crossingCandidates[0]?.id ?? winnerId;
      finishedAt = time;
    }

    frames.push({
      time,
      positions: { ...positions },
      stamina: { ...staminaState },
    });

    if (finishedAt !== HORSE_RACE_DURATION_MS && time >= finishedAt + 1500) {
      break;
    }
  }

  const placements = horses
    .slice()
    .sort((a, b) => (positions[b.id] ?? 0) - (positions[a.id] ?? 0))
    .map((horse) => horse.id);
  const orderedPlacements = [winnerId, ...placements.filter((id) => id !== winnerId)];

  return {
    raceId: `local-${Date.now()}-${Math.floor(random() * 99999)}`,
    horses,
    frames,
    placements: orderedPlacements,
    winnerId,
    finishTimeMs: finishedAt,
    durationMs: frames[frames.length - 1]?.time ?? HORSE_RACE_DURATION_MS,
  };
}

export function getFrameAt(result: HorseRaceResult, elapsedMs: number): HorseRaceFrame {
  const safeElapsed = Number.isFinite(elapsedMs) ? clamp(elapsedMs, 0, result.durationMs) : 0;
  const index = Math.min(result.frames.length - 1, Math.floor(safeElapsed / HORSE_RACE_FRAME_MS));
  return result.frames[index] ?? result.frames[0];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = items.slice();

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
