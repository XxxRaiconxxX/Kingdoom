import {
  startTransition,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Download,
  ExternalLink,
  Film,
  Gauge,
  Layers3,
  PlayCircle,
  Search,
  Server,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import {
  ANIME_PROVIDER_OPTIONS,
  getAnimeProviderDiagnostics,
  remoteAnimeHubProvider,
  type AnimeEpisodeLinks,
  type AnimeProviderDiagnostic,
  type AnimeProviderId,
  type AnimeSeriesDetail,
  type AnimeSeriesSummary,
} from "../features/animeHub";

const QUICK_SEARCHES = ["One Piece", "Naruto", "Jujutsu Kaisen", "Frieren"];

function summaryToDetail(series: AnimeSeriesSummary): AnimeSeriesDetail {
  const synopsis = series.synopsis || "Sin sinopsis disponible.";
  return {
    ...series,
    synopsis,
    episodeCount: 0,
    releaseWindow: series.year || "N/D",
    featuredQuote:
      synopsis.length > 150 ? `${synopsis.slice(0, 150).trim()}...` : synopsis,
    episodes: [],
    downloads: [],
  };
}

function healthLabel(provider: AnimeProviderDiagnostic) {
  if (provider.status === "online") return "En linea";
  if (provider.status === "degraded") return "Con respaldo";
  if (provider.status === "offline") return "No disponible";
  return "Sin comprobar";
}

function healthClass(status: AnimeProviderDiagnostic["status"]) {
  if (status === "online") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  if (status === "degraded") return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  if (status === "offline") return "border-rose-400/25 bg-rose-400/10 text-rose-200";
  return "border-white/10 bg-white/[0.04] text-stone-400";
}

function ResultSkeleton() {
  return (
    <div className="min-w-[12rem] animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] sm:min-w-0">
      <div className="aspect-[4/5] bg-white/[0.06]" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-4/5 rounded bg-white/10" />
        <div className="h-3 w-2/5 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function AnimeHubSection() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<AnimeProviderId>("all");
  const [results, setResults] = useState<AnimeSeriesSummary[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<AnimeSeriesDetail | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [selectedEpisodeLinks, setSelectedEpisodeLinks] = useState<AnimeEpisodeLinks | null>(null);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [selectedDownloadIndex, setSelectedDownloadIndex] = useState(0);
  const [episodeFilter, setEpisodeFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailLoadFailed, setDetailLoadFailed] = useState(false);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [feedback, setFeedback] = useState("Listo para explorar.");
  const [error, setError] = useState("");
  const [providerDiagnostics, setProviderDiagnostics] = useState<AnimeProviderDiagnostic[]>(
    () => getAnimeProviderDiagnostics()
  );
  const searchRequest = useRef(0);
  const detailRequest = useRef(0);
  const episodeRequest = useRef(0);
  const deferredEpisodeFilter = useDeferredValue(episodeFilter);

  const selectedEpisode = useMemo(
    () => selectedSeries?.episodes.find((episode) => episode.id === selectedEpisodeId) ?? null,
    [selectedEpisodeId, selectedSeries]
  );

  const visibleEpisodes = useMemo(() => {
    const filter = deferredEpisodeFilter.trim().toLowerCase();
    if (!filter) return selectedSeries?.episodes ?? [];
    return (selectedSeries?.episodes ?? []).filter(
      (episode) =>
        String(episode.number).includes(filter) || episode.title.toLowerCase().includes(filter)
    );
  }, [deferredEpisodeFilter, selectedSeries]);

  function resetEpisode() {
    episodeRequest.current += 1;
    setSelectedEpisodeId("");
    setSelectedEpisodeLinks(null);
    setSelectedStreamIndex(0);
    setSelectedDownloadIndex(0);
    setEpisodeFilter("");
  }

  async function loadSeries(series: AnimeSeriesSummary) {
    const requestId = ++detailRequest.current;
    resetEpisode();
    setSelectedSeries(summaryToDetail(series));
    setIsDetailLoading(true);
    setDetailLoadFailed(false);
    setError("");

    try {
      const detail = await remoteAnimeHubProvider.getSeriesDetail(series.id);
      if (requestId !== detailRequest.current) return;
      setSelectedSeries(detail ?? summaryToDetail(series));
      setDetailLoadFailed(!detail);
      setFeedback(detail ? "Ficha y episodios actualizados." : "No se pudo completar la ficha. Puedes reintentar.");
    } catch {
      if (requestId !== detailRequest.current) return;
      setDetailLoadFailed(true);
      setFeedback("Ficha basica disponible; el detalle no respondio. Puedes reintentar.");
    } finally {
      if (requestId === detailRequest.current) setIsDetailLoading(false);
    }
  }

  async function runSearch(searchTerm = query) {
    const normalizedQuery = searchTerm.trim();
    if (normalizedQuery.length < 2) {
      setError("Escribe al menos 2 caracteres para buscar.");
      return;
    }

    const requestId = ++searchRequest.current;
    detailRequest.current += 1;
    resetEpisode();
    setQuery(normalizedQuery);
    setIsSearching(true);
    setSelectedSeries(null);
    setDetailLoadFailed(false);
    setError("");
    setFeedback("Consultando proveedores...");

    try {
      const nextResults = await remoteAnimeHubProvider.searchSeries({
        query: normalizedQuery,
        provider: selectedProvider,
      });
      if (requestId !== searchRequest.current) return;

      startTransition(() => {
        setResults(nextResults);
        setHasSearched(true);
        setProviderDiagnostics(getAnimeProviderDiagnostics());
      });
      setFeedback(
        nextResults.length
          ? `${nextResults.length} resultados disponibles.`
          : "No encontramos coincidencias. Prueba otro titulo o proveedor."
      );
      if (nextResults[0]) void loadSeries(nextResults[0]);
    } catch (searchError) {
      if (requestId !== searchRequest.current) return;
      setResults([]);
      setHasSearched(true);
      setProviderDiagnostics(getAnimeProviderDiagnostics());
      setError(
        searchError instanceof Error
          ? searchError.message
          : "No se pudo consultar el catalogo anime."
      );
      setFeedback("La busqueda no pudo completarse.");
    } finally {
      if (requestId === searchRequest.current) setIsSearching(false);
    }
  }

  async function loadEpisode(episodeId: string) {
    const requestId = ++episodeRequest.current;
    setSelectedEpisodeId(episodeId);
    setSelectedEpisodeLinks(null);
    setIsEpisodeLoading(true);
    setError("");

    try {
      const links = await remoteAnimeHubProvider.getEpisodeLinks(episodeId);
      if (requestId !== episodeRequest.current) return;
      setSelectedEpisodeLinks(links);
      setSelectedStreamIndex(0);
      setSelectedDownloadIndex(0);
      setFeedback(links ? "Servidores listos para abrir." : "Este episodio no entrego enlaces activos.");
    } catch {
      if (requestId !== episodeRequest.current) return;
      setError("No se pudieron cargar los servidores del episodio.");
    } finally {
      if (requestId === episodeRequest.current) setIsEpisodeLoading(false);
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-amber-200/10 bg-[#090a0d] text-stone-100 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_5%,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.11),transparent_30%),linear-gradient(145deg,#090a0d_0%,#11100d_48%,#080b0e_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />

      <header className="border-b border-white/10 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.25em] text-amber-300">
              <Sparkles className="h-4 w-4" />
              Portal Anime
            </div>
            <h2 className="font-serif text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Encuentra tu proxima historia
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400 sm:text-base">
              Kingdoom consulta varias fuentes desde su servidor y reune resultados, episodios y enlaces en un solo lugar.
            </p>
          </div>

          <form
            className="w-full max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <label htmlFor="anime-search" className="sr-only">Buscar anime</label>
            <div className="flex min-h-14 items-center gap-2 rounded-2xl border border-white/15 bg-black/35 p-1.5 shadow-inner shadow-black/30 transition focus-within:border-amber-300/60 focus-within:ring-4 focus-within:ring-amber-300/10">
              <Search className="ml-3 h-5 w-5 shrink-0 text-stone-500" />
              <input
                id="anime-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej: One Piece, Frieren..."
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base font-semibold text-white outline-none placeholder:text-stone-600"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="min-h-12 shrink-0 rounded-xl bg-amber-300 px-4 text-sm font-black text-stone-950 transition hover:bg-amber-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:px-6"
              >
                {isSearching ? "Buscando" : "Buscar"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Proveedores anime">
          {ANIME_PROVIDER_OPTIONS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              aria-pressed={selectedProvider === provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`min-h-12 shrink-0 snap-start rounded-full border px-4 text-xs font-black uppercase tracking-[0.12em] transition ${
                selectedProvider === provider.id
                  ? "border-amber-300/70 bg-amber-300 text-stone-950 shadow-[0_8px_28px_rgba(251,191,36,0.18)]"
                  : "border-white/10 bg-white/[0.04] text-stone-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {provider.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(17rem,0.82fr)_minmax(0,1.8fr)] lg:gap-6 lg:p-8">
        <aside className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-stone-500">Catalogo</p>
              <h3 className="mt-1 text-lg font-black text-white">
                {hasSearched ? `${results.length} coincidencias` : "Explora por titulo"}
              </h3>
            </div>
            {isSearching && <Activity className="h-5 w-5 animate-pulse text-amber-300" />}
          </div>

          {!hasSearched && !isSearching && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <Film className="h-9 w-9 text-amber-300" />
              <p className="mt-4 text-base font-black text-white">Empieza con una busqueda</p>
              <p className="mt-1 text-sm leading-6 text-stone-400">No consumimos recursos hasta que escribas un titulo.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_SEARCHES.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => void runSearch(title)}
                    className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold text-stone-300 transition hover:border-amber-300/40 hover:text-amber-200"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[0, 1, 2, 3].map((item) => <ResultSkeleton key={item} />)}
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 px-5 py-10 text-center">
              <Search className="mx-auto h-8 w-8 text-stone-600" />
              <p className="mt-3 font-bold text-stone-300">Sin coincidencias</p>
              <p className="mt-1 text-sm text-stone-500">Cambia el titulo o selecciona otra fuente.</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-color:rgba(251,191,36,.4)_transparent] sm:grid sm:grid-cols-2 lg:max-h-[43rem] lg:grid-cols-1 lg:overflow-y-auto xl:grid-cols-2">
              {results.map((series, index) => {
                const active = selectedSeries?.id === series.id;
                return (
                  <motion.button
                    key={series.id}
                    type="button"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.25) }}
                    onClick={() => void loadSeries(series)}
                    className={`group min-w-[12rem] snap-start overflow-hidden rounded-3xl border text-left transition sm:min-w-0 ${
                      active
                        ? "border-amber-300/60 bg-amber-300/10 shadow-[0_14px_36px_rgba(251,191,36,0.12)]"
                        : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-900">
                      <img src={series.coverImage} alt={`Portada de ${series.title}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                      <span className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wider text-white backdrop-blur">
                        {series.providerLabel}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-white">{series.title}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                        <span>{series.year}</span>
                        {series.score && <span className="text-amber-300">{series.score}</span>}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-stone-400">
              <Gauge className="h-4 w-4 text-cyan-300" /> Estado de fuentes
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {providerDiagnostics.map((provider) => (
                <div key={provider.id} title={provider.message} className={`rounded-xl border p-2.5 ${healthClass(provider.status)}`}>
                  <div className="flex items-center gap-1.5">
                    {provider.status === "offline" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                    <span className="truncate text-[0.68rem] font-black">{provider.label}</span>
                  </div>
                  <p className="mt-1 text-[0.62rem] opacity-75">
                    {healthLabel(provider)}{provider.latencyMs ? ` · ${provider.latencyMs} ms` : ""}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.68rem] leading-5 text-stone-600">Las consultas salen por el servidor de Kingdoom, no directamente desde tu navegador.</p>
          </div>
        </aside>

        <main className="min-w-0">
          <AnimatePresence mode="wait">
            {selectedSeries ? (
              <motion.article
                key={selectedSeries.id}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/30 shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
              >
                <div className="relative min-h-[20rem] overflow-hidden sm:min-h-[24rem]">
                  <img src={selectedSeries.bannerImage || selectedSeries.coverImage} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[2px]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,6,.96)_8%,rgba(5,5,6,.72)_52%,rgba(5,5,6,.35)),linear-gradient(0deg,#08090b_0%,transparent_55%)]" />
                  <div className="relative flex min-h-[20rem] items-end gap-5 p-5 sm:min-h-[24rem] sm:p-7 lg:p-9">
                    <img src={selectedSeries.coverImage} alt={`Portada de ${selectedSeries.title}`} className="hidden aspect-[3/4] w-36 rounded-2xl border border-white/15 object-cover shadow-2xl sm:block lg:w-44" />
                    <div className="max-w-2xl pb-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-300 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider text-stone-950">{selectedSeries.providerLabel}</span>
                        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[0.65rem] font-bold text-stone-300 backdrop-blur">{selectedSeries.statusLabel}</span>
                      </div>
                      <h3 className="mt-4 text-wrap-balance font-serif text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{selectedSeries.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-stone-300 sm:text-sm">
                        <span>{selectedSeries.releaseWindow}</span>
                        <span>{isDetailLoading ? "Cargando episodios..." : `${selectedSeries.episodeCount || selectedSeries.episodes.length} episodios`}</span>
                        {selectedSeries.score && <span className="text-amber-300">Puntaje {selectedSeries.score}</span>}
                      </div>
                      {selectedSeries.genres.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedSeries.genres.slice(0, 5).map((genre) => <span key={genre} className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[0.68rem] font-semibold text-stone-300">{genre}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  {isDetailLoading && <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/5"><motion.div className="h-full w-1/3 bg-amber-300" animate={{ x: ["-100%", "400%"] }} transition={{ repeat: Infinity, duration: 1.1 }} /></div>}
                </div>

                <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)] xl:p-9">
                  <div className="min-w-0 space-y-7">
                    <section>
                      <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-amber-300">Sinopsis</p>
                      <ExpandableText key={selectedSeries.id} text={selectedSeries.synopsis} lines={4} />
                    </section>

                    <section>
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-cyan-300">Episodios</p>
                          <h4 className="mt-1 text-xl font-black text-white">Elige un capitulo</h4>
                        </div>
                        {selectedSeries.episodes.length > 10 && (
                          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-stone-400 focus-within:border-cyan-300/40">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Filtrar episodios</span>
                            <input value={episodeFilter} onChange={(event) => setEpisodeFilter(event.target.value)} placeholder="Numero o titulo" className="w-32 bg-transparent py-2 outline-none placeholder:text-stone-600" />
                          </label>
                        )}
                      </div>
                      {isDetailLoading ? (
                        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-8 text-center text-sm font-bold text-cyan-200">
                          <Activity className="mx-auto mb-2 h-5 w-5 animate-pulse" />
                          Consultando ficha y episodios...
                        </div>
                      ) : selectedSeries.episodes.length ? (
                        <div className="grid max-h-[25rem] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 [scrollbar-color:rgba(34,211,238,.35)_transparent]">
                          {visibleEpisodes.map((episode) => (
                            <button
                              key={episode.id}
                              type="button"
                              onClick={() => void loadEpisode(episode.id)}
                              className={`min-h-14 rounded-xl border px-3 py-2 text-left transition ${selectedEpisodeId === episode.id ? "border-cyan-300/55 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/[0.035] text-stone-300 hover:border-white/25 hover:bg-white/[0.07]"}`}
                            >
                              <span className="block text-[0.62rem] font-black uppercase tracking-wider opacity-60">Episodio</span>
                              <span className="block truncate text-sm font-black">{episode.number}</span>
                            </button>
                          ))}
                        </div>
                      ) : detailLoadFailed ? (
                        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-7 text-center text-sm text-stone-300">
                          <p>La ficha no termino de cargar.</p>
                          <button
                            type="button"
                            onClick={() => void loadSeries(selectedSeries)}
                            className="mt-4 min-h-12 rounded-xl border border-amber-300/35 bg-amber-300/10 px-4 font-black text-amber-200 transition hover:bg-amber-300/20"
                          >
                            Reintentar ficha
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-stone-500">El proveedor no publico una lista de episodios para esta ficha.</div>
                      )}
                    </section>
                  </div>

                  <aside className="self-start rounded-3xl border border-white/10 bg-white/[0.035] p-4 xl:sticky xl:top-5 xl:p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Layers3 className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone-500">Reproductor externo</p>
                        <p className="truncate font-black text-white">{selectedEpisode ? `Episodio ${selectedEpisode.number}` : "Selecciona un episodio"}</p>
                      </div>
                    </div>

                    {isEpisodeLoading && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-5 text-center text-sm font-bold text-cyan-200"><Activity className="mx-auto mb-2 h-5 w-5 animate-pulse" />Buscando servidores...</div>}

                    {!isEpisodeLoading && selectedEpisodeLinks?.stream.length ? (
                      <div className="mt-5 space-y-3">
                        <label htmlFor="anime-stream" className="text-xs font-bold text-stone-400">Servidor para ver</label>
                        <select id="anime-stream" value={selectedStreamIndex} onChange={(event) => setSelectedStreamIndex(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-white/10 bg-stone-950 px-3 text-sm font-bold text-white outline-none focus:border-cyan-300/50">
                          {selectedEpisodeLinks.stream.map((link, index) => <option key={`${link.server}-${link.url}`} value={index}>{link.server}{link.quality ? ` · ${link.quality}` : ""}</option>)}
                        </select>
                        <a href={selectedEpisodeLinks.stream[selectedStreamIndex]?.url} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-cyan-300 px-4 font-black text-stone-950 transition hover:bg-cyan-200 active:scale-[0.98]">
                          <span className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Abrir episodio</span><ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : null}

                    {!isEpisodeLoading && selectedEpisodeLinks?.download.length ? (
                      <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                        <label htmlFor="anime-download" className="text-xs font-bold text-stone-400">Opcion de descarga</label>
                        <select id="anime-download" value={selectedDownloadIndex} onChange={(event) => setSelectedDownloadIndex(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-white/10 bg-stone-950 px-3 text-sm font-bold text-white outline-none focus:border-amber-300/50">
                          {selectedEpisodeLinks.download.map((link, index) => <option key={`${link.server}-${link.url}`} value={index}>{link.server}{link.quality ? ` · ${link.quality}` : ""}</option>)}
                        </select>
                        <a href={selectedEpisodeLinks.download[selectedDownloadIndex]?.url} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-amber-300/35 bg-amber-300/10 px-4 font-black text-amber-100 transition hover:bg-amber-300/20 active:scale-[0.98]">
                          <span className="flex items-center gap-2"><Download className="h-5 w-5" /> Descargar</span><ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : null}

                    {!isEpisodeLoading && selectedEpisodeId && !selectedEpisodeLinks && (
                      <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-stone-500"><Server className="mx-auto mb-2 h-5 w-5" />No hay enlaces activos para este episodio.</div>
                    )}
                    {!isEpisodeLoading && !selectedEpisodeId && (
                      <p className="mt-5 text-sm leading-6 text-stone-500">Los enlaces se solicitan solo al elegir un episodio, reduciendo esperas y consumo innecesario.</p>
                    )}
                  </aside>
                </div>
              </motion.article>
            ) : (
              <motion.div key="anime-empty" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[30rem] place-items-center rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center lg:min-h-[43rem]">
                <div className="max-w-sm">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] border border-amber-300/20 bg-amber-300/10 text-amber-300 shadow-[0_18px_50px_rgba(251,191,36,.08)]"><Film className="h-9 w-9" /></div>
                  <h3 className="mt-6 font-serif text-2xl font-black text-white">Tu portal esta preparado</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">Busca una serie para ver su informacion, episodios y servidores disponibles.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <div className="border-t border-white/10 px-4 py-3 sm:px-6 lg:px-8">
        {error ? <p role="alert" className="text-sm font-semibold text-rose-300">{error}</p> : <p role="status" aria-live="polite" className="text-sm text-stone-500">{feedback}</p>}
      </div>
    </section>
  );
}
