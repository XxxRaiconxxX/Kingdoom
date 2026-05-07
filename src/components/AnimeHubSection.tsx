import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  ExternalLink,
  Film,
  PlayCircle,
  RefreshCw,
  Search,
  ServerCog,
} from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import {
  ANIME_HUB_GENRES,
  mockAnimeHubProvider,
  remoteAnimeHubProvider,
  type AnimeEpisodeLinks,
  type AnimeSeriesDetail,
  type AnimeSeriesSummary,
} from "../features/animeHub";

function providerIsRemote() {
  return Boolean(import.meta.env.VITE_ANIME_HUB_API_URL);
}

export function AnimeHubSection() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("Todos");
  const [results, setResults] = useState<AnimeSeriesSummary[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<AnimeSeriesDetail | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
  const [selectedEpisodeLinks, setSelectedEpisodeLinks] = useState<AnimeEpisodeLinks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const activeProvider = useMemo(
    () => (providerIsRemote() ? remoteAnimeHubProvider : mockAnimeHubProvider),
    []
  );

  const sourceBadge = providerIsRemote() ? "Remoto" : "Demo";

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      setIsLoading(true);
      const nextResults = await activeProvider.searchSeries({ query: "", genre: "" });
      const nextSelected = nextResults[0]
        ? await activeProvider.getSeriesDetail(nextResults[0].id)
        : null;

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
        genre: genre === "Todos" ? "" : genre,
      });
      const nextSelected = nextResults[0]
        ? await activeProvider.getSeriesDetail(nextResults[0].id)
        : null;

      setResults(nextResults);
      setSelectedSeries(nextSelected);
      setFeedback(nextResults.length > 0 ? "Catalogo actualizado." : "Sin resultados.");
    } catch {
      setFeedback("No se pudo consultar el proveedor.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectSeries(seriesId: string) {
    setIsLoading(true);
    setSelectedEpisodeLinks(null);
    setSelectedEpisodeId("");

    try {
      const nextSelected = await activeProvider.getSeriesDetail(seriesId);
      setSelectedSeries(nextSelected);
      setFeedback(nextSelected ? "Ficha cargada." : "Ficha no disponible.");
    } catch {
      setFeedback("No se pudo abrir la ficha.");
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
      setFeedback(links ? "Enlaces listos." : "Sin enlaces disponibles.");
    } catch {
      setFeedback("No se pudieron cargar los enlaces.");
    } finally {
      setIsEpisodeLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[19rem_1fr]">
        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Anime Hub
                </p>
                <h2 className="mt-1 text-2xl font-black text-stone-100">Catalogo</h2>
              </div>
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                {sourceBadge}
              </span>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-2xl border border-stone-800 bg-black/35 px-3 py-3">
              <Search className="h-4 w-4 text-stone-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSearch();
                  }
                }}
                placeholder="Buscar serie..."
                className="min-w-0 flex-1 bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-600"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGenre("Todos")}
                className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                  genre === "Todos"
                    ? "border-amber-300/60 bg-amber-300 text-black"
                    : "border-stone-800 bg-black/25 text-stone-400 hover:text-stone-100"
                }`}
              >
                Todos
              </button>
              {ANIME_HUB_GENRES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGenre(item)}
                  className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                    genre === item
                      ? "border-fuchsia-300/60 bg-fuchsia-400/20 text-fuchsia-100"
                      : "border-stone-800 bg-black/25 text-stone-400 hover:text-stone-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleSearch()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300/35 bg-amber-300 px-4 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Buscar
            </button>
          </article>

          <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/60 p-4">
            <div className="flex items-center gap-2 text-cyan-200">
              <ServerCog className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Estado</p>
            </div>
            <p className="mt-3 text-sm font-bold text-stone-200">{activeProvider.label}</p>
            <p className="mt-2 text-sm text-stone-500">{feedback}</p>
          </article>
        </aside>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)]">
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

            <div className="mt-4 grid max-h-[48rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-1">
              {results.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.2 }}
                  onClick={() => void handleSelectSeries(item.id)}
                  className={`group grid grid-cols-[5.4rem_1fr] gap-3 overflow-hidden rounded-2xl border p-2 text-left transition ${
                    selectedSeries?.id === item.id
                      ? "border-amber-300/50 bg-amber-300/10"
                      : "border-stone-800 bg-black/25 hover:border-stone-700"
                  }`}
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-32 w-full rounded-xl object-cover"
                    loading="lazy"
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
                  <img
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

                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-stone-800 bg-black/25 p-4">
                      <ExpandableText text={selectedSeries.synopsis} lines={4} />
                    </div>

                    <div className="rounded-2xl border border-stone-800 bg-black/25 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-cyan-200">
                          <PlayCircle className="h-4 w-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Episodios</p>
                        </div>
                        {isEpisodeLoading ? (
                          <span className="text-xs font-bold text-stone-500">Cargando...</span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                        {selectedSeries.episodes.map((episode) => (
                          <button
                            key={episode.id}
                            type="button"
                            onClick={() => void handleSelectEpisode(episode.id)}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                              selectedEpisodeId === episode.id
                                ? "border-cyan-300/50 bg-cyan-300/10"
                                : "border-stone-800 bg-stone-950/60 hover:border-cyan-400/25"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-stone-100">
                                {episode.number}. {episode.title}
                              </p>
                              <p className="mt-1 text-[11px] text-stone-500">
                                {episode.duration || "Disponible"}
                              </p>
                            </div>
                            <PlayCircle className="h-4 w-4 shrink-0 text-cyan-200" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                      <div className="flex items-center gap-2 text-cyan-200">
                        <PlayCircle className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ver</p>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {(selectedEpisodeLinks?.stream ?? []).map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20"
                          >
                            {link.server}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ))}
                        {selectedEpisodeLinks && selectedEpisodeLinks.stream.length === 0 ? (
                          <p className="text-sm text-stone-500">Sin servidores de reproduccion.</p>
                        ) : null}
                        {!selectedEpisodeLinks ? (
                          <p className="text-sm text-stone-500">Selecciona un episodio.</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Download className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Descargar</p>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {(selectedEpisodeLinks?.download ?? []).map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20"
                          >
                            <span className="truncate">
                              {link.server} {link.quality ? `(${link.quality})` : ""}
                            </span>
                            <Download className="h-4 w-4 shrink-0" />
                          </a>
                        ))}
                        {selectedEpisodeLinks && selectedEpisodeLinks.download.length === 0 ? (
                          <p className="text-sm text-stone-500">Sin descargas disponibles.</p>
                        ) : null}
                        {!selectedEpisodeLinks ? (
                          <p className="text-sm text-stone-500">Los enlaces apareceran aqui.</p>
                        ) : null}
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
      </div>
    </section>
  );
}
