import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ErrorPanel,
  MetricTile,
  PrimaryAction,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchRealmEventsNative } from "@/src/features/events/eventsService";
import { fetchMissionsNative } from "@/src/features/missions/missionsService";
import type { RealmEvent, RealmMission } from "@/src/features/shared/types";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";

function QuickAction({
  label,
  detail,
  icon,
  onPress,
}: {
  label: string;
  detail: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 86,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: pressed ? "rgba(240,179,47,0.58)" : MOBILE_THEME.border,
        backgroundColor: pressed ? "rgba(240,179,47,0.12)" : "rgba(5,5,4,0.64)",
        padding: 12,
        justifyContent: "space-between",
      })}
    >
      <MaterialIcons name={icon} size={20} color={MOBILE_THEME.gold} />
      <View>
        <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11, marginTop: 2 }}>{detail}</Text>
      </View>
    </Pressable>
  );
}

function PulseCard({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: MOBILE_THEME.border,
        backgroundColor: "rgba(5,5,4,0.62)",
        padding: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: MOBILE_THEME.gold, fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }} numberOfLines={1}>
        {title}
      </Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 18 }} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState("");
  const { player, isLoading, errorMessage, connectByUsername, clearError } = useSessionStore();
  const eventsQuery = useQuery({ queryKey: ["realm-events", "home"], queryFn: fetchRealmEventsNative });
  const missionsQuery = useQuery({ queryKey: ["realm-missions", "home"], queryFn: fetchMissionsNative });
  const activeEvents = (eventsQuery.data?.events ?? []).filter((event) => event.status !== "finished");
  const openMissions = (missionsQuery.data?.missions ?? []).filter((mission) => mission.status !== "closed");
  const featuredEvent: RealmEvent | undefined = activeEvents[0];
  const featuredMission: RealmMission | undefined = openMissions[0];

  async function handleConnect() {
    clearError();
    await connectByUsername(usernameInput);
  }

  return (
    <ScreenShell
      title="Kingdoom Native"
      subtitle="Perfil, oro y pulso del reino"
      rightSlot={
        player ? (
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
        ) : null
      }
    >
      <StaggerItem index={0}>
        <RealmCard tone={player ? "teal" : "gold"}>
          <SectionHeader eyebrow="Sesion" title={player ? "Perfil conectado" : "Conecta tu perfil"} />
          {player ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>{player.username}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <MetricTile label="ORO" value={player.gold} icon="account-balance-wallet" />
                <MetricTile label="ACTIVIDAD" value={activeEvents.length + openMissions.length} icon="local-fire-department" />
              </View>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <SearchInput value={usernameInput} onChangeText={setUsernameInput} placeholder="Nombre registrado" />
              <PrimaryAction
                label="Conectar"
                icon="login"
                loading={isLoading}
                disabled={usernameInput.trim().length === 0}
                onPress={() => void handleConnect()}
              />
            </View>
          )}
        </RealmCard>
      </StaggerItem>

      {errorMessage ? (
        <StaggerItem index={1}>
          <ErrorPanel message={errorMessage} />
        </StaggerItem>
      ) : null}

      <StaggerItem index={2}>
        <RealmCard tone="teal">
          <SectionHeader
            eyebrow="Reino"
            title="Actividad abierta"
            trailing={eventsQuery.isLoading || missionsQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricTile label="EVENTOS" value={activeEvents.length} icon="event" />
            <MetricTile label="MISIONES" value={openMissions.length} icon="flag" />
          </View>
          {featuredEvent ? (
            <PulseCard label="Evento" title={featuredEvent.title} subtitle={featuredEvent.description} />
          ) : null}
          {featuredMission ? (
            <PulseCard label="Mision" title={featuredMission.title} subtitle={`${featuredMission.rewardGold} oro - ${featuredMission.difficulty}`} />
          ) : null}
        </RealmCard>
      </StaggerItem>

      <StaggerItem index={3}>
        <RealmCard>
          <SectionHeader eyebrow="Acceso rapido" title="Mesa de mando" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickAction label="Misiones" detail="Tomar y entregar" icon="flag" onPress={() => router.push("/(tabs)/library")} />
            <QuickAction label="Mercado" detail="Comprar seguro" icon="store" onPress={() => router.push("/(tabs)/market")} />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickAction label="Grimorio" detail="Magias y bestias" icon="auto-stories" onPress={() => router.push("/(tabs)/grimoire")} />
            <QuickAction label="Archivista" detail="Consultar IA" icon="auto-awesome" onPress={() => router.push("/(tabs)/archivist")} />
          </View>
        </RealmCard>
      </StaggerItem>

      {eventsQuery.data?.errorMessage || missionsQuery.data?.errorMessage ? (
        <StaggerItem index={4}>
          <ErrorPanel
            message={eventsQuery.data?.errorMessage || missionsQuery.data?.errorMessage || ""}
            onRetry={() => {
              void eventsQuery.refetch();
              void missionsQuery.refetch();
            }}
          />
        </StaggerItem>
      ) : null}
    </ScreenShell>
  );
}
