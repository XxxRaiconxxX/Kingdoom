import { supabase } from "./supabaseClient";
import { fetchPlayerByUsername } from "./players";
import type { InventoryEntry, PlayerAccount } from "../types";

type RpcRow = Record<string, unknown>;

function readRpcRow(data: unknown): RpcRow | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0];
  return row && typeof row === "object" ? (row as RpcRow) : null;
}

function readRpcMessage(row: RpcRow | null, fallback: string) {
  return typeof row?.message === "string" && row.message.trim()
    ? row.message
    : fallback;
}

function getTransferErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const details = error as { code?: unknown; message?: unknown };
  const code = String(details.code ?? "");
  const message = String(details.message ?? "");

  if (code === "42883" || code === "PGRST202" || message.includes("transfer_player_")) {
    return "Falta aplicar supabase_player_transfers.sql antes de habilitar intercambios.";
  }

  return fallback;
}

export async function transferGold(
  fromPlayer: PlayerAccount,
  toUsername: string,
  amount: number
): Promise<{ success: boolean; message: string; newGold?: number }> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { success: false, message: "La cantidad de oro debe ser mayor a 0." };
  }

  if (fromPlayer.gold < amount) {
    return { success: false, message: "No tienes suficiente oro para enviar." };
  }

  const targetPlayer = await fetchPlayerByUsername(toUsername);
  if (!targetPlayer) {
    return { success: false, message: "El jugador destinatario no existe." };
  }

  if (targetPlayer.id === fromPlayer.id) {
    return { success: false, message: "No puedes enviarte oro a ti mismo." };
  }

  const { data, error } = await supabase.rpc("transfer_player_gold", {
    p_from_player_id: fromPlayer.id,
    p_to_player_id: targetPlayer.id,
    p_amount: amount,
  });

  if (error) {
    return {
      success: false,
      message: getTransferErrorMessage(error, "No se pudo completar la transferencia de oro."),
    };
  }

  const row = readRpcRow(data);
  if (row?.success !== true) {
    return {
      success: false,
      message: readRpcMessage(row, "No se pudo completar la transferencia de oro."),
    };
  }

  const newGold = Number(row.sender_gold);
  return {
    success: true,
    message: readRpcMessage(row, "Oro enviado correctamente."),
    ...(Number.isFinite(newGold) ? { newGold } : {}),
  };
}

export async function transferItem(
  fromPlayer: PlayerAccount,
  toUsername: string,
  item: InventoryEntry,
  amount: number
): Promise<{ success: boolean; message: string }> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { success: false, message: "La cantidad debe ser mayor a 0." };
  }

  if (item.isLocked) {
    return { success: false, message: "Ese objeto está bloqueado por un plan de pago activo." };
  }

  if (item.quantity < amount) {
    return { success: false, message: "No tienes suficientes unidades de este objeto." };
  }

  const targetPlayer = await fetchPlayerByUsername(toUsername);
  if (!targetPlayer) {
    return { success: false, message: "El jugador destinatario no existe." };
  }

  if (targetPlayer.id === fromPlayer.id) {
    return { success: false, message: "No puedes enviarte objetos a ti mismo." };
  }

  const { data, error } = await supabase.rpc("transfer_player_item", {
    p_from_player_id: fromPlayer.id,
    p_to_player_id: targetPlayer.id,
    p_inventory_id: item.id,
    p_amount: amount,
  });

  if (error) {
    return {
      success: false,
      message: getTransferErrorMessage(error, "No se pudo completar la transferencia del objeto."),
    };
  }

  const row = readRpcRow(data);
  return row?.success === true
    ? { success: true, message: readRpcMessage(row, "Objeto enviado correctamente.") }
    : {
        success: false,
        message: readRpcMessage(row, "No se pudo completar la transferencia del objeto."),
      };
}
