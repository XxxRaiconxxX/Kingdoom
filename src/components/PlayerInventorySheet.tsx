import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Backpack,
  Gem,
  Lock,
  PackageCheck,
  RefreshCw,
  Shield,
  Sword,
  WalletCards,
  X,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { fetchPlayerInventory, fetchPlayerPaymentPlans } from "../utils/inventory";
import type { InventoryCategoryId, InventoryEntry, PaymentPlan } from "../types";

type InventoryFilter = "all" | InventoryCategoryId;
type ActiveTab = "inventory" | "credits";

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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PlayerInventorySheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const { player, inventoryRefreshToken } = usePlayerSession();
  const playerId = player?.id ?? null;

  // --- Inventory state ---
  const [items, setItems] = useState<InventoryEntry[]>([]);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [inventoryStatus, setInventoryStatus] = useState<
    "loading" | "ready" | "empty" | "unavailable"
  >("loading");
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Payment plans state ---
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [plansStatus, setPlansStatus] = useState<
    "loading" | "ready" | "empty" | "unavailable"
  >("loading");

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<ActiveTab>("inventory");

  // ---- Load inventory ----
  useEffect(() => {
    let isCancelled = false;

    async function loadInventory() {
      if (!playerId) return;
      setInventoryStatus("loading");
      setInventoryMessage("");
      const result = await fetchPlayerInventory(playerId);
      if (isCancelled) return;
      if (result.status === "unavailable") {
        setItems([]);
        setInventoryStatus("unavailable");
        setInventoryMessage(result.message);
        return;
      }
      setItems(result.items);
      setInventoryStatus(result.items.length === 0 ? "empty" : "ready");
    }

    void loadInventory();
    return () => { isCancelled = true; };
  }, [inventoryRefreshToken, playerId]);

  // ---- Load payment plans ----
  useEffect(() => {
    let isCancelled = false;

    async function loadPlans() {
      if (!playerId) return;
      setPlansStatus("loading");
      const result = await fetchPlayerPaymentPlans(playerId);
      if (isCancelled) return;
      if (result.status === "unavailable") {
        setPlans([]);
        setPlansStatus("unavailable");
        return;
      }
      setPlans(result.plans);
      setPlansStatus(result.plans.length === 0 ? "empty" : "ready");
    }

    void loadPlans();
    return () => { isCancelled = true; };
  }, [inventoryRefreshToken, playerId]);

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

  const activePlansCount = plans.filter((p) => p.status === "active").length;
  const defaultedPlansCount = plans.filter((p) => p.status === "defaulted").length;

  async function handleRefresh() {
    if (!playerId) return;
    setIsRefreshing(true);
    const [invResult, plansResult] = await Promise.all([
      fetchPlayerInventory(playerId),
      fetchPlayerPaymentPlans(playerId),
    ]);
    setIsRefreshing(false);

    if (invResult.status === "unavailable") {
      setItems([]);
      setInventoryStatus("unavailable");
      setInventoryMessage(invResult.message);
    } else {
      setItems(invResult.items);
      setInventoryStatus(invResult.items.length === 0 ? "empty" : "ready");
    }

    if (plansResult.status === "unavailable") {
      setPlans([]);
      setPlansStatus("unavailable");
    } else {
      setPlans(plansResult.plans);
      setPlansStatus(plansResult.plans.length === 0 ? "empty" : "ready");
    }
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
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/75">
              Inventario del jugador
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100 md:text-3xl">
              {player?.username ?? "Perfil desconectado"}
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              Objetos persistentes del reino. Las pociones no se guardan aquí.
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

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-stone-800 px-5 pt-3 pb-0 md:px-6">
          <TabButton
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
            icon={<Backpack className="h-3.5 w-3.5" />}
            label={`Inventario (${totalUnits})`}
          />
          <TabButton
            active={activeTab === "credits"}
            onClick={() => setActiveTab("credits")}
            icon={<WalletCards className="h-3.5 w-3.5" />}
            label="Créditos"
            badge={defaultedPlansCount > 0 ? defaultedPlansCount : activePlansCount || undefined}
            badgeTone={defaultedPlansCount > 0 ? "red" : "amber"}
          />
        </div>

        {/* Inventory tab toolbar */}
        {activeTab === "inventory" && (
          <div className="border-b border-stone-800 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <InventoryFilterButton
                  active={filter === "all"}
                  label={`Todo (${totalUnits})`}
                  onClick={() => setFilter("all")}
                />
                {(Object.keys(CATEGORY_LABELS) as InventoryCategoryId[]).map((categoryId) => {
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
                })}
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
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {/* ─── INVENTORY TAB ─── */}
          {activeTab === "inventory" && (
            <>
              {inventoryStatus === "loading" && (
                <InventoryInfo message="Abriendo el inventario del reino..." />
              )}
              {inventoryStatus === "unavailable" && (
                <InventoryInfo
                  title="Inventario no sincronizado"
                  message={inventoryMessage}
                  tone="warning"
                />
              )}
              {inventoryStatus === "empty" && (
                <InventoryInfo
                  title="Inventario vacío"
                  message="Todavía no tienes armas, armaduras u otros objetos persistentes en tu perfil."
                />
              )}
              {inventoryStatus === "ready" && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <InventoryCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── CREDITS TAB ─── */}
          {activeTab === "credits" && (
            <>
              {plansStatus === "loading" && (
                <InventoryInfo message="Cargando planes de pago activos..." />
              )}
              {plansStatus === "unavailable" && (
                <InventoryInfo
                  title="Créditos no disponibles"
                  message="No se pudo conectar con el registro de cuotas. Intenta de nuevo."
                  tone="warning"
                />
              )}
              {plansStatus === "empty" && (
                <InventoryInfo
                  title="Sin créditos activos"
                  message="No tienes objetos en cuotas pendientes. Todos tus bienes están libres de deuda."
                />
              )}
              {plansStatus === "ready" && (
                <div className="space-y-4">
                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <CreditSummaryCard
                      label="Planes activos"
                      value={activePlansCount}
                      tone="amber"
                    />
                    <CreditSummaryCard
                      label="En mora"
                      value={defaultedPlansCount}
                      tone="red"
                    />
                    <CreditSummaryCard
                      label="Deuda total"
                      value={`${plans.reduce((s, p) => s + p.remainingBalance, 0).toLocaleString()} 🪙`}
                      tone="neutral"
                    />
                  </div>

                  {/* Plan cards */}
                  {plans.map((plan) => (
                    <PaymentPlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────── Sub-components ───────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeTone = "amber",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeTone?: "amber" | "red";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400 text-amber-300"
          : "border-transparent text-stone-500 hover:text-stone-300"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${
            badgeTone === "red"
              ? "bg-red-500/80 text-white"
              : "bg-amber-500/80 text-stone-950"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
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
    <article
      className={`overflow-hidden rounded-[1.5rem] border bg-stone-900/70 transition ${
        item.isLocked
          ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
          : "border-stone-800"
      }`}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        {!imageFailed && item.itemImageUrl ? (
          <img
            loading="lazy"
            decoding="async"
            src={item.itemImageUrl}
            alt={item.itemName}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className={`h-full w-full transition ${item.isLocked ? "opacity-60 grayscale-[30%]" : ""}`}
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

        {/* Lock overlay badge */}
        {item.isLocked && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 backdrop-blur-sm">
            <Lock className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
              En cuotas
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-stone-100">{item.itemName}</h4>
            <p className="mt-1 text-sm leading-6 text-stone-400">{item.itemDescription}</p>
          </div>
          <div className="rounded-full border border-stone-700 bg-stone-950/60 px-2.5 py-1 text-xs font-semibold text-stone-300">
            x{item.quantity}
          </div>
        </div>

        {item.itemAbility ? (
          <p className="text-sm leading-6 text-stone-300/80">{item.itemAbility}</p>
        ) : null}

        {item.isLocked && (
          <p className="text-[11px] text-amber-400/80">
            🔒 Bloqueado — pendiente de pago de cuotas
          </p>
        )}

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

function CreditSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "amber" | "red" | "neutral";
}) {
  const colorMap = {
    amber: "border-amber-500/20 bg-amber-500/8 text-amber-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    neutral: "border-stone-700 bg-stone-900/60 text-stone-200",
  };

  return (
    <div className={`rounded-2xl border p-3.5 ${colorMap[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-black">{value}</p>
    </div>
  );
}

function PaymentPlanCard({ plan }: { plan: PaymentPlan }) {
  const paidRatio = plan.paidInstallments / plan.totalInstallments;
  const progressPct = Math.round(paidRatio * 100);
  const isDefaulted = plan.status === "defaulted";

  const statusColors = {
    active: {
      border: "border-amber-500/25",
      bg: "bg-amber-500/8",
      badge: "border-amber-500/30 bg-amber-500/15 text-amber-300",
      label: "Activo",
    },
    defaulted: {
      border: "border-red-500/30",
      bg: "bg-red-500/8",
      badge: "border-red-500/30 bg-red-500/15 text-red-300",
      label: "En mora",
    },
    completed: {
      border: "border-emerald-500/25",
      bg: "bg-emerald-500/8",
      badge: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
      label: "Completado",
    },
  };

  const colors = statusColors[plan.status];

  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${colors.border} ${colors.bg}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Pedido #{plan.orderRef.slice(-8).toUpperCase()}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-stone-100">
            Item: {plan.itemId}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${colors.badge}`}
          >
            {isDefaulted && <AlertTriangle className="h-2.5 w-2.5" />}
            {colors.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[11px] text-stone-400">
          <span>
            Cuotas: {plan.paidInstallments}/{plan.totalInstallments} pagadas
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-800">
          <div
            className={`h-full rounded-full transition-all ${isDefaulted ? "bg-red-500" : "bg-amber-400"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Detail grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DetailCell
          label="Cuota mensual"
          value={`${plan.installmentAmount.toLocaleString()} 🪙`}
        />
        <DetailCell
          label="Saldo restante"
          value={`${plan.remainingBalance.toLocaleString()} 🪙`}
        />
        <DetailCell
          label="Próximo pago"
          value={formatDate(plan.nextPaymentDate)}
        />
        {plan.penaltyDays > 0 && (
          <DetailCell
            label="Días de mora"
            value={String(plan.penaltyDays)}
            tone="red"
          />
        )}
      </div>

      {isDefaulted && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          ⚠️ Este plan está en mora. Tu crédito está bloqueado por 14 días tras saldar la deuda.
        </p>
      )}
    </div>
  );
}

function DetailCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "red";
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          tone === "red" ? "text-red-300" : "text-stone-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
