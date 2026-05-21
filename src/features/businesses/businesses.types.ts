import type {
  BusinessCollectionLogEntry,
  BusinessStatus,
  BusinessProposalStatus,
  PlayerBusiness,
  PlayerBusinessProposal,
} from "../../types";

export type BusinessProposalRow = {
  id: string;
  player_id: string;
  proposed_by_id?: string | null;
  proposed_by_name?: string | null;
  name: string;
  description: string;
  business_type: string;
  icon: string | null;
  production_label: string | null;
  gold_per_hour: number;
  max_storage: number;
  hourly_range_min: number | null;
  hourly_range_max: number | null;
  base_cost: number | null;
  staff_fee: number | null;
  opening_cost: number;
  notes: string | null;
  status: BusinessProposalStatus;
  created_at?: string;
  responded_at?: string | null;
};

export type BusinessRow = {
  id: string;
  player_id: string;
  proposal_id?: string | null;
  name: string;
  description: string;
  business_type: string;
  icon: string | null;
  production_label: string | null;
  gold_per_hour: number;
  max_storage: number;
  hourly_range_min: number | null;
  hourly_range_max: number | null;
  base_cost: number | null;
  staff_fee: number | null;
  opening_cost: number;
  status: BusinessStatus;
  opened_at: string;
  last_collected_at: string;
  created_at?: string;
  updated_at?: string;
};

export type BusinessCollectionLogRow = {
  id: string;
  business_id: string;
  player_id: string;
  collected_gold: number;
  collected_at: string;
};

export type BusinessProposalInput = {
  id: string;
  playerId: string;
  proposedById?: string | null;
  proposedByName?: string | null;
  name: string;
  description: string;
  businessType: string;
  icon: string;
  productionLabel: string;
  goldPerHour: number;
  maxStorage: number;
  hourlyRangeMin: number;
  hourlyRangeMax: number;
  baseCost: number;
  staffFee: number;
  openingCost: number;
  notes: string;
  status: BusinessProposalStatus;
};

export type BusinessAdminState = {
  proposals: PlayerBusinessProposal[];
  businesses: PlayerBusiness[];
  logs: BusinessCollectionLogEntry[];
};

export type BusinessProjection = {
  storedGold: number;
  fillRatio: number;
  capped: boolean;
  nextFullAt: number | null;
};

export type BusinessProposalRpcRow = {
  success: boolean;
  message: string | null;
  remaining_gold: number | null;
  proposal_status: BusinessProposalStatus | null;
};

export type BusinessCollectRpcRow = {
  success: boolean;
  message: string | null;
  collected_gold: number | null;
  remaining_gold: number | null;
};
