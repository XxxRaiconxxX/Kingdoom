import {
  APP_LIVE_HUNT_MUTATORS,
  APP_LIVE_HUNT_SPECIALIZATIONS,
  APP_LIVE_HUNT_TEMPLATES,
  getAppLiveHuntMutator,
  getAppLiveHuntTemplate,
} from "../data/appLiveHunts";
import type {
  AppLiveHuntAction,
  AppLiveHuntActionType,
  AppLiveHuntMember,
  AppLiveHuntResult,
  AppLiveHuntRoom,
  AppLiveHuntRound,
  AppLiveHuntSpecialization,
  CharacterSheet,
  PvePlayerProgress,
} from "../types";
import { supabase } from "./supabaseClient";

type LiveHuntRoomRow = {
  id: string;
  template_id: string;
  title: string;
  description: string;
  enemy_name: string;
  host_player_id: string;
  host_username: string;
  host_sheet_id: string;
  host_sheet_name: string;
  mutator_id?: string | null;
  mutator_title?: string | null;
  mutator_summary?: string | null;
  status: AppLiveHuntRoom["status"];
  current_round: number;
  max_rounds: number;
  enemy_hp: number;
  enemy_max_hp: number;
  threat: number;
  threat_cap: number;
  reward_pool: number;
  created_at: string;
  updated_at: string;
};

type LiveHuntMemberRow = {
  id: string;
  hunt_id: string;
  player_id: string;
  username: string;
  sheet_id: string;
  sheet_name: string;
  sheet_level: number;
  sheet_power: number;
  specialization?: AppLiveHuntSpecialization | null;
  specialization_title?: string | null;
  joined_at: string;
};

type LiveHuntActionRow = {
  id: string;
  hunt_id: string;
  round_number: number;
  player_id: string;
  player_username: string;
  sheet_id: string;
  sheet_name: string;
  action_type: AppLiveHuntActionType;
  created_at: string;
};

type LiveHuntRoundRow = {
  id: string;
  hunt_id: string;
  round_number: number;
  summary: string;
  enemy_damage: number;
  threat_delta: number;
  reward_delta: number;
  created_at: string;
};

type LiveHuntResultRow = {
  id: string;
  hunt_id: string;
  player_id: string;
  username: string;
  sheet_id: string;
  sheet_name: string;
  outcome: AppLiveHuntRoom["status"];
  gold_reward: number;
  participation_score: number;
  created_at: string;
};

export type AppLiveHuntSnapshot = {
  room: AppLiveHuntRoom;
  members: AppLiveHuntMember[];
  actions: AppLiveHuntAction[];
  rounds: AppLiveHuntRound[];
  results: AppLiveHuntResult[];
};

export type AppLiveHuntState = {
  status: "ready" | "fallback";
  message: string;
  rooms: AppLiveHuntRoom[];
};

function mapRoom(row: LiveHuntRoomRow): AppLiveHuntRoom {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    description: row.description,
    enemyName: row.enemy_name,
    hostPlayerId: row.host_player_id,
    hostUsername: row.host_username,
    hostSheetId: row.host_sheet_id,
    hostSheetName: row.host_sheet_name,
    mutatorId: row.mutator_id ?? APP_LIVE_HUNT_MUTATORS[0].id,
    mutatorTitle: row.mutator_title ?? APP_LIVE_HUNT_MUTATORS[0].title,
    mutatorSummary: row.mutator_summary ?? APP_LIVE_HUNT_MUTATORS[0].summary,
    status: row.status,
    currentRound: row.current_round,
    maxRounds: row.max_rounds,
    enemyHp: row.enemy_hp,
    enemyMaxHp: row.enemy_max_hp,
    threat: row.threat,
    threatCap: row.threat_cap,
    rewardPool: row.reward_pool,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: LiveHuntMemberRow): AppLiveHuntMember {
  const specialization =
    row.specialization && row.specialization in APP_LIVE_HUNT_SPECIALIZATIONS
      ? row.specialization
      : "strategist";
  return {
    id: row.id,
    huntId: row.hunt_id,
    playerId: row.player_id,
    username: row.username,
    sheetId: row.sheet_id,
    sheetName: row.sheet_name,
    sheetLevel: row.sheet_level,
    sheetPower: row.sheet_power,
    specialization,
    specializationTitle:
      row.specialization_title ??
      APP_LIVE_HUNT_SPECIALIZATIONS[specialization].title,
    joinedAt: row.joined_at,
  };
}

function mapAction(row: LiveHuntActionRow): AppLiveHuntAction {
  return {
    id: row.id,
    huntId: row.hunt_id,
    roundNumber: row.round_number,
    playerId: row.player_id,
    playerUsername: row.player_username,
    sheetId: row.sheet_id,
    sheetName: row.sheet_name,
    actionType: row.action_type,
    createdAt: row.created_at,
  };
}

function mapRound(row: LiveHuntRoundRow): AppLiveHuntRound {
  return {
    id: row.id,
    huntId: row.hunt_id,
    roundNumber: row.round_number,
    summary: row.summary,
    enemyDamage: row.enemy_damage,
    threatDelta: row.threat_delta,
    rewardDelta: row.reward_delta,
    createdAt: row.created_at,
  };
}

function mapResult(row: LiveHuntResultRow): AppLiveHuntResult {
  return {
    id: row.id,
    huntId: row.hunt_id,
    playerId: row.player_id,
    username: row.username,
    sheetId: row.sheet_id,
    sheetName: row.sheet_name,
    outcome: row.outcome,
    goldReward: row.gold_reward,
    participationScore: row.participation_score,
    createdAt: row.created_at,
  };
}

function isMissingTable(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("42p01");
}

function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomMutator(templateId: string) {
  const template = getAppLiveHuntTemplate(templateId);
  const pool = template.mutatorPool
    .map((mutatorId) => getAppLiveHuntMutator(mutatorId))
    .filter(Boolean);
  return pool[randomRange(0, Math.max(0, pool.length - 1))] ?? APP_LIVE_HUNT_MUTATORS[0];
}

export function resolveAppLiveHuntSpecialization(progress: PvePlayerProgress) {
  const entries = [
    { key: "vanguard" as const, value: progress.stats.strength },
    { key: "bastion" as const, value: progress.stats.life },
    { key: "warden" as const, value: progress.stats.defense },
  ].sort((left, right) => right.value - left.value);

  if (entries[0].value <= 0) {
    return "strategist" as const;
  }

  if (entries[0].value === entries[1].value) {
    return "strategist" as const;
  }

  return entries[0].key;
}

export async function fetchAppLiveHunts(): Promise<AppLiveHuntState> {
  const { data, error } = await supabase
    .from("app_live_hunts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return {
      status: "fallback",
      message: isMissingTable(error.message)
        ? "La caceria comunal aun no tiene tablas en Supabase. Ejecuta `supabase_app_live_hunts.sql` para activarla."
        : "No se pudieron cargar las salas en vivo desde Supabase.",
      rooms: [],
    };
  }

  return {
    status: "ready",
    message: "",
    rooms: (data as LiveHuntRoomRow[]).map(mapRoom),
  };
}

export async function fetchAppLiveHuntSnapshot(
  huntId: string
): Promise<AppLiveHuntSnapshot | null> {
  const [
    { data: room, error: roomError },
    { data: members, error: membersError },
    { data: actions, error: actionsError },
    { data: rounds, error: roundsError },
    { data: results, error: resultsError },
  ] = await Promise.all([
    supabase.from("app_live_hunts").select("*").eq("id", huntId).maybeSingle(),
    supabase
      .from("app_live_hunt_members")
      .select("*")
      .eq("hunt_id", huntId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("app_live_hunt_actions")
      .select("*")
      .eq("hunt_id", huntId)
      .order("created_at", { ascending: true }),
    supabase
      .from("app_live_hunt_rounds")
      .select("*")
      .eq("hunt_id", huntId)
      .order("round_number", { ascending: false }),
    supabase
      .from("app_live_hunt_results")
      .select("*")
      .eq("hunt_id", huntId)
      .order("gold_reward", { ascending: false }),
  ]);

  if (
    roomError ||
    membersError ||
    actionsError ||
    roundsError ||
    resultsError ||
    !room
  ) {
    return null;
  }

  return {
    room: mapRoom(room as LiveHuntRoomRow),
    members: (members as LiveHuntMemberRow[]).map(mapMember),
    actions: (actions as LiveHuntActionRow[]).map(mapAction),
    rounds: (rounds as LiveHuntRoundRow[]).map(mapRound),
    results: (results as LiveHuntResultRow[]).map(mapResult),
  };
}

export async function createAppLiveHunt(input: {
  templateId: string;
  hostPlayerId: string;
  hostUsername: string;
  hostSheet: CharacterSheet;
  hostProgress: PvePlayerProgress;
}) {
  const template = getAppLiveHuntTemplate(input.templateId);
  const mutator = pickRandomMutator(input.templateId);
  const huntPayload = {
    template_id: template.id,
    title: template.title,
    description: template.description,
    enemy_name: template.enemyName,
    host_player_id: input.hostPlayerId,
    host_username: input.hostUsername,
    host_sheet_id: input.hostSheet.id,
    host_sheet_name: input.hostSheet.name || "Ficha sin nombre",
    mutator_id: mutator.id,
    mutator_title: mutator.title,
    mutator_summary: mutator.summary,
    status: "lobby",
    current_round: 1,
    max_rounds: template.maxRounds,
    enemy_hp: template.baseEnemyHp,
    enemy_max_hp: template.baseEnemyHp,
    threat: 20,
    threat_cap: template.threatCap,
    reward_pool: template.rewardBase,
  };

  const { data, error } = await supabase
    .from("app_live_hunts")
    .insert(huntPayload)
    .select("*")
    .single();

  if (error || !data) {
    return {
      status: "error" as const,
      message: isMissingTable(error?.message ?? "")
        ? "Faltan las tablas de Caceria comunal en Supabase."
        : "No se pudo abrir la sala de caceria.",
      room: null,
    };
  }

  const joinResult = await joinAppLiveHunt({
    huntId: (data as LiveHuntRoomRow).id,
    playerId: input.hostPlayerId,
    username: input.hostUsername,
    sheet: input.hostSheet,
    progress: input.hostProgress,
  });

  if (joinResult.status === "error") {
    return {
      status: "error" as const,
      message: joinResult.message,
      room: null,
    };
  }

  return {
    status: "created" as const,
    message: "Sala abierta. Ya puedes reunir a la cuadrilla.",
    room: mapRoom(data as LiveHuntRoomRow),
  };
}

export async function joinAppLiveHunt(input: {
  huntId: string;
  playerId: string;
  username: string;
  sheet: CharacterSheet;
  progress: PvePlayerProgress;
}) {
  const specialization = resolveAppLiveHuntSpecialization(input.progress);
  const payload = {
    hunt_id: input.huntId,
    player_id: input.playerId,
    username: input.username,
    sheet_id: input.sheet.id,
    sheet_name: input.sheet.name || "Ficha sin nombre",
    sheet_level: input.progress.level,
    sheet_power:
      input.progress.level * 12 +
      input.progress.stats.strength * 8 +
      input.progress.stats.life * 7 +
      input.progress.stats.defense * 7,
    specialization,
    specialization_title: APP_LIVE_HUNT_SPECIALIZATIONS[specialization].title,
  };

  const { error } = await supabase
    .from("app_live_hunt_members")
    .upsert(payload, { onConflict: "hunt_id,player_id" });

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo unir la ficha a la caceria comunal.",
    };
  }

  return {
    status: "joined" as const,
    message: "Te uniste a la caceria comunal.",
  };
}

export async function setAppLiveHuntStatus(
  huntId: string,
  status: AppLiveHuntRoom["status"]
) {
  const { error } = await supabase
    .from("app_live_hunts")
    .update({
      status,
      ...(status === "active" ? { current_round: 1 } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", huntId);

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo actualizar el estado de la caceria.",
    };
  }

  return {
    status: "saved" as const,
    message:
      status === "active"
        ? "La caceria ya esta activa. Los jugadores pueden marcar accion."
        : "El estado de la sala fue actualizado.",
  };
}

export async function submitAppLiveHuntAction(input: {
  huntId: string;
  roundNumber: number;
  playerId: string;
  playerUsername: string;
  sheetId: string;
  sheetName: string;
  actionType: AppLiveHuntActionType;
}) {
  const { error } = await supabase.from("app_live_hunt_actions").upsert(
    {
      hunt_id: input.huntId,
      round_number: input.roundNumber,
      player_id: input.playerId,
      player_username: input.playerUsername,
      sheet_id: input.sheetId,
      sheet_name: input.sheetName,
      action_type: input.actionType,
    },
    { onConflict: "hunt_id,round_number,player_id" }
  );

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo registrar tu accion de ronda.",
    };
  }

  return {
    status: "saved" as const,
    message: "Accion enviada. Esperando al resto de la cuadrilla.",
  };
}

export async function resolveAppLiveHuntRound(snapshot: AppLiveHuntSnapshot) {
  const room = snapshot.room;
  const template = getAppLiveHuntTemplate(room.templateId);
  const mutator = getAppLiveHuntMutator(room.mutatorId);
  const currentActions = snapshot.actions.filter(
    (action) => action.roundNumber === room.currentRound
  );

  let totalDamage = 0;
  let threatDelta = 0;
  let rewardDelta = 0;
  const summaryParts: string[] = [];
  const participationMap = new Map<
    string,
    {
      playerId: string;
      username: string;
      sheetId: string;
      sheetName: string;
      score: number;
    }
  >();

  const silentHunters = snapshot.members.filter(
    (member) => !currentActions.some((action) => action.playerId === member.playerId)
  );

  currentActions.forEach((action) => {
    const member = snapshot.members.find((entry) => entry.playerId === action.playerId);
    const level = member?.sheetLevel ?? 1;
    const power = member?.sheetPower ?? template.recommendedPower;
    const specialization = member?.specialization ?? "strategist";

    switch (action.actionType) {
      case "attack": {
        const specializationBonus =
          specialization === "vanguard" ? 10 : specialization === "strategist" ? 4 : 0;
        const damage = Math.round(
          (14 + Math.floor(power / 11) + specializationBonus + randomRange(0, 7)) *
            mutator.damageMod
        );
        totalDamage += damage;
        threatDelta += 4;
        participationMap.set(action.playerId, {
          playerId: action.playerId,
          username: action.playerUsername,
          sheetId: action.sheetId,
          sheetName: action.sheetName,
          score: damage + 18,
        });
        summaryParts.push(`${action.sheetName} presiona la linea y abre ${damage} de dano.`);
        break;
      }
      case "guard": {
        const guardBonus =
          specialization === "bastion" ? 12 : specialization === "warden" ? 6 : 0;
        const damage = 5 + Math.floor(level / 2) + (specialization === "warden" ? 4 : 0);
        totalDamage += damage;
        threatDelta -= 10 + Math.floor(power / 24) + guardBonus;
        rewardDelta += 40 + level * 4 + (specialization === "bastion" ? 18 : 0);
        participationMap.set(action.playerId, {
          playerId: action.playerId,
          username: action.playerUsername,
          sheetId: action.sheetId,
          sheetName: action.sheetName,
          score: damage + 30 + guardBonus,
        });
        summaryParts.push(`${action.sheetName} contiene la amenaza y estabiliza el frente.`);
        break;
      }
      case "channel": {
        const channelBonus =
          specialization === "strategist" ? 34 : specialization === "bastion" ? 14 : 0;
        const damage = Math.round(
          (10 + Math.floor(power / 16) + randomRange(0, 5)) *
            (specialization === "strategist" ? 1.05 : 1)
        );
        totalDamage += damage;
        threatDelta -= 3 + (specialization === "strategist" ? 4 : 0);
        rewardDelta += 85 + level * 6 + channelBonus;
        participationMap.set(action.playerId, {
          playerId: action.playerId,
          username: action.playerUsername,
          sheetId: action.sheetId,
          sheetName: action.sheetName,
          score: damage + 24 + Math.floor(channelBonus / 2),
        });
        summaryParts.push(`${action.sheetName} canaliza reliquias y mejora el botin comunal.`);
        break;
      }
      case "sabotage": {
        const sabotageBonus = specialization === "vanguard" ? 8 : 0;
        const threatPenalty = specialization === "warden" ? 4 : 0;
        const damage = Math.round(
          (20 + Math.floor(power / 9) + sabotageBonus + randomRange(2, 10)) *
            mutator.damageMod
        );
        totalDamage += damage;
        threatDelta += Math.max(2, 8 - threatPenalty);
        rewardDelta += 55 + level * 5;
        participationMap.set(action.playerId, {
          playerId: action.playerId,
          username: action.playerUsername,
          sheetId: action.sheetId,
          sheetName: action.sheetName,
          score: damage + 20 + sabotageBonus,
        });
        summaryParts.push(`${action.sheetName} sabotea el flanco y deja una grieta enorme.`);
        break;
      }
    }
  });

  if (silentHunters.length > 0) {
    threatDelta += silentHunters.length * 6;
    summaryParts.push(
      `${silentHunters.length} integrante(s) no marcaron accion y la caceria perdio ritmo.`
    );
  }

  const enemyCounter = 12 + room.currentRound * 3 + randomRange(0, 6);
  threatDelta += enemyCounter + mutator.threatMod;

  const nextEnemyHp = Math.max(0, room.enemyHp - totalDamage);
  const nextThreat = Math.max(0, room.threat + threatDelta);
  const nextRewardPool = Math.max(
    0,
    Math.round(room.rewardPool + rewardDelta * mutator.rewardMod)
  );

  let nextStatus: AppLiveHuntRoom["status"] = "active";
  let nextRound = room.currentRound + 1;
  let settlementPayload: Array<{
    player_id: string;
    username: string;
    sheet_id: string;
    sheet_name: string;
    gold_reward: number;
    participation_score: number;
  }> = [];

  if (nextEnemyHp <= 0) {
    nextStatus = "victory";
    nextRound = room.currentRound;
    const participants = snapshot.members.map((member) => {
      const participation = participationMap.get(member.playerId);
      return {
        player_id: member.playerId,
        username: member.username,
        sheet_id: member.sheetId,
        sheet_name: member.sheetName,
        participation_score:
          participation?.score ??
          Math.max(8, Math.floor(member.sheetPower / 16) + member.sheetLevel * 2),
      };
    });
    const totalScore = participants.reduce(
      (sum, entry) => sum + entry.participation_score,
      0
    );
    settlementPayload = participants.map((entry) => ({
      ...entry,
      gold_reward:
        totalScore > 0
          ? Math.max(
              60,
              Math.round((nextRewardPool * entry.participation_score) / totalScore)
            )
          : Math.max(60, Math.round(nextRewardPool / Math.max(1, participants.length))),
    }));
    summaryParts.push(
      `La cuadrilla remata a ${room.enemyName}. ${mutator.title} termina inclinando el reparto y el botin queda en ${nextRewardPool} de oro segun el peso de cada integrante.`
    );
  } else if (nextThreat >= room.threatCap || room.currentRound >= room.maxRounds) {
    nextStatus = "defeat";
    nextRound = room.currentRound;
    settlementPayload = snapshot.members.map((member) => ({
      player_id: member.playerId,
      username: member.username,
      sheet_id: member.sheetId,
      sheet_name: member.sheetName,
      gold_reward: Math.max(12, Math.round(room.rewardPool * 0.08)),
      participation_score:
        participationMap.get(member.playerId)?.score ??
        Math.max(6, Math.floor(member.sheetPower / 18) + member.sheetLevel),
    }));
    summaryParts.push(
      `La amenaza supera el margen del contrato y ${room.enemyName} retiene el frente. ${mutator.title} endurecio la caza y la cuadrilla solo rescata una parte menor del botin.`
    );
  } else {
    summaryParts.push(
      `La caceria sigue abierta bajo ${mutator.title}. La ronda ${nextRound} ya puede prepararse.`
    );
  }

  const summary = summaryParts.join(" ");
  const { error: settleError } = await supabase.rpc("settle_app_live_hunt", {
    p_hunt_id: room.id,
    p_round_number: room.currentRound,
    p_summary: summary,
    p_enemy_damage: totalDamage,
    p_threat_delta: threatDelta,
    p_reward_delta: rewardDelta,
    p_next_status: nextStatus,
    p_next_round: nextRound,
    p_next_enemy_hp: nextEnemyHp,
    p_next_threat: nextThreat,
    p_next_reward_pool: nextRewardPool,
    p_rewards: settlementPayload,
  });

  if (settleError) {
    return {
      status: "error" as const,
      message: "No se pudo resolver la ronda en Supabase.",
    };
  }

  return {
    status: "resolved" as const,
    message:
      nextStatus === "victory"
        ? "Ronda resuelta. La cuadrilla tumbo el contrato."
        : nextStatus === "defeat"
        ? "Ronda resuelta. La caceria se perdio."
        : "Ronda resuelta. Ya puedes preparar la siguiente decision.",
  };
}

export function buildAppLiveHuntRoomLabel(room: AppLiveHuntRoom) {
  const template = APP_LIVE_HUNT_TEMPLATES.find((entry) => entry.id === room.templateId);
  return template?.shortLabel ?? room.title;
}
