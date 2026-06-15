import { supabase } from "./supabaseClient";
import type { MissionDifficulty, RankName, RankTier } from "../types";

export type PlayerRankSnapshot = {
  monthlyPoints: number;
  completedRewardedMissions: number;
  rewardedEvents: number;
  manualAwardsCount: number;
  rankName: RankName;
  rankTier: RankTier;
  monthStartsAt: string;
  monthEndsAt: string;
  seasonId: string | null;
  seasonName: string;
  seedPoints: number;
  currentRankMinPoints: number;
  nextRankMinPoints: number | null;
  nextRankName: RankName | null;
  nextRankTier: RankTier | null;
  progressWithinRankPercent: number;
  seasonProgressPercent: number;
};

type MissionRankClaimRow = {
  id: string;
  reward_delivered_at: string | null;
  realm_missions:
    | {
        difficulty?: MissionDifficulty | null;
      }
    | Array<{
        difficulty?: MissionDifficulty | null;
      }>
    | null;
};

type EventRankParticipantRow = {
  id: string;
  reward_delivered_at: string | null;
};

type RankStep = {
  minPoints: number;
  rankName: RankName;
  rankTier: RankTier;
};

type SeasonRankPointRuleRow = {
  scope: "mission" | "event";
  rule_key: string;
  mission_difficulty?: MissionDifficulty | null;
  base_points: number;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type SeasonRankThresholdRow = {
  rank_name: RankName;
  rank_tier: RankTier;
  min_points: number;
  is_active?: boolean | null;
  sort_order: number;
};

type SeasonRankSeasonRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "active" | "closed";
};

type SeasonRankSeedRow = {
  seed_points: number;
  seed_rank_name: RankName;
  seed_rank_tier: RankTier;
};

type SeasonRankAwardRow = {
  id: string;
  points_awarded: number;
};

const FALLBACK_MISSION_POINTS: Record<MissionDifficulty, number> = {
  easy: 12,
  medium: 28,
  hard: 55,
  elite: 95,
};

const FALLBACK_EVENT_POINTS = 50;

const FALLBACK_RANK_STEPS: RankStep[] = [
  { minPoints: 0, rankName: "siervo", rankTier: "III" },
  { minPoints: 40, rankName: "siervo", rankTier: "II" },
  { minPoints: 90, rankName: "siervo", rankTier: "I" },
  { minPoints: 160, rankName: "escudero", rankTier: "III" },
  { minPoints: 240, rankName: "escudero", rankTier: "II" },
  { minPoints: 340, rankName: "escudero", rankTier: "I" },
  { minPoints: 470, rankName: "caballero", rankTier: "III" },
  { minPoints: 620, rankName: "caballero", rankTier: "II" },
  { minPoints: 790, rankName: "caballero", rankTier: "I" },
  { minPoints: 980, rankName: "senor", rankTier: "III" },
  { minPoints: 1200, rankName: "senor", rankTier: "II" },
  { minPoints: 1450, rankName: "senor", rankTier: "I" },
  { minPoints: 1730, rankName: "senor-oscuro", rankTier: "III" },
  { minPoints: 2050, rankName: "senor-oscuro", rankTier: "II" },
  { minPoints: 2400, rankName: "senor-oscuro", rankTier: "I" },
];

function getFallbackSeasonWindow(now = new Date()) {
  const monthStartsAt = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const seasonEndsAt = new Date(monthStartsAt);
  seasonEndsAt.setDate(seasonEndsAt.getDate() + 70);

  return {
    seasonId: null,
    seasonName: "Temporada provisional",
    monthStartsAt: monthStartsAt.toISOString(),
    monthEndsAt: seasonEndsAt.toISOString(),
  };
}

function getMissionDifficulty(
  relation: MissionRankClaimRow["realm_missions"]
): MissionDifficulty | null {
  if (Array.isArray(relation)) {
    return relation[0]?.difficulty ?? null;
  }

  return relation?.difficulty ?? null;
}

function buildMissionPointMap(
  rows: SeasonRankPointRuleRow[] | null | undefined
): Record<MissionDifficulty, number> {
  const nextMap = { ...FALLBACK_MISSION_POINTS };

  for (const row of rows ?? []) {
    if (row.scope !== "mission" || !row.mission_difficulty) {
      continue;
    }

    nextMap[row.mission_difficulty] = Math.max(0, Math.floor(row.base_points ?? 0));
  }

  return nextMap;
}

function resolveEventPointValue(rows: SeasonRankPointRuleRow[] | null | undefined) {
  const eventRule = (rows ?? []).find(
    (row) => row.scope === "event" && row.rule_key === "rewarded_participation"
  );

  if (!eventRule) {
    return FALLBACK_EVENT_POINTS;
  }

  return Math.max(0, Math.floor(eventRule.base_points ?? 0));
}

function buildRankSteps(rows: SeasonRankThresholdRow[] | null | undefined): RankStep[] {
  if (!rows || rows.length === 0) {
    return FALLBACK_RANK_STEPS;
  }

  const mapped = rows
    .filter((row) => typeof row.min_points === "number")
    .sort((left, right) => {
      if ((left.sort_order ?? 0) !== (right.sort_order ?? 0)) {
        return (left.sort_order ?? 0) - (right.sort_order ?? 0);
      }

      return left.min_points - right.min_points;
    })
    .map<RankStep>((row) => ({
      minPoints: Math.max(0, Math.floor(row.min_points)),
      rankName: row.rank_name,
      rankTier: row.rank_tier,
    }));

  return mapped.length > 0 ? mapped : FALLBACK_RANK_STEPS;
}

function deriveRankFromSteps(points: number, rankSteps: RankStep[]): Pick<
  PlayerRankSnapshot,
  "rankName" | "rankTier"
> {
  let resolved = rankSteps[0] ?? FALLBACK_RANK_STEPS[0];

  for (const step of rankSteps) {
    if (points >= step.minPoints) {
      resolved = step;
    } else {
      break;
    }
  }

  return {
    rankName: resolved.rankName,
    rankTier: resolved.rankTier,
  };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function describeProgress(
  points: number,
  rankSteps: RankStep[]
): Pick<
  PlayerRankSnapshot,
  | "currentRankMinPoints"
  | "nextRankMinPoints"
  | "nextRankName"
  | "nextRankTier"
  | "progressWithinRankPercent"
> {
  let currentIndex = 0;

  for (let index = 0; index < rankSteps.length; index += 1) {
    if (points >= rankSteps[index].minPoints) {
      currentIndex = index;
    } else {
      break;
    }
  }

  const currentStep = rankSteps[currentIndex] ?? FALLBACK_RANK_STEPS[0];
  const nextStep = rankSteps[currentIndex + 1] ?? null;

  if (!nextStep) {
    return {
      currentRankMinPoints: currentStep.minPoints,
      nextRankMinPoints: null,
      nextRankName: null,
      nextRankTier: null,
      progressWithinRankPercent: 100,
    };
  }

  const span = Math.max(1, nextStep.minPoints - currentStep.minPoints);
  const progress = ((points - currentStep.minPoints) / span) * 100;

  return {
    currentRankMinPoints: currentStep.minPoints,
    nextRankMinPoints: nextStep.minPoints,
    nextRankName: nextStep.rankName,
    nextRankTier: nextStep.rankTier,
    progressWithinRankPercent: clampPercent(progress),
  };
}

function computeSeasonProgressPercent(startsAt: string, endsAt: string, now = new Date()) {
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }

  return clampPercent(((nowMs - startMs) / (endMs - startMs)) * 100);
}

async function fetchActiveSeason() {
  const { data, error } = await supabase
    .from("season_rank_seasons")
    .select("id, name, starts_at, ends_at, status")
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return getFallbackSeasonWindow();
  }

  const season = data as SeasonRankSeasonRow;

  return {
    seasonId: season.id,
    seasonName: season.name?.trim() || "Temporada activa",
    monthStartsAt: season.starts_at,
    monthEndsAt: season.ends_at,
  };
}

export async function fetchPlayerMonthlyRankSnapshot(
  playerId: string
): Promise<PlayerRankSnapshot> {
  const normalizedPlayerId = playerId.trim();
  const season = await fetchActiveSeason();

  if (!normalizedPlayerId) {
    return {
      monthlyPoints: 0,
      completedRewardedMissions: 0,
      rewardedEvents: 0,
      manualAwardsCount: 0,
      rankName: "siervo",
      rankTier: "III",
      monthStartsAt: season.monthStartsAt,
      monthEndsAt: season.monthEndsAt,
      seasonId: season.seasonId,
      seasonName: season.seasonName,
      seedPoints: 0,
      currentRankMinPoints: 0,
      nextRankMinPoints: 40,
      nextRankName: "siervo",
      nextRankTier: "II",
      progressWithinRankPercent: 0,
      seasonProgressPercent: computeSeasonProgressPercent(
        season.monthStartsAt,
        season.monthEndsAt
      ),
    };
  }

  const [
    pointRulesResult,
    thresholdsResult,
    seedResult,
    missionsResult,
    eventsResult,
    awardsResult,
  ] = await Promise.all([
    supabase
      .from("season_rank_point_rules")
      .select("scope, rule_key, mission_difficulty, base_points, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("season_rank_thresholds")
      .select("rank_name, rank_tier, min_points, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    season.seasonId
      ? supabase
          .from("season_rank_player_seeds")
          .select("seed_points, seed_rank_name, seed_rank_tier")
          .eq("season_id", season.seasonId)
          .eq("player_id", normalizedPlayerId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("realm_mission_claims")
      .select("id, reward_delivered_at, realm_missions(difficulty)")
      .eq("player_id", normalizedPlayerId)
      .eq("reward_delivered", true)
      .eq("status", "rewarded")
      .gte("reward_delivered_at", season.monthStartsAt)
      .lt("reward_delivered_at", season.monthEndsAt),
    supabase
      .from("realm_event_participants")
      .select("id, reward_delivered_at")
      .eq("player_id", normalizedPlayerId)
      .eq("reward_delivered", true)
      .eq("status", "rewarded")
      .gte("reward_delivered_at", season.monthStartsAt)
      .lt("reward_delivered_at", season.monthEndsAt),
    season.seasonId
      ? supabase
          .from("season_rank_awards")
          .select("id, points_awarded")
          .eq("season_id", season.seasonId)
          .eq("player_id", normalizedPlayerId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (missionsResult.error || eventsResult.error || awardsResult.error) {
    return {
      monthlyPoints: 0,
      completedRewardedMissions: 0,
      rewardedEvents: 0,
      manualAwardsCount: 0,
      rankName: "siervo",
      rankTier: "III",
      monthStartsAt: season.monthStartsAt,
      monthEndsAt: season.monthEndsAt,
      seasonId: season.seasonId,
      seasonName: season.seasonName,
      seedPoints: 0,
      currentRankMinPoints: 0,
      nextRankMinPoints: 40,
      nextRankName: "siervo",
      nextRankTier: "II",
      progressWithinRankPercent: 0,
      seasonProgressPercent: computeSeasonProgressPercent(
        season.monthStartsAt,
        season.monthEndsAt
      ),
    };
  }

  const pointRules = pointRulesResult.error
    ? null
    : ((pointRulesResult.data ?? []) as SeasonRankPointRuleRow[]);
  const thresholds = thresholdsResult.error
    ? null
    : ((thresholdsResult.data ?? []) as SeasonRankThresholdRow[]);
  const seedRow = seedResult?.error
    ? null
    : ((seedResult?.data ?? null) as SeasonRankSeedRow | null);
  const missionRows = (missionsResult.data ?? []) as MissionRankClaimRow[];
  const eventRows = (eventsResult.data ?? []) as EventRankParticipantRow[];
  const awardRows = (awardsResult.data ?? []) as SeasonRankAwardRow[];

  const missionPointMap = buildMissionPointMap(pointRules);
  const eventPointValue = resolveEventPointValue(pointRules);
  const rankSteps = buildRankSteps(thresholds);
  const seedPoints = Math.max(0, Math.floor(seedRow?.seed_points ?? 0));

  const missionPoints = missionRows.reduce((accumulator, row) => {
    const difficulty = getMissionDifficulty(row.realm_missions);
    if (!difficulty) {
      return accumulator;
    }

    return accumulator + missionPointMap[difficulty];
  }, 0);

  const eventPoints = eventRows.length * eventPointValue;
  const awardPoints = awardRows.reduce(
    (accumulator, row) => accumulator + Math.max(0, Math.floor(row.points_awarded ?? 0)),
    0
  );
  const monthlyPoints = seedPoints + missionPoints + eventPoints + awardPoints;
  const rank = deriveRankFromSteps(monthlyPoints, rankSteps);
  const progress = describeProgress(monthlyPoints, rankSteps);

  return {
    monthlyPoints,
    completedRewardedMissions: missionRows.length,
    rewardedEvents: eventRows.length,
    manualAwardsCount: awardRows.length,
    rankName: rank.rankName,
    rankTier: rank.rankTier,
    monthStartsAt: season.monthStartsAt,
    monthEndsAt: season.monthEndsAt,
    seasonId: season.seasonId,
    seasonName: season.seasonName,
    seedPoints,
    currentRankMinPoints: progress.currentRankMinPoints,
    nextRankMinPoints: progress.nextRankMinPoints,
    nextRankName: progress.nextRankName,
    nextRankTier: progress.nextRankTier,
    progressWithinRankPercent: progress.progressWithinRankPercent,
    seasonProgressPercent: computeSeasonProgressPercent(
      season.monthStartsAt,
      season.monthEndsAt
    ),
  };
}
