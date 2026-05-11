import type { AnimeSeriesDetail } from "./animeHub.types";

export const ANIME_HUB_GENRES = [
  "Accion",
  "Aventura",
  "Oscuro",
  "Fantasia",
  "Psicologico",
  "Cyberpunk",
] as const;

export const ANIME_HUB_LIBRARY: AnimeSeriesDetail[] = [
  {
    id: "berserk-1997",
    title: "Berserk",
    altTitle: "Kenpuu Denki Berserk",
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1400&q=80",
    synopsis:
      "Un escaparate de catalogo privado con tono oscuro, pensado para validar busqueda, ficha, episodios y flujo de descarga antes de conectar un proveedor real.",
    genres: ["Accion", "Oscuro", "Fantasia"],
    year: "1997",
    statusLabel: "Catalogo privado",
    providerLabel: "anime shell",
    score: "9.1",
    episodeCount: 25,
    releaseWindow: "Invierno 1997",
    featuredQuote: "Cascaron listo para conectar un backend externo cuando corresponda.",
    episodes: Array.from({ length: 8 }).map((_, index) => ({
      id: `berserk-1997-ep-${index + 1}`,
      number: index + 1,
      title: `Episodio ${index + 1}`,
      duration: "24 min",
      status: "provider-required",
    })),
    downloads: [
      {
        qualityLabel: "720p MP4",
        providerLabel: "Proveedor remoto",
        status: "provider-required",
        note: "Aqui faltaria conectar el endpoint real de descarga del proveedor activo.",
      },
      {
        qualityLabel: "1080p HLS",
        providerLabel: "Proveedor remoto",
        status: "provider-required",
        note: "Aqui faltaria resolver el episodio remoto y el manifest HLS del proveedor.",
      },
    ],
  },
  {
    id: "edgerunners",
    title: "Cyber Pulse",
    altTitle: "Edgerunners Mock",
    coverImage:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1400&q=80",
    synopsis:
      "Una segunda serie mock para que el buscador, los filtros y las fichas tengan variedad visual en el cascaron.",
    genres: ["Cyberpunk", "Accion", "Psicologico"],
    year: "2022",
    statusLabel: "Demo navegable",
    providerLabel: "anime shell",
    score: "8.8",
    episodeCount: 10,
    releaseWindow: "Otono 2022",
    featuredQuote: "La interfaz ya distingue catalogo, detalle, episodios y solicitudes pendientes.",
    episodes: Array.from({ length: 6 }).map((_, index) => ({
      id: `edgerunners-ep-${index + 1}`,
      number: index + 1,
      title: `Pulso ${index + 1}`,
      duration: "26 min",
      status: "provider-required",
    })),
    downloads: [
      {
        qualityLabel: "480p MP4",
        providerLabel: "TioAnime",
        status: "provider-required",
        note: "Aqui faltaria traducir la respuesta del backend a opciones descargables.",
      },
      {
        qualityLabel: "Batch ZIP",
        providerLabel: "Batch worker",
        status: "provider-required",
        note: "Aqui faltaria conectar la cola batch real del proveedor elegido.",
      },
    ],
  },
  {
    id: "argentis-chronicle",
    title: "Argentis Chronicle",
    altTitle: "Original demo",
    coverImage:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    synopsis:
      "Ejemplo de contenido propio o licenciado dentro del mismo modulo, util para distinguir entre catalogo externo y biblioteca interna.",
    genres: ["Aventura", "Fantasia"],
    year: "2026",
    statusLabel: "Original",
    providerLabel: "Biblioteca interna",
    score: "beta",
    episodeCount: 4,
    releaseWindow: "Proyecto interno",
    featuredQuote: "Este espacio tambien puede servir para material original de tu comunidad.",
    episodes: Array.from({ length: 4 }).map((_, index) => ({
      id: `argentis-chronicle-ep-${index + 1}`,
      number: index + 1,
      title: `Capitulo de prueba ${index + 1}`,
      duration: "18 min",
      status: "provider-required",
    })),
    downloads: [
      {
        qualityLabel: "Trailer local",
        providerLabel: "Biblioteca",
        status: "provider-required",
        note: "Aqui faltaria enlazar almacenamiento propio o blob autorizado.",
      },
    ],
  },
];
