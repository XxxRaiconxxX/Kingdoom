import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchMarketItemsNative } from "@/src/features/market/marketService";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function MarketScreen() {
  const marketQuery = useQuery({
    queryKey: ["market-items"],
    queryFn: fetchMarketItemsNative,
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
        </View>
      ))}
    </ScreenShell>
  );
}
