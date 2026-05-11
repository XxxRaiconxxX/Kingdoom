import type { MobileAnimeSeriesDetail } from "./animeHubTypes";

export const MOBILE_ANIME_GENRES = [
  "Accion",
  "Aventura",
  "Oscuro",
  "Fantasia",
  "Cyberpunk",
] as const;

export const MOBILE_ANIME_LIBRARY: MobileAnimeSeriesDetail[] = [
  {
    id: "berserk-1997",
    title: "Berserk",
    altTitle: "Kenpuu Denki Berserk",
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1400&q=80",
    synopsis:
      "Cascaron nativo para busqueda, ficha, episodios y solicitudes pendientes. Todo funcional a nivel visual y sin proveedor conectado.",
    genres: ["Accion", "Oscuro", "Fantasia"],
    year: "1997",
    statusLabel: "Catalogo privado",
    providerLabel: "anime shell",
    score: "9.1",
    releaseWindow: "Invierno 1997",
    episodeCount: 25,
    featuredQuote: "La app ya queda lista para enchufar un backend compatible cuando quieras.",
    episodes: Array.from({ length: 6 }).map((_, index) => ({
      id: `berserk-mobile-${index + 1}`,
      number: index + 1,
      title: `Episodio ${index + 1}`,
      duration: "24 min",
      status: "provider-required",
    })),
    downloads: [
      {
        qualityLabel: "720p MP4",
        providerLabel: "Proveedor remoto",
        note: "Aqui faltaria conectar el endpoint de descarga real del proveedor.",
      },
      {
        qualityLabel: "1080p HLS",
        providerLabel: "Proveedor remoto",
        note: "Aqui faltaria resolver mirrors y manifest antes de mostrar el enlace final.",
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
      "Serie mock secundaria para validar scroll, listados y detalle sin dependencia de red externa.",
    genres: ["Cyberpunk", "Accion"],
    year: "2022",
    statusLabel: "Demo navegable",
    providerLabel: "anime shell",
    score: "8.8",
    releaseWindow: "Otono 2022",
    episodeCount: 10,
    featuredQuote: "Los contratos del proveedor remoto quedan preparados, pero no activos.",
    episodes: Array.from({ length: 4 }).map((_, index) => ({
      id: `cyber-pulse-mobile-${index + 1}`,
      number: index + 1,
      title: `Pulso ${index + 1}`,
      duration: "26 min",
      status: "provider-required",
    })),
    downloads: [
      {
        qualityLabel: "Batch ZIP",
        providerLabel: "Batch worker",
        note: "Aqui faltaria conectar la cola del batch y la respuesta de progreso.",
      },
    ],
  },
];
