import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DatabaseZap,
  Download,
  Film,
  Layers3,
  PlayCircle,
  Search,
  ServerCog,
  Sparkles,
} from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import { SectionHeader } from "./SectionHeader";
import {
  ANIME_HUB_GENRES,
  mockAnimeHubProvider,
  remoteAnimeHubProvider,
  type AnimeSeriesDetail,
  type AnimeSeriesSummary,
} from "../features/animeHub";

const ENDPOINT_LABELS = [
  { key: "search", label: "Buscar" },
  { key: "info", label: "Ficha" },
  { key: "episode", label: "Episodios" },
  { key: "download", label: "Descarga" },
  { key: "batch", label: "Batch" },
] as const;

export function AnimeHubSection() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("Todos");
  const [results, setResults] = useState<AnimeSeriesSummary[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<AnimeSeriesDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const activeProvider = useMemo(
    () => (import.meta.env.VITE_ANIME_HUB_API_URL ? remoteAnimeHubProvider : mockAnimeHubProvider),
    []
  );

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
      setFeedback(
        activeProvider.id === "anime1v-remote"
          ? "Proveedor remoto conectado y sincronizado."
          : "Proveedor mock activo. El remoto sigue preparado pero sin conectar."
      );
      setIsLoading(false);
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, []);

  const endpointSummary = useMemo(
    () =>
      ENDPOINT_LABELS.map(({ key, label }) => ({
        label,
        path: remoteAnimeHubProvider.endpointMap[key],
      })),
    []
  );

  async function handleSearch() {
    setIsLoading(true);
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
      setFeedback(
        nextResults.length > 0
          ? activeProvider.id === "anime1v-remote"
            ? "Resultados remotos actualizados."
            : "Busqueda lista. Las llamadas reales siguen deshabilitadas a nivel de proveedor."
          : "No hay coincidencias en el catalogo actual."
      );
    } catch (err) {
      setFeedback("Error al conectar con el proveedor remoto. Usando fallback.");
    }
    setIsLoading(false);
  }

  async function handleSelectSeries(seriesId: string) {
    setIsLoading(true);
    try {
      const nextSelected = await activeProvider.getSeriesDetail(seriesId);
      setSelectedSeries(nextSelected);
    } catch (err) {
      setFeedback("No se pudo cargar el detalle de la serie.");
    }
    setIsLoading(false);
  }

  return (
    <section className="space-y-6">
      <div className="kd-glass rounded-[2.5rem] border border-fuchsia-500/15 bg-stone-900/80 p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <SectionHeader
            eyebrow="Anime Hub"
            title="Portal anime privado"
            description="Catalogo navegable, ficha completa, episodios y solicitudes listas para un proveedor compatible, sin conexion activa por ahora."
            rightSlot={
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
                Shell listo
              </div>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[29rem]">
            <div className="rounded-[1.6rem] border border-fuchsia-500/15 bg-stone-950/55 p-4">
              <div className="flex items-center gap-2 text-fuchsia-200">
                <DatabaseZap className="h-4 w-4" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Proveedor activo</p>
              </div>
              <p className="mt-3 text-lg font-black text-stone-100">{mockAnimeHubProvider.label}</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Muestra la experiencia final sin tocar el backend externo.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-cyan-500/15 bg-stone-950/55 p-4">
              <div className="flex items-center gap-2 text-cyan-200">
                <ServerCog className="h-4 w-4" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Proveedor remoto</p>
              </div>
              <p className="mt-3 text-lg font-black text-stone-100">{remoteAnimeHubProvider.label}</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Contratos y rutas ya definidos. Solo faltaria conectar la URL y adaptar respuestas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1.85fr]">
        <div className="space-y-5">
          <article className="rounded-[2rem] border border-stone-800 bg-stone-900/78 p-5">
            <div className="flex items-center gap-2 text-amber-300">
              <Search className="h-4 w-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.22em]">Explorar catalogo</p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="rounded-[1.35rem] border border-stone-800 bg-black/30 px-4 py-3">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
                  Buscar
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleSearch();
                    }
                  }}
                  placeholder="Berserk, cyberpunk, fantasia..."
                  className="mt-2 w-full bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-600"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGenre("Todos")}
                  className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                    genre === "Todos"
                      ? "border-cyan-400/35 bg-cyan-400/15 text-cyan-200"
                      : "border-stone-800 bg-stone-950/50 text-stone-400"
                  }`}
                >
                  Todos
                </button>
                {ANIME_HUB_GENRES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGenre(item)}
                    className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                      genre === item
                        ? "border-fuchsia-400/35 bg-fuchsia-400/15 text-fuchsia-200"
                        : "border-stone-800 bg-stone-950/50 text-stone-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleSearch()}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-fuchsia-400/35 bg-fuchsia-500/15 px-4 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-500/22"
              >
                <Sparkles className="h-4 w-4" />
                Refrescar shell
              </button>
            </div>
          </article>

          <article className="rounded-[2rem] border border-stone-800 bg-stone-900/78 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  Rutas preparadas
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Contratos copiados del flujo esperado del backend compatible.
                </p>
              </div>
              <Layers3 className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="mt-4 grid gap-2">
              {endpointSummary.map((entry) => (
                <div
                  key={entry.label}
                  className="rounded-[1.1rem] border border-stone-800 bg-stone-950/45 px-3 py-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                    {entry.label}
                  </p>
                  <p className="mt-1 font-mono text-xs text-stone-200">{entry.path}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-5">
          <article className="rounded-[2rem] border border-stone-800 bg-stone-900/78 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Resultados
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  {isLoading ? "Cargando mock..." : `${results.length} entradas listas para navegar.`}
                </p>
              </div>
              <div className="rounded-full border border-stone-800 bg-black/35 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-300">
                {genre}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {results.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.24 }}
                  onClick={() => void handleSelectSeries(item.id)}
                  className={`overflow-hidden rounded-[1.5rem] border text-left transition ${
                    selectedSeries?.id === item.id
                      ? "border-fuchsia-400/35 bg-fuchsia-500/10 shadow-[0_0_24px_rgba(217,70,239,0.12)]"
                      : "border-stone-800 bg-stone-950/45"
                  }`}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full border border-cyan-400/25 bg-cyan-400/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">
                      {item.providerLabel}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-stone-100">{item.title}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                          {item.year} · {item.statusLabel}
                        </p>
                      </div>
                      {item.score ? (
                        <div className="rounded-full border border-amber-500/18 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-200">
                          {item.score}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <ExpandableText text={item.synopsis} lines={3} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-900/78">
            {selectedSeries ? (
              <>
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={selectedSeries.bannerImage || selectedSeries.coverImage}
                    alt={selectedSeries.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/45 to-stone-950/20" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="flex flex-wrap gap-2">
                      {selectedSeries.genres.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-3 text-3xl font-black text-white">{selectedSeries.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-200/82">
                      {selectedSeries.featuredQuote}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 p-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-5">
                    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                      <div className="flex items-center gap-2 text-fuchsia-200">
                        <Film className="h-4 w-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Ficha</p>
                      </div>
                      <div className="mt-3">
                        <ExpandableText text={selectedSeries.synopsis} lines={4} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.1rem] border border-stone-800 bg-black/30 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Temporada</p>
                          <p className="mt-2 font-bold text-stone-100">{selectedSeries.releaseWindow}</p>
                        </div>
                        <div className="rounded-[1.1rem] border border-stone-800 bg-black/30 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Episodios</p>
                          <p className="mt-2 font-bold text-stone-100">{selectedSeries.episodeCount}</p>
                        </div>
                        <div className="rounded-[1.1rem] border border-stone-800 bg-black/30 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Proveedor</p>
                          <p className="mt-2 font-bold text-stone-100">{selectedSeries.providerLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                      <div className="flex items-center gap-2 text-cyan-200">
                        <PlayCircle className="h-4 w-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Episodios</p>
                      </div>
                      <div className="mt-4 grid gap-2">
                        {selectedSeries.episodes.map((episode) => (
                          <div
                            key={episode.id}
                            className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-stone-800 bg-black/25 px-4 py-3"
                          >
                            <div>
                              <p className="font-bold text-stone-100">
                                {episode.number}. {episode.title}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                                {episode.duration || "Duracion pendiente"}
                              </p>
                            </div>
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                              {episode.status === "ready" ? "Listo" : "Provider"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[1.5rem] border border-amber-500/15 bg-amber-500/6 p-4">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Download className="h-4 w-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Solicitudes de descarga</p>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {selectedSeries.downloads.map((download) => (
                          <div
                            key={`${selectedSeries.id}-${download.qualityLabel}`}
                            className="rounded-[1.2rem] border border-amber-500/12 bg-stone-950/45 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-bold text-stone-100">{download.qualityLabel}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-200/70">
                                  {download.providerLabel}
                                </p>
                              </div>
                              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">
                                Pendiente
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-stone-400">{download.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
                        Estado del cascaron
                      </p>
                      <p className="mt-3 text-sm leading-6 text-stone-300">{feedback}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-stone-400">
                Selecciona una serie del catalogo para ver la ficha preparada.
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
