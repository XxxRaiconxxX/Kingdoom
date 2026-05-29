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
import { MaterialIcons } from "@expo/vector-icons";
import { DetailSheet } from "@/src/components/DetailSheet";
import {
  EmptyState,
  MetricTile,
  Pill,
  PrimaryAction,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { PlayerNotificationBellNative } from "@/src/components/PlayerNotificationBellNative";
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
    () => (missionsQuery.data?.missions ?? []).map((m) => m.id).filter((id): id is string => Boolean(id)),
    [missionsQuery.data?.missions]
  );
  const eventIds = useMemo(
    () => (eventsQuery.data?.events ?? []).map((e) => e.id).filter((id): id is string => Boolean(id)),
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
      .map((mission) => ({ mission, claim: mission.id ? claimsByMissionId[mission.id] : null }))
      .filter((entry) => Boolean(entry.claim))
      .slice(0, 4);
  }, [missionsQuery.data?.missions, playerMissionQuery.data?.claimsByMissionId]);

  const playerEventCards = useMemo(() => {
    const participationsByEventId = playerEventQuery.data?.participationsByEventId ?? {};
    return (eventsQuery.data?.events ?? [])
      .map((event) => ({ event, participation: event.id ? participationsByEventId[event.id] : null }))
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
      rightSlot={
        player ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <PlayerNotificationBellNative playerId={player.id} />
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: "rgba(17,16,13,0.86)",
                padding: 10,
                alignItems: "center",
                minWidth: 70,
              }}
            >
              <MaterialIcons name="account-circle" size={22} color={MOBILE_THEME.gold} />
              <Text style={{ color: MOBILE_THEME.text, fontSize: 11, fontWeight: "900", marginTop: 4 }} numberOfLines={1}>
                {player.username}
              </Text>
            </View>
          </View>
        ) : null
      }
    >
      <StaggerItem index={0}>
        <RealmCard tone={player ? "gold" : "default"}>
          <SectionHeader eyebrow="Jugador" title={player ? player.username : "Sin sesion activa"} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricTile label="ORO" value={player?.gold ?? 0} icon="account-balance-wallet" />
          </View>
          {player ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <PrimaryAction label="Salir" icon="logout" variant="ghost" onPress={disconnect} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryAction label="Refrescar" icon="refresh" variant="gold" onPress={() => void refreshGold()} />
              </View>
            </View>
          ) : null}
        </RealmCard>
      </StaggerItem>

      {player ? (
        <StaggerItem index={1}>
          <RealmCard tone="teal">
            <SectionHeader eyebrow="Metricas" title="Resumen de actividad" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricTile label="COMPRAS 7D" value={profileMetrics.buys7d} icon="shopping-cart" />
              <MetricTile label="COMPRAS 30D" value={profileMetrics.buys30d} icon="shopping-cart" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricTile label="OBJETOS UNICOS" value={profileMetrics.uniqueItems} icon="category" />
              <MetricTile label="UNIDADES" value={profileMetrics.totalUnits} icon="inventory-2" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricTile label="MISIONES" value={profileMetrics.activeMissions} icon="flag" />
              <MetricTile label="EVENTOS" value={profileMetrics.activeEvents} icon="event" />
            </View>
          </RealmCard>
        </StaggerItem>
      ) : null}

      {player ? (
        <StaggerItem index={2}>
          <RealmCard>
            <SectionHeader eyebrow="Progreso" title="Actividad del rol" />
            {missionsQuery.isLoading || eventsQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
            <Text style={{ color: MOBILE_THEME.gold, fontWeight: "800", fontSize: 12, marginTop: 4 }}>MISIONES TOMADAS</Text>
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
              <EmptyState title="Sin misiones" message="No tienes misiones activas." />
            ) : null}
            <Text style={{ color: MOBILE_THEME.gold, fontWeight: "800", fontSize: 12, marginTop: 8 }}>EVENTOS</Text>
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
              <EmptyState title="Sin eventos" message="No estas participando en eventos." />
            ) : null}
          </RealmCard>
        </StaggerItem>
      ) : null}

      {player ? (
        <StaggerItem index={3}>
          <RealmCard>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <SectionHeader eyebrow="Historial" title="Movimientos" />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <PrimaryAction
                  label="Compartir"
                  icon="share"
                  variant="ghost"
                  disabled={playerPurchaseEntries.length === 0}
                  onPress={() => void handleShareHistory()}
                />
                <PrimaryAction
                  label="Limpiar"
                  icon="delete"
                  variant="danger"
                  onPress={() => clearPlayerEntries(player.id)}
                />
              </View>
            </View>
            <SearchInput
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder="Buscar por item o referencia"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["7d", "30d", "all"] as HistoryWindow[]).map((chip) => {
                  const active = historyWindow === chip;
                  const label = chip === "7d" ? "7 dias" : chip === "30d" ? "30 dias" : "Todo";
                  return (
                    <Pill
                      key={chip}
                      label={label}
                      active={active}
                      onPress={() => setHistoryWindow(chip)}
                    />
                  );
                })}
              </View>
            </ScrollView>
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
              <EmptyState title="Sin movimientos" message="No se encontraron compras en este periodo." />
            ) : null}
          </RealmCard>
        </StaggerItem>
      ) : null}

      {player ? (
        <StaggerItem index={4}>
          <RealmCard>
            <SectionHeader eyebrow="Coleccion" title="Inventario" />
            <SearchInput
              value={inventorySearch}
              onChangeText={setInventorySearch}
              placeholder="Buscar objeto o ID"
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
                    <Pill
                      key={chip.id}
                      label={chip.label}
                      active={active}
                      onPress={() => setInventoryFilter(chip.id)}
                    />
                  );
                })}
              </View>
            </ScrollView>
            {inventoryQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
            {inventoryQuery.data?.errorMessage ? (
              <RealmCard tone="danger">
                <Text style={{ color: MOBILE_THEME.danger, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
                  {inventoryQuery.data.errorMessage}
                </Text>
                <PrimaryAction
                  label="Reintentar inventario"
                  icon="refresh"
                  variant="danger"
                  onPress={() => void inventoryQuery.refetch()}
                />
              </RealmCard>
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
                <View style={{ marginTop: 4 }}>
                  <PrimaryAction
                    label="Ver detalle"
                    icon="visibility"
                    variant="ghost"
                    onPress={() => setSelectedInventoryItem(item)}
                  />
                </View>
              </View>
            ))}
            {!inventoryQuery.isLoading && filteredInventoryItems.length === 0 ? (
              <EmptyState title="Sin objetos" message="No tienes objetos en esta categoria." />
            ) : null}
          </RealmCard>
        </StaggerItem>
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
