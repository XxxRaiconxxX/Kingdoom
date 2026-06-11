import { supabase } from "./supabaseClient";
import type { MarketAuction, MarketAuctionBid, AuctionStatus, Rarity } from "../types";

export type PlaceBidResult =
  | {
      status: "success";
      auctionId: string;
      highestBid: number;
      highestBidderId: string;
      remainingGold: number;
    }
  | {
      status: "error";
      message: string;
    };

export type ResolveAuctionResult =
  | {
      status: "success";
      auctionId: string;
      winnerId: string | null;
      itemName: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function fetchAuctions(currentPlayerId?: string): Promise<{
  status: "ready" | "error";
  auctions: MarketAuction[];
  message?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("market_auctions")
      .select(`
        *,
        highest_bidder:players!highest_bidder_id(username)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { status: "error", auctions: [], message: error.message };
    }

    const participantMap: Record<string, boolean> = {};
    if (currentPlayerId && data && data.length > 0) {
      const { data: partData, error: partError } = await supabase
        .from("market_auction_participants")
        .select("auction_id, has_withdrawn")
        .eq("player_id", currentPlayerId);

      if (!partError && partData) {
        partData.forEach((p) => {
          participantMap[p.auction_id] = p.has_withdrawn;
        });
      }
    }

    const auctions: MarketAuction[] = (data || []).map((row: any) => ({
      id: row.id,
      itemId: row.item_id,
      itemName: row.item_name,
      itemDescription: row.item_description,
      itemCategory: row.item_category,
      itemRarity: row.item_rarity as Rarity,
      itemImageUrl: row.item_image_url,
      startPrice: row.start_price,
      minIncrement: row.min_increment,
      status: row.status as AuctionStatus,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      closedAt: row.closed_at,
      highestBid: row.highest_bid,
      highestBidderId: row.highest_bidder_id,
      whatsappMessageId: row.whatsapp_message_id,
      whatsappChatId: row.whatsapp_chat_id,
      createdBy: row.created_by,
      highestBidderUsername: row.highest_bidder?.username || null,
      hasWithdrawn: !!participantMap[row.id],
    }));

    return { status: "ready", auctions };
  } catch (err: any) {
    return { status: "error", auctions: [], message: err.message || String(err) };
  }
}

export async function fetchAuctionBids(auctionId: string): Promise<{
  status: "ready" | "error";
  bids: MarketAuctionBid[];
  message?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("market_auction_bids")
      .select(`
        id,
        auction_id,
        player_id,
        amount,
        created_at,
        player:players!player_id(username)
      `)
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false });

    if (error) {
      return { status: "error", bids: [], message: error.message };
    }

    const bids: MarketAuctionBid[] = (data || []).map((row: any) => ({
      id: row.id,
      auctionId: row.auction_id,
      playerId: row.player_id,
      amount: row.amount,
      createdAt: row.created_at,
      playerUsername: row.player?.username || "Desconocido",
    }));

    return { status: "ready", bids };
  } catch (err: any) {
    return { status: "error", bids: [], message: err.message || String(err) };
  }
}

export async function placeAuctionBid(input: {
  playerId: string;
  auctionId: string;
  amount: number;
}): Promise<PlaceBidResult> {
  const { data, error } = await supabase.rpc("place_auction_bid", {
    p_player_id: input.playerId,
    p_auction_id: input.auctionId,
    p_amount: input.amount,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { status: "error", message: "La puja no devolvió datos." };
  }

  return {
    status: "success",
    auctionId: row.auction_id,
    highestBid: row.highest_bid,
    highestBidderId: row.highest_bidder_id,
    remainingGold: row.remaining_gold,
  };
}

export async function withdrawFromAuction(input: {
  playerId: string;
  auctionId: string;
}): Promise<{ status: "success" } | { status: "error"; message: string }> {
  const { data, error } = await supabase.rpc("withdraw_from_auction", {
    p_player_id: input.playerId,
    p_auction_id: input.auctionId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success" };
}

export async function resolveMarketAuction(auctionId: string): Promise<ResolveAuctionResult> {
  const { data, error } = await supabase.rpc("resolve_market_auction", {
    p_auction_id: auctionId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { status: "error", message: "No se pudieron obtener los detalles de resolución." };
  }

  return {
    status: "success",
    auctionId: row.auction_id,
    winnerId: row.winner_id,
    itemName: row.item_name,
  };
}

export async function createMarketAuction(input: {
  itemId: string | null;
  itemName: string;
  itemDescription: string | null;
  itemCategory: string;
  itemRarity: string;
  itemImageUrl: string | null;
  startPrice: number;
  minIncrement: number;
  durationMinutes: number;
  whatsappChatId?: string | null;
}): Promise<{ status: "success"; auctionId: string } | { status: "error"; message: string }> {
  const { data, error } = await supabase.rpc("create_market_auction", {
    p_item_id: input.itemId,
    p_item_name: input.itemName,
    p_item_description: input.itemDescription,
    p_item_category: input.itemCategory,
    p_item_rarity: input.itemRarity,
    p_item_image_url: input.itemImageUrl,
    p_start_price: input.startPrice,
    p_min_increment: input.minIncrement,
    p_duration_minutes: input.durationMinutes,
    p_whatsapp_chat_id: input.whatsappChatId || null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", auctionId: data as string };
}
