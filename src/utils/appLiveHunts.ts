import { APP_LIVE_HUNT_TEMPLATES, getAppLiveHuntTemplate } from "../data/appLiveHunts";
import type {
  AppLiveHuntAction,
  AppLiveHuntActionType,
  AppLiveHuntMember,
  AppLiveHuntRoom,
  AppLiveHuntRound,
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

export type AppLiveHuntSnapshot = {
  room: AppLiveHuntRoom;
  members: AppLiveHuntMember[];
  actions: AppLiveHuntAction[];
  rounds: AppLiveHuntRound[];
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
  return {
    id: row.id,
    huntId: row.hunt_id,
    playerId: row.player_id,
    username: row.username,
    sheetId: row.sheet_id,
    sheetName: row.sheet_name,
    sheetLevel: row.sheet_level,
    sheetPower: row.sheet_power,
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

function isMissingTable(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("42p01");
}

function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  ]);

  if (roomError || membersError || actionsError || roundsError || !room) {
    return null;
  }

  return {
    room: mapRoom(room as LiveHuntRoomRow),
    members: (members as LiveHuntMemberRow[]).map(mapMember),
    actions: (actions as LiveHuntActionRow[]).map(mapAction),
    rounds: (rounds as LiveHuntRoundRow[]).map(mapRound),
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
  const huntPayload = {
    template_id: template.id,
    title: template.title,
    description: template.description,
    enemy_name: template.enemyName,
    host_player_id: input.hostPlayerId,
    host_username: input.hostUsername,
    host_sheet_id: input.hostSheet.id,
    host_sheet_name: input.hostSheet.name || "Ficha sin nombre",
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
  const currentActions = snapshot.actions.filter(
    (action) => action.roundNumber === room.currentRound
  );

  let totalDamage = 0;
  let threatDelta = 0;
  let rewardDelta = 0;
  const summaryParts: string[] = [];

  const silentHunters = snapshot.members.filter(
    (member) => !currentActions.some((action) => action.playerId === member.playerId)
  );

  currentActions.forEach((action) => {
    const member = snapshot.members.find((entry) => entry.playerId === action.playerId);
    const level = member?.sheetLevel ?? 1;
    const power = member?.sheetPower ?? template.recommendedPower;

    switch (action.actionType) {
      case "attack": {
        const damage = 14 + Math.floor(power / 11) + randomRange(0, 7);
        totalDamage += damage;
        threatDelta += 4;
        summaryParts.push(`${action.sheetName} presiona la linea y abre ${damage} de dano.`);
        break;
      }
      case "guard": {
        const damage = 5 + Math.floor(level / 2);
        totalDamage += damage;
        threatDelta -= 10 + Math.floor(power / 24);
        rewardDelta += 40 + level * 4;
        summaryParts.push(`${action.sheetName} contiene la amenaza y estabiliza el frente.`);
        break;
      }
      case "channel": {
        const damage = 10 + Math.floor(power / 16) + randomRange(0, 5);
        totalDamage += damage;
        threatDelta -= 3;
        rewardDelta += 85 + level * 6;
        summaryParts.push(`${action.sheetName} canaliza reliquias y mejora el botin comunal.`);
        break;
      }
      case "sabotage": {
        const damage = 20 + Math.floor(power / 9) + randomRange(2, 10);
        totalDamage += damage;
        threatDelta += 8;
        rewardDelta += 55 + level * 5;
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
  threatDelta += enemyCounter;

  const nextEnemyHp = Math.max(0, room.enemyHp - totalDamage);
  const nextThreat = Math.max(0, room.threat + threatDelta);
  const nextRewardPool = Math.max(0, room.rewardPool + rewardDelta);

  let nextStatus: AppLiveHuntRoom["status"] = "active";
  let nextRound = room.currentRound + 1;

  if (nextEnemyHp <= 0) {
    nextStatus = "victory";
    nextRound = room.currentRound;
    summaryParts.push(
      `La cuadrilla remata a ${room.enemyName}. El botin potencial queda en ${nextRewardPool} de oro para narrar y repartir luego.`
    );
  } else if (nextThreat >= room.threatCap || room.currentRound >= room.maxRounds) {
    nextStatus = "defeat";
    nextRound = room.currentRound;
    summaryParts.push(
      `La amenaza supera el margen del contrato y ${room.enemyName} retiene el frente.`
    );
  } else {
    summaryParts.push(
      `La caceria sigue abierta. La ronda ${nextRound} ya puede prepararse.`
    );
  }

  const summary = summaryParts.join(" ");

  const [{ error: roundError }, { error: roomError }] = await Promise.all([
    supabase.from("app_live_hunt_rounds").insert({
      hunt_id: room.id,
      round_number: room.currentRound,
      summary,
      enemy_damage: totalDamage,
      threat_delta: threatDelta,
      reward_delta: rewardDelta,
    }),
    supabase
      .from("app_live_hunts")
      .update({
        status: nextStatus,
        current_round: nextRound,
        enemy_hp: nextEnemyHp,
        threat: nextThreat,
        reward_pool: nextRewardPool,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id),
  ]);

  if (roundError || roomError) {
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
