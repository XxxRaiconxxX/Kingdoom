import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailSheet } from "@/src/components/DetailSheet";
import { RealmStockExchangeNative } from "@/src/components/RealmStockExchangeNative";
import { TavernSlotsNative } from "@/src/components/TavernSlotsNative";
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  NoticeBanner,
  Pill,
  PrimaryAction,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchMarketItemsNative } from "@/src/features/market/marketService";
import { usePurchaseHistoryStore } from "@/src/features/market/purchaseHistoryStore";
import { purchaseMarketItemNative } from "@/src/features/market/purchaseService";
import type { MarketCategoryId, MarketItem } from "@/src/features/shared/types";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";

const CATEGORY_FILTERS: Array<{ id: "all" | MarketCategoryId; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "potions", label: "Pociones" },
  { id: "armors", label: "Armaduras" },
  { id: "swords", label: "Espadas" },
  { id: "others", label: "Otros" },
];

const CATEGORY_META: Record<MarketCategoryId, { title: string; icon: keyof typeof MaterialIcons.glyphMap; tone: "gold" | "teal" | "default" }> = {
  potions: { title: "Pociones", icon: "auto-fix-high", tone: "teal" },
  armors: { title: "Armaduras", icon: "shield", tone: "gold" },
  swords: { title: "Espadas", icon: "hardware", tone: "default" },
  others: { title: "Otros", icon: "category", tone: "default" },
};

type MarketFeedback = {
  type: "success" | "error";
  message: string;
};

function getRarityLabel(item: MarketItem) {
  if (item.rarity === "mythic") return "Mitico";
  if (item.rarity === "legendary") return "Legendario";
  if (item.rarity === "epic") return "Epico";
  if (item.rarity === "rare") return "Raro";
  return "Comun";
}

function ItemThumb({ item }: { item: MarketItem }) {
  const isMythic = item.rarity === "mythic";

  if (!item.imageUrl) {
    return (
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isMythic ? "rgba(255,86,86,0.62)" : MOBILE_THEME.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isMythic ? "rgba(255,59,71,0.12)" : "rgba(240,179,47,0.08)",
        }}
      >
        <MaterialIcons name="inventory-2" size={22} color={isMythic ? "#ff5666" : MOBILE_THEME.gold} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: item.imageUrl }}
      resizeMode={item.imageFit === "contain" ? "contain" : "cover"}
      style={{
        width: 58,
        height: 58,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isMythic ? "rgba(255,86,86,0.72)" : MOBILE_THEME.borderStrong,
        backgroundColor: MOBILE_THEME.bg,
      }}
    />
  );
}

export default function MarketScreen() {
  const queryClient = useQueryClient();
  const addHistoryEntry = usePurchaseHistoryStore((state) => state.addEntry);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | MarketCategoryId>("all");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [quantityByItemId, setQuantityByItemId] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<MarketFeedback | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const { player, refreshGold } = useSessionStore();

  const marketQuery = useQuery({
    queryKey: ["market-items"],
    queryFn: fetchMarketItemsNative,
  });

  const sortedItems = useMemo(
    () =>
      (marketQuery.data?.items ?? [])
        .slice()
        .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))),
    [marketQuery.data?.items]
  );

  const purchaseMutation = useMutation({
    mutationFn: async (variables: { playerId: string; itemId: string; quantity: number }) => {
      const result = await purchaseMarketItemNative(variables);
      return { result, variables };
    },
    onMutate: async ({ itemId }) => {
      setPendingItemId(itemId);
    },
    onSuccess: async ({ result, variables }) => {
      if (result.status === "error") {
        setFeedback({ type: "error", message: result.message });
        return;
      }

      setFeedback({
        type: "success",
        message: `${result.message} Pedido ${result.orderRef}.`,
      });
      const boughtItem = sortedItems.find((item) => item.id === variables.itemId);
      if (player && boughtItem) {
        addHistoryEntry({
          id: `${result.orderRef}-${Date.now()}`,
          playerId: player.id,
          playerUsername: player.username,
          itemId: boughtItem.id,
          itemName: boughtItem.name,
          quantity: variables.quantity,
          totalPrice: result.totalPrice,
          remainingGold: result.remainingGold,
          orderRef: result.orderRef,
          purchasedAt: new Date().toISOString(),
        });
      }

      await refreshGold();
      if (player?.id) {
        await queryClient.invalidateQueries({ queryKey: ["inventory", player.id] });
      }
      await queryClient.invalidateQueries({ queryKey: ["market-items"] });
    },
    onError: () => {
      setFeedback({ type: "error", message: "No se pudo completar la compra." });
    },
    onSettled: () => {
      setPendingItemId(null);
    },
  });

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return sortedItems.filter((item) => {
      const categoryOk = categoryFilter === "all" || item.category === categoryFilter;
      const searchOk =
        normalized.length === 0 ||
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized);
      return categoryOk && searchOk;
    });
  }, [categoryFilter, search, sortedItems]);

  const categoryStats = useMemo(() => {
    return sortedItems.reduce<Record<MarketCategoryId, number>>(
      (acc, item) => {
        acc[item.category] += 1;
        return acc;
      },
      { potions: 0, armors: 0, swords: 0, others: 0 }
    );
  }, [sortedItems]);

  return (
    <ScreenShell
      title="Mercado"
      subtitle="Compra segura nativa"
      rightSlot={
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: "rgba(17,16,13,0.88)",
            paddingHorizontal: 12,
            paddingVertical: 9,
            alignItems: "center",
            minWidth: 86,
          }}
        >
          <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "900" }}>ORO</Text>
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>{player?.gold ?? 0}</Text>
        </View>
      }
      onRefresh={() => {
        void marketQuery.refetch();
        void refreshGold();
      }}
      refreshing={marketQuery.isRefetching}
    >
      <StaggerItem index={0}>
        <RealmCard tone="gold">
          <SectionHeader eyebrow="Catalogo" title="Objetos del reino" />
          <SearchInput value={search} onChangeText={setSearch} placeholder="Buscar item" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CATEGORY_FILTERS.map((chip) => (
                <Pill
                  key={chip.id}
                  label={chip.id === "all" ? `${chip.label} ${sortedItems.length}` : `${chip.label} ${categoryStats[chip.id]}`}
                  active={chip.id === categoryFilter}
                  onPress={() => setCategoryFilter(chip.id)}
                />
              ))}
            </View>
          </ScrollView>
        </RealmCard>
      </StaggerItem>

      {sortedItems.length > 0 ? (
        <StaggerItem index={1}>
          <RealmCard tone="teal">
            <SectionHeader eyebrow="Categorias" title="Resumen rapido" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {(Object.keys(CATEGORY_META) as MarketCategoryId[]).map((category) => {
                const meta = CATEGORY_META[category];
                return (
                  <Pressable
                    key={category}
                    onPress={() => setCategoryFilter(category)}
                    style={({ pressed }) => ({
                      width: "47.5%",
                      minHeight: 78,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: categoryFilter === category ? "rgba(240,179,47,0.7)" : MOBILE_THEME.border,
                      backgroundColor: pressed || categoryFilter === category ? "rgba(240,179,47,0.1)" : "rgba(5,5,4,0.58)",
                      padding: 11,
                      justifyContent: "space-between",
                    })}
                  >
                    <MaterialIcons
                      name={meta.icon}
                      size={19}
                      color={meta.tone === "teal" ? MOBILE_THEME.teal : MOBILE_THEME.gold}
                    />
                    <View>
                      <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>{meta.title}</Text>
                      <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11 }}>{categoryStats[category]} items</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </RealmCard>
        </StaggerItem>
      ) : null}

      {marketQuery.isLoading ? (
        <StaggerItem index={2}>
          <LoadingPanel label="Cargando mercado" />
        </StaggerItem>
      ) : null}

      {marketQuery.data?.errorMessage ? (
        <StaggerItem index={2}>
          <ErrorPanel
            message={marketQuery.data.errorMessage}
            onRetry={() => {
              void marketQuery.refetch();
              void refreshGold();
            }}
          />
        </StaggerItem>
      ) : null}

      {feedback ? (
        <StaggerItem index={3}>
          <NoticeBanner
            title={feedback.type === "error" ? "Compra no completada" : "Compra confirmada"}
            message={feedback.message}
            tone={feedback.type === "error" ? "danger" : "teal"}
            icon={feedback.type === "error" ? "error-outline" : "inventory"}
          />
        </StaggerItem>
      ) : null}

      <StaggerItem index={4}>
        <RealmStockExchangeNative />
      </StaggerItem>

      <StaggerItem index={5}>
        <TavernSlotsNative />
      </StaggerItem>

      {filteredItems.map((item, index) => {
        const stockLimit = Math.max(0, Math.floor(item.stockLimit ?? 0));
        const stockSold = Math.max(0, Math.floor(item.stockSold ?? 0));
        const remainingStock = stockLimit > 0 ? Math.max(0, stockLimit - stockSold) : null;
        const isSoldOut = item.stockStatus === "sold-out" || remainingStock === 0;
        const maxQuantity = remainingStock ?? 99;
        const quantity = Math.min(quantityByItemId[item.id] ?? 1, maxQuantity);
        const pending = pendingItemId === item.id;
        const totalPrice = item.price * quantity;
        const notEnoughGold = Boolean(player && totalPrice > player.gold);
        const disabled = !player || isSoldOut || pending || notEnoughGold;

        return (
          <StaggerItem key={item.id} index={index + 6}>
            <RealmCard tone={item.rarity === "mythic" ? "mythic" : item.featured ? "gold" : "default"}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <ItemThumb item={item} />
                <View style={{ flex: 1, gap: 5 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    <Text style={{ color: MOBILE_THEME.text, fontSize: 16, fontWeight: "900", flex: 1 }} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>{item.price}</Text>
                  </View>
                  <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 18 }} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    <Pill label={getRarityLabel(item)} active={item.rarity === "mythic"} />
                    <Pill label={isSoldOut ? "Agotado" : remainingStock !== null ? "Limitado" : "Disponible"} />
                  </View>
                  {remainingStock !== null ? (
                    <Text style={{ color: isSoldOut ? MOBILE_THEME.danger : MOBILE_THEME.gold, fontSize: 11, fontWeight: "900" }}>
                      Limitado: {remainingStock}/{stockLimit}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <PrimaryAction
                  label="-"
                  icon="remove"
                  variant="ghost"
                  disabled={pending}
                  onPress={() =>
                    setQuantityByItemId((current) => ({
                      ...current,
                      [item.id]: Math.max(1, quantity - 1),
                    }))
                  }
                />
                <View
                  style={{
                    minWidth: 48,
                    minHeight: 46,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: MOBILE_THEME.border,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: MOBILE_THEME.bg,
                  }}
                >
                  <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>{quantity}</Text>
                </View>
                <PrimaryAction
                  label="+"
                  icon="add"
                  variant="ghost"
                  disabled={pending}
                  onPress={() =>
                    setQuantityByItemId((current) => ({
                      ...current,
                      [item.id]: Math.min(maxQuantity, quantity + 1),
                    }))
                  }
                />
              </View>

              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: notEnoughGold ? "rgba(225,100,100,0.4)" : MOBILE_THEME.border,
                  backgroundColor: "rgba(5,5,4,0.62)",
                  padding: 11,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: MOBILE_THEME.dimText, fontWeight: "900", fontSize: 11 }}>TOTAL</Text>
                <Text style={{ color: notEnoughGold ? MOBILE_THEME.danger : MOBILE_THEME.gold, fontWeight: "900" }}>
                  {totalPrice} oro
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryAction label="Detalle" icon="visibility" variant="ghost" disabled={pending} onPress={() => setSelectedItem(item)} />
                </View>
                <View style={{ flex: 1.25 }}>
                  <PrimaryAction
                    label={isSoldOut ? "Agotado" : !player ? "Conecta perfil" : notEnoughGold ? "Sin oro" : "Comprar"}
                    icon="shopping-bag"
                    loading={pending}
                    disabled={disabled}
                    onPress={() => {
                      setFeedback(null);
                      if (!player) {
                        setFeedback({ type: "error", message: "Conecta tu perfil primero." });
                        return;
                      }
                      void purchaseMutation.mutateAsync({ playerId: player.id, itemId: item.id, quantity });
                    }}
                  />
                </View>
              </View>
            </RealmCard>
          </StaggerItem>
        );
      })}

      {!marketQuery.isLoading && !marketQuery.data?.errorMessage && filteredItems.length === 0 ? (
        <EmptyState title="Sin items" message="No hay objetos para ese filtro." icon="inventory-2" />
      ) : null}

      <DetailSheet
        visible={Boolean(selectedItem)}
        title={selectedItem?.name ?? "Detalle"}
        subtitle={selectedItem ? `${selectedItem.category} / ${selectedItem.rarity}` : ""}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem?.imageUrl ? (
          <Image
            source={{ uri: selectedItem.imageUrl }}
            resizeMode={selectedItem.imageFit === "contain" ? "contain" : "cover"}
            style={{
              width: "100%",
              height: 190,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: MOBILE_THEME.bg,
            }}
          />
        ) : null}
        <RealmCard>
          <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>{selectedItem?.description}</Text>
          {selectedItem?.ability ? (
            <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Habilidad: {selectedItem.ability}</Text>
          ) : null}
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>Precio: {selectedItem?.price ?? 0} oro</Text>
        </RealmCard>
      </DetailSheet>
    </ScreenShell>
  );
}
