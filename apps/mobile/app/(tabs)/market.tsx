import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchMarketItemsNative } from "@/src/features/market/marketService";
import { purchaseMarketItemNative } from "@/src/features/market/purchaseService";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function MarketScreen() {
  const queryClient = useQueryClient();
  const [quantityByItemId, setQuantityByItemId] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const { player, refreshGold } = useSessionStore();

  const marketQuery = useQuery({
    queryKey: ["market-items"],
    queryFn: fetchMarketItemsNative,
  });

  const purchaseMutation = useMutation({
    mutationFn: purchaseMarketItemNative,
    onSuccess: async (result) => {
      if (result.status === "error") {
        setFeedback(result.message);
        return;
      }

      setFeedback(
        `${result.message} Pedido ${result.orderRef}. Descuento: ${result.totalPrice} oro.`
      );
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

  return (
    <ScreenShell title="Mercado" subtitle="Catalogo, compra e inventario">
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

      {sortedItems.map((item) => (
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
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>
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
    </ScreenShell>
  );
}
