import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  EmptyState,
  Pill,
  RealmCard,
  SearchInput,
  SectionHeader,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import {
  MOBILE_ANIME_ENDPOINTS,
  fetchMobileAnimeShell,
  fetchMobileAnimeShellDetail,
} from "@/src/features/animeHub/animeHubProvider";
import { MOBILE_ANIME_GENRES } from "@/src/features/animeHub/animeHubMock";
import type { MobileAnimeSeriesDetail } from "@/src/features/animeHub/animeHubTypes";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function AnimeScreen() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Todos");
  const [entries, setEntries] = useState<MobileAnimeSeriesDetail[]>([]);
  const [selected, setSelected] = useState<MobileAnimeSeriesDetail | null>(null);
  const [feedback, setFeedback] = useState(
    "Proveedor mock activo. El remoto sigue apagado."
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const nextEntries = await fetchMobileAnimeShell("", "");
      const nextSelected = nextEntries[0]
        ? await fetchMobileAnimeShellDetail(nextEntries[0].id)
        : null;

      if (cancelled) {
        return;
      }

      setEntries(nextEntries);
      setSelected(nextSelected);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefreshShell() {
    const nextEntries = await fetchMobileAnimeShell(
      query,
      genre === "Todos" ? "" : genre
    );
    const nextSelected = nextEntries[0]
      ? await fetchMobileAnimeShellDetail(nextEntries[0].id)
      : null;

    setEntries(nextEntries);
    setSelected(nextSelected);
    setFeedback(
      nextEntries.length > 0
        ? "Catalogo refrescado. Falta conectar el proveedor remoto."
        : "Sin coincidencias en el mock actual."
    );
  }

  return (
    <ScreenShell
      title="Anime Hub"
      subtitle="Catalogo privado y shell listo para proveedor externo"
      eyebrow="anime shell"
    >
      <RealmCard tone="mythic">
        <SectionHeader eyebrow="Busqueda" title="Portal anime" />
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar anime..."
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pill
            label="Todos"
            active={genre === "Todos"}
            onPress={() => setGenre("Todos")}
          />
          {MOBILE_ANIME_GENRES.map((item) => (
            <Pill
              key={item}
              label={item}
              active={genre === item}
              onPress={() => setGenre(item)}
            />
          ))}
        </View>
        <Pressable
          onPress={() => void handleRefreshShell()}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,211,106,0.28)",
            backgroundColor: "rgba(240,179,47,0.12)",
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>
            Refrescar shell
          </Text>
        </Pressable>
        <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 18 }}>
          {feedback}
        </Text>
      </RealmCard>

      <RealmCard tone="teal">
        <SectionHeader eyebrow="Rutas" title="Endpoints preparados" />
        <View style={{ gap: 8 }}>
          {Object.entries(MOBILE_ANIME_ENDPOINTS).map(([key, value]) => (
            <View
              key={key}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: "rgba(4,4,3,0.46)",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: MOBILE_THEME.dimText,
                  fontSize: 10,
                  fontWeight: "900",
                  textTransform: "uppercase",
                }}
              >
                {key}
              </Text>
              <Text
                style={{
                  color: MOBILE_THEME.text,
                  marginTop: 4,
                  fontSize: 12,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
      </RealmCard>

      <RealmCard>
        <SectionHeader eyebrow="Catalogo" title={`${entries.length} resultados`} />
        {entries.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            message="El shell quedo listo para mas catalogo mock o proveedor real."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {entries.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() => setSelected(entry)}
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor:
                    selected?.id === entry.id
                      ? "rgba(255,211,106,0.34)"
                      : MOBILE_THEME.border,
                  backgroundColor:
                    selected?.id === entry.id
                      ? "rgba(240,179,47,0.08)"
                      : "rgba(6,6,5,0.5)",
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", gap: 12, padding: 12 }}>
                  <Image
                    source={{ uri: entry.coverImage }}
                    style={{
                      width: 68,
                      height: 92,
                      borderRadius: 14,
                      backgroundColor: MOBILE_THEME.bg,
                    }}
                  />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text
                      style={{
                        color: MOBILE_THEME.text,
                        fontSize: 17,
                        fontWeight: "900",
                      }}
                    >
                      {entry.title}
                    </Text>
                    <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11 }}>
                      {entry.year} | {entry.providerLabel}
                    </Text>
                    <Text
                      style={{ color: MOBILE_THEME.mutedText, lineHeight: 18 }}
                      numberOfLines={3}
                    >
                      {entry.synopsis}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </RealmCard>

      {selected ? (
        <RealmCard tone="gold">
          <SectionHeader eyebrow="Ficha" title={selected.title} />
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>
            {selected.synopsis}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {selected.genres.map((item) => (
              <Pill key={item} label={item} />
            ))}
          </View>
          <View style={{ gap: 8 }}>
            {selected.episodes.slice(0, 4).map((episode) => (
              <View
                key={episode.id}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: MOBILE_THEME.border,
                  backgroundColor: "rgba(4,4,3,0.46)",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: MOBILE_THEME.text, fontWeight: "900" }}
                  >
                    {episode.number}. {episode.title}
                  </Text>
                  <Text
                    style={{
                      color: MOBILE_THEME.dimText,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {episode.duration ?? "Duracion pendiente"}
                  </Text>
                </View>
                <MaterialIcons
                  name="cloud-off"
                  size={18}
                  color={MOBILE_THEME.gold}
                />
              </View>
            ))}
          </View>
          <View style={{ gap: 8 }}>
            {selected.downloads.map((download) => (
              <View
                key={`${selected.id}-${download.qualityLabel}`}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,211,106,0.18)",
                  backgroundColor: "rgba(240,179,47,0.06)",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 4,
                }}
              >
                <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>
                  {download.qualityLabel} | {download.providerLabel}
                </Text>
                <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 18 }}>
                  {download.note}
                </Text>
              </View>
            ))}
          </View>
        </RealmCard>
      ) : null}
    </ScreenShell>
  );
}
