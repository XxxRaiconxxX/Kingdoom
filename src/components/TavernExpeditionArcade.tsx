import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeAlert,

  Coins,
  Heart,
  Lock,
  Shield,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { ARCADE_ENCOUNTERS } from "../data/pve";
import {
  consumeEncounterAttempt,
  createDefaultPveProgress,
  getEncounterUsageCount,
  getNextResetAt,
  getPvePower,
  getPveProgressToNextLevel,
  grantPveExperience,
  grantVictoryPoint,
  loadPveProgressForSheet,
  resolveActivePveSheetId,
  savePveProgress,
  setActivePveSheetId,
  spendPvePoint,
} from "../utils/pveProgress";
import { getPlayerSheets } from "../utils/characterSheets";
import type { CharacterSheet, PveCombatStats, PvePlayerProgress, PveStatKey } from "../types";

type CombatAction = "attack" | "ability" | "defend";
type CombatResult = "idle" | "active" | "victory" | "defeat";
type CombatLogTone = "neutral" | "good" | "bad" | "warn";

type CombatLog = {
  id: string;
  tone: CombatLogTone;
  text: string;
};

type EncounterMutator = {
  id: string;
  name: string;
  description: string;
  rewardMultiplier: number;
  playerDamageMultiplier?: number;
  abilityDamageMultiplier?: number;
  playerCritChanceBonus?: number;
  playerCritMultiplierBonus?: number;
  enemyDamageMultiplier?: number;
  enemyCritChanceBonus?: number;
  enemyGuardBonus?: number;
  enemyEvasionBonus?: number;
  phaseTwoBonus?: number;
  dodgeBonus?: number;
};

type ArcadeBattleState = {
  encounterId: string;
  usedSheetId: string;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: number;
  abilityCooldown: number;
  phaseTwoTriggered: boolean;
  result: CombatResult;
  reward: number;
  expReward: number;
  entryFee: number;
  awardedPoint: boolean;
  levelsGained: number;
  milestonePointsGained: number;
  levelAfter: number;
  mutator: EncounterMutator;
  logs: CombatLog[];
};

const PLAYER_BASE_HP = 100;
const LIFE_BONUS_PER_POINT = 15;
const STRENGTH_ATTACK_BONUS = 3;
const STRENGTH_ABILITY_BONUS = 4;
const DEFENSE_DAMAGE_REDUCTION = 2;
const ATTACK_CRIT_CHANCE = 0.2;
const ABILITY_CRIT_CHANCE = 0.32;
const DEFENSE_DODGE_CHANCE = 0.28;
const DEFENSE_REDUCE_CHANCE = 0.5;
const CONTROLLED_POINT_CHANCE = 0.05;
const MEDIUM_POINT_CHANCE = 0.1;
const HARD_POINT_CHANCE = 1;
const CONTROLLED_CRIT_MULTIPLIER = 1.55;
const MEDIUM_CRIT_MULTIPLIER = 1.8;
const HARD_CRIT_MULTIPLIER = 2.1;
const PROGRESS_WINDOW_MS =
  Math.max(...ARCADE_ENCOUNTERS.map((encounter) => encounter.windowHours)) * 60 * 60 * 1000;

const CONTRACT_MUTATORS: Record<"controlled" | "medium" | "hard", EncounterMutator[]> = {
  controlled: [
    {
      id: "hunter-edge",
      name: "Filo del cazador",
      description: "Tus golpes salen mas limpios. +12% dano base y +5% oro.",
      rewardMultiplier: 1.05,
      playerDamageMultiplier: 1.12,
    },
    {
      id: "wind-step",
      name: "Paso de bruma",
      description: "Tu lectura mejora en el duelo. +8% esquiva y +3% critico.",
      rewardMultiplier: 1,
      dodgeBonus: 0.08,
      playerCritChanceBonus: 0.03,
    },
    {
      id: "thick-fog",
      name: "Niebla cerrada",
      description: "La presa se vuelve dificil de fijar. +5% guardia rival, +5% evasion rival, +15% oro.",
      rewardMultiplier: 1.15,
      enemyGuardBonus: 0.05,
      enemyEvasionBonus: 0.05,
    },
  ],
  medium: [
    {
      id: "blood-moon",
      name: "Luna carmesi",
      description: "Ambos entran calientes. +6% critico tuyo, +4% critico enemigo, +12% oro.",
      rewardMultiplier: 1.12,
      playerCritChanceBonus: 0.06,
      enemyCritChanceBonus: 0.04,
    },
    {
      id: "iron-oath",
      name: "Juramento de hierro",
      description: "Combate mas denso. +8% guardia enemiga, +8% dano enemigo, +10% habilidad, +15% oro.",
      rewardMultiplier: 1.15,
      enemyGuardBonus: 0.08,
      enemyDamageMultiplier: 1.08,
      abilityDamageMultiplier: 1.1,
    },
    {
      id: "arcane-current",
      name: "Corriente arcana",
      description: "Las tecnicas cargadas fluyen mejor. +18% habilidad, +8% fase dos, +10% oro.",
      rewardMultiplier: 1.1,
      abilityDamageMultiplier: 1.18,
      phaseTwoBonus: 0.08,
    },
  ],
  hard: [
    {
      id: "void-storm",
      name: "Tormenta del vacio",
      description: "Todo pega mas fuerte. +10% dano tuyo, +14% dano enemigo, +18% oro.",
      rewardMultiplier: 1.18,
      playerDamageMultiplier: 1.1,
      enemyDamageMultiplier: 1.14,
      phaseTwoBonus: 0.1,
    },
    {
      id: "execution-mark",
      name: "Marca del verdugo",
      description: "Criticos mas brutales para ambos lados. +8% critico, +0.25 al multiplicador critico, +12% oro.",
      rewardMultiplier: 1.12,
      playerCritChanceBonus: 0.08,
      playerCritMultiplierBonus: 0.25,
      enemyCritChanceBonus: 0.06,
    },
    {
      id: "ravager-pact",
      name: "Pacto devastador",
      description: "La presa esquiva y aguanta mas, pero el contrato paga mejor. +6% guardia/evasion rival, +22% oro.",
      rewardMultiplier: 1.22,
      enemyGuardBonus: 0.06,
      enemyEvasionBonus: 0.06,
      playerDamageMultiplier: 1.08,
      abilityDamageMultiplier: 1.08,
    },
  ],
};

function rollChance(chance: number) {
  return Math.random() < chance;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampChance(value: number) {
  return Math.min(0.95, Math.max(0, value));
}

function difficultyLabel(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return "Dificil";
    case "medium":
      return "Medio";
    default:
      return "Controlado";
  }
}

function difficultyTone(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return "border-rose-500/25 bg-rose-500/10 text-rose-200";
    case "medium":
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    default:
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  }
}

function getDifficultyCritMultiplier(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return HARD_CRIT_MULTIPLIER;
    case "medium":
      return MEDIUM_CRIT_MULTIPLIER;
    default:
      return CONTROLLED_CRIT_MULTIPLIER;
  }
}

function getPlayerCritLabel(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return "juicio del verdugo";
    case "medium":
      return "ruptura brutal";
    default:
      return "corte preciso";
  }
}

function getEnemyCritLabel(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return "desgarro del vacio";
    case "medium":
      return "embestida severa";
    default:
      return "contraataque certero";
  }
}

function getVictoryPointChance(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return HARD_POINT_CHANCE;
    case "medium":
      return MEDIUM_POINT_CHANCE;
    default:
      return CONTROLLED_POINT_CHANCE;
  }
}

function formatVictoryPointChance(difficulty: "controlled" | "medium" | "hard") {
  const chance = getVictoryPointChance(difficulty);
  return chance >= 1 ? "Punto garantizado" : `${Math.round(chance * 100)}% punto`;
}

function getRandomEncounterMutator(difficulty: "controlled" | "medium" | "hard") {
  const pool = CONTRACT_MUTATORS[difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}

function logToneClasses(tone: CombatLogTone) {
  switch (tone) {
    case "good":
      return "border-emerald-500/20 bg-emerald-500/8 text-emerald-100";
    case "bad":
      return "border-rose-500/20 bg-rose-500/8 text-rose-100";
    case "warn":
      return "border-amber-500/20 bg-amber-500/8 text-amber-100";
    default:
      return "border-stone-800 bg-stone-950/55 text-stone-300";
  }
}

function createLog(text: string, tone: CombatLogTone): CombatLog {
  return {
    id: crypto.randomUUID(),
    tone,
    text,
  };
}

function formatResetDistance(target: number | null) {
  if (!target) {
    return "Disponible";
  }

  const diff = Math.max(0, target - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function getSheetCombatBonuses(sheet: CharacterSheet | null) {
  if (!sheet) {
    return {
      strength: 0,
      life: 0,
      defense: 0,
      ability: 0,
    };
  }

  return {
    strength: Math.floor((sheet.stats.strength ?? 0) / 4),
    life: Math.floor(((sheet.stats.defense ?? 0) + (sheet.stats.magicDefense ?? 0)) / 6),
    defense: Math.floor(((sheet.stats.defense ?? 0) + (sheet.stats.agility ?? 0)) / 6),
    ability: Math.floor((sheet.stats.intelligence ?? 0) / 4),
  };
}

function getSheetSummary(sheet: CharacterSheet | null) {
  if (!sheet) {
    return "Sin ficha activa";
  }

  return [sheet.race, sheet.profession].filter(Boolean).join(" · ") || "Ficha lista para expedicion";
}

export function TavernExpeditionArcade() {
  const { player, isHydrating, setPlayerGold, refreshPlayer } = usePlayerSession();
  const [selectedEncounterId, setSelectedEncounterId] = useState(
    ARCADE_ENCOUNTERS[0]?.id ?? ""
  );
  const [battle, setBattle] = useState<ArcadeBattleState | null>(null);
  const [progress, setProgress] = useState<PvePlayerProgress | null>(null);
  const [playerSheets, setPlayerSheets] = useState<CharacterSheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateExpeditionState() {
      if (!player) {
        setProgress(null);
        setPlayerSheets([]);
        setActiveSheetId(null);
        setBattle(null);
        return;
      }

      const sheets = await getPlayerSheets(player.id);
      if (cancelled) {
        return;
      }

      setPlayerSheets(sheets);
      const resolvedSheetId = resolveActivePveSheetId(
        player.id,
        sheets.map((sheet) => sheet.id)
      );
      setActiveSheetId(resolvedSheetId);

      if (!resolvedSheetId) {
        setProgress(null);
        setBattle(null);
        return;
      }

      setProgress(loadPveProgressForSheet(player.id, resolvedSheetId, PROGRESS_WINDOW_MS));
      setBattle((currentBattle) =>
        currentBattle?.usedSheetId === resolvedSheetId ? currentBattle : null
      );
    }

    void hydrateExpeditionState();

    return () => {
      cancelled = true;
    };
  }, [player]);

  const selectedEncounter = useMemo(
    () =>
      ARCADE_ENCOUNTERS.find((encounter) => encounter.id === selectedEncounterId) ??
      ARCADE_ENCOUNTERS[0],
    [selectedEncounterId]
  );

  const activeSheet = useMemo(
    () => playerSheets.find((sheet) => sheet.id === activeSheetId) ?? null,
    [activeSheetId, playerSheets]
  );
  const safeProgress =
    progress ?? createDefaultPveProgress(player?.id ?? "guest", activeSheetId ?? "guest-sheet");
  const sheetBonuses = useMemo(() => getSheetCombatBonuses(activeSheet), [activeSheet]);
  const effectiveStats = useMemo<PveCombatStats>(
    () => ({
      strength: safeProgress.stats.strength + sheetBonuses.strength,
      life: safeProgress.stats.life + sheetBonuses.life,
      defense: safeProgress.stats.defense + sheetBonuses.defense,
    }),
    [safeProgress, sheetBonuses]
  );
  const playerMaxHp = PLAYER_BASE_HP + effectiveStats.life * LIFE_BONUS_PER_POINT;
  const playerPower = getPvePower({
    level: safeProgress.level,
    stats: effectiveStats,
  });
  const levelProgress = getPveProgressToNextLevel(safeProgress);
  const selectedEncounterLocked =
    !selectedEncounter || safeProgress.level < selectedEncounter.minLevel;
  const willLevelSoon = selectedEncounter
    ? grantPveExperience(safeProgress, selectedEncounter.expReward).levelsGained > 0
    : false;

  useEffect(() => {
    if (!selectedEncounter) {
      return;
    }

    const unlockedEncounters = ARCADE_ENCOUNTERS.filter(
      (encounter) => encounter.minLevel <= safeProgress.level
    );
    const highestUnlocked =
      unlockedEncounters[unlockedEncounters.length - 1] ?? ARCADE_ENCOUNTERS[0];

    if (selectedEncounter.minLevel > safeProgress.level) {
      setSelectedEncounterId(highestUnlocked.id);
    }
  }, [safeProgress.level, selectedEncounter]);

  function handleSelectActiveSheet(sheetId: string) {
    if (!player || battle?.result === "active") {
      return;
    }

    setActivePveSheetId(player.id, sheetId);
    setActiveSheetId(sheetId);
    setProgress(loadPveProgressForSheet(player.id, sheetId, PROGRESS_WINDOW_MS));
    setBattle(null);
  }

  async function startRun() {
    if (!player || !selectedEncounter || isUpdating || !progress || !activeSheetId || !activeSheet) {
      return;
    }

    const windowMs = selectedEncounter.windowHours * 60 * 60 * 1000;
    const attemptsUsed = getEncounterUsageCount(progress, selectedEncounter.id, windowMs);
    const attemptsLeft = selectedEncounter.maxAttemptsPerWindow - attemptsUsed;

    if (attemptsLeft <= 0 || player.gold < selectedEncounter.entryFee || selectedEncounterLocked) {
      return;
    }

    setIsUpdating(true);
    const updatedPlayer = await setPlayerGold(player.gold - selectedEncounter.entryFee);
    setIsUpdating(false);

    if (!updatedPlayer) {
      return;
    }

    const nextProgress = consumeEncounterAttempt(
      progress,
      selectedEncounter.id,
      windowMs
    );
    savePveProgress(nextProgress);
    setProgress(nextProgress);

    const mutator = getRandomEncounterMutator(selectedEncounter.difficulty);

    setBattle({
      encounterId: selectedEncounter.id,
      usedSheetId: activeSheetId,
      playerHp: playerMaxHp,
      playerMaxHp,
      enemyHp: selectedEncounter.enemyHp,
      enemyMaxHp: selectedEncounter.enemyHp,
      turn: 1,
      abilityCooldown: 0,
      phaseTwoTriggered: false,
      result: "active",
      reward: 0,
      expReward: 0,
      entryFee: selectedEncounter.entryFee,
      awardedPoint: false,
      levelsGained: 0,
      milestonePointsGained: 0,
      levelAfter: safeProgress.level,
      mutator,
      logs: [
        createLog(
          `Contrato abierto contra ${selectedEncounter.enemyName} con ${activeSheet.name || "tu ficha"} al frente. Entrada pagada: ${selectedEncounter.entryFee} de oro.`,
          "warn"
        ),
        createLog(`Mutador activo: ${mutator.name}. ${mutator.description}`, "neutral"),
      ],
    });
  }

  async function resolveAction(action: CombatAction) {
    if (
      !battle ||
      !selectedEncounter ||
      !player ||
      !progress ||
      battle.result !== "active" ||
      isUpdating
    ) {
      return;
    }

    let nextPlayerHp = battle.playerHp;
    let nextEnemyHp = battle.enemyHp;
    let nextCooldown = Math.max(0, battle.abilityCooldown - 1);
    let nextPhaseTwo = battle.phaseTwoTriggered;
    let result: CombatResult = "active";
    let reward = 0;
    let expReward = 0;
    let awardedPoint = false;
    let levelsGained = 0;
    let milestonePointsGained = 0;
    let levelAfter = safeProgress.level;
    const logs: CombatLog[] = [];
    const mutator = battle.mutator;

    if (action === "attack" || action === "ability") {
      const baseDamage =
        action === "attack"
          ? randomBetween(17, 29) + effectiveStats.strength * STRENGTH_ATTACK_BONUS
          : randomBetween(28, 44) +
            effectiveStats.strength * STRENGTH_ABILITY_BONUS +
            sheetBonuses.ability * 3;
      const rawDamage = Math.floor(
        baseDamage *
          (action === "attack"
            ? mutator.playerDamageMultiplier ?? 1
            : mutator.abilityDamageMultiplier ?? mutator.playerDamageMultiplier ?? 1)
      );
      const critChance =
        (action === "attack" ? ATTACK_CRIT_CHANCE : ABILITY_CRIT_CHANCE) +
        (mutator.playerCritChanceBonus ?? 0);
      const wasCrit = rollChance(critChance);
      const critMultiplier =
        getDifficultyCritMultiplier(selectedEncounter.difficulty) +
        (mutator.playerCritMultiplierBonus ?? 0);
      let inflictedDamage = wasCrit ? Math.floor(rawDamage * critMultiplier) : rawDamage;

      if (action === "ability") {
        nextCooldown = 2;
      }

      if (rollChance(clampChance(selectedEncounter.enemyEvasionChance + (mutator.enemyEvasionBonus ?? 0)))) {
        inflictedDamage = 0;
        logs.push(
          createLog(
            `${selectedEncounter.enemyName} se desplaza a tiempo y esquiva por completo tu ${action === "attack" ? "ataque" : "habilidad"}.`,
            "bad"
          )
        );
      } else if (rollChance(clampChance(selectedEncounter.enemyGuardChance + (mutator.enemyGuardBonus ?? 0)))) {
        inflictedDamage = Math.max(6, Math.floor(inflictedDamage * 0.45));
        logs.push(
          createLog(
            `${selectedEncounter.enemyName} levanta defensa y reduce el impacto. Solo entran ${inflictedDamage} puntos.`,
            "warn"
          )
        );
      } else {
        logs.push(
          createLog(
            `${action === "attack" ? "Golpe directo" : "Tecnica cargada"} por ${inflictedDamage}${wasCrit ? ` con ${getPlayerCritLabel(selectedEncounter.difficulty)}` : ""}.`,
            wasCrit ? "good" : "neutral"
          )
        );
      }

      nextEnemyHp = Math.max(0, nextEnemyHp - inflictedDamage);

      const canTriggerPhaseTwo =
        !nextPhaseTwo &&
        nextEnemyHp > 0 &&
        nextEnemyHp <= Math.floor(battle.enemyMaxHp * 0.35) &&
        rollChance(clampChance(selectedEncounter.phaseTwoChance + (mutator.phaseTwoBonus ?? 0)));

      if (canTriggerPhaseTwo) {
        nextPhaseTwo = true;
        const healAmount = Math.floor(battle.enemyMaxHp * 0.5);
        nextEnemyHp = Math.min(battle.enemyMaxHp, nextEnemyHp + healAmount);
        logs.push(
          createLog(
            `${selectedEncounter.enemyName} entra en segunda fase y recupera ${healAmount} de vida.`,
            "bad"
          )
        );
      }

      if (nextEnemyHp <= 0) {
        const baseReward = randomBetween(selectedEncounter.rewardMin, selectedEncounter.rewardMax);
        reward = Math.floor(baseReward * mutator.rewardMultiplier);
        expReward = selectedEncounter.expReward;
        result = "victory";

        const pointChance = getVictoryPointChance(selectedEncounter.difficulty);
        awardedPoint = rollChance(pointChance);
        const expProjection = grantPveExperience(progress, expReward);
        levelsGained = expProjection.levelsGained;
        milestonePointsGained = expProjection.milestonePoints;
        levelAfter = expProjection.progress.level;

        if (awardedPoint) {
          logs.push(
            createLog(
              `Objetivo abatido. El gremio liquida ${reward} de oro${reward > baseReward ? ` gracias a ${mutator.name}` : ""}, sumas ${expReward} exp y cae 1 punto de mejora.`,
              "good"
            )
          );
        } else {
          logs.push(
            createLog(
              `Objetivo abatido. El gremio liquida ${reward} de oro${reward > baseReward ? ` gracias a ${mutator.name}` : ""} y sumas ${expReward} exp, pero esta vez no cayo punto de mejora.`,
              "good"
            )
          );
        }

        if (levelsGained > 0) {
          logs.push(
            createLog(
              `${activeSheet?.name || "Tu ficha"} sube a nivel ${levelAfter}${milestonePointsGained > 0 ? ` y gana ${milestonePointsGained} punto extra por hito de nivel.` : "."}`,
              "good"
            )
          );
        }
      }
    }

    if (action === "defend") {
      logs.push(
        createLog(
          "Adoptas postura defensiva y preparas un paso corto para cortar el ritmo rival.",
          "neutral"
        )
      );
    }

    if (result === "active") {
      let enemyDamage = randomBetween(
        selectedEncounter.enemyAttackMin,
        selectedEncounter.enemyAttackMax
      );

      enemyDamage = Math.floor(enemyDamage * (mutator.enemyDamageMultiplier ?? 1));

      if (
        rollChance(
          (selectedEncounter.difficulty === "hard"
            ? 0.2
            : selectedEncounter.difficulty === "medium"
              ? 0.15
              : 0.1) + (mutator.enemyCritChanceBonus ?? 0)
        )
      ) {
        enemyDamage = Math.floor(enemyDamage * (1.6 + (selectedEncounter.difficulty === "hard" ? 0.15 : selectedEncounter.difficulty === "medium" ? 0.08 : 0)));
        logs.push(createLog(`${selectedEncounter.enemyName} conecta ${getEnemyCritLabel(selectedEncounter.difficulty)}.`, "bad"));
      }

      if (action === "defend") {
        const dodgeChance =
          DEFENSE_DODGE_CHANCE + effectiveStats.defense * 0.03 + (mutator.dodgeBonus ?? 0);
        const reduceChance = DEFENSE_REDUCE_CHANCE + effectiveStats.defense * 0.05;

        if (rollChance(dodgeChance)) {
          enemyDamage = 0;
          logs.push(createLog("Lees la embestida y esquivas todo el dano.", "good"));
        } else if (rollChance(reduceChance)) {
          enemyDamage = Math.max(
            3,
            Math.floor(enemyDamage * 0.4) - effectiveStats.defense * DEFENSE_DAMAGE_REDUCTION
          );
          logs.push(
            createLog(
              `Tu defensa absorbe la mayor parte del impacto. Solo recibes ${enemyDamage}.`,
              "good"
            )
          );
        } else {
          enemyDamage = Math.max(
            1,
            enemyDamage - effectiveStats.defense * DEFENSE_DAMAGE_REDUCTION
          );
          logs.push(
            createLog(`La defensa no cierra a tiempo y aun asi recibes ${enemyDamage}.`, "warn")
          );
        }
      } else {
        enemyDamage = Math.max(1, enemyDamage - effectiveStats.defense * DEFENSE_DAMAGE_REDUCTION);
        logs.push(
          createLog(`${selectedEncounter.enemyName} responde y te hiere por ${enemyDamage}.`, "bad")
        );
      }

      nextPlayerHp = Math.max(0, nextPlayerHp - enemyDamage);

      if (nextPlayerHp <= 0) {
        result = "defeat";
        logs.push(createLog("Tu resistencia colapsa. La caceria termina en derrota.", "bad"));
      }
    }

    const nextBattle: ArcadeBattleState = {
      ...battle,
      playerHp: nextPlayerHp,
      enemyHp: nextEnemyHp,
      turn: battle.turn + 1,
      abilityCooldown: nextCooldown,
      phaseTwoTriggered: nextPhaseTwo,
      result,
      reward,
      expReward,
      awardedPoint,
      levelsGained,
      milestonePointsGained,
      levelAfter,
      mutator,
      logs: [...logs, ...battle.logs].slice(0, 8),
    };

    setBattle(nextBattle);

    if (result === "victory" && reward > 0) {
      setIsUpdating(true);
      const refreshedPlayer = await refreshPlayer();
      const goldBase = refreshedPlayer?.gold ?? player.gold;
      await setPlayerGold(goldBase + reward);

      const expResult = grantPveExperience(progress, expReward);
      let nextProgress = expResult.progress;
      if (awardedPoint) {
        nextProgress = grantVictoryPoint(nextProgress, {
          countHardVictory: selectedEncounter.difficulty === "hard",
        });
      }
      savePveProgress(nextProgress);
      setProgress(nextProgress);

      setIsUpdating(false);
    }
  }

  function resetBattle() {
    setBattle(null);
  }

  function upgradeStat(stat: PveStatKey) {
    if (!player || !progress || progress.availablePoints <= 0 || battle?.result === "active") {
      return;
    }

    const nextProgress = spendPvePoint(progress, stat);
    savePveProgress(nextProgress);
    setProgress(nextProgress);
  }

  if (isHydrating) {
    return <ArcadePlaceholder message="Preparando contratos de expedicion..." />;
  }

  if (!player) {
    return <ArcadePlaceholder message="Conecta tu perfil para iniciar cacerias arcade." />;
  }

  if (playerSheets.length === 0) {
    return (
      <ArcadePlaceholder message="Importa una ficha en tu perfil. Expedicion ahora progresa por personaje y cada cuenta puede entrenar hasta dos fichas." />
    );
  }

  if (!activeSheet || !activeSheetId) {
    return (
      <ArcadePlaceholder message="Elige una ficha activa para Expedicion desde tu perfil o desde este panel antes de abrir contratos." />
    );
  }

  return (
    <div className="rounded-[2rem] border border-emerald-500/15 bg-emerald-950/25 p-4 shadow-[0_32px_80px_rgba(0,0,0,0.3)]">
      <div className="space-y-4 rounded-[1.7rem] border border-emerald-400/20 bg-[#072b16] p-4 sm:p-5">
        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                Cazador activo
              </p>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-300">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-black text-stone-100">
                    {activeSheet.name || "Ficha sin nombre"}
                  </p>
                  <p className="text-sm text-stone-400">{getSheetSummary(activeSheet)}</p>
                </div>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-stone-400">
                Cada ficha crece por separado. El nivel se gana por exp del contrato y cada 5 niveles da 1 punto extra de stats.
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-stone-800 bg-stone-900/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Progreso actual
              </p>
              <p className="mt-2 text-2xl font-black text-stone-100">Lv {safeProgress.level}</p>
              <p className="mt-1 text-sm text-stone-400">
                {levelProgress.current}/{levelProgress.required} exp del rango actual
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {playerSheets.map((sheet) => {
              const active = sheet.id === activeSheetId;
              return (
                <button
                  key={sheet.id}
                  type="button"
                  disabled={battle?.result === "active"}
                  onClick={() => handleSelectActiveSheet(sheet.id)}
                  className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${
                    active
                      ? "border-amber-400/30 bg-amber-500/10"
                      : "border-stone-800 bg-stone-950/65 hover:border-amber-400/20"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-stone-100">
                        {sheet.name || "Ficha sin nombre"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                        {getSheetSummary(sheet)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        active
                          ? "border border-amber-400/30 bg-amber-500/10 text-amber-200"
                          : "border border-stone-700 bg-stone-900 text-stone-400"
                      }`}
                    >
                      {active ? "Activa" : "Cambiar"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Cazador activo
                </p>
                <p className="text-lg font-black text-stone-100">{activeSheet.name || player.username}</p>
                <p className="text-sm text-stone-400">
                  La ficha aporta bonos base al combate: +{sheetBonuses.strength} fuerza, +{sheetBonuses.life} vida y +{sheetBonuses.defense} defensa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:min-w-[620px]">
              <MiniStat icon={Coins} label="Oro" value={player.gold} />
              <MiniStat icon={Sparkles} label="Nivel" value={safeProgress.level} />
              <MiniStat icon={BadgeAlert} label="Poder" value={playerPower} />
              <MiniStat icon={Sparkles} label="Puntos" value={safeProgress.availablePoints} />
              <MiniStat icon={Heart} label="Vida base" value={playerMaxHp} />
              <MiniStat icon={BadgeAlert} label="Hard wins" value={safeProgress.hardVictories} />
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                Mejora del cazador
              </p>
              <p className="mt-1 text-sm text-stone-400">
                Los contratos siguen soltando puntos de mejora, pero ademas cada 5 niveles obtienes 1 punto extra. La ficha base tambien suma al combate para que cada personaje se sienta distinto.
              </p>
            </div>
            <span className="rounded-full border border-stone-700 bg-stone-900/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
              {safeProgress.availablePoints} disponibles
            </span>
          </div>

          <div className="mb-4 rounded-[1.2rem] border border-stone-800 bg-stone-900/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-200">Exp actual: {safeProgress.exp}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                Siguiente hito en Lv {Math.floor(safeProgress.level / 5) * 5 + 5}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{
                  width: `${Math.max(4, Math.min(100, (levelProgress.current / levelProgress.required) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <UpgradeCard
              icon={Swords}
              label="Fuerza"
              value={effectiveStats.strength}
              hint={`${safeProgress.stats.strength} invertidos | +${sheetBonuses.strength} ficha | +${effectiveStats.strength * STRENGTH_ATTACK_BONUS} ataque`}
              disabled={safeProgress.availablePoints <= 0 || battle?.result === "active"}
              onUpgrade={() => upgradeStat("strength")}
            />
            <UpgradeCard
              icon={Heart}
              label="Vida"
              value={effectiveStats.life}
              hint={`${safeProgress.stats.life} invertidos | +${sheetBonuses.life} ficha | +${effectiveStats.life * LIFE_BONUS_PER_POINT} HP`}
              disabled={safeProgress.availablePoints <= 0 || battle?.result === "active"}
              onUpgrade={() => upgradeStat("life")}
            />
            <UpgradeCard
              icon={Shield}
              label="Defensa"
              value={effectiveStats.defense}
              hint={`${safeProgress.stats.defense} invertidos | +${sheetBonuses.defense} ficha | -${effectiveStats.defense * DEFENSE_DAMAGE_REDUCTION} dano`}
              disabled={safeProgress.availablePoints <= 0 || battle?.result === "active"}
              onUpgrade={() => upgradeStat("defense")}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {ARCADE_ENCOUNTERS.map((encounter) => {
            const active = encounter.id === selectedEncounterId;
            const locked = safeProgress.level < encounter.minLevel;
            const windowMs = encounter.windowHours * 60 * 60 * 1000;
            const used = getEncounterUsageCount(safeProgress, encounter.id, windowMs);
            const remaining = Math.max(0, encounter.maxAttemptsPerWindow - used);
            const nextResetAt = getNextResetAt(safeProgress, encounter.id, windowMs);

            return (
              <button
                key={encounter.id}
                type="button"
                onClick={() => {
                  if (!locked) {
                    setSelectedEncounterId(encounter.id);
                  }
                }}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  active
                    ? "border-amber-400/30 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.08)]"
                    : "border-stone-800 bg-stone-950/50"
                } ${locked ? "opacity-60" : ""}`}
                disabled={locked}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                      {difficultyLabel(encounter.difficulty)}
                    </p>
                    <h3 className="mt-2 text-base font-black text-stone-100">
                      {encounter.title}
                    </h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${difficultyTone(encounter.difficulty)}`}>
                    {formatVictoryPointChance(encounter.difficulty)}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-stone-400">{encounter.summary}</p>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-stone-500">
                  <span>Lv {encounter.minLevel} minimo</span>
                  <span>Poder {encounter.recommendedPower}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-stone-300">
                  <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
                    Entrada {encounter.entryFee}
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
                    {encounter.expReward} exp
                  </div>
                </div>

                <div className="mt-2 rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-2 text-xs leading-5 text-stone-400">
                  {locked
                    ? `Bloqueado hasta nivel ${encounter.minLevel}.`
                    : "Al iniciar se asigna un mutador aleatorio de contrato."}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-stone-500">
                  <span>{remaining}/{encounter.maxAttemptsPerWindow} usos</span>
                  <span>reset {formatResetDistance(nextResetAt)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedEncounter ? (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                    Objetivo
                  </p>
                  <h4 className="mt-2 text-xl font-black text-stone-100">
                    {selectedEncounter.enemyName}
                  </h4>
                </div>
                <span className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${difficultyTone(selectedEncounter.difficulty)}`}>
                  {difficultyLabel(selectedEncounter.difficulty)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat icon={Coins} label="Entrada" value={selectedEncounter.entryFee} />
                <MiniStat icon={Sparkles} label="Exp" value={selectedEncounter.expReward} />
                <MiniStat icon={Sparkles} label="Min" value={selectedEncounter.rewardMin} />
                <MiniStat icon={BadgeAlert} label="Max" value={selectedEncounter.rewardMax} />
              </div>

              <div className="mt-4 rounded-[1.1rem] border border-stone-800 bg-stone-900/70 px-4 py-3 text-sm text-stone-300">
                <span className="font-semibold text-amber-300">Requisito:</span> nivel {selectedEncounter.minLevel} minimo y poder recomendado de {selectedEncounter.recommendedPower}.
                {playerPower < selectedEncounter.recommendedPower
                  ? " Puedes entrar antes, pero el contrato te va a castigar."
                  : " Tu ficha ya esta en rango para pelearlo con dignidad."}
              </div>

              <div className="mt-3 rounded-[1.1rem] border border-stone-800 bg-stone-900/70 px-4 py-3 text-sm text-stone-300">
                <span className="font-semibold text-amber-300">Puntos de mejora:</span>{" "}
                {selectedEncounter.difficulty === "hard"
                  ? "esta caceria entrega 1 punto garantizado si ganas, ademas de la exp del contrato."
                  : `si ganas, tienes ${Math.round(
                      getVictoryPointChance(selectedEncounter.difficulty) * 100
                    )}% de recibir 1 punto de mejora, aparte de la exp.`}
              </div>

              <div className="mt-3 rounded-[1.1rem] border border-stone-800 bg-stone-900/70 px-4 py-3 text-sm text-stone-300">
                <span className="font-semibold text-amber-300">Critico especial:</span>{" "}
                {selectedEncounter.difficulty === "hard"
                  ? "Juicio del verdugo, el remate mas brutal del modo dificil."
                  : selectedEncounter.difficulty === "medium"
                    ? "Ruptura brutal, criticos mas pesados y agresivos."
                    : "Corte preciso, criticos mas estables para farmear."}
              </div>

              <button
                type="button"
                onClick={() => void startRun()}
                disabled={
                  selectedEncounterLocked ||
                  isUpdating ||
                  player.gold < selectedEncounter.entryFee ||
                  battle?.result === "active" ||
                  getEncounterUsageCount(
                    safeProgress,
                    selectedEncounter.id,
                    selectedEncounter.windowHours * 60 * 60 * 1000
                  ) >= selectedEncounter.maxAttemptsPerWindow
                }
                className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-4 text-sm font-black text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedEncounterLocked
                  ? `Bloqueado hasta nivel ${selectedEncounter.minLevel}`
                  : player.gold < selectedEncounter.entryFee
                  ? "Oro insuficiente"
                  : battle?.result === "active"
                    ? "Combate en curso"
                    : getEncounterUsageCount(
                        safeProgress,
                        selectedEncounter.id,
                        selectedEncounter.windowHours * 60 * 60 * 1000
                      ) >= selectedEncounter.maxAttemptsPerWindow
                      ? "Limite alcanzado"
                      : "Iniciar caceria"}
              </button>

              <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-stone-400">
                {selectedEncounterLocked ? <Lock className="h-3.5 w-3.5 text-amber-300" /> : null}
                {willLevelSoon
                  ? "Si ganas este contrato, tu ficha sube de nivel."
                  : "La curva esta pensada para que cada rango nuevo se sienta ganado, no regalado."}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-4">
              {battle && battle.encounterId === selectedEncounter.id ? (
                <>
                  <div className="rounded-[1.2rem] border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                      Mutador activo
                    </p>
                    <p className="mt-2 text-sm font-bold text-stone-100">{battle.mutator.name}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-400">{battle.mutator.description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <BarCard label="Tu vida" value={battle.playerHp} max={battle.playerMaxHp} tone="player" />
                    <BarCard label="Vida enemiga" value={battle.enemyHp} max={battle.enemyMaxHp} tone="enemy" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <ActionButton
                      label="Ataque"
                      icon={Swords}
                      disabled={battle.result !== "active" || isUpdating}
                      onClick={() => void resolveAction("attack")}
                    />
                    <ActionButton
                      label="Habilidad"
                      icon={Sparkles}
                      disabled={battle.result !== "active" || isUpdating || battle.abilityCooldown > 0}
                      onClick={() => void resolveAction("ability")}
                      badge={battle.abilityCooldown > 0 ? `${battle.abilityCooldown}` : "OK"}
                    />
                    <ActionButton
                      label="Defensa"
                      icon={Shield}
                      disabled={battle.result !== "active" || isUpdating}
                      onClick={() => void resolveAction("defend")}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-stone-500">
                    <span>Turno {battle.turn}</span>
                    <span>{battle.phaseTwoTriggered ? "Fase 2 activa" : "Fase 1"}</span>
                  </div>

                  <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {battle.logs.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-[1.1rem] border px-3 py-3 text-sm leading-5 ${logToneClasses(log.tone)}`}
                        >
                          {log.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {battle.result !== "active" ? (
                    <div className="mt-4 rounded-[1.3rem] border border-stone-800 bg-stone-900/80 p-4">
                      <p className="text-sm font-bold text-stone-100">
                        {battle.result === "victory"
                          ? `Victoria: +${battle.reward} de oro, +${battle.expReward} exp${battle.awardedPoint ? " y +1 punto" : ""}`
                          : "Derrota: sin recompensa"}
                      </p>
                      {battle.result === "victory" ? (
                        <div className="mt-3 space-y-2 text-sm text-stone-300">
                          <p>
                            Nivel final: <span className="font-bold text-stone-100">Lv {battle.levelAfter}</span>
                            {battle.levelsGained > 0 ? ` (+${battle.levelsGained})` : ""}
                          </p>
                          {battle.milestonePointsGained > 0 ? (
                            <p>Hito de nivel: +{battle.milestonePointsGained} punto extra para stats.</p>
                          ) : null}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={resetBattle}
                        className="mt-3 w-full rounded-2xl bg-stone-100 px-4 py-3 text-sm font-black text-stone-950"
                      >
                        Reiniciar combate
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex min-h-64 items-center justify-center rounded-[1.4rem] border border-dashed border-stone-800 bg-stone-900/60 px-5 text-center text-sm leading-6 text-stone-400">
                  Elige un contrato y entra directo al combate arcade. Esta version prioriza ritmo, claridad y lectura limpia en movil.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function UpgradeCard({
  icon: Icon,
  label,
  value,
  hint,
  disabled,
  onUpgrade,
}: {
  icon: typeof Swords;
  label: string;
  value: number;
  hint: string;
  disabled: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="rounded-[1.3rem] border border-stone-800 bg-stone-900/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-black text-stone-100">{label}</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{hint}</p>
          </div>
        </div>
        <span className="text-xl font-black text-stone-100">{value}</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onUpgrade}
        className="mt-3 w-full rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-35"
      >
        + Subir
      </button>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.1rem] border border-stone-800 bg-stone-900/80 p-3">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-stone-100">{value}</p>
    </div>
  );
}

function BarCard({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "player" | "enemy";
}) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  const barTone =
    tone === "player" ? "from-emerald-400 to-emerald-600" : "from-rose-400 to-rose-600";

  return (
    <div className="rounded-[1.3rem] border border-stone-800 bg-stone-900/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-300">{label}</p>
        <p className="text-sm font-black text-stone-100">{value}/{max}</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${barTone}`} style={{ width }} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  disabled,
  onClick,
  badge,
}: {
  label: string;
  icon: typeof Swords;
  disabled: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-[1.2rem] border border-stone-800 bg-stone-900/80 px-3 py-4 transition hover:border-amber-400/30 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-100">
          {label}
        </p>
        {badge ? (
          <span className="rounded-full border border-stone-700 bg-stone-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function ArcadePlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
        <Swords className="h-8 w-8" />
      </div>
      <p className="mt-4 text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}
