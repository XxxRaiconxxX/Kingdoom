import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailSheet } from "@/src/components/DetailSheet";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchMarketItemsNative } from "@/src/features/market/marketService";
import { usePurchaseHistoryStore } from "@/src/features/market/purchaseHistoryStore";
import { purchaseMarketItemNative } from "@/src/features/market/purchaseService";
import { useSessionStore } from "@/src/features/session/sessionStore";
import type { MarketCategoryId, MarketItem } from "@/src/features/shared/types";
import { MOBILE_THEME } from "@/src/theme/colors";

const CATEGORY_FILTERS: Array<{ id: "all" | MarketCategoryId; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "potions", label: "Pociones" },
  { id: "armors", label: "Armaduras" },
  { id: "swords", label: "Espadas" },
  { id: "others", label: "Otros" },
];

export default function MarketScreen() {
  const queryClient = useQueryClient();
  const addHistoryEntry = usePurchaseHistoryStore((state) => state.addEntry);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | MarketCategoryId>("all");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [quantityByItemId, setQuantityByItemId] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const { player, refreshGold } = useSessionStore();

  const marketQuery = useQuery({
    queryKey: ["market-items"],
    queryFn: fetchMarketItemsNative,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (variables: { playerId: string; itemId: string; quantity: number }) => {
      const result = await purchaseMarketItemNative(variables);
      return { result, variables };
    },
    onSuccess: async ({ result, variables }) => {
      if (result.status === "error") {
        setFeedback(result.message);
        return;
      }

      setFeedback(
        `${result.message} Pedido ${result.orderRef}. Descuento: ${result.totalPrice} oro.`
      );
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
  });

  const sortedItems = useMemo(
    () => (marketQuery.data?.items ?? []).slice().sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))),
    [marketQuery.data?.items]
  );

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

  return (
    <ScreenShell
      title="Mercado"
      subtitle="Compra segura nativa"
      onRefresh={() => {
        void marketQuery.refetch();
        void refreshGold();
      }}
      refreshing={marketQuery.isRefetching}
    >
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          backgroundColor: MOBILE_THEME.surfaceSoft,
          padding: 12,
          gap: 10,
        }}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          placeholder="Buscar item"
          placeholderTextColor={MOBILE_THEME.mutedText}
          style={{
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: MOBILE_THEME.text,
            backgroundColor: MOBILE_THEME.bg,
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CATEGORY_FILTERS.map((chip) => {
              const active = chip.id === categoryFilter;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setCategoryFilter(chip.id)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? MOBILE_THEME.gold : MOBILE_THEME.border,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: active ? "rgba(212,166,74,0.14)" : MOBILE_THEME.bg,
                  }}
                >
                  <Text
                    style={{
                      color: active ? MOBILE_THEME.gold : MOBILE_THEME.mutedText,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {marketQuery.isLoading ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 16,
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={MOBILE_THEME.gold} />
        </View>
      ) : null}

      {marketQuery.data?.errorMessage ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
          }}
        >
          <Text style={{ color: MOBILE_THEME.danger, lineHeight: 20 }}>
            {marketQuery.data.errorMessage}
          </Text>
        </View>
      ) : null}

      {feedback ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 12,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text }}>{feedback}</Text>
        </View>
      ) : null}

      {filteredItems.map((item) => (
        <View
          key={item.id}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
            gap: 6,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontSize: 16, fontWeight: "800" }}>
            {item.name}
          </Text>
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "700" }}>{item.price} oro</Text>
          <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
            {item.category} | {item.rarity} | {item.stockStatus}
            {item.featured ? " | destacado" : ""}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() =>
                setQuantityByItemId((current) => ({
                  ...current,
                  [item.id]: Math.max(1, (current[item.id] ?? 1) - 1),
                }))
              }
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>-</Text>
            </Pressable>
            <Text style={{ color: MOBILE_THEME.text, minWidth: 24, textAlign: "center" }}>
              {quantityByItemId[item.id] ?? 1}
            </Text>
            <Pressable
              onPress={() =>
                setQuantityByItemId((current) => ({
                  ...current,
                  [item.id]: Math.min(99, (current[item.id] ?? 1) + 1),
                }))
              }
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>+</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setSelectedItem(item)}
            style={{
              marginTop: 2,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              paddingVertical: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: MOBILE_THEME.text, fontWeight: "700", fontSize: 12 }}>
              Ver detalle
            </Text>
          </Pressable>

          <Pressable
            disabled={
              !player ||
              item.stockStatus === "sold-out" ||
              purchaseMutation.isPending
            }
            onPress={() => {
              setFeedback("");
              if (!player) {
                setFeedback("Conecta tu perfil primero para comprar.");
                return;
              }

              void purchaseMutation.mutateAsync({
                playerId: player.id,
                itemId: item.id,
                quantity: quantityByItemId[item.id] ?? 1,
              });
            }}
            style={{
              marginTop: 8,
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
              backgroundColor:
                !player || item.stockStatus === "sold-out" || purchaseMutation.isPending
                  ? MOBILE_THEME.border
                  : MOBILE_THEME.gold,
            }}
          >
            {purchaseMutation.isPending ? (
              <ActivityIndicator color={MOBILE_THEME.bg} />
            ) : (
              <Text
                style={{
                  color:
                    !player || item.stockStatus === "sold-out"
                      ? MOBILE_THEME.mutedText
                      : MOBILE_THEME.bg,
                  fontWeight: "800",
                }}
              >
                {item.stockStatus === "sold-out"
                  ? "Agotado"
                  : !player
                    ? "Conecta perfil"
                    : "Comprar seguro"}
              </Text>
            )}
          </Pressable>
        </View>
      ))}

      {!marketQuery.isLoading && filteredItems.length === 0 ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
          }}
        >
          <Text style={{ color: MOBILE_THEME.mutedText }}>
            No hay items para ese filtro.
          </Text>
        </View>
      ) : null}

      <DetailSheet
        visible={Boolean(selectedItem)}
        title={selectedItem?.name ?? "Detalle"}
        subtitle={selectedItem ? `${selectedItem.category} · ${selectedItem.rarity}` : ""}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem?.imageUrl ? (
          <Image
            source={{ uri: selectedItem.imageUrl }}
            resizeMode={selectedItem.imageFit === "contain" ? "contain" : "cover"}
            style={{
              width: "100%",
              height: 180,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: MOBILE_THEME.bg,
            }}
          />
        ) : null}
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 12,
            gap: 8,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>
            {selectedItem?.description}
          </Text>
          {selectedItem?.ability ? (
            <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>
              Habilidad: {selectedItem.ability}
            </Text>
          ) : null}
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "800", fontSize: 16 }}>
            Precio: {selectedItem?.price ?? 0} oro
          </Text>
          <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
            Estado: {selectedItem?.stockStatus ?? "N/A"}
            {selectedItem?.featured ? " · destacado" : ""}
          </Text>
        </View>
      </DetailSheet>
    </ScreenShell>
  );
}
