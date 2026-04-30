import { useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { DetailSheet } from "@/src/components/DetailSheet";
import {
  EmptyState,
  ErrorPanel,
  Pill,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchGrimoireNative } from "@/src/features/grimoire/grimoireService";
import type { BestiaryEntry, FloraEntry, MagicStyle } from "@/src/features/shared/types";
import { MOBILE_THEME } from "@/src/theme/colors";

type GrimoireMode = "magic" | "bestiary" | "flora";
type SelectedEntry =
  | { type: "magic"; entry: MagicStyle }
  | { type: "bestiary"; entry: BestiaryEntry }
  | { type: "flora"; entry: FloraEntry }
  | null;

export default function GrimoireScreen() {
  const [mode, setMode] = useState<GrimoireMode>("magic");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry>(null);
  const grimoireQuery = useQuery({ queryKey: ["grimoire-native"], queryFn: fetchGrimoireNative });

  const normalized = search.trim().toLowerCase();

  const magic = useMemo(
    () =>
      (grimoireQuery.data?.magic ?? []).filter(
        (entry) =>
          (!normalized ||
            entry.title.toLowerCase().includes(normalized) ||
            entry.categoryTitle.toLowerCase().includes(normalized) ||
            entry.description.toLowerCase().includes(normalized)) &&
          (categoryFilter === "all" || entry.categoryTitle === categoryFilter)
      ),
    [categoryFilter, grimoireQuery.data?.magic, normalized]
  );

  const bestiary = useMemo(
    () =>
      (grimoireQuery.data?.bestiary ?? []).filter(
        (entry) =>
          (!normalized ||
            entry.name.toLowerCase().includes(normalized) ||
            entry.category.toLowerCase().includes(normalized) ||
            entry.type.toLowerCase().includes(normalized)) &&
          (categoryFilter === "all" || entry.category === categoryFilter)
      ),
    [categoryFilter, grimoireQuery.data?.bestiary, normalized]
  );

  const flora = useMemo(
    () =>
      (grimoireQuery.data?.flora ?? []).filter(
        (entry) =>
          (!normalized ||
            entry.name.toLowerCase().includes(normalized) ||
            entry.category.toLowerCase().includes(normalized) ||
            entry.type.toLowerCase().includes(normalized)) &&
          (categoryFilter === "all" || entry.category === categoryFilter)
      ),
    [categoryFilter, grimoireQuery.data?.flora, normalized]
  );

  const activeCount = mode === "magic" ? magic.length : mode === "bestiary" ? bestiary.length : flora.length;
  const activeCategories = useMemo(() => {
    const source =
      mode === "magic"
        ? (grimoireQuery.data?.magic ?? []).map((entry) => entry.categoryTitle)
        : mode === "bestiary"
          ? (grimoireQuery.data?.bestiary ?? []).map((entry) => entry.category)
          : (grimoireQuery.data?.flora ?? []).map((entry) => entry.category);
    return Array.from(new Set(source.filter(Boolean))).slice(0, 8);
  }, [grimoireQuery.data?.bestiary, grimoireQuery.data?.flora, grimoireQuery.data?.magic, mode]);

  function selectMode(nextMode: GrimoireMode) {
    setMode(nextMode);
    setCategoryFilter("all");
  }

  return (
    <ScreenShell
      title="Grimorio"
      subtitle="Magias, bestiario y flora"
      onRefresh={() => {
        void grimoireQuery.refetch();
      }}
      refreshing={grimoireQuery.isRefetching}
    >
      <StaggerItem index={0}>
        <RealmCard tone="gold">
          <SectionHeader
            eyebrow="Archivo vivo"
            title="Conocimiento del reino"
            trailing={<Pill label={`${activeCount}`} active />}
          />
          <SearchInput value={search} onChangeText={setSearch} placeholder="Buscar entrada" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pill label={`Magias ${grimoireQuery.data?.magic.length ?? 0}`} icon="auto-stories" active={mode === "magic"} onPress={() => selectMode("magic")} />
              <Pill label={`Bestiario ${grimoireQuery.data?.bestiary.length ?? 0}`} icon="pets" active={mode === "bestiary"} onPress={() => selectMode("bestiary")} />
              <Pill label={`Flora ${grimoireQuery.data?.flora.length ?? 0}`} icon="local-florist" active={mode === "flora"} onPress={() => selectMode("flora")} />
            </View>
          </ScrollView>
          {activeCategories.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pill label="Todo" active={categoryFilter === "all"} onPress={() => setCategoryFilter("all")} />
                {activeCategories.map((category) => (
                  <Pill
                    key={category}
                    label={category}
                    active={categoryFilter === category}
                    onPress={() => setCategoryFilter(category)}
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}
        </RealmCard>
      </StaggerItem>

      {grimoireQuery.isLoading ? (
        <RealmCard>
          <ActivityIndicator color={MOBILE_THEME.gold} />
        </RealmCard>
      ) : null}

      {grimoireQuery.data?.errorMessage ? (
        <ErrorPanel
          message={grimoireQuery.data.errorMessage}
          onRetry={() => {
            void grimoireQuery.refetch();
          }}
        />
      ) : null}

      {mode === "magic"
        ? magic.map((entry, index) => (
            <StaggerItem key={entry.id} index={index + 1}>
              <RealmCard>
                <SectionHeader
                  eyebrow={entry.categoryTitle}
                  title={entry.title}
                  trailing={<MaterialIcons name="auto-stories" size={22} color={MOBILE_THEME.gold} />}
                />
                <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={3}>
                  {entry.description}
                </Text>
                <Pill label="Ver magia" icon="visibility" onPress={() => setSelectedEntry({ type: "magic", entry })} />
              </RealmCard>
            </StaggerItem>
          ))
        : null}

      {mode === "bestiary"
        ? bestiary.map((entry, index) => (
            <StaggerItem key={entry.id} index={index + 1}>
              <RealmCard tone={entry.rarity === "calamity" ? "danger" : entry.rarity === "legendary" ? "gold" : "default"}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {entry.imageUrl ? (
                    <Image
                      source={{ uri: entry.imageUrl }}
                      resizeMode="cover"
                      style={{ width: 72, height: 84, borderRadius: 16, borderWidth: 1, borderColor: MOBILE_THEME.border, backgroundColor: MOBILE_THEME.bg }}
                    />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <SectionHeader eyebrow={entry.rarity} title={entry.name} />
                    <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>{entry.category} / {entry.type}</Text>
                  </View>
                </View>
                <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
                  {entry.description}
                </Text>
                <Pill label="Ver bestia" icon="visibility" onPress={() => setSelectedEntry({ type: "bestiary", entry })} />
              </RealmCard>
            </StaggerItem>
          ))
        : null}

      {mode === "flora"
        ? flora.map((entry, index) => (
            <StaggerItem key={entry.id} index={index + 1}>
              <RealmCard tone={entry.rarity === "legendary" || entry.rarity === "calamity" ? "gold" : "teal"}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {entry.imageUrl ? (
                    <Image
                      source={{ uri: entry.imageUrl }}
                      resizeMode="cover"
                      style={{ width: 72, height: 84, borderRadius: 16, borderWidth: 1, borderColor: MOBILE_THEME.border, backgroundColor: MOBILE_THEME.bg }}
                    />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <SectionHeader eyebrow={entry.rarity} title={entry.name} />
                    <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>{entry.category} / {entry.type}</Text>
                  </View>
                </View>
                <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
                  {entry.description}
                </Text>
                <Pill label="Ver flora" icon="visibility" onPress={() => setSelectedEntry({ type: "flora", entry })} />
              </RealmCard>
            </StaggerItem>
          ))
        : null}

      {!grimoireQuery.isLoading && activeCount === 0 ? (
        <EmptyState title="Sin entradas" message="No hay registros para esta busqueda." icon="auto-stories" />
      ) : null}

      <DetailSheet
        visible={Boolean(selectedEntry)}
        title={
          selectedEntry?.type === "magic"
            ? selectedEntry.entry.title
            : selectedEntry?.entry.name ?? "Entrada"
        }
        subtitle={
          selectedEntry?.type === "magic"
            ? selectedEntry.entry.categoryTitle
            : selectedEntry
              ? `${selectedEntry.entry.category} / ${selectedEntry.entry.type}`
              : ""
        }
        onClose={() => setSelectedEntry(null)}
      >
        {selectedEntry?.type !== "magic" && selectedEntry?.entry.imageUrl ? (
          <Image
            source={{ uri: selectedEntry.entry.imageUrl }}
            resizeMode="cover"
            style={{ width: "100%", height: 210, borderRadius: 16, borderWidth: 1, borderColor: MOBILE_THEME.border, backgroundColor: MOBILE_THEME.bg }}
          />
        ) : null}

        {selectedEntry?.type === "magic" ? (
          <MagicDetail entry={selectedEntry.entry} />
        ) : selectedEntry?.type === "bestiary" ? (
          <BestiaryDetail entry={selectedEntry.entry} />
        ) : selectedEntry?.type === "flora" ? (
          <FloraDetail entry={selectedEntry.entry} />
        ) : null}
      </DetailSheet>
    </ScreenShell>
  );
}

function MagicDetail({ entry }: { entry: MagicStyle }) {
  const levels = Object.entries(entry.levels).slice(0, 5);

  return (
    <>
      <RealmCard>
        <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>{entry.description}</Text>
      </RealmCard>
      {levels.map(([level, abilities]) => (
        <RealmCard key={level}>
          <SectionHeader eyebrow={`Lv ${level}`} title={`Habilidades (${abilities.length})`} />
          {abilities.map((ability) => (
            <View key={`${level}-${ability.name}`} style={{ gap: 4 }}>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>{ability.name}</Text>
              <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 19 }}>{ability.effect}</Text>
              <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>CD: {ability.cd}</Text>
              <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>Limite: {ability.limit}</Text>
              <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>Anti abuso: {ability.antiManoNegra}</Text>
            </View>
          ))}
        </RealmCard>
      ))}
    </>
  );
}

function BestiaryDetail({ entry }: { entry: BestiaryEntry }) {
  return (
    <RealmCard tone={entry.rarity === "calamity" ? "danger" : "gold"}>
      <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>{entry.description}</Text>
      <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>Amenaza: {entry.threatLevel}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Datos: {entry.generalData}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Origen: {entry.originPlace}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Habitat: {entry.foundAt}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Habilidad: {entry.ability}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Domesticacion: {entry.domestication}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Uso: {entry.usage}</Text>
    </RealmCard>
  );
}

function FloraDetail({ entry }: { entry: FloraEntry }) {
  return (
    <RealmCard tone="teal">
      <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>{entry.description}</Text>
      <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>Rareza: {entry.rarity}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Datos: {entry.generalData}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Propiedades: {entry.properties}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Origen: {entry.originPlace}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Donde se encuentra: {entry.foundAt}</Text>
      <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>Uso: {entry.usage}</Text>
    </RealmCard>
  );
}
