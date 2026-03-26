import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Castle,
  ChevronDown,
  Coins,
  Crown,
  Dice5,
  Flame,
  Gem,
  Home,
  PackageCheck,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  ScrollText,
  Store,
  Sword,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type TabId = "home" | "lore" | "market" | "ranking";
type Rarity = "legendary" | "epic" | "rare" | "common";
type PlayerStatus = "alive" | "dead";
type MarketCategoryId = "potions" | "armors" | "swords" | "others";
type EventStatus = "active" | "in-production" | "finished";

type NavItem = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

type MarketCategory = {
  id: MarketCategoryId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

type MarketItem = {
  name: string;
  description: string;
  price: number;
  rarity: Rarity;
  imageUrl: string;
  category: MarketCategoryId;
};

type PurchaseFormValues = {
  buyerName: string;
  whatsapp: string;
  quantity: number;
  gotcha: string;
};

type RankingPlayer = {
  name: string;
  faction: string;
  level: number;
  gold: number;
  status: PlayerStatus;
};

type RealmEvent = {
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
};

const WHATSAPP_JOIN_URL = "https://chat.whatsapp.com/TU-ENLACE-DE-INVITACION";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkopndnl";
const MIN_PURCHASE_DELAY_MS = 3000;

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "lore", label: "Lore", icon: ScrollText },
  { id: "market", label: "Mercado", icon: Store },
  { id: "ranking", label: "Ranking", icon: Trophy },
];

const MARKET_CATEGORIES: MarketCategory[] = [
  {
    id: "potions",
    title: "Pociones",
    subtitle: "Breves ventajas en combate, viajes y rituales.",
    icon: Sparkles,
  },
  {
    id: "armors",
    title: "Armaduras",
    subtitle: "Proteccion para campeones, guardianes y exploradores.",
    icon: Shield,
  },
  {
    id: "swords",
    title: "Espadas",
    subtitle: "Acero comun, reliquias nobles y hojas malditas.",
    icon: Sword,
  },
  {
    id: "others",
    title: "Otros",
    subtitle: "Objetos curiosos, suministros y amuletos de ocasion.",
    icon: Gem,
  },
];

const MARKET_ITEMS: MarketItem[] = [
  {
    category: "potions",
    name: "Pocion de Niebla Roja",
    description: "Aumenta la evasión en una escena y deja un aroma a hierro viejo.",
    price: 180,
    rarity: "rare",
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "potions",
    name: "Elixir del Cuervo",
    description: "Recupera fuerzas tras una expedicion y mejora tiradas de percepcion.",
    price: 320,
    rarity: "epic",
    imageUrl:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "armors",
    name: "Coraza del Bastion Negro",
    description: "Armadura pesada que absorbe el primer impacto serio de un duelo.",
    price: 940,
    rarity: "epic",
    imageUrl:
      "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "armors",
    name: "Manto del Vigia Gris",
    description: "Defensa ligera para patrullas nocturnas y misiones de sigilo.",
    price: 410,
    rarity: "common",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "swords",
    name: "Espada del Eclipse",
    description: "Hoja maldita capaz de ignorar armaduras comunes y sembrar miedo.",
    price: 1250,
    rarity: "legendary",
    imageUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "swords",
    name: "Sable de la Marca Ceniza",
    description: "Acero rapido con bonificacion narrativa en persecuciones y duelos.",
    price: 560,
    rarity: "rare",
    imageUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "others",
    name: "Sello de Obsidiana",
    description: "Amuleto de linaje oscuro que protege de maldiciones durante una escena.",
    price: 780,
    rarity: "epic",
    imageUrl:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "others",
    name: "Raciones del Camino Gris",
    description: "Suministros basicos para viajes largos, asedios y expediciones nocturnas.",
    price: 95,
    rarity: "common",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  },
];

const RANKING_PLAYERS: RankingPlayer[] = [
  {
    name: "Aldric Noctis",
    faction: "Cuervos del Norte",
    level: 28,
    gold: 3420,
    status: "alive",
  },
  {
    name: "Seraphina Voss",
    faction: "Orden del Sol Marchito",
    level: 24,
    gold: 2890,
    status: "alive",
  },
  {
    name: "Thorne Blackwall",
    faction: "Guardianes del Umbral",
    level: 21,
    gold: 2015,
    status: "dead",
  },
  {
    name: "Lyra Duskbane",
    faction: "Cuervos del Norte",
    level: 19,
    gold: 1785,
    status: "alive",
  },
  {
    name: "Marek Hollow",
    faction: "Mercenarios del Hierro",
    level: 17,
    gold: 1490,
    status: "alive",
  },
];

const ACTIVE_EVENTS: RealmEvent[] = [
  {
    title: "La Caza del Ciervo Negro",
    description:
      "Las facciones compiten por rastrear una criatura sagrada cuya sangre puede bendecir o condenar un linaje entero.",
    imageUrl:
      "https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80",
    startDate: "28 de marzo",
    endDate: "2 de abril",
    status: "active",
  },
  {
    title: "Asedio de Valdren",
    description:
      "Se prepara una ofensiva sobre las ruinas del viejo bastion. Espias, mercenarios y nobles ya mueven sus piezas.",
    imageUrl:
      "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1200&q=80",
    startDate: "5 de abril",
    endDate: "12 de abril",
    status: "in-production",
  },
  {
    title: "El Banquete de Ceniza",
    description:
      "Una noche de intriga y pactos rotos que redefinio alianzas dentro del reino y dejo dos casas al borde del colapso.",
    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    startDate: "10 de marzo",
    endDate: "14 de marzo",
    status: "finished",
  },
];

const rarityStyles: Record<
  Rarity,
  { label: string; card: string; badge: string; imageRing: string }
> = {
  legendary: {
    label: "Legendario",
    card: "border-amber-400/70 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    badge: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25",
    imageRing: "ring-amber-400/45",
  },
  epic: {
    label: "Epico",
    card: "border-fuchsia-400/55 bg-fuchsia-500/10",
    badge: "bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-fuchsia-400/25",
    imageRing: "ring-fuchsia-400/40",
  },
  rare: {
    label: "Raro",
    card: "border-sky-400/55 bg-sky-500/10",
    badge: "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/25",
    imageRing: "ring-sky-400/35",
  },
  common: {
    label: "Comun",
    card: "border-stone-700 bg-stone-900/80",
    badge: "bg-stone-700/40 text-stone-300 ring-1 ring-stone-600/40",
    imageRing: "ring-stone-700/60",
  },
};

const pageTransition = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

const eventStatusStyles: Record<
  EventStatus,
  { label: string; badge: string; dot: string }
> = {
  active: {
    label: "Activo",
    badge: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/20",
    dot: "bg-emerald-400",
  },
  "in-production": {
    label: "En produccion",
    badge: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20",
    dot: "bg-amber-400",
  },
  finished: {
    label: "Finalizado",
    badge: "bg-stone-700/45 text-stone-300 ring-1 ring-stone-600/35",
    dot: "bg-stone-400",
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
          >
            {activeTab === "home" && <HomeSection />}
            {activeTab === "lore" && <LoreSection />}
            {activeTab === "market" && <MarketSection />}
            {activeTab === "ranking" && <RankingSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-800/80 bg-stone-950/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 px-3 pt-3 pb-safe">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-[11px] font-semibold transition ${
                  isActive
                    ? "border-amber-400/30 bg-amber-500/12 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                    : "border-transparent bg-stone-900/70 text-stone-400"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-amber-400" : "text-stone-500"
                  }`}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeSection() {
  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6 shadow-2xl shadow-black/30">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          <Castle className="h-4 w-4" />
          Reino vivo por WhatsApp
        </div>

        <h1 className="text-4xl font-black leading-none text-stone-100">
          Reino de las Sombras
        </h1>

        <p className="mt-4 text-sm leading-6 text-stone-300/90">
          Intrigas de corte, guerra entre facciones y reliquias prohibidas en un
          reino donde cada decision puede convertirte en leyenda o condenarte al
          olvido.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCard icon={Users} value="120+" label="Personajes" />
          <StatCard icon={Flame} value="4" label="Facciones" />
          <StatCard icon={Dice5} value="24/7" label="Eventos" />
        </div>

        <a
          href={WHATSAPP_JOIN_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-4 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400"
        >
          Unirse al Gremio (WhatsApp)
        </a>
      </div>

      <div className="grid gap-4">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/75 p-5">
          <h2 className="text-lg font-bold text-stone-100">La noche se mueve</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Participa en asedios, pactos secretos, cacerias y duelos narrativos
            con estetica medieval oscura y progresion competitiva.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
                Estado del reino
              </p>
              <p className="mt-2 text-2xl font-black text-stone-100">
                Guerra fria
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <Crown className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Las coronas vacilan, los gremios acumulan oro y el trono negro atrae
            traiciones en cada frontera.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
              Agenda del reino
            </p>
            <h2 className="mt-2 text-2xl font-black text-stone-100">
              Eventos activos
            </h2>
          </div>
          <span className="rounded-full border border-stone-700 bg-stone-900/70 px-3 py-1 text-xs font-semibold text-stone-400">
            {ACTIVE_EVENTS.length} eventos
          </span>
        </div>

        <div className="space-y-4">
          {ACTIVE_EVENTS.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>
      </section>
    </section>
  );
}

function LoreSection() {
  return (
    <section className="space-y-5">
      <header className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
          Lore y reglas
        </p>
        <h2 className="mt-3 text-3xl font-black text-stone-100">
          Leyes de la penumbra
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          El rol mezcla narrativa libre con decisiones tacticas. La historia se
          expande mediante campanas, eventos y consecuencias permanentes.
        </p>
      </header>

      <div className="space-y-4">
        <LoreCard
          icon={Skull}
          title="Permadeath"
          description="Si un personaje muere de forma canonica, no regresa. Las decisiones arriesgadas importan y dejan huella real."
        />
        <LoreCard
          icon={Dice5}
          title="Uso de dados"
          description="Las acciones clave, emboscadas y hechizos se resuelven con dados. La suerte influye, pero el contexto narrativo tambien pesa."
        />
        <LoreCard
          icon={ScrollText}
          title="Canon del reino"
          description="Los eventos oficiales alteran alianzas, ciudades, recursos y reputaciones. Todo lo ocurrido puede repercutir en la temporada."
        />
      </div>

      <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6">
        <h3 className="text-xl font-bold text-stone-100">Historia principal</h3>
        <p className="mt-3 text-sm leading-7 text-stone-400">
          Hace veinte inviernos, el Sol de Ceniza desaparecio detras de un eclipse
          eterno. Desde entonces, el Reino de las Sombras vive dividido entre
          casas nobles en decadencia, ordenes religiosas quebradas y gremios que
          comercian con reliquias prohibidas.
        </p>
        <p className="mt-3 text-sm leading-7 text-stone-400">
          La Corona de Carbon, simbolo del antiguo monarca, ha vuelto a emitir un
          fulgor oscuro bajo las ruinas de Valdren. Quien la reclame podra unir
          el reino o desatar una guerra total entre vivos, traidores y fantasmas.
        </p>
      </div>
    </section>
  );
}

function MarketSection() {
  const [openCategory, setOpenCategory] = useState<MarketCategoryId | null>(
    "potions"
  );
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  return (
    <section className="space-y-5">
      <header className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
          Mercado negro
        </p>
        <h2 className="mt-3 text-3xl font-black text-stone-100">
          Catalogo del mercader
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Explora secciones desplegables y muestra cada articulo con imagen,
          nombre, descripcion y precio.
        </p>
      </header>

      <div className="rounded-[2rem] border border-amber-500/15 bg-amber-500/6 p-4 text-sm leading-6 text-stone-400">
        <p className="font-semibold text-amber-300">Nota sobre imagenes externas</p>
        <p className="mt-2">
          Puedes usar URLs directas de imagen en cada producto. Si quieres usar
          Pinterest, la URL debe apuntar al archivo de imagen, por ejemplo
          `https://i.pinimg.com/...jpg`, no a una pagina `pinterest.com/pin/...`.
          Si Pinterest bloquea el hotlink, la tarjeta mostrara un fallback visual.
        </p>
      </div>

      <div className="space-y-4">
        {MARKET_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isOpen = openCategory === category.id;
          const items = MARKET_ITEMS.filter((item) => item.category === category.id);

          return (
            <div
              key={category.id}
              className="overflow-hidden rounded-[1.8rem] border border-stone-800 bg-stone-900/75"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenCategory((current) =>
                    current === category.id ? null : category.id
                  )
                }
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-stone-100">
                      {category.title}
                    </h3>
                    <p className="mt-1 text-sm text-stone-400">
                      {category.subtitle}
                    </p>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-full border border-stone-700 p-2 text-stone-400"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden border-t border-stone-800"
                  >
                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                      {items.map((item) => (
                        <MarketItemCard
                          key={item.name}
                          item={item}
                          onBuy={() => setSelectedItem(item)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <PurchaseModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function RankingSection() {
  return (
    <section className="space-y-5">
      <header className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
          Salon de la fama
        </p>
        <h2 className="mt-3 text-3xl font-black text-stone-100">
          Ranking de jugadores
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Los campeones del reino se ordenan por nivel, riqueza y supervivencia en
          campanas oficiales.
        </p>
      </header>

      <div className="space-y-4">
        {RANKING_PLAYERS.map((player, index) => {
          const isDead = player.status === "dead";

          return (
            <div
              key={player.name}
              className={`rounded-[1.75rem] border border-stone-800 bg-stone-900/80 p-4 transition ${
                isDead ? "grayscale opacity-80" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-800 text-lg font-black text-amber-300">
                  #{index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-100">
                      {player.name}
                    </h3>
                    {index === 0 && <Crown className="h-5 w-5 text-amber-400" />}
                    {isDead && <Skull className="h-4 w-4 text-stone-400" />}
                  </div>

                  <p className="mt-1 text-sm text-stone-400">{player.faction}</p>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <RankingMetric label="Nivel" value={player.level} />
                    <RankingMetric label="Oro" value={player.gold} />
                    <RankingMetric
                      label="Estado"
                      value={isDead ? "Muerto" : "Vivo"}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MarketItemCard({
  item,
  onBuy,
}: {
  item: MarketItem;
  onBuy: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const style = rarityStyles[item.rarity];

  return (
    <article className={`overflow-hidden rounded-[1.5rem] border ${style.card}`}>
      <div className="relative aspect-[4/5] bg-stone-950">
        {!imageFailed ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className={`h-full w-full object-cover ring-1 ring-inset ${style.imageRing}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-stone-900 to-stone-950 p-6 text-center">
            <ShieldAlert className="h-8 w-8 text-amber-400" />
            <p className="text-sm font-semibold text-stone-200">
              Imagen externa no disponible
            </p>
            <p className="text-xs leading-5 text-stone-500">
              Revisa que la URL apunte directo a una imagen publica.
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-lg font-bold text-stone-100">{item.name}</h4>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
            {style.label}
          </span>
        </div>

        <p className="text-sm leading-6 text-stone-300/90">{item.description}</p>

        <div className="inline-flex items-center gap-2 rounded-full bg-stone-950/55 px-3 py-2 text-sm font-bold text-amber-300 ring-1 ring-inset ring-amber-500/10">
          <Coins className="h-4 w-4" />
          {item.price} de oro
        </div>

        <button
          type="button"
          onClick={onBuy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400"
        >
          <PackageCheck className="h-4 w-4" />
          Comprar
        </button>
      </div>
    </article>
  );
}

function PurchaseModal({
  item,
  onClose,
}: {
  item: MarketItem;
  onClose: () => void;
}) {
  const [formValues, setFormValues] = useState<PurchaseFormValues>({
    buyerName: "",
    whatsapp: "",
    quantity: 1,
    gotcha: "",
  });
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

  const remainingDelayMs = Math.max(
    0,
    MIN_PURCHASE_DELAY_MS - (now - openedAt)
  );
  const remainingDelaySeconds = Math.ceil(remainingDelayMs / 1000);
  const isDelayActive = remainingDelayMs > 0;
  const category = MARKET_CATEGORIES.find((entry) => entry.id === item.category);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formValues.gotcha.trim() !== "") {
      setSubmitState("success");
      setFeedbackMessage("Pedido enviado.");
      return;
    }

    if (isDelayActive) {
      setSubmitState("error");
      setFeedbackMessage(
        "Espera un momento antes de enviar el pedido para validar la compra."
      );
      return;
    }

    setSubmitState("submitting");
    setFeedbackMessage("");

    const data = new FormData();
    data.append("nombre", formValues.buyerName);
    data.append("whatsapp", formValues.whatsapp);
    data.append("producto", item.name);
    data.append("categoria", category?.title ?? item.category);
    data.append("precio", `${item.price}`);
    data.append("cantidad", `${formValues.quantity}`);
    data.append("_gotcha", formValues.gotcha);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setSubmitState("success");
        setFeedbackMessage(
          "Pedido enviado con exito. Revisa tu correo objetivo en Formspree para ver la solicitud."
        );
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { errors?: Array<{ message?: string }> }
        | null;
      const apiMessage =
        payload?.errors?.map((error) => error.message).filter(Boolean).join(", ") ??
        "";

      setSubmitState("error");
      setFeedbackMessage(
        apiMessage || "No se pudo enviar el pedido. Intentalo otra vez."
      );
    } catch {
      setSubmitState("error");
      setFeedbackMessage(
        "No se pudo conectar con el sistema de pedidos. Intenta nuevamente."
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
              Pedido del mercado
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100">
              Confirmar compra
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="mb-5 overflow-hidden rounded-[1.6rem] border border-stone-800 bg-stone-900/80">
            <div className="aspect-[16/10] bg-stone-950">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2 p-4">
              <h4 className="text-lg font-bold text-stone-100">{item.name}</h4>
              <p className="text-sm leading-6 text-stone-400">
                {item.description}
              </p>
            </div>
          </div>

          {submitState === "success" ? (
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-bold text-emerald-300">
                  Compra enviada
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {feedbackMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Nombre
                  </span>
                  <input
                    required
                    type="text"
                    value={formValues.buyerName}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        buyerName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                    placeholder="Tu nombre"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    WhatsApp
                  </span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={formValues.whatsapp}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        whatsapp: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                    placeholder="+595 9xx xxx xxx"
                  />
                </label>

                <PurchaseReadonlyField
                  label="Producto"
                  value={item.name}
                />
                <PurchaseReadonlyField
                  label="Categoria"
                  value={category?.title ?? item.category}
                />
                <PurchaseReadonlyField
                  label="Precio"
                  value={`${item.price} de oro`}
                />

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Cantidad
                  </span>
                  <input
                    required
                    min={1}
                    max={99}
                    type="number"
                    value={formValues.quantity}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        quantity: Number(event.target.value || 1),
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                  />
                </label>

                <div className="hidden">
                  <label>
                    No completar
                    <input
                      type="text"
                      name="_gotcha"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formValues.gotcha}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          gotcha: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900/70 p-4 text-sm leading-6 text-stone-400">
                <p className="font-semibold text-amber-300">Proteccion anti-spam</p>
                <p className="mt-2">
                  El formulario usa filtro honeypot y un breve retraso antes de
                  habilitar el envio. Formspree tambien aplica proteccion propia
                  del lado del servicio.
                </p>
              </div>

              {feedbackMessage && submitState === "error" && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {feedbackMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitState === "submitting" || isDelayActive}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  submitState === "submitting" || isDelayActive
                    ? "cursor-not-allowed bg-stone-800 text-stone-500"
                    : "bg-amber-500 text-stone-950 hover:bg-amber-400"
                }`}
              >
                {submitState === "submitting"
                  ? "Enviando pedido..."
                  : isDelayActive
                    ? `Preparando formulario... ${remainingDelaySeconds}s`
                    : "Enviar pedido"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function EventCard({ event }: { event: RealmEvent }) {
  const [imageFailed, setImageFailed] = useState(false);
  const statusStyle = eventStatusStyles[event.status];

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-900/80">
      <div className="relative aspect-[16/10] bg-stone-950">
        {!imageFailed ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
            <Castle className="h-10 w-10 text-amber-400" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950 via-stone-950/65 to-transparent" />
        <div className="absolute left-4 top-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${statusStyle.badge}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-xl font-bold text-stone-100">{event.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            {event.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/55 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
              Inicio
            </p>
            <p className="mt-1 text-sm font-bold text-stone-200">
              {event.startDate}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/55 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
              Cierre
            </p>
            <p className="mt-1 text-sm font-bold text-stone-200">
              {event.endDate}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/65 p-3 text-center">
      <Icon className="mx-auto h-5 w-5 text-amber-400" />
      <p className="mt-2 text-lg font-black text-stone-100">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function LoreCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function RankingMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/55 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-200">{value}</p>
    </div>
  );
}

function PurchaseReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3 text-sm text-stone-300">
        {value}
      </div>
    </div>
  );
}
