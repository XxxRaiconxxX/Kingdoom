import { FileSearch, Home, Library, Sparkles, Store } from "lucide-react";
import { AnimeIcon } from "./AnimeIcon";
import { motion } from "framer-motion";
import type { TabId } from "../types";

export const KINGDOOM_EMBLEM = `${import.meta.env.BASE_URL}img/kingdoom-emblem.png`;

export const REALM_NAVIGATION = [
  { id: "home", label: "Inicio", description: "El pulso del reino", icon: Home },
  { id: "grimoire", label: "Grimorio", description: "Magia, criaturas y flora", icon: Sparkles },
  { id: "library", label: "Biblioteca", description: "Crónicas y territorios", icon: Library },
  { id: "market", label: "Mercado", description: "Comercio y taberna", icon: Store },
  { id: "archivist", label: "Archivista", description: "El conocimiento de Argentis", icon: FileSearch },
] as const;

export function RealmNavigation({ activeTab, onNavigate, onPreload }: {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  onPreload: (tab: TabId) => void;
}) {
  return (
    <nav className="realm-navigation" aria-label="Navegación principal">
      <button className="realm-brand" onClick={() => onNavigate("home")} aria-label="Kingdoom, ir al inicio">
        <img className="realm-logo realm-crest" src={KINGDOOM_EMBLEM} width="80" height="80" alt="" />
        <span><strong>Kingdoom</strong><small>Reino de las Sombras</small></span>
      </button>
      <p className="realm-nav-caption">Explora el reino</p>
      <div className="realm-nav-links">
        {REALM_NAVIGATION.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="realm-nav-link"
            aria-current={activeTab === id ? "page" : undefined}
            onMouseEnter={() => onPreload(id)}
            onFocus={() => onPreload(id)}
            onClick={() => onNavigate(id)}
          >
            {activeTab === id && <motion.span aria-hidden="true" className="realm-nav-active" layoutId="realm-nav-active" transition={{ type: "spring", stiffness: 340, damping: 32 }} />}
            <Icon aria-hidden="true" />
            <span><strong>{label}</strong><small>{description}</small></span>
          </button>
        ))}
      </div>
      <div className="realm-nav-extra">
        <p className="realm-nav-caption">Más allá del reino</p>
        <button className="realm-nav-link" aria-current={activeTab === "anime" ? "page" : undefined}
          onClick={() => onNavigate("anime")} onMouseEnter={() => onPreload("anime")} onFocus={() => onPreload("anime")}>
          {activeTab === "anime" && <motion.span aria-hidden="true" className="realm-nav-active" layoutId="realm-nav-active" transition={{ type: "spring", stiffness: 340, damping: 32 }} />}
          <AnimeIcon /><span><strong>Portal anime</strong><small>Un universo por descubrir</small></span>
        </button>
      </div>
      <div className="realm-nav-footer"><img className="realm-logo" src={KINGDOOM_EMBLEM} width="64" height="64" alt="" /><p>Tu historia forma<br />parte del reino.</p><span>Rol por WhatsApp</span></div>
    </nav>
  );
}
