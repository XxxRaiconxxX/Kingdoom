import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  ExternalLink,
  Film,
  PlayCircle,
  Search,
} from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import {
  mockAnimeHubProvider,
  remoteAnimeHubProvider,
  type AnimeEpisodeLinks,
  type AnimeSeriesDetail,
  type AnimeSeriesSummary,
} from "../features/animeHub";

function providerIsRemote() {
  return true;
}

function summaryToDetail(series: AnimeSeriesSummary): AnimeSeriesDetail {
  const synopsis = series.synopsis || "Sin sinopsis disponible.";

  return {
    ...series,
    episodeCount: 0,
    releaseWindow: series.year || "N/A",
    featuredQuote:
      synopsis.length > 150 ? `${synopsis.slice(0, 150).trim()}...` : synopsis,
    synopsis,
    episodes: [],
    downloads: [],
  };
}

function preserveGeneratedArtwork(
  detail: AnimeSeriesDetail,
  seed: AnimeSeriesSummary
): AnimeSeriesDetail {
  const shouldPreserveSeedArtwork =
    seed.coverImage.startsWith("data:image/svg+xml") ||
    detail.coverImage === seed.coverImage;

  if (!shouldPreserveSeedArtwork) {
    return detail;
  }

  return {
    ...detail,
    coverImage: seed.coverImage,
    bannerImage:
      !detail.bannerImage || detail.bannerImage === detail.coverImage
        ? seed.bannerImage ?? seed.coverImage
        : detail.bannerImage,
  };
}

export function AnimeHubSection() {
  const [query, setQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("tioanime");
  const [results, setResults] = useState<AnimeSeriesSummary[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<AnimeSeriesDetail | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
  const [selectedEpisodeLinks, setSelectedEpisodeLinks] = useState<AnimeEpisodeLinks | null>(null);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [selectedDownloadIndex, setSelectedDownloadIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const activeProvider = useMemo(
    () => (providerIsRemote() ? remoteAnimeHubProvider : mockAnimeHubProvider),
    []
  );

  const selectedEpisode = useMemo(
    () =>
      selectedSeries?.episodes.find((episode) => episode.id === selectedEpisodeId) ??
      null,
    [selectedEpisodeId, selectedSeries]
  );

  async function resolveSeriesDetail(series: AnimeSeriesSummary) {
    const detail = (await activeProvider.getSeriesDetail(series.id)) ?? summaryToDetail(series);
    return preserveGeneratedArtwork(detail, series);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      setIsLoading(true);
      const nextResults = await activeProvider.searchSeries({ query: "", genre: "", provider: "tioanime" });
      const nextSelected = nextResults[0] ? await resolveSeriesDetail(nextResults[0]) : null;

      if (cancelled) {
        return;
      }

      setResults(nextResults);
      setSelectedSeries(nextSelected);
      setSelectedEpisodeLinks(null);
      setSelectedEpisodeId("");
      setFeedback(providerIsRemote() ? "Catalogo conectado." : "Modo demo activo.");
      setIsLoading(false);
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, [activeProvider]);

  async function handleSearch() {
    setIsLoading(true);
    setSelectedEpisodeLinks(null);
    setSelectedEpisodeId("");

    try {
      const nextResults = await activeProvider.searchSeries({
        query,
        genre: "",
        provider: selectedProvider,
      });
      const nextSelected = nextResults[0] ? await resolveSeriesDetail(nextResults[0]) : null;

      setResults(nextResults);
      setSelectedSeries(nextSelected);
      setFeedback(nextResults.length > 0 ? "Catalogo actualizado." : "Sin resultados.");
    } catch {
      setFeedback("No se pudo consultar el proveedor.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectSeries(series: AnimeSeriesSummary) {
    setIsLoading(true);
    setSelectedEpisodeLinks(null);
    setSelectedEpisodeId("");
    setSelectedSeries(summaryToDetail(series));

    try {
      const nextSelected = await activeProvider.getSeriesDetail(series.id);
      if (nextSelected) {
        setSelectedSeries(preserveGeneratedArtwork(nextSelected, series));
      }
      setFeedback(
        nextSelected ? "Ficha cargada." : "Ficha basica cargada. Episodios pendientes."
      );
    } catch {
      setFeedback("Ficha basica cargada. El proveedor no entrego detalle.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectEpisode(episodeId: string) {
    setSelectedEpisodeId(episodeId);
    setSelectedEpisodeLinks(null);
    setIsEpisodeLoading(true);

    try {
      const links = await activeProvider.getEpisodeLinks(episodeId);
      setSelectedEpisodeLinks(links);
      setSelectedStreamIndex(0);
      setSelectedDownloadIndex(0);
      setFeedback(links ? "Enlaces listos." : "Sin enlaces disponibles.");
    } catch {
      setFeedback("No se pudieron cargar los enlaces.");
    } finally {
      setIsEpisodeLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <article className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
        <div className="flex items-center">
          <form
            className="flex min-w-0 flex-1 flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearch();
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-stone-800 bg-black/35 px-3 py-3">
                <Search className="h-4 w-4 text-stone-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar serie..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-600"
                />
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="hidden h-11 rounded-2xl border border-stone-800 bg-black/35 px-3 text-xs text-stone-400 outline-none transition focus:border-amber-300/50 md:block"
              >
                <option value="tioanime">TioAnime (Español)</option>
                <option value="veranimeonline">VerAnimeOnline (Español)</option>
                <option value="animeav1">AnimeAV1 (Español)</option>
                <option value="jkanime">JKAnime (Español)</option>
                <option value="anime-website">GogoAnime (Inglés)</option>
              </select>
              <button
                type="submit"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/35 bg-amber-300 text-black transition hover:brightness-110 active:scale-[0.96]"
                aria-label="Buscar anime"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
        <p className="sr-only" aria-live="polite">
          {feedback}
        </p>
      </article>

      <div className="grid gap-5 xl:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.68fr)]">
          <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/65 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Resultados
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {isLoading ? "Cargando..." : `${results.length} titulos`}
                </p>
              </div>
              <Film className="h-5 w-5 text-stone-500" />
            </div>

            <div className="mt-4 grid max-h-[48rem] gap-3 overflow-y-auto pr-3 [scrollbar-gutter:stable] md:grid-cols-2 xl:grid-cols-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-400/70 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-black/30">
              {results.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.2 }}
                  onClick={() => void handleSelectSeries(item)}
                  className={`group grid grid-cols-[5.4rem_1fr] gap-3 overflow-hidden rounded-2xl border p-2 text-left transition ${
                    selectedSeries?.id === item.id
                      ? "border-amber-300/50 bg-amber-300/10"
                      : "border-stone-800 bg-black/25 hover:border-stone-700"
                  }`}
                >
                  <img loading="lazy" decoding="async" 
                    src={item.coverImage}
                    alt={item.title}
                    className="h-32 w-full rounded-xl object-cover"
                  />
                  <div className="min-w-0 py-1">
                    <h3 className="line-clamp-2 text-base font-black text-stone-100">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                      {item.year} | {item.statusLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.genres.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-stone-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-300">
                      Ver ficha
                      <ExternalLink className="h-3 w-3" />
                    </p>
                  </div>
                </motion.button>
              ))}

              {!isLoading && results.length === 0 ? (
                <div className="rounded-2xl border border-stone-800 bg-black/25 p-5 text-sm text-stone-400">
                  No hay coincidencias.
                </div>
              ) : null}
            </div>
          </article>

          <article className="overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-950/65">
            {selectedSeries ? (
              <>
                <div className="relative min-h-[18rem] overflow-hidden">
                  <img loading="lazy" decoding="async"  
                    src={selectedSeries.bannerImage || selectedSeries.coverImage}
                    alt={selectedSeries.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/20" />
                  <div className="relative flex min-h-[18rem] flex-col justify-end p-5">
                    <div className="flex flex-wrap gap-2">
                      {selectedSeries.genres.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-3 text-3xl font-black text-white md:text-4xl">
                      {selectedSeries.title}
                    </h3>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-stone-300">
                      {selectedSeries.releaseWindow} | {selectedSeries.episodeCount} episodios | {selectedSeries.providerLabel}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="rounded-2xl border border-stone-800 bg-black/25 p-4">
                    <ExpandableText text={selectedSeries.synopsis} lines={3} />
                  </div>

                  <div className="grid gap-4 min-[2000px]:grid-cols-[minmax(0,1fr)_minmax(21rem,0.72fr)]">
                    <div className="rounded-2xl border border-stone-800 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-cyan-200">
                          <PlayCircle className="h-4 w-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                            Episodios
                          </p>
                        </div>
                        {isEpisodeLoading ? (
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100">
                            Cargando
                          </span>
                        ) : (
                          <span className="rounded-full border border-stone-700 bg-stone-950/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-stone-400">
                            {selectedSeries.episodes.length} eps
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid max-h-[26rem] grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2 overflow-y-auto pr-1">
                        {selectedSeries.episodes.map((episode) => (
                          <button
                            key={episode.id}
                            type="button"
                            onClick={() => void handleSelectEpisode(episode.id)}
                            className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                              selectedEpisodeId === episode.id
                                ? "border-cyan-300/55 bg-cyan-300/10 shadow-[0_0_22px_rgba(34,211,238,0.12)]"
                                : "border-stone-800 bg-stone-950/60 hover:border-cyan-400/25 hover:bg-cyan-400/5"
                            }`}
                          >
                            <span
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-black ${
                                selectedEpisodeId === episode.id
                                  ? "border-cyan-300/50 bg-cyan-300/20 text-cyan-100"
                                  : "border-stone-700 bg-black/35 text-stone-400"
                              }`}
                            >
                              {episode.number}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-stone-100">
                                {episode.title}
                              </p>
                              <p className="mt-1 text-[11px] text-stone-500">
                                {episode.duration || "Disponible"}
                              </p>
                            </div>
                            <PlayCircle className="h-4 w-4 shrink-0 text-cyan-200 opacity-70 transition group-hover:opacity-100" />
                          </button>
                        ))}
                        {selectedSeries.episodes.length === 0 ? (
                          <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-4 text-sm text-stone-500 sm:col-span-2">
                            El proveedor mostro la serie, pero aun no entrego episodios para esta ficha.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-stone-950 via-stone-950 to-amber-950/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                            Acciones
                          </p>
                          <h4 className="mt-1 text-lg font-black text-stone-100">
                            {selectedEpisode
                              ? `Episodio ${selectedEpisode.number}`
                              : "Selecciona episodio"}
                          </h4>
                        </div>
                        {selectedEpisode ? (
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                            Listo
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 rounded-2xl border border-stone-800/80 bg-black/20 px-3 py-2 text-[11px] text-stone-400">
                        Proveedor activo: <span className="font-black text-stone-200">{selectedSeries.providerLabel}</span>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2 min-[2000px]:grid-cols-1">
                        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-cyan-200">
                              <PlayCircle className="h-4 w-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ver</p>
                            </div>
                            {selectedEpisodeLinks && selectedEpisodeLinks.stream.length > 1 && (
                              <div className="relative">
                                <button className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-black text-cyan-200 transition hover:bg-cyan-400/20">
                                  <span>{selectedStreamIndex + 1}</span>
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                                <select
                                  value={selectedStreamIndex}
                                  onChange={(e) => setSelectedStreamIndex(Number(e.target.value))}
                                  className="absolute inset-0 cursor-pointer opacity-0"
                                >
                                  {selectedEpisodeLinks.stream.map((link, i) => (
                                    <option key={i} value={i}>
                                      Opción {i + 1}: {link.server}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            {selectedEpisodeLinks && selectedEpisodeLinks.stream.length > 0 ? (
                              <a
                                href={selectedEpisodeLinks.stream[selectedStreamIndex]?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 active:scale-[0.98] shadow-[0_4px_12px_rgba(34,211,238,0.12)]"
                              >
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70">Servidor</span>
                                  <span className="truncate text-base">{selectedEpisodeLinks.stream[selectedStreamIndex]?.server}</span>
                                </div>
                                <ExternalLink className="h-5 w-5 shrink-0 text-cyan-300" />
                              </a>
                            ) : selectedEpisodeLinks ? (
                              <p className="py-2 text-sm text-stone-500">Sin servidores.</p>
                            ) : (
                              <p className="py-2 text-sm text-stone-500">Elige un episodio.</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-amber-200">
                              <Download className="h-4 w-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Descargar</p>
                            </div>
                            {selectedEpisodeLinks && selectedEpisodeLinks.download.length > 1 && (
                              <div className="relative">
                                <button className="flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-200 transition hover:bg-amber-400/20">
                                  <span>{selectedDownloadIndex + 1}</span>
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                                <select
                                  value={selectedDownloadIndex}
                                  onChange={(e) => setSelectedDownloadIndex(Number(e.target.value))}
                                  className="absolute inset-0 cursor-pointer opacity-0"
                                >
                                  {selectedEpisodeLinks.download.map((link, i) => (
                                    <option key={i} value={i}>
                                      Opción {i + 1}: {link.server}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            {selectedEpisodeLinks && selectedEpisodeLinks.download.length > 0 ? (
                              <a
                                href={selectedEpisodeLinks.download[selectedDownloadIndex]?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3.5 text-sm font-black text-amber-50 transition hover:bg-amber-400/20 active:scale-[0.98] shadow-[0_4px_12px_rgba(251,191,36,0.12)]"
                              >
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">Opción de descarga</span>
                                  <span className="truncate text-base">
                                    {selectedEpisodeLinks.download[selectedDownloadIndex]?.server} 
                                    {selectedEpisodeLinks.download[selectedDownloadIndex]?.quality ? ` (${selectedEpisodeLinks.download[selectedDownloadIndex]?.quality})` : ""}
                                  </span>
                                </div>
                                <Download className="h-5 w-5 shrink-0 text-amber-300" />
                              </a>
                            ) : selectedEpisodeLinks ? (
                              <p className="py-2 text-sm text-stone-500">Sin descargas.</p>
                            ) : (
                              <p className="py-2 text-sm text-stone-500">Apareceran aqui.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-stone-400">Selecciona una serie.</div>
            )}
          </article>
      </div>
    </section>
  );
}
