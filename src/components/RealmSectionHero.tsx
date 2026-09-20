import { ArrowDown, BookOpen, Gem } from "lucide-react";
import { AnimeIcon } from "./AnimeIcon";

const destinations = {
  market: {
    eyebrow: "El bazar de las sombras", title: "Todo tesoro tiene una historia.",
    description: "Acero, reliquias y fortunas por descubrir. Encuentra la pieza que cambiará tu destino.",
    action: "Explorar el mercado", target: "#realm-catalogue", icon: Gem,
    caption: "Reliquias · Comercio · Taberna", numeral: "III",
  },
  grimoire: {
    eyebrow: "El archivo de lo imposible", title: "El poder empieza con un secreto.",
    description: "Abre el grimorio. Descubre escuelas de magia, criaturas ancestrales y la flora que da vida al reino.",
    action: "Abrir el compendio", target: "#realm-grimoire-content", icon: BookOpen,
    caption: "Magia · Bestiario · Flora", numeral: "II",
  },
  anime: {
    eyebrow: "Kingdoom · Anime club", title: "Otro mundo. Tu próxima historia.",
    description: "Del primer episodio a la última batalla. Cruza el portal y descubre tu siguiente universo favorito.",
    action: "Encontrar mi anime", target: "#anime-search", icon: AnimeIcon,
    caption: "Fantasía · Aventura · Nuevos mundos", numeral: "異世界",
  },
} as const;

export function RealmSectionHero({ section }: { section: keyof typeof destinations }) {
  const { eyebrow, title, description, action, target, icon: Icon, caption, numeral } = destinations[section];
  return (
    <header className={`realm-portal-hero realm-portal-${section}`}>
      <img className="realm-portal-art" src={`${import.meta.env.BASE_URL}img/realm-${section}.webp`} width="1536" height="1024" alt="" decoding="async" />
      <div className="realm-portal-aura" aria-hidden="true" />
      <div className="realm-portal-orbits" aria-hidden="true"><i /><i /></div>
      <div className={`realm-embers ${section === "anime" ? "realm-sakura" : ""}`} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="realm-portal-copy">
        <p className="realm-portal-eyebrow"><Icon />{eyebrow}</p>
        <h2>{title}</h2>
        <p className="realm-portal-description">{description}</p>
        <a className="realm-button realm-portal-action" href={target}>{action}<ArrowDown /></a>
      </div>
      <span className="realm-portal-numeral" aria-hidden="true">{numeral}</span>
      <p className="realm-portal-caption"><span />{caption}</p>
    </header>
  );
}
