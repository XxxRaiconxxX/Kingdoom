import type {
  BusinessCollectionLogEntry,
  PlayerBusiness,
  PlayerBusinessProposal,
} from "../../types";
import type {
  BusinessCollectionLogRow,
  BusinessProjection,
  BusinessProposalInput,
  BusinessProposalRow,
  BusinessRow,
} from "./businesses.types";

const DEFAULT_BUSINESS_ICON = "🏪";

function safeNumber(value: number | null | undefined) {
  return Math.max(0, Math.floor(Number(value ?? 0) || 0));
}

export function mapBusinessProposalRow(
  row: BusinessProposalRow
): PlayerBusinessProposal {
  return {
    id: row.id,
    playerId: row.player_id,
    proposedById: row.proposed_by_id ?? null,
    proposedByName: row.proposed_by_name ?? null,
    name: row.name,
    description: row.description,
    businessType: row.business_type,
    icon: row.icon?.trim() || DEFAULT_BUSINESS_ICON,
    productionLabel: row.production_label?.trim() || "Produce oro pasivo",
    goldPerHour: safeNumber(row.gold_per_hour),
    maxStorage: safeNumber(row.max_storage),
    hourlyRangeMin: safeNumber(row.hourly_range_min),
    hourlyRangeMax: safeNumber(row.hourly_range_max),
    baseCost: safeNumber(row.base_cost),
    staffFee: safeNumber(row.staff_fee),
    openingCost: safeNumber(row.opening_cost),
    notes: row.notes ?? null,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? null,
  };
}

export function mapBusinessRow(row: BusinessRow): PlayerBusiness {
  return {
    id: row.id,
    playerId: row.player_id,
    proposalId: row.proposal_id ?? null,
    name: row.name,
    description: row.description,
    businessType: row.business_type,
    icon: row.icon?.trim() || DEFAULT_BUSINESS_ICON,
    productionLabel: row.production_label?.trim() || "Produce oro pasivo",
    goldPerHour: safeNumber(row.gold_per_hour),
    maxStorage: safeNumber(row.max_storage),
    hourlyRangeMin: safeNumber(row.hourly_range_min),
    hourlyRangeMax: safeNumber(row.hourly_range_max),
    baseCost: safeNumber(row.base_cost),
    staffFee: safeNumber(row.staff_fee),
    openingCost: safeNumber(row.opening_cost),
    status: row.status,
    openedAt: row.opened_at,
    lastCollectedAt: row.last_collected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBusinessCollectionLogRow(
  row: BusinessCollectionLogRow
): BusinessCollectionLogEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    playerId: row.player_id,
    collectedGold: safeNumber(row.collected_gold),
    collectedAt: row.collected_at,
  };
}

export function buildBusinessProposalPayload(input: BusinessProposalInput) {
  const openingCost = safeNumber(input.baseCost) + safeNumber(input.staffFee);

  return {
    id: input.id.trim(),
    player_id: input.playerId.trim(),
    proposed_by_id: input.proposedById?.trim() || null,
    proposed_by_name: input.proposedByName?.trim() || null,
    name: input.name.trim(),
    description: input.description.trim(),
    business_type: input.businessType.trim(),
    icon: input.icon.trim() || DEFAULT_BUSINESS_ICON,
    production_label: input.productionLabel.trim() || "Produce oro pasivo",
    gold_per_hour: safeNumber(input.goldPerHour),
    max_storage: safeNumber(input.maxStorage),
    hourly_range_min: safeNumber(input.hourlyRangeMin),
    hourly_range_max: safeNumber(input.hourlyRangeMax),
    base_cost: safeNumber(input.baseCost),
    staff_fee: safeNumber(input.staffFee),
    opening_cost: input.openingCost > 0 ? safeNumber(input.openingCost) : openingCost,
    notes: input.notes.trim() || null,
    status: input.status,
  };
}

export function projectBusinessStorage(
  business: Pick<PlayerBusiness, "goldPerHour" | "maxStorage" | "lastCollectedAt">,
  now = Date.now()
): BusinessProjection {
  const lastCollectedAt = Date.parse(business.lastCollectedAt);

  if (!Number.isFinite(lastCollectedAt)) {
    return {
      storedGold: 0,
      fillRatio: 0,
      capped: false,
      nextFullAt: null,
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - lastCollectedAt) / 1000));
  const storedGold = Math.min(
    safeNumber(business.maxStorage),
    Math.floor((elapsedSeconds * safeNumber(business.goldPerHour)) / 3600)
  );
  const capped = storedGold >= safeNumber(business.maxStorage);
  const fillRatio =
    business.maxStorage > 0 ? Math.min(1, storedGold / business.maxStorage) : 0;

  if (capped || business.goldPerHour <= 0 || business.maxStorage <= 0) {
    return {
      storedGold,
      fillRatio,
      capped,
      nextFullAt: capped ? lastCollectedAt + (business.maxStorage * 3600 * 1000) / Math.max(1, business.goldPerHour) : null,
    };
  }

  const secondsToFill =
    ((business.maxStorage - storedGold) * 3600) / Math.max(1, business.goldPerHour);

  return {
    storedGold,
    fillRatio,
    capped,
    nextFullAt: now + secondsToFill * 1000,
  };
}

export function formatBusinessPaybackHours(
  goldPerHour: number,
  openingCost: number
) {
  const safeRate = safeNumber(goldPerHour);
  const safeCost = safeNumber(openingCost);

  if (safeRate <= 0 || safeCost <= 0) {
    return null;
  }

  return Number((safeCost / safeRate).toFixed(1));
}
