import type {
  BusinessCollectionLogEntry,
  PlayerBusiness,
  PlayerBusinessProposal,
} from "../../types";
import { formatAdminPermissionMessage } from "../../utils/supabaseErrors";
import { supabase } from "../../utils/supabaseClient";
import {
  buildBusinessProposalPayload,
  mapBusinessCollectionLogRow,
  mapBusinessProposalRow,
  mapBusinessRow,
} from "./businesses.adapter";
import type {
  BusinessAdminState,
  BusinessCollectRpcRow,
  BusinessCollectionLogRow,
  BusinessProposalInput,
  BusinessProposalRow,
  BusinessProposalRpcRow,
  BusinessRow,
} from "./businesses.types";

const BUSINESS_PROPOSALS_SELECT = `
  id, player_id, proposed_by_id, proposed_by_name, name, description, business_type,
  icon, production_label, gold_per_hour, max_storage, hourly_range_min, hourly_range_max,
  base_cost, staff_fee, opening_cost, notes, status, created_at, responded_at
`;

const BUSINESSES_SELECT = `
  id, player_id, proposal_id, name, description, business_type, icon, production_label,
  gold_per_hour, max_storage, hourly_range_min, hourly_range_max, base_cost, staff_fee,
  opening_cost, status, opened_at, last_collected_at, created_at, updated_at
`;

const BUSINESS_LOGS_SELECT = `
  id, business_id, player_id, collected_gold, collected_at
`;

function isMissingBusinessRpc(
  error: { code?: string; message?: string | null; details?: string | null },
  functionName: string
) {
  const message = String(error.message ?? "").toLowerCase();
  const details = String(error.details ?? "").toLowerCase();

  return (
    error.code === "42883" ||
    error.code === "PGRST202" ||
    message.includes("schema cache") ||
    details.includes("schema cache") ||
    message.includes("could not find the function") ||
    message.includes(functionName)
  );
}

export async function fetchBusinessAdminState(): Promise<BusinessAdminState> {
  const [proposalResult, businessResult, logResult] = await Promise.all([
    supabase
      .from("business_proposals")
      .select(BUSINESS_PROPOSALS_SELECT)
      .order("created_at", { ascending: false }),
    supabase
      .from("businesses")
      .select(BUSINESSES_SELECT)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_collection_log")
      .select(BUSINESS_LOGS_SELECT)
      .order("collected_at", { ascending: false })
      .limit(40),
  ]);

  return {
    proposals: proposalResult.error || !proposalResult.data
      ? []
      : (proposalResult.data as BusinessProposalRow[]).map(mapBusinessProposalRow),
    businesses: businessResult.error || !businessResult.data
      ? []
      : (businessResult.data as BusinessRow[]).map(mapBusinessRow),
    logs: logResult.error || !logResult.data
      ? []
      : (logResult.data as BusinessCollectionLogRow[]).map(mapBusinessCollectionLogRow),
  };
}

export async function fetchPlayerBusinessProposals(
  playerId: string
): Promise<PlayerBusinessProposal[]> {
  const normalizedPlayerId = playerId.trim();

  if (!normalizedPlayerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("business_proposals")
    .select(BUSINESS_PROPOSALS_SELECT)
    .eq("player_id", normalizedPlayerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as BusinessProposalRow[]).map(mapBusinessProposalRow);
}

export async function fetchPlayerBusinesses(
  playerId: string
): Promise<PlayerBusiness[]> {
  const normalizedPlayerId = playerId.trim();

  if (!normalizedPlayerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESSES_SELECT)
    .eq("player_id", normalizedPlayerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as BusinessRow[]).map(mapBusinessRow);
}

export async function fetchPlayerBusinessCollectionLog(
  playerId: string
): Promise<BusinessCollectionLogEntry[]> {
  const normalizedPlayerId = playerId.trim();

  if (!normalizedPlayerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("business_collection_log")
    .select(BUSINESS_LOGS_SELECT)
    .eq("player_id", normalizedPlayerId)
    .order("collected_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    return [];
  }

  return (data as BusinessCollectionLogRow[]).map(mapBusinessCollectionLogRow);
}

export async function upsertBusinessProposal(input: BusinessProposalInput) {
  const payload = buildBusinessProposalPayload(input);
  const { error } = await supabase
    .from("business_proposals")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo guardar la propuesta de negocio.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message:
      payload.status === "pending"
        ? "Propuesta de negocio enviada al jugador."
        : "Propuesta de negocio actualizada correctamente.",
  };
}

export async function respondBusinessProposal(input: {
  proposalId: string;
  playerId: string;
  action: "accept" | "reject";
}) {
  const { data, error } = await supabase.rpc("respond_business_proposal", {
    p_proposal_id: input.proposalId,
    p_player_id: input.playerId,
    p_action: input.action,
  });

  if (error) {
    const missingRpc = isMissingBusinessRpc(error, "respond_business_proposal");

    return {
      status: "error" as const,
      message: missingRpc
        ? "La respuesta segura de negocios aun no aparece en el schema de Supabase. Ejecuta el SQL de negocios y luego fuerza un `NOTIFY pgrst, 'reload schema';` en el SQL Editor."
        : `No se pudo responder la propuesta. ${error.message}${error.details ? ` ${error.details}` : ""}`.trim(),
      remainingGold: null,
      proposalStatus: null,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as BusinessProposalRpcRow | undefined)
    : (data as BusinessProposalRpcRow | null);

  if (!row?.success) {
    return {
      status: "error" as const,
      message: row?.message ?? "No se pudo responder la propuesta.",
      remainingGold: row?.remaining_gold ?? null,
      proposalStatus: row?.proposal_status ?? null,
    };
  }

  return {
    status: "success" as const,
    message:
      row.message ??
      (input.action === "accept"
        ? "Negocio activado correctamente."
        : "Propuesta rechazada."),
    remainingGold: row.remaining_gold ?? null,
    proposalStatus: row.proposal_status ?? null,
  };
}

export async function collectBusinessGold(input: {
  businessId: string;
  playerId: string;
}) {
  const { data, error } = await supabase.rpc("collect_business_gold", {
    p_business_id: input.businessId,
    p_player_id: input.playerId,
  });

  if (error) {
    const missingRpc = isMissingBusinessRpc(error, "collect_business_gold");

    return {
      status: "error" as const,
      message: missingRpc
        ? "La recoleccion segura de negocios aun no aparece en el schema de Supabase. Ejecuta el SQL de negocios y luego fuerza un `NOTIFY pgrst, 'reload schema';` en el SQL Editor."
        : `No se pudo recolectar el oro del negocio. ${error.message}${error.details ? ` ${error.details}` : ""}`.trim(),
      collectedGold: 0,
      remainingGold: null,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as BusinessCollectRpcRow | undefined)
    : (data as BusinessCollectRpcRow | null);

  if (!row?.success) {
    return {
      status: "error" as const,
      message: row?.message ?? "No se pudo recolectar el oro del negocio.",
      collectedGold: Number(row?.collected_gold ?? 0),
      remainingGold: row?.remaining_gold ?? null,
    };
  }

  return {
    status: "success" as const,
    message: row.message ?? "Oro recolectado correctamente.",
    collectedGold: Number(row.collected_gold ?? 0),
    remainingGold: row.remaining_gold ?? null,
  };
}
