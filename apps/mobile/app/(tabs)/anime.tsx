import { useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  EmptyState,
  Pill,
  RealmCard,
  SearchInput,
  SectionHeader,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import {
  fetchMobileAnimeShell,
  fetchMobileAnimeShellDetail,
  fetchMobileEpisodeLinks,
} from "@/src/features/animeHub/animeHubProvider";
import { MOBILE_ANIME_GENRES } from "@/src/features/animeHub/animeHubMock";
import type { MobileAnimeSeriesDetail } from "@/src/features/animeHub/animeHubTypes";
import { MOBILE_THEME } from "@/src/theme/colors";

type EpisodeLinks = Awaited<ReturnType<typeof fetchMobileEpisodeLinks>>;

export default function AnimeScreen() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Todos");
  const [selectedProvider, setSelectedProvider] = useState("animeflv");
  const [entries, setEntries] = useState<MobileAnimeSeriesDetail[]>([]);
  const [selected, setSelected] = useState<MobileAnimeSeriesDetail | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [episodeLinks, setEpisodeLinks] = useState<EpisodeLinks>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [feedback, setFeedback] = useState("Catalogo listo.");
  const provider = "mixed";
  const providerFilters: Array<{ value: string; label: string }> = [];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const nextEntries = await fetchMobileAnimeShell("", "", "animeflv");
      const nextSelected = nextEntries[0]
        ? await fetchMobileAnimeShellDetail(nextEntries[0].id)
        : null;

      if (cancelled) {
        return;
      }

      setEntries(nextEntries);
      setSelected(nextSelected ?? nextEntries[0] ?? null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch() {
    setLoading(true);
    setEpisodeLinks(null);
    setSelectedEpisodeId("");

    const nextEntries = await fetchMobileAnimeShell(
      query,
      genre === "Todos" ? "" : genre,
      selectedProvider
    );
    const nextSelected = nextEntries[0]
      ? await fetchMobileAnimeShellDetail(nextEntries[0].id)
      : null;

    setEntries(nextEntries);
    setSelected(nextSelected ?? nextEntries[0] ?? null);
    setFeedback(nextEntries.length > 0 ? "Catalogo actualizado." : "Sin resultados.");
    setLoading(false);
  }

  async function handleSelectSeries(entry: MobileAnimeSeriesDetail) {
    setLoading(true);
    setEpisodeLinks(null);
    setSelectedEpisodeId("");
    setSelected(entry);
    const nextSelected = await fetchMobileAnimeShellDetail(entry.id);
    setSelected(nextSelected ?? entry);
    setLoading(false);
  }

  async function handleSelectEpisode(episodeId: string) {
    setSelectedEpisodeId(episodeId);
    setEpisodeLinks(null);
    setLoadingLinks(true);
    const links = await fetchMobileEpisodeLinks(episodeId);
    setEpisodeLinks(links);
    setFeedback(links ? "Enlaces cargados." : "Sin enlaces disponibles.");
    setLoadingLinks(false);
  }

  async function openUrl(url?: string) {
    if (!url || url === "#") {
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <ScreenShell
      title="Anime Hub"
      subtitle="Catalogo y episodios"
      eyebrow="kingdoom native"
      onRefresh={() => void handleSearch()}
      refreshing={loading}
    >
      <RealmCard tone="mythic">
        <SectionHeader
          eyebrow="buscar"
          title="Portal anime"
          trailing={
            <Pressable
              onPress={() => void handleSearch()}
              style={({ pressed }) => ({
                width: 46,
                height: 46,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: MOBILE_THEME.gold,
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <MaterialIcons name="refresh" size={20} color={MOBILE_THEME.black} />
            </Pressable>
          }
        />
        <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar serie..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
            <Pill label="Todos" active={genre === "Todos"} onPress={() => setGenre("Todos")} />
            {MOBILE_ANIME_GENRES.map((item) => (
              <Pill
                key={item}
                label={item}
                active={genre === item}
                onPress={() => setGenre(item)}
              />
            ))}
          </View>
        </ScrollView>
        {/* Proveedores filtrados: centrado en AnimeFLV */}
        <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>{feedback}</Text>
      </RealmCard>

      <RealmCard>
        <SectionHeader eyebrow="catalogo" title={loading ? "Cargando..." : `${entries.length} titulos`} />
        {entries.length === 0 && !loading ? (
          <EmptyState title="Sin resultados" message="Prueba con otro termino." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 12, paddingRight: 8 }}>
              {entries.map((entry, index) => (
                <Animated.View key={entry.id} entering={FadeInDown.delay(index * 45).duration(220)}>
                  <Pressable
                    onPress={() => void handleSelectSeries(entry)}
                    style={({ pressed }) => ({
                      width: 178,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor:
                        selected?.id === entry.id
                          ? "rgba(255,211,106,0.55)"
                          : MOBILE_THEME.border,
                      backgroundColor: "rgba(5,5,4,0.72)",
                      overflow: "hidden",
                      opacity: pressed ? 0.88 : 1,
                    })}
                  >
                    <Image
                      source={{ uri: entry.coverImage }}
                      style={{ height: 230, width: "100%", backgroundColor: MOBILE_THEME.bg }}
                    />
                    <View style={{ padding: 12, gap: 6 }}>
                      <Text
                        numberOfLines={2}
                        style={{ color: MOBILE_THEME.text, fontSize: 15, fontWeight: "900" }}
                      >
                        {entry.title}
                      </Text>
                      <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11 }}>
                        {entry.year} | {entry.statusLabel}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        )}
      </RealmCard>

      {selected ? (
        <RealmCard tone="gold">
          <Image
            source={{ uri: selected.bannerImage || selected.coverImage }}
            style={{ height: 150, borderRadius: 16, backgroundColor: MOBILE_THEME.bg }}
          />
          <SectionHeader eyebrow={selected.providerLabel} title={selected.title} />
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={5}>
            {selected.synopsis}
          </Text>
          <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>
            Fuente activa: {selected.providerLabel}
            {provider !== "mixed"
              ? ` · filtro ${providerFilters.find((item) => item.value === provider)?.label ?? ""}`
              : ""}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {selected.genres.slice(0, 5).map((item) => (
              <Pill key={item} label={item} />
            ))}
          </View>
        </RealmCard>
      ) : null}

      {selected ? (
        <RealmCard tone="teal">
          <SectionHeader
            eyebrow="episodios"
            title={`${selected.episodes.length || selected.episodeCount} disponibles`}
            trailing={loadingLinks ? <Text style={{ color: MOBILE_THEME.dimText }}>...</Text> : null}
          />
          <View style={{ gap: 8 }}>
            {selected.episodes.slice(0, 12).map((episode) => (
              <Pressable
                key={episode.id}
                onPress={() => void handleSelectEpisode(episode.id)}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor:
                    selectedEpisodeId === episode.id
                      ? "rgba(49,209,179,0.55)"
                      : MOBILE_THEME.border,
                  backgroundColor:
                    selectedEpisodeId === episode.id
                      ? "rgba(49,209,179,0.12)"
                      : "rgba(4,4,3,0.46)",
                  paddingHorizontal: 12,
                  paddingVertical: 11,
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }} numberOfLines={1}>
                    {episode.number}. {episode.title}
                  </Text>
                  <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11, marginTop: 2 }}>
                    {episode.duration ?? "Disponible"}
                  </Text>
                </View>
                <MaterialIcons name="play-circle" size={20} color={MOBILE_THEME.teal} />
              </Pressable>
            ))}
            {selected.episodes.length === 0 ? (
              <EmptyState
                title="Ficha sin episodios"
                message="El proveedor mostro la serie, pero aun no entrego episodios."
              />
            ) : null}
          </View>
        </RealmCard>
      ) : null}

      {selectedEpisodeId ? (
        <RealmCard tone="gold">
          <SectionHeader eyebrow="acciones" title="Ver o descargar" />
          <View style={{ gap: 8 }}>
            {(episodeLinks?.stream ?? []).map((link: any) => (
              <Pressable
                key={link.url}
                onPress={() => void openUrl(link.url)}
                style={({ pressed }) => ({
                  minHeight: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(49,209,179,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(49,209,179,0.28)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>
                  Ver en {link.server ?? link.name ?? "Servidor"}
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={MOBILE_THEME.teal} />
              </Pressable>
            ))}

            {(episodeLinks?.download ?? []).map((link: any) => (
              <Pressable
                key={link.url}
                onPress={() => void openUrl(link.url)}
                style={({ pressed }) => ({
                  minHeight: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(240,179,47,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(240,179,47,0.28)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>
                  {link.server ?? link.name ?? "Descarga"} {link.quality ? `(${link.quality})` : ""}
                </Text>
                <MaterialIcons name="download" size={18} color={MOBILE_THEME.gold} />
              </Pressable>
            ))}

            {episodeLinks && episodeLinks.stream.length === 0 && episodeLinks.download.length === 0 ? (
              <Text style={{ color: MOBILE_THEME.mutedText }}>Sin enlaces disponibles.</Text>
            ) : null}
            {!episodeLinks && !loadingLinks ? (
              <Text style={{ color: MOBILE_THEME.mutedText }}>Selecciona un episodio para cargar enlaces.</Text>
            ) : null}
          </View>
        </RealmCard>
      ) : null}
    </ScreenShell>
  );
}
