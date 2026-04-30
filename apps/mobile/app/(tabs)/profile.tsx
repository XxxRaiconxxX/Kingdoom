import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { DetailSheet } from "@/src/components/DetailSheet";
import { ScreenShell } from "@/src/components/ScreenShell";
import {
  fetchPlayerEventParticipationsNative,
  fetchRealmEventsNative,
  getEventParticipationStatusLabel,
} from "@/src/features/events/eventsService";
import { fetchPlayerInventoryNative } from "@/src/features/inventory/inventoryService";
import { usePurchaseHistoryStore } from "@/src/features/market/purchaseHistoryStore";
import {
  fetchMissionsNative,
  fetchPlayerMissionClaimsNative,
  getMissionClaimStatusLabel,
} from "@/src/features/missions/missionsService";
import type { InventoryCategoryId, InventoryEntry } from "@/src/features/shared/types";
import { MOBILE_THEME } from "@/src/theme/colors";
import { useSessionStore } from "@/src/features/session/sessionStore";

type HistoryWindow = "7d" | "30d" | "all";
type InventoryFilter = "all" | InventoryCategoryId;

export default function ProfileScreen() {
  const { player, disconnect, refreshGold } = useSessionStore();
  const purchaseEntries = usePurchaseHistoryStore((state) => state.entries);
  const clearPlayerEntries = usePurchaseHistoryStore((state) => state.clearPlayerEntries);
  const [historySearch, setHistorySearch] = useState("");
  const [historyWindow, setHistoryWindow] = useState<HistoryWindow>("30d");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryEntry | null>(null);
  const playerAllEntries = useMemo(
    () => (player ? purchaseEntries.filter((entry) => entry.playerId === player.id) : []),
    [player, purchaseEntries]
  );

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
  const missionsQuery = useQuery({
    queryKey: ["realm-missions", "profile"],
    queryFn: fetchMissionsNative,
    enabled: Boolean(player?.id),
  });
  const eventsQuery = useQuery({
    queryKey: ["realm-events", "profile"],
    queryFn: fetchRealmEventsNative,
    enabled: Boolean(player?.id),
  });
  const missionIds = useMemo(
    () => (missionsQuery.data?.missions ?? []).map((mission) => mission.id),
    [missionsQuery.data?.missions]
  );
  const eventIds = useMemo(
    () => (eventsQuery.data?.events ?? []).map((event) => event.id),
    [eventsQuery.data?.events]
  );
  const playerMissionQuery = useQuery({
    queryKey: ["player-mission-claims", "profile", player?.id, missionIds],
    queryFn: () => fetchPlayerMissionClaimsNative(player?.id ?? "", missionIds),
    enabled: Boolean(player?.id) && missionIds.length > 0,
  });
  const playerEventQuery = useQuery({
    queryKey: ["player-event-participations", "profile", player?.id, eventIds],
    queryFn: () => fetchPlayerEventParticipationsNative(player?.id ?? "", eventIds),
    enabled: Boolean(player?.id) && eventIds.length > 0,
  });

  const filteredInventoryItems = useMemo(() => {
    const normalized = inventorySearch.trim().toLowerCase();
    return (inventoryQuery.data?.items ?? []).filter((item) => {
      const categoryOk = inventoryFilter === "all" || item.itemCategory === inventoryFilter;
      const searchOk =
        !normalized ||
        item.itemName.toLowerCase().includes(normalized) ||
        item.itemId.toLowerCase().includes(normalized);
      return categoryOk && searchOk;
    });
  }, [inventoryFilter, inventoryQuery.data?.items, inventorySearch]);

  const profileMetrics = useMemo(() => {
    const now = Date.now();
    const start7d = now - 7 * 24 * 60 * 60 * 1000;
    const start30d = now - 30 * 24 * 60 * 60 * 1000;

    let spent7d = 0;
    let spent30d = 0;
    let buys7d = 0;
    let buys30d = 0;

    for (const entry of playerAllEntries) {
      const when = new Date(entry.purchasedAt).getTime();
      if (!Number.isFinite(when)) {
        continue;
      }
      if (when >= start30d) {
        spent30d += entry.totalPrice;
        buys30d += 1;
      }
      if (when >= start7d) {
        spent7d += entry.totalPrice;
        buys7d += 1;
      }
    }

    const inventoryItems = inventoryQuery.data?.items ?? [];
    const totalUnits = inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
    const uniqueItems = inventoryItems.length;
    const missionClaims = Object.values(playerMissionQuery.data?.claimsByMissionId ?? {});
    const eventParticipations = Object.values(playerEventQuery.data?.participationsByEventId ?? {});
    const pendingMissionReviews = missionClaims.filter((claim) => claim.status === "completed").length;

    return {
      spent7d,
      spent30d,
      buys7d,
      buys30d,
      totalUnits,
      uniqueItems,
      activeMissions: missionClaims.length,
      activeEvents: eventParticipations.length,
      pendingMissionReviews,
    };
  }, [
    inventoryQuery.data?.items,
    playerAllEntries,
    playerEventQuery.data?.participationsByEventId,
    playerMissionQuery.data?.claimsByMissionId,
  ]);

  const playerMissionCards = useMemo(() => {
    const claimsByMissionId = playerMissionQuery.data?.claimsByMissionId ?? {};
    return (missionsQuery.data?.missions ?? [])
      .map((mission) => ({ mission, claim: claimsByMissionId[mission.id] }))
      .filter((entry) => Boolean(entry.claim))
      .slice(0, 4);
  }, [missionsQuery.data?.missions, playerMissionQuery.data?.claimsByMissionId]);

  const playerEventCards = useMemo(() => {
    const participationsByEventId = playerEventQuery.data?.participationsByEventId ?? {};
    return (eventsQuery.data?.events ?? [])
      .map((event) => ({ event, participation: participationsByEventId[event.id] }))
      .filter((entry) => Boolean(entry.participation))
      .slice(0, 4);
  }, [eventsQuery.data?.events, playerEventQuery.data?.participationsByEventId]);

  const isRefreshing =
    inventoryQuery.isRefetching ||
    missionsQuery.isRefetching ||
    eventsQuery.isRefetching ||
    playerMissionQuery.isRefetching ||
    playerEventQuery.isRefetching;

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
        void missionsQuery.refetch();
        void eventsQuery.refetch();
        void playerMissionQuery.refetch();
        void playerEventQuery.refetch();
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
        <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, fontWeight: "800" }}>
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
          <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 16 }}>
            Resumen de actividad
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: MOBILE_THEME.bg,
                padding: 10,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>COMPRAS 7 DIAS</Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 18 }}>
                {profileMetrics.buys7d}
              </Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12 }}>
                -{profileMetrics.spent7d} oro
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: MOBILE_THEME.bg,
                padding: 10,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>COMPRAS 30 DIAS</Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 18 }}>
                {profileMetrics.buys30d}
              </Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12 }}>
                -{profileMetrics.spent30d} oro
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: MOBILE_THEME.bg,
                padding: 10,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>OBJETOS UNICOS</Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 18 }}>
                {profileMetrics.uniqueItems}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: MOBILE_THEME.bg,
                padding: 10,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>UNIDADES TOTALES</Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 18 }}>
                {profileMetrics.totalUnits}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: MOBILE_THEME.bg,
                padding: 10,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>MISIONES</Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 18 }}>
                {profileMetrics.activeMissions}
              </Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12 }}>
                {profileMetrics.pendingMissionReviews} en revision
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: MOBILE_THEME.bg,
                padding: 10,
                gap: 3,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 11 }}>EVENTOS</Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 18 }}>
                {profileMetrics.activeEvents}
              </Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12 }}>participando</Text>
            </View>
          </View>
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
            gap: 10,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontWeight: "800", fontSize: 16 }}>
            Actividad del rol
          </Text>
          {missionsQuery.isLoading || eventsQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "800", fontSize: 12 }}>MISIONES TOMADAS</Text>
          {playerMissionCards.map(({ mission, claim }) => (
            <View
              key={mission.id}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                padding: 10,
                backgroundColor: MOBILE_THEME.bg,
                gap: 4,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800" }}>{mission.title}</Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, fontWeight: "700" }}>
                {claim ? getMissionClaimStatusLabel(claim.status) : "-"} | {mission.rewardGold} oro
              </Text>
              {claim?.proofText ? (
                <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }} numberOfLines={2}>
                  {claim.proofText}
                </Text>
              ) : null}
            </View>
          ))}
          {playerMissionCards.length === 0 ? (
            <Text style={{ color: MOBILE_THEME.mutedText }}>Sin misiones tomadas.</Text>
          ) : null}
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "800", fontSize: 12, marginTop: 4 }}>EVENTOS</Text>
          {playerEventCards.map(({ event, participation }) => (
            <View
              key={event.id}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                padding: 10,
                backgroundColor: MOBILE_THEME.bg,
                gap: 4,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "800" }}>{event.title}</Text>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, fontWeight: "700" }}>
                {participation ? getEventParticipationStatusLabel(participation.status) : "-"} | {event.participationRewardGold} oro
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
                {event.startDate} / {event.endDate}
              </Text>
            </View>
          ))}
          {playerEventCards.length === 0 ? (
            <Text style={{ color: MOBILE_THEME.mutedText }}>Sin eventos tomados.</Text>
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
          <TextInput
            value={inventorySearch}
            onChangeText={setInventorySearch}
            autoCapitalize="none"
            placeholder="Buscar objeto o ID"
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(
                [
                  { id: "all", label: "Todo" },
                  { id: "armors", label: "Armaduras" },
                  { id: "swords", label: "Espadas" },
                  { id: "others", label: "Otros" },
                ] as Array<{ id: InventoryFilter; label: string }>
              ).map((chip) => {
                const active = inventoryFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setInventoryFilter(chip.id)}
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
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          {inventoryQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
          {inventoryQuery.data?.errorMessage ? (
            <View
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                padding: 10,
                backgroundColor: MOBILE_THEME.bg,
                gap: 8,
              }}
            >
              <Text style={{ color: MOBILE_THEME.danger }}>{inventoryQuery.data.errorMessage}</Text>
              <Pressable
                onPress={() => {
                  void inventoryQuery.refetch();
                }}
                style={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: MOBILE_THEME.border,
                  paddingVertical: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: MOBILE_THEME.text, fontWeight: "700", fontSize: 12 }}>
                  Reintentar inventario
                </Text>
              </Pressable>
            </View>
          ) : null}
          {filteredInventoryItems.map((item) => (
            <View
              key={item.id}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                padding: 10,
                backgroundColor: MOBILE_THEME.bg,
                gap: 4,
              }}
            >
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>
                {item.itemName} x{item.quantity}
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
                {item.itemCategory} | {item.itemRarity}
              </Text>
              <Pressable
                onPress={() => setSelectedInventoryItem(item)}
                style={{
                  marginTop: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: MOBILE_THEME.border,
                  paddingVertical: 7,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: MOBILE_THEME.text, fontSize: 12, fontWeight: "700" }}>
                  Ver detalle
                </Text>
              </Pressable>
            </View>
          ))}
          {!inventoryQuery.isLoading && filteredInventoryItems.length === 0 ? (
            <Text style={{ color: MOBILE_THEME.mutedText }}>Sin objetos registrados.</Text>
          ) : null}
        </View>
      ) : null}

      <DetailSheet
        visible={Boolean(selectedInventoryItem)}
        title={selectedInventoryItem?.itemName ?? "Objeto"}
        subtitle={
          selectedInventoryItem
            ? `${selectedInventoryItem.itemCategory} - ${selectedInventoryItem.itemRarity}`
            : ""
        }
        onClose={() => setSelectedInventoryItem(null)}
      >
        {selectedInventoryItem?.itemImageUrl ? (
          <Image
            source={{ uri: selectedInventoryItem.itemImageUrl }}
            resizeMode={selectedInventoryItem.itemImageFit === "contain" ? "contain" : "cover"}
            style={{
              width: "100%",
              height: 170,
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
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "800" }}>
            Cantidad: x{selectedInventoryItem?.quantity ?? 0}
          </Text>
          <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>
            {selectedInventoryItem?.itemDescription || "Sin descripcion."}
          </Text>
          {selectedInventoryItem?.itemAbility ? (
            <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>
              Habilidad: {selectedInventoryItem.itemAbility}
            </Text>
          ) : null}
          <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
            ID: {selectedInventoryItem?.itemId ?? "-"}
          </Text>
        </View>
      </DetailSheet>
    </ScreenShell>
  );
}
