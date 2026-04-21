import { supabase, supabaseConfigError } from "@/src/services/supabase";

type PurchaseRpcRow = {
  success: boolean;
  message: string | null;
  remaining_gold: number | null;
  total_price: number | null;
  inventory_synced: boolean | null;
  order_ref: string | null;
};

export type NativePurchaseResult =
  | {
      status: "success";
      message: string;
      remainingGold: number;
      totalPrice: number;
      inventorySynced: boolean;
      orderRef: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function purchaseMarketItemNative(input: {
  playerId: string;
  itemId: string;
  quantity: number;
}): Promise<NativePurchaseResult> {
  if (!supabase) {
    return { status: "error", message: supabaseConfigError };
  }

  const safeQuantity = Math.max(1, Math.floor(input.quantity));

  const { data, error } = await supabase.rpc("purchase_market_item", {
    p_player_id: input.playerId,
    p_item_id: input.itemId,
    p_quantity: safeQuantity,
  });

  if (error) {
    return {
      status: "error",
      message:
        "La compra segura no esta disponible todavia. Ejecuta el SQL de Fase 2 (RPC purchase_market_item) en Supabase.",
    };
  }

  const rpcRow = Array.isArray(data) ? (data[0] as PurchaseRpcRow | undefined) : (data as PurchaseRpcRow | null);
  if (!rpcRow || !rpcRow.success) {
    return {
      status: "error",
      message: rpcRow?.message ?? "No se pudo completar la compra segura.",
    };
  }

  return {
    status: "success",
    message: rpcRow.message ?? "Compra confirmada.",
    remainingGold: Number(rpcRow.remaining_gold ?? 0),
    totalPrice: Number(rpcRow.total_price ?? 0),
    inventorySynced: Boolean(rpcRow.inventory_synced),
    orderRef: rpcRow.order_ref ?? "N/A",
  };
}
