import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gem, PackageCheck, RefreshCw, Shield, Sword, X } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { fetchPlayerInventory } from "../utils/inventory";
import type { InventoryCategoryId, InventoryEntry } from "../types";

type InventoryFilter = "all" | InventoryCategoryId;

const CATEGORY_LABELS: Record<InventoryCategoryId, string> = {
  armors: "Armaduras",
  swords: "Espadas",
  others: "Otros",
};

const CATEGORY_ICONS = {
  armors: Shield,
  swords: Sword,
  others: Gem,
} satisfies Record<InventoryCategoryId, typeof Shield>;

export function PlayerInventorySheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const { player, inventoryRefreshToken } = usePlayerSession();
  const [items, setItems] = useState<InventoryEntry[]>([]);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "unavailable">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadInventory() {
      if (!player) {
        return;
      }

      setStatus("loading");
      setMessage("");

      const result = await fetchPlayerInventory(player.id);

      if (isCancelled) {
        return;
      }

      if (result.status === "unavailable") {
        setItems([]);
        setStatus("unavailable");
        setMessage(result.message);
        return;
      }

      setItems(result.items);

      if (result.items.length === 0) {
        setStatus("empty");
        return;
      }

      setStatus("ready");
    }

    void loadInventory();

    return () => {
      isCancelled = true;
    };
  }, [inventoryRefreshToken, player]);

  const filteredItems = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((item) => item.itemCategory === filter),
    [filter, items]
  );

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  async function handleRefresh() {
    if (!player) {
      return;
    }

    setIsRefreshing(true);
    const result = await fetchPlayerInventory(player.id);
    setIsRefreshing(false);

    if (result.status === "unavailable") {
      setItems([]);
      setStatus("unavailable");
      setMessage(result.message);
      return;
    }

    setItems(result.items);
    setStatus(result.items.length === 0 ? "empty" : "ready");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/75">
              Inventario del jugador
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100 md:text-3xl">
              {player?.username ?? "Perfil desconectado"}
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              Objetos persistentes del reino. Las pociones no se guardan aqui.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-stone-800 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <InventoryFilterButton
                active={filter === "all"}
                label={`Todo (${totalUnits})`}
                onClick={() => setFilter("all")}
              />
              {(Object.keys(CATEGORY_LABELS) as InventoryCategoryId[]).map(
                (categoryId) => {
                  const count = items
                    .filter((item) => item.itemCategory === categoryId)
                    .reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <InventoryFilterButton
                      key={categoryId}
                      active={filter === categoryId}
                      label={`${CATEGORY_LABELS[categoryId]} (${count})`}
                      onClick={() => setFilter(categoryId)}
                    />
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-stone-500 hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {status === "loading" ? (
            <InventoryInfo message="Abriendo el inventario del reino..." />
          ) : null}

          {status === "unavailable" ? (
            <InventoryInfo
              title="Inventario no sincronizado"
              message={message}
              tone="warning"
            />
          ) : null}

          {status === "empty" ? (
            <InventoryInfo
              title="Inventario vacio"
              message="Todavia no tienes armas, armaduras u otros objetos persistentes en tu perfil."
            />
          ) : null}

          {status === "ready" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <InventoryCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function InventoryFilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
        active
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-stone-700 bg-stone-900/60 text-stone-400 hover:border-stone-500 hover:text-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

function InventoryInfo({
  title = "Inventario",
  message,
  tone = "neutral",
}: {
  title?: string;
  message: string;
  tone?: "neutral" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
      : "border-stone-800 bg-stone-900/60 text-stone-300";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}

function InventoryCard({ item }: { item: InventoryEntry }) {
  const [imageFailed, setImageFailed] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[item.itemCategory];

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-stone-800 bg-stone-900/70">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        {!imageFailed && item.itemImageUrl ? (
          <img
            src={item.itemImageUrl}
            alt={item.itemName}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full"
            style={{
              objectFit: item.itemImageFit ?? "contain",
              objectPosition: item.itemImagePosition ?? "center",
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-500">
            <PackageCheck className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-stone-100">{item.itemName}</h4>
            <p className="mt-1 text-sm leading-6 text-stone-400">
              {item.itemDescription}
            </p>
          </div>
          <div className="rounded-full border border-stone-700 bg-stone-950/60 px-2.5 py-1 text-xs font-semibold text-stone-300">
            x{item.quantity}
          </div>
        </div>

        {item.itemAbility ? (
          <p className="text-sm leading-6 text-stone-300/80">{item.itemAbility}</p>
        ) : null}

        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-stone-500">
          <span className="inline-flex items-center gap-2">
            <CategoryIcon className="h-3.5 w-3.5 text-stone-500" />
            {CATEGORY_LABELS[item.itemCategory]}
          </span>
          <span>{item.itemRarity}</span>
        </div>
      </div>
    </article>
  );
}
