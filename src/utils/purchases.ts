import { supabase } from "./supabaseClient";

type PurchaseMarketItemResult =
  | {
      status: "success";
      orderRef: string;
      remainingGold: number;
      totalPrice: number;
      itemName: string;
      inventorySynced: boolean;
    }
  | {
      status: "error";
      message: string;
    };

type PurchaseMarketItemRpcRow = {
  order_ref: string;
  remaining_gold: number;
  total_price: number;
  item_name: string;
  inventory_synced: boolean;
};

export async function purchaseMarketItemSecure(input: {
  itemId: string;
  quantity: number;
  whatsapp: string;
  orderRef: string;
}): Promise<PurchaseMarketItemResult> {
  const { data, error } = await supabase.rpc("purchase_market_item", {
    p_item_id: input.itemId,
    p_quantity: input.quantity,
    p_whatsapp: input.whatsapp.trim(),
    p_order_ref: input.orderRef,
  });

  if (error) {
    const missingRpc =
      error.code === "42883" ||
      error.message.toLowerCase().includes("purchase_market_item");

    return {
      status: "error",
      message: missingRpc
        ? "La compra segura aun no esta activada en Supabase. Ejecuta el SQL de market_orders + purchase_market_item antes de usar el mercado."
        : error.message,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as PurchaseMarketItemRpcRow | undefined)
    : (data as PurchaseMarketItemRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La compra segura no devolvio datos. Revisa la RPC purchase_market_item.",
    };
  }

  return {
    status: "success",
    orderRef: row.order_ref,
    remainingGold: row.remaining_gold,
    totalPrice: row.total_price,
    itemName: row.item_name,
    inventorySynced: Boolean(row.inventory_synced),
  };
}
