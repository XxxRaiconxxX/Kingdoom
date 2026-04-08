import { supabase } from "./supabaseClient";
import { fetchPlayerByUsername } from "./players";
import type { PlayerAccount, InventoryEntry } from "../types";

export async function transferGold(
  fromPlayer: PlayerAccount,
  toUsername: string,
  amount: number
): Promise<{ success: boolean; message: string; newGold?: number }> {
  if (amount <= 0) {
    return { success: false, message: "La cantidad de oro debe ser mayor a 0." };
  }

  if (fromPlayer.gold < amount) {
    return { success: false, message: "No tienes suficiente oro para enviar." };
  }

  if (fromPlayer.username.toLowerCase() === toUsername.toLowerCase().trim()) {
     return { success: false, message: "No puedes enviarte oro a ti mismo." };
  }

  const targetPlayer = await fetchPlayerByUsername(toUsername);
  if (!targetPlayer) {
    return { success: false, message: "El jugador destinatario no existe." };
  }

  // Deduct from sender
  const newSenderGold = fromPlayer.gold - amount;
  const { error: senderError } = await supabase
    .from("players")
    .update({ gold: newSenderGold })
    .eq("id", fromPlayer.id);

  if (senderError) {
    return { success: false, message: "Ocurrió un error al descontar tu oro." };
  }

  // Add to target
  const { error: targetError } = await supabase
    .from("players")
    .update({ gold: targetPlayer.gold + amount })
    .eq("id", targetPlayer.id);

  if (targetError) {
    // Attempt rollback (best effort)
    await supabase.from("players").update({ gold: fromPlayer.gold }).eq("id", fromPlayer.id);
    return { success: false, message: "Error al enviar oro. Operación cancelada." };
  }

  return { success: true, message: "Oro enviado correctamente.", newGold: newSenderGold };
}

export async function transferItem(
  fromPlayer: PlayerAccount,
  toUsername: string,
  item: InventoryEntry,
  amount: number
): Promise<{ success: boolean; message: string }> {
  if (amount <= 0) {
    return { success: false, message: "La cantidad debe ser mayor a 0." };
  }

  if (item.quantity < amount) {
    return { success: false, message: "No tienes suficientes unidades de este objeto." };
  }

  if (fromPlayer.username.toLowerCase() === toUsername.toLowerCase().trim()) {
    return { success: false, message: "No puedes enviarte objetos a ti mismo." };
  }

  const targetPlayer = await fetchPlayerByUsername(toUsername);
  if (!targetPlayer) {
    return { success: false, message: "El jugador destinatario no existe." };
  }

  // Deduct/remove from sender
  const newSenderQuantity = item.quantity - amount;
  
  if (newSenderQuantity === 0) {
    const { error: deleteError } = await supabase
      .from("player_inventory")
      .delete()
      .eq("id", item.id);
      
    if (deleteError) return { success: false, message: "Error al descontar tu objeto." };
  } else {
    const { error: updateError } = await supabase
      .from("player_inventory")
      .update({ quantity: newSenderQuantity })
      .eq("id", item.id);
      
    if (updateError) return { success: false, message: "Error al actualizar tu inventario." };
  }

  // Add to target
  // Check if target already has this item
  const { data: existingTargetItem } = await supabase
    .from("player_inventory")
    .select("id, quantity")
    .eq("player_id", targetPlayer.id)
    .eq("item_id", item.itemId)
    .maybeSingle();

  if (existingTargetItem) {
    const { error: targetUpdateError } = await supabase
      .from("player_inventory")
      .update({ quantity: existingTargetItem.quantity + amount })
      .eq("id", existingTargetItem.id);

    if (targetUpdateError) {
      // Best effort rollback
      if (newSenderQuantity === 0) {
        await supabase.from("player_inventory").insert({
          player_id: fromPlayer.id,
          item_id: item.itemId,
          item_name: item.itemName,
          item_category: item.itemCategory,
          item_description: item.itemDescription,
          item_ability: item.itemAbility,
          item_image_url: item.itemImageUrl,
          item_image_fit: item.itemImageFit,
          item_image_position: item.itemImagePosition,
          item_rarity: item.itemRarity,
          quantity: item.quantity,
        });
      } else {
        await supabase.from("player_inventory").update({ quantity: item.quantity }).eq("id", item.id);
      }
      return { success: false, message: "Error al enviar el objeto. Operación cancelada." };
    }
  } else {
    const { error: targetInsertError } = await supabase
      .from("player_inventory")
      .insert({
        player_id: targetPlayer.id,
        item_id: item.itemId,
        item_name: item.itemName,
        item_category: item.itemCategory,
        item_description: item.itemDescription,
        item_ability: item.itemAbility,
        item_image_url: item.itemImageUrl,
        item_image_fit: item.itemImageFit,
        item_image_position: item.itemImagePosition,
        item_rarity: item.itemRarity,
        quantity: amount,
      });

    if (targetInsertError) {
       // Best effort rollback
       if (newSenderQuantity === 0) {
         await supabase.from("player_inventory").insert({
           player_id: fromPlayer.id,
           item_id: item.itemId,
           item_name: item.itemName,
           item_category: item.itemCategory,
           item_description: item.itemDescription,
           item_ability: item.itemAbility,
           item_image_url: item.itemImageUrl,
           item_image_fit: item.itemImageFit,
           item_image_position: item.itemImagePosition,
           item_rarity: item.itemRarity,
           quantity: item.quantity,
         });
       } else {
         await supabase.from("player_inventory").update({ quantity: item.quantity }).eq("id", item.id);
       }
       return { success: false, message: "Error al añadir el objeto al destinatario. Operación cancelada." };
    }
  }

  return { success: true, message: "Objeto enviado correctamente." };
}
