import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchPlayerInventoryNative } from "@/src/features/inventory/inventoryService";
import { usePurchaseHistoryStore } from "@/src/features/market/purchaseHistoryStore";
import { MOBILE_THEME } from "@/src/theme/colors";
import { useSessionStore } from "@/src/features/session/sessionStore";

export default function ProfileScreen() {
  const { player, disconnect, refreshGold } = useSessionStore();
  const purchaseEntries = usePurchaseHistoryStore((state) => state.entries);
  const clearPlayerEntries = usePurchaseHistoryStore((state) => state.clearPlayerEntries);

  const playerPurchaseEntries = player
    ? purchaseEntries.filter((entry) => entry.playerId === player.id).slice(0, 8)
    : [];

  const inventoryQuery = useQuery({
    queryKey: ["inventory", player?.id],
    queryFn: () => fetchPlayerInventoryNative(player!.id),
    enabled: Boolean(player?.id),
  });

  return (
    <ScreenShell title="Perfil" subtitle="Sesion, oro y estado base">
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          backgroundColor: MOBILE_THEME.surfaceSoft,
          padding: 14,
          gap: 8,
        }}
      >
        <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, letterSpacing: 0.7 }}>
          JUGADOR
        </Text>
        <Text style={{ color: MOBILE_THEME.text, fontSize: 18, fontWeight: "800" }}>
          {player ? player.username : "Sin sesion activa"}
        </Text>
        <Text style={{ color: MOBILE_THEME.gold, fontSize: 15, fontWeight: "700" }}>
          Oro: {player?.gold ?? 0}
        </Text>

        <Pressable
          onPress={disconnect}
          style={{
            marginTop: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            paddingVertical: 11,
            alignItems: "center",
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>Cerrar sesion</Text>
        </Pressable>
        <Pressable
          onPress={() => void refreshGold()}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: MOBILE_THEME.gold,
            paddingVertical: 11,
            alignItems: "center",
          }}
        >
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "700" }}>Refrescar oro</Text>
        </Pressable>
      </View>

      {player ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 16 }}>
              Movimientos de compra
            </Text>
            <Pressable
              onPress={() => clearPlayerEntries(player.id)}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, fontWeight: "700" }}>
                Limpiar
              </Text>
            </Pressable>
          </View>
          {playerPurchaseEntries.map((entry) => (
            <View
              key={entry.id}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                padding: 10,
                backgroundColor: MOBILE_THEME.bg,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>
                {entry.itemName} x{entry.quantity}
              </Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, fontWeight: "700" }}>
                -{entry.totalPrice} oro | Saldo: {entry.remainingGold}
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>
                Ref: {entry.orderRef}
              </Text>
            </View>
          ))}
          {playerPurchaseEntries.length === 0 ? (
            <Text style={{ color: MOBILE_THEME.mutedText }}>Sin movimientos registrados.</Text>
          ) : null}
        </View>
      ) : null}

      {player ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
            gap: 8,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 16 }}>
            Inventario
          </Text>
          {inventoryQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
          {inventoryQuery.data?.errorMessage ? (
            <Text style={{ color: MOBILE_THEME.danger }}>{inventoryQuery.data.errorMessage}</Text>
          ) : null}
          {(inventoryQuery.data?.items ?? []).map((item) => (
            <View
              key={item.id}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                padding: 10,
                backgroundColor: MOBILE_THEME.bg,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>
                {item.itemName} x{item.quantity}
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
                {item.itemCategory} | {item.itemRarity}
              </Text>
            </View>
          ))}
          {!inventoryQuery.isLoading && (inventoryQuery.data?.items?.length ?? 0) === 0 ? (
            <Text style={{ color: MOBILE_THEME.mutedText }}>Sin objetos registrados.</Text>
          ) : null}
        </View>
      ) : null}
    </ScreenShell>
  );
}
