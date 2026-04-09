import { useState } from "react";
import { 
  ScrollText, 
  Map, 
  Castle,
  Users,
  Compass,
  AlertCircle,
  X
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { ExpandableText } from "./ExpandableText";
import { FilterPill } from "./FilterPill";
import { 
  LORE_RULES, 
  LORE_CHAPTERS, 
  REALM_FACTIONS,
  FACTION_DOSSIERS
} from "../data/lore";
import { 
  WORLD_STATUS, 
  DEMOGRAPHIC_BLOCS, 
  DIPLOMATIC_TENSIONS, 
  COMMON_THREATS 
} from "../data/world";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import mapVyralis from "../assets/maps/vyralis-map.jpeg";
import mapGeopolitica from "../assets/maps/geopolitica-map.jpeg";

type LibraryTab = "lore" | "world";

export function LibrarySection() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("lore");

  return (
    <section className="space-y-6">
      <div className="rounded-[2.5rem] border border-stone-800 bg-stone-900/80 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <SectionHeader
            eyebrow="Archivos del Gremio"
            title="Biblioteca del Reino"
            description="Consulta las cronicas, leyes y la geopolitica de Aethelgardia en un solo lugar."
          />
          <div className="flex bg-stone-950/50 p-1.5 rounded-2xl border border-stone-800 shrink-0">
            <button
              onClick={() => setActiveTab("lore")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "lore" 
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/10" 
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <ScrollText className="h-4 w-4" />
              Cronicas y Leyes
            </button>
            <button
              onClick={() => setActiveTab("world")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "world" 
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/10" 
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <Map className="h-4 w-4" />
              Mapa y Mundo
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "lore" ? <LoreSubSection /> : <WorldSubSection />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function LoreSubSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {LORE_RULES.map((rule) => {
          const Icon = rule.icon;
          return (
            <article key={rule.title} className="rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
              <div className="w-fit rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-stone-100">{rule.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">{rule.description}</p>
            </article>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Historia principal"
          title="El pulso de la temporada"
          description="La cronica larga queda resumida al principio y puedes expandir cada bloque solo si te interesa leer mas."
        />
        <div className="mt-4 rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-5">
          <ExpandableText
            lines={4}
            text="Hace veinte inviernos, el Sol de Ceniza desaparecio detras de un eclipse eterno. Desde entonces, el Reino de las Sombras vive dividido entre casas nobles en decadencia, ordenes religiosas quebradas y gremios que comercian con reliquias prohibidas. La Corona de Carbon ha vuelto a emitir un fulgor oscuro bajo las ruinas de Valdren, y quien la reclame podria unir el reino o romperlo por completo."
          />
        </div>
      </div>

      <div className="space-y-3">
        {LORE_CHAPTERS.map((chapter) => (
          <CollapsiblePanel key={chapter.title} title={chapter.title} subtitle={chapter.summary}>
            <ExpandableText text={chapter.content} lines={4} />
          </CollapsiblePanel>
        ))}
      </div>

      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Facciones"
          title="Fuerzas del relato"
          description="Las principales facciones del rol quedan resumidas para que el jugador nuevo no se pierda."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {REALM_FACTIONS.map((faction) => (
            <article
              key={faction.name}
              className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-5"
            >
              <h3 className="text-lg font-bold text-stone-100">{faction.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                {faction.motto}
              </p>
              <div className="mt-3">
                <ExpandableText text={faction.description} lines={3} />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {FACTION_DOSSIERS.map((dossier) => (
            <CollapsiblePanel
              key={dossier.id}
              title={dossier.name}
              subtitle={`${dossier.motto} · ${dossier.alignedRealm}`}
            >
              <div className="grid gap-3">
                <DossierBlock label="Lore e historia" text={dossier.history} />
                <DossierBlock
                  label="Especializacion y combate"
                  text={`${dossier.specialization}\n\nTacticas: ${dossier.tactics}`}
                />
                <DossierBlock label="Equipo" text={dossier.equipment} />
                <DossierBlock label="Sede y presencia" text={dossier.headquarters} />

                <div className="rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-stone-400">
                    Relaciones con reinos
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {dossier.relations.map((rel) => (
                      <div
                        key={`${dossier.id}-${rel.realm}`}
                        className="rounded-[1.2rem] border border-stone-800 bg-stone-900/40 p-3"
                      >
                        <p className="text-xs font-bold text-stone-100">{rel.realm}</p>
                        <p className="mt-2 text-sm leading-6 text-stone-400">
                          {rel.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-amber-500/15 bg-amber-500/5 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">
                    Detalles para el jugador
                  </p>
                  <div className="mt-3">
                    <ExpandableText text={dossier.playerDetails} lines={4} />
                  </div>
                  {(dossier.bonuses?.length || dossier.startingItem) ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dossier.bonuses?.map((bonus) => (
                        <span
                          key={`${dossier.id}-${bonus}`}
                          className="rounded-full border border-amber-500/15 bg-stone-950/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80"
                        >
                          {bonus}
                        </span>
                      ))}
                      {dossier.startingItem ? (
                        <span className="rounded-full border border-stone-800 bg-stone-950/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-stone-200/80">
                          Inicio: {dossier.startingItem}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </CollapsiblePanel>
          ))}
        </div>
      </div>
    </div>
  );
}

function DossierBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-stone-400">
        {label}
      </p>
      <div className="mt-3">
        <ExpandableText text={text} lines={4} />
      </div>
    </div>
  );
}

function WorldSubSection() {
  const [activeMap, setActiveMap] = useState<"vyralis" | "geopolitica">("vyralis");
  const [mapViewerOpen, setMapViewerOpen] = useState(false);

  const mapInfo =
    activeMap === "vyralis"
      ? {
          title: "Mapa del continente de Vyralis",
          subtitle: "Poder, recursos y tensiones",
          src: mapVyralis,
          alt: "Mapa del continente de Vyralis",
        }
      : {
          title: "Geopolitica del continente",
          subtitle: "Fronteras y rutas",
          src: mapGeopolitica,
          alt: "Mapa geopolitico del continente",
        };

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Mapa del reino"
            title={mapInfo.title}
            description={mapInfo.subtitle}
          />
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Vyralis"
              active={activeMap === "vyralis"}
              onClick={() => setActiveMap("vyralis")}
            />
            <FilterPill
              label="Geopolitica"
              active={activeMap === "geopolitica"}
              onClick={() => setActiveMap("geopolitica")}
            />
            <button
              onClick={() => setMapViewerOpen(true)}
              className="ml-auto rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-200 transition hover:bg-amber-500/15"
              type="button"
            >
              Ver en grande
            </button>
          </div>
        </div>

        <button
          onClick={() => setMapViewerOpen(true)}
          type="button"
          className="mt-5 w-full overflow-hidden rounded-[1.6rem] border border-stone-800 bg-stone-950/40 text-left shadow-inner shadow-black/20"
        >
          <img
            src={mapInfo.src}
            alt={mapInfo.alt}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-cover"
          />
          <div className="flex items-center justify-between gap-4 border-t border-stone-800 px-4 py-3">
            <p className="text-xs leading-5 text-stone-400">
              Toca el mapa para ampliarlo y leer los detalles.
            </p>
            <span className="shrink-0 rounded-full border border-stone-800 bg-stone-900/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">
              Zoom
            </span>
          </div>
        </button>
      </div>

      <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Estado del mundo"
          title={WORLD_STATUS.title}
          description={WORLD_STATUS.description}
        />
      </div>

      <div className="space-y-3">
        {DEMOGRAPHIC_BLOCS.map((bloc) => (
          <CollapsiblePanel key={bloc.realm} title={bloc.realm} subtitle={bloc.epithet}>
            <div className="grid gap-3 md:grid-cols-2">
              {bloc.groups.map((group) => (
                <div key={group.title} className="rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-4">
                  <p className="text-sm font-bold text-stone-100">{group.title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-400">{group.races.join(", ")}</p>
                </div>
              ))}
            </div>
          </CollapsiblePanel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Diplomacia" title="Tensiones activas" />
          <div className="mt-4 space-y-3">
            {DIPLOMATIC_TENSIONS.map((note) => (
              <article key={note.title} className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
                <h3 className="text-sm font-bold text-stone-100">{note.title}</h3>
                <div className="mt-3">
                  <ExpandableText text={note.description} lines={3} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Peligros del continente" title="Amenazas comunes" />
          <div className="mt-4 space-y-3">
            {COMMON_THREATS.map((note) => (
              <article key={note.title} className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
                <h3 className="text-sm font-bold text-stone-100">{note.title}</h3>
                <div className="mt-3">
                  <ExpandableText text={note.description} lines={3} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mapViewerOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/50"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/80">
                    Mapa y mundo
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-stone-100">
                    {mapInfo.title}
                  </p>
                </div>
                <button
                  onClick={() => setMapViewerOpen(false)}
                  type="button"
                  className="rounded-2xl border border-stone-800 bg-stone-900/60 p-2 text-stone-300 transition hover:bg-stone-900"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[78vh] overflow-auto bg-black/20">
                <img
                  src={mapInfo.src}
                  alt={mapInfo.alt}
                  className="block h-auto w-full select-none object-contain"
                  draggable={false}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 px-5 py-4">
                <p className="text-xs leading-5 text-stone-400">
                  Consejo: en movil, puedes hacer zoom con los gestos del navegador.
                </p>
                <a
                  href={mapInfo.src}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-800 bg-stone-900/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-200 transition hover:bg-stone-900"
                >
                  Abrir archivo
                </a>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CollapsiblePanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">{subtitle}</p>
        </div>
        <div className="mt-1 rounded-xl bg-stone-800 p-2 text-stone-400 transition group-open:rotate-180 group-open:text-amber-300">
          <ChevronDown className="h-5 w-5" />
        </div>
      </summary>
      <div className="mt-5 border-t border-stone-800 pt-5">{children}</div>
    </details>
  );
}

function ChevronDown(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
