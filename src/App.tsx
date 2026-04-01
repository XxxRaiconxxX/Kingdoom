import React, { useState } from "react";
import {
  ScrollText,
  Store,
  Trophy,
  Home as HomeIcon,
  Sword,
  Shield,
  Coins,
  Users,
  Skull,
  Crown,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MARKET_ITEMS = [
  {
    id: 1,
    name: "Espada de Acero Valyrio",
    desc: "Un arma forjada con magia antigua. +50 Ataque.",
    price: 1500,
    icon: Sword,
    rarity: "legendary",
  },
  {
    id: 2,
    name: "Armadura de Escamas de Dragon",
    desc: "Inmune al fuego y ataques basicos. +100 Defensa.",
    price: 2000,
    icon: Shield,
    rarity: "epic",
  },
  {
    id: 3,
    name: "Veneno de Basilisco",
    desc: "Mata lentamente al objetivo. Uso unico.",
    price: 500,
    icon: Skull,
    rarity: "rare",
  },
  {
    id: 4,
    name: "Titulo de Nobleza Falso",
    desc: "Te permite entrar a los distritos altos sin ser cuestionado.",
    price: 800,
    icon: ScrollText,
    rarity: "rare",
  },
  {
    id: 5,
    name: "Pocion de Sangre",
    desc: "Restaura tus heridas instantaneamente.",
    price: 100,
    icon: Coins,
    rarity: "common",
  },
];

const RANKING_PLAYERS = [
  {
    id: 1,
    name: "Lord Arthur",
    title: "El Leon Dorado",
    faction: "Los Leones",
    level: 45,
    gold: 12500,
    status: "alive",
    kills: 142,
    avatar: { x: 2, y: 0 },
  },
  {
    id: 2,
    name: "Sir Lancelot",
    title: "La Espada Fiel",
    faction: "Los Leones",
    level: 42,
    gold: 8300,
    status: "alive",
    kills: 98,
    avatar: { x: 4, y: 2 },
  },
  {
    id: 3,
    name: "Silas",
    title: "El Mercader",
    faction: "Gremio de Sombras",
    level: 30,
    gold: 25000,
    status: "alive",
    kills: 12,
    avatar: { x: 1, y: 1 },
  },
  {
    id: 4,
    name: "Grom",
    title: "El Sanguinario",
    faction: "Barbaros del Norte",
    level: 38,
    gold: 1200,
    status: "alive",
    kills: 215,
    avatar: { x: 3, y: 2 },
  },
  {
    id: 5,
    name: "Eliza",
    title: "La Viuda Negra",
    faction: "Gremio de Sombras",
    level: 25,
    gold: 4500,
    status: "dead",
    kills: 45,
    avatar: { x: 0, y: 2 },
  },
  {
    id: 6,
    name: "Baelor",
    title: "El Piadoso",
    faction: "Clerigos de la Luz",
    level: 22,
    gold: 800,
    status: "alive",
    kills: 0,
    avatar: { x: 1, y: 0 },
  },
];

function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-24"
    >
      <div className="space-y-4 py-8 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-wider text-amber-500 md:text-6xl">
          Reino de las Sombras
        </h1>
        <p className="mx-auto max-w-md px-4 text-sm text-stone-400 md:text-base">
          Un mundo de traicion, magia y acero. Forja tu destino en el rol de
          WhatsApp mas inmersivo.
        </p>
      </div>

      <div className="px-4">
        <a
          href="#"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 py-4 font-serif text-lg font-bold text-white shadow-[0_0_15px_rgba(180,83,9,0.5)] transition-colors hover:bg-amber-600"
        >
          <MessageCircle size={24} />
          Unirse al Gremio (WhatsApp)
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4">
        <div className="space-y-2 rounded-xl border border-stone-800 bg-stone-900/80 p-4 text-center">
          <Users className="mx-auto text-amber-500" size={32} />
          <h3 className="font-serif font-bold text-stone-200">50+ Jugadores</h3>
          <p className="text-xs text-stone-500">Activos diariamente</p>
        </div>
        <div className="space-y-2 rounded-xl border border-stone-800 bg-stone-900/80 p-4 text-center">
          <Sword className="mx-auto text-amber-500" size={32} />
          <h3 className="font-serif font-bold text-stone-200">
            Sistema de Combate
          </h3>
          <p className="text-xs text-stone-500">Dados y estadisticas</p>
        </div>
      </div>
    </motion.div>
  );
}

function Lore() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 px-4 pb-24"
    >
      <h2 className="pt-6 text-center font-serif text-3xl font-bold text-amber-500">
        El Lore
      </h2>

      <div className="space-y-4 rounded-xl border border-stone-800 bg-stone-900/80 p-6">
        <h3 className="border-b border-stone-800 pb-2 font-serif text-xl text-stone-200">
          La Caida del Rey
        </h3>
        <p className="text-sm leading-relaxed text-stone-400">
          Hace cien anios, el Rey Loco fue derrocado, dejando el reino
          fracturado. Ahora, tres facciones principales luchan por el control
          de la capital, mientras en las sombras, el mercado negro prospera y
          los asesinos dictan quien vive un dia mas.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-800 bg-stone-900/80 p-6">
        <h3 className="border-b border-stone-800 pb-2 font-serif text-xl text-stone-200">
          Reglas Basicas
        </h3>
        <ul className="list-disc space-y-3 pl-4 text-sm text-stone-400">
          <li>Respeta el turno de rol de los demas.</li>
          <li>
            Las acciones de combate se deciden mediante tiradas de dados (bot
            en el grupo).
          </li>
          <li>La muerte de un personaje es permanente (Permadeath).</li>
          <li>El metagaming esta estrictamente prohibido.</li>
        </ul>
      </div>
    </motion.div>
  );
}

function Market() {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-amber-500 border-amber-500/30 bg-amber-500/5";
      case "epic":
        return "text-purple-500 border-purple-500/30 bg-purple-500/5";
      case "rare":
        return "text-blue-400 border-blue-400/30 bg-blue-400/5";
      default:
        return "text-stone-300 border-stone-800 bg-stone-900/50";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 px-4 pb-24"
    >
      <div className="space-y-2 pt-6 text-center">
        <h2 className="font-serif text-3xl font-bold text-amber-500">
          Mercado Negro
        </h2>
        <p className="text-sm text-stone-500">
          Solo para aquellos con el oro suficiente...
        </p>
      </div>

      <div className="space-y-4">
        {MARKET_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-4 rounded-xl border p-4 ${getRarityColor(item.rarity)}`}
          >
            <div className="shrink-0 rounded-lg bg-stone-950 p-3">
              <item.icon size={24} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between">
                <h3 className="font-serif font-bold text-stone-200">
                  {item.name}
                </h3>
                <span className="flex items-center gap-1 font-mono text-sm font-bold text-amber-500">
                  {item.price} <Coins size={14} />
                </span>
              </div>
              <p className="text-xs leading-relaxed text-stone-400">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Ranking() {
  const top3 = RANKING_PLAYERS.slice(0, 3);
  const rest = RANKING_PLAYERS.slice(3);

  const PodiumItem = ({
    player,
    rank,
    height,
    color,
    delay,
  }: {
    player: (typeof RANKING_PLAYERS)[number];
    rank: number;
    height: string;
    color: string;
    delay: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className="relative flex w-[30%] flex-col items-center"
    >
      <div className="relative z-10 mb-3">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${color} opacity-40 blur-md`}
        />
        <div className="relative z-10 h-16 w-16 overflow-hidden rounded-full border-2 border-stone-800 bg-stone-900 md:h-20 md:w-20" />
        <div
          className={`absolute -bottom-2 -right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-stone-900 bg-gradient-to-br ${color} text-xs font-bold text-stone-950 shadow-lg`}
        >
          {rank === 1 ? <Crown size={14} /> : rank}
        </div>
      </div>

      <div className="z-10 mb-2 text-center">
        <div className="w-full truncate px-1 font-serif text-sm font-bold text-stone-200">
          {player.name}
        </div>
        <div className="flex items-center justify-center gap-1 font-mono text-[10px] text-amber-500">
          {player.gold} <Coins size={10} />
        </div>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-t-lg border-x border-t border-stone-500/30 bg-gradient-to-t ${color} ${height} opacity-20`}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 px-4 pb-24"
    >
      <div className="space-y-2 pt-6 text-center">
        <h2 className="flex items-center justify-center gap-2 font-serif text-3xl font-bold text-amber-500">
          <Trophy className="text-amber-500" size={28} />
          Salon de la Fama
        </h2>
        <p className="text-sm text-stone-500">
          Las leyendas del Reino de las Sombras
        </p>
      </div>

      <div className="mt-12 mb-8 flex items-end justify-center gap-2 px-2">
        <PodiumItem
          player={top3[1]}
          rank={2}
          height="h-24 md:h-32"
          color="from-stone-300 to-stone-500"
          delay={0.2}
        />
        <PodiumItem
          player={top3[0]}
          rank={1}
          height="h-32 md:h-40"
          color="from-amber-300 to-amber-600"
          delay={0.1}
        />
        <PodiumItem
          player={top3[2]}
          rank={3}
          height="h-20 md:h-24"
          color="from-orange-400 to-orange-800"
          delay={0.3}
        />
      </div>

      <div className="space-y-3">
        {rest.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border border-stone-800 bg-stone-900/80 p-3 transition-colors hover:border-stone-700 ${player.status === "dead" ? "opacity-60 grayscale" : ""}`}
          >
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-stone-800 transition-colors group-hover:bg-amber-900/50" />

            <div className="w-6 text-center font-serif text-sm font-bold text-stone-500">
              {index + 4}
            </div>

            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-stone-700 bg-stone-950" />

            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-2 truncate font-serif text-sm font-bold text-stone-200">
                {player.name}
                {player.status === "dead" && (
                  <Skull size={12} className="shrink-0 text-red-500" />
                )}
              </h3>
              <p className="truncate text-[10px] text-stone-500">
                {player.title} - {player.faction}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-0.5 text-[10px] text-stone-400"
                  title="Asesinatos"
                >
                  {player.kills} <Sword size={10} />
                </span>
                <span className="rounded bg-stone-800 px-1.5 text-xs font-bold text-stone-300">
                  Nvl {player.level}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-amber-500">
                {player.gold} <Coins size={10} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home key="home" />;
      case "lore":
        return <Lore key="lore" />;
      case "market":
        return <Market key="market" />;
      case "ranking":
        return <Ranking key="ranking" />;
      default:
        return <Home key="home" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-300 selection:bg-amber-900 selection:text-amber-100">
      <main className="relative mx-auto min-h-screen max-w-md">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-stone-800 bg-stone-950/90 pb-safe backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-around p-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center rounded-lg p-2 transition-colors ${activeTab === "home" ? "text-amber-500" : "text-stone-500 hover:text-stone-300"}`}
          >
            <HomeIcon size={24} />
            <span className="mt-1 font-serif text-[10px]">Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab("lore")}
            className={`flex flex-col items-center rounded-lg p-2 transition-colors ${activeTab === "lore" ? "text-amber-500" : "text-stone-500 hover:text-stone-300"}`}
          >
            <ScrollText size={24} />
            <span className="mt-1 font-serif text-[10px]">Lore</span>
          </button>

          <button
            onClick={() => setActiveTab("market")}
            className={`flex flex-col items-center rounded-lg p-2 transition-colors ${activeTab === "market" ? "text-amber-500" : "text-stone-500 hover:text-stone-300"}`}
          >
            <Store size={24} />
            <span className="mt-1 font-serif text-[10px]">Mercado</span>
          </button>

          <button
            onClick={() => setActiveTab("ranking")}
            className={`flex flex-col items-center rounded-lg p-2 transition-colors ${activeTab === "ranking" ? "text-amber-500" : "text-stone-500 hover:text-stone-300"}`}
          >
            <Trophy size={24} />
            <span className="mt-1 font-serif text-[10px]">Ranking</span>
          </button>
        </div>
      </nav>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `,
        }}
      />
    </div>
  );
}
