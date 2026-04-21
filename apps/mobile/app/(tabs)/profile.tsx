import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchPlayerInventoryNative } from "@/src/features/inventory/inventoryService";
import { usePurchaseHistoryStore } from "@/src/features/market/purchaseHistoryStore";
import { MOBILE_THEME } from "@/src/theme/colors";
import { useSessionStore } from "@/src/features/session/sessionStore";

type HistoryWindow = "7d" | "30d" | "all";

export default function ProfileScreen() {
  const { player, disconnect, refreshGold } = useSessionStore();
  const purchaseEntries = usePurchaseHistoryStore((state) => state.entries);
  const clearPlayerEntries = usePurchaseHistoryStore((state) => state.clearPlayerEntries);
  const [historySearch, setHistorySearch] = useState("");
  const [historyWindow, setHistoryWindow] = useState<HistoryWindow>("30d");

  const playerPurchaseEntries = useMemo(() => {
    if (!player) {
      return [];
    }

    const now = Date.now();
    const filterStart =
      historyWindow === "7d"
        ? now - 7 * 24 * 60 * 60 * 1000
        : historyWindow === "30d"
          ? now - 30 * 24 * 60 * 60 * 1000
          : 0;
    const normalized = historySearch.trim().toLowerCase();

    return purchaseEntries
      .filter((entry) => {
        if (entry.playerId !== player.id) {
          return false;
        }
        const purchasedAtMs = new Date(entry.purchasedAt).getTime();
        if (filterStart > 0 && Number.isFinite(purchasedAtMs) && purchasedAtMs < filterStart) {
          return false;
        }
        if (!normalized) {
          return true;
        }
        return (
          entry.itemName.toLowerCase().includes(normalized) ||
          entry.orderRef.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 20);
  }, [historySearch, historyWindow, player, purchaseEntries]);

  const inventoryQuery = useQuery({
    queryKey: ["inventory", player?.id],
    queryFn: () => fetchPlayerInventoryNative(player!.id),
    enabled: Boolean(player?.id),
  });

  const isRefreshing = inventoryQuery.isRefetching;

  async function handleShareHistory() {
    if (!player || playerPurchaseEntries.length === 0) {
      return;
    }

    const lines = playerPurchaseEntries.map((entry) => {
      const date = new Date(entry.purchasedAt);
      const dateLabel = Number.isNaN(date.getTime()) ? entry.purchasedAt : date.toLocaleString();
      return `${dateLabel} | ${entry.itemName} x${entry.quantity} | -${entry.totalPrice} oro | saldo ${entry.remainingGold} | ${entry.orderRef}`;
    });

    const payload = [
      `Kingdoom - Movimientos de compra`,
      `Jugador: ${player.username}`,
      `Total listado: ${playerPurchaseEntries.length}`,
      "",
      ...lines,
    ].join("\n");

    await Share.share({
      message: payload,
      title: `Movimientos ${player.username}`,
    });
  }

  return (
    <ScreenShell
      title="Perfil"
      subtitle="Sesion, oro y estado base"
      onRefresh={() => {
        if (!player) {
          return;
        }
        void refreshGold();
        void inventoryQuery.refetch();
      }}
      refreshing={isRefreshing}
    >
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
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => void handleShareHistory()}
                disabled={playerPurchaseEntries.length === 0}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: MOBILE_THEME.border,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  opacity: playerPurchaseEntries.length === 0 ? 0.5 : 1,
                }}
              >
                <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, fontWeight: "700" }}>
                  Compartir
                </Text>
              </Pressable>
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
          </View>
          <TextInput
            value={historySearch}
            onChangeText={setHistorySearch}
            autoCapitalize="none"
            placeholder="Buscar por item o referencia"
            placeholderTextColor={MOBILE_THEME.mutedText}
            style={{
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              borderRadius: 10,
              paddingHorizontal: 11,
              paddingVertical: 9,
              color: MOBILE_THEME.text,
              backgroundColor: MOBILE_THEME.bg,
              fontSize: 13,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["7d", "30d", "all"] as HistoryWindow[]).map((chip) => {
              const active = historyWindow === chip;
              const label = chip === "7d" ? "7 dias" : chip === "30d" ? "30 dias" : "Todo";
              return (
                <Pressable
                  key={chip}
                  onPress={() => setHistoryWindow(chip)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? MOBILE_THEME.gold : MOBILE_THEME.border,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: active ? "rgba(212,166,74,0.12)" : MOBILE_THEME.bg,
                  }}
                >
                  <Text
                    style={{
                      color: active ? MOBILE_THEME.gold : MOBILE_THEME.mutedText,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
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
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>
                {new Date(entry.purchasedAt).toLocaleString()}
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
