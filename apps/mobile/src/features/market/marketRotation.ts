import type { MarketItem, Rarity } from "@/src/features/shared/types";

const MARKET_ROTATION_WINDOW_MS = 5 * 60 * 60 * 1000;

const MARKET_RARITY_ROTATION: Record<Rarity, { probability: number; count: number }> = {
  common: { probability: 1, count: 5 },
  rare: { probability: 0.9, count: 5 },
  epic: { probability: 0.5, count: 4 },
  legendary: { probability: 0.1, count: 3 },
  mythic: { probability: 0.01, count: 2 },
};

const MARKET_RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export type MarketRotationState = {
  items: MarketItem[];
  windowId: number;
  nextRefreshAt: number;
  nextRefreshLabel: string;
  activeRarities: Rarity[];
};

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function hasAvailableStock(item: MarketItem) {
  const stockLimit = Math.max(0, Math.floor(item.stockLimit ?? 0));
  const stockSold = Math.max(0, Math.floor(item.stockSold ?? 0));

  if (item.stockStatus === "sold-out") {
    return false;
  }

  return stockLimit <= 0 || stockSold < stockLimit;
}

function selectRotatedItems(items: MarketItem[], rarity: Rarity, windowId: number, count: number) {
  const rarityItems = items.filter((item) => item.rarity === rarity);
  const availableItems = rarityItems.filter(hasAvailableStock);
  const pool = availableItems.length >= count ? availableItems : rarityItems;

  return pool
    .slice()
    .sort((a, b) => {
      const availableDifference = Number(hasAvailableStock(b)) - Number(hasAvailableStock(a));

      if (availableDifference !== 0) {
        return availableDifference;
      }

      return (
        hashSeed(`${windowId}:${rarity}:${a.id}`) -
        hashSeed(`${windowId}:${rarity}:${b.id}`)
      );
    })
    .slice(0, count);
}

export function getMarketRotationState(
  items: MarketItem[],
  now = Date.now()
): MarketRotationState {
  const windowId = Math.floor(now / MARKET_ROTATION_WINDOW_MS);
  const selectedItems: MarketItem[] = [];
  const activeRarities: Rarity[] = [];

  for (const rarity of MARKET_RARITY_ORDER) {
    const config = MARKET_RARITY_ROTATION[rarity];
    const isActive =
      config.probability >= 1 ||
      hashSeed(`${windowId}:${rarity}:gate`) <= config.probability;

    if (!isActive) {
      continue;
    }

    const raritySelection = selectRotatedItems(items, rarity, windowId, config.count);

    if (raritySelection.length > 0) {
      activeRarities.push(rarity);
      selectedItems.push(...raritySelection);
    }
  }

  const nextRefreshAt = (windowId + 1) * MARKET_ROTATION_WINDOW_MS;
  const remainingMs = Math.max(0, nextRefreshAt - now);
  const remainingHours = Math.floor(remainingMs / 3600000);
  const remainingMinutes = Math.ceil((remainingMs % 3600000) / 60000);

  return {
    items: selectedItems,
    windowId,
    nextRefreshAt,
    nextRefreshLabel:
      remainingHours > 0
        ? `${remainingHours}h ${String(remainingMinutes).padStart(2, "0")}m`
        : `${Math.max(1, remainingMinutes)}m`,
    activeRarities,
  };
}
