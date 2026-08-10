# 👑 Kingdoom

> **Reino de las Sombras** — companion app del reino para rol medieval, economía persistente, lore, mercado, taberna, grimorio, biblioteca y herramientas comunitarias.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Expo](https://img.shields.io/badge/Expo-Mobile-000020?logo=expo&logoColor=white)](https://expo.dev/)

## 🌑 ¿Qué es Kingdoom?

**Kingdoom** es la plataforma digital de **Reino de las Sombras**, un universo de rol medieval diseñado para funcionar como algo más que una página informativa.

El proyecto combina una SPA web mobile-first con servicios persistentes y una aplicación móvil en desarrollo. El objetivo es centralizar la experiencia del reino: conocer su historia, consultar información, administrar personajes, utilizar el mercado, participar en la economía y acceder a sistemas interactivos del mundo.

La arquitectura está pensada para evolucionar por etapas, manteniendo una experiencia rápida en dispositivos móviles y separando los sistemas que requieren persistencia o procesamiento externo.

## ✨ Funcionalidades

### 🏰 Reino y contenido

- Inicio del reino con estado, anuncios, eventos y onboarding.
- Lore e historia del mundo.
- Facciones y contexto político.
- Mundo, demografía, geopolítica y amenazas.
- Ranking de jugadores.
- Eventos, misiones y contenido vivo.
- Grimorio y biblioteca con grandes volúmenes de contenido desacoplados del bundle principal.

### ⚔️ Mercado

El mercado permite consultar objetos y realizar compras utilizando el oro persistente del jugador.

Incluye:

- Catálogo por categorías.
- Rareza, stock, precio, descripción y habilidades.
- Perfil global del jugador.
- Consulta y actualización del oro mediante Supabase.
- Compras con validación de jugador.
- Formularios para procesar pedidos.
- Arquitectura preparada para ampliar el sistema económico.

### 🍺 Taberna Clandestina

La taberna utiliza el mismo perfil y economía del jugador y contiene múltiples minijuegos.

Actualmente existen componentes para:

- 🎰 Ruleta.
- 🃏 Cartas.
- 💰 Cofres.
- 📈 Multiplicador / Crash.
- 🎰 Slots.
- 🏗️ Tower Defense.
- 🟠 Plinko.
- 🐎 Carrera de caballos.
- 🎫 Scratch.

Los minijuegos comparten la infraestructura de saldo del jugador y están preparados para seguir creciendo como sistemas independientes.

> **Nota de arquitectura:** la economía persistente continúa teniendo trabajo pendiente de endurecimiento server-side para que todas las liquidaciones críticas sean atómicas y no dependan de lógica confiable en el cliente.

### 📚 Archivista

El **Archivista** funciona como una interfaz inteligente para consultar información del reino.

Incluye:

- Consultas sobre mercado, eventos, misiones, grimorio, biblioteca y jugadores.
- Sugerencias rápidas.
- Estados de carga, error y respuesta parcial.
- Reintentos y cancelación de consultas.
- Adjuntos validados.
- Historial acotado y autoscroll respetuoso.
- Controles adaptados a dispositivos táctiles.
- Herramientas administrativas separadas de la experiencia normal del jugador.
- Tolerancia a fallos por fuente para evitar que un conector degradado bloquee toda la experiencia.

### 📺 Portal Anime

El proyecto también incorpora un **Portal Anime** con arquitectura de proveedores intercambiables.

La integración utiliza contratos compartidos entre cliente y servidor y contempla proveedores como AnimeFLV y TioAnime, además de integraciones experimentales/recientes documentadas en el changelog.

El navegador recibe enlaces normalizados de reproducción y el sistema está preparado para aislar fallos de proveedores externos.

> La disponibilidad de proveedores externos puede cambiar sin aviso y no está garantizada por Kingdoom.

## 📱 Aplicación móvil

El repositorio incluye `apps/mobile`, una aplicación basada en **Expo + React Native + Expo Router**.

La aplicación móvil comparte la lógica y el ecosistema de Kingdoom, pero mantiene una interfaz nativa independiente cuando es necesario.

Incluye infraestructura para:

- Navegación mediante Expo Router.
- Mercado móvil.
- Componentes nativos de sistemas de la taberna.
- Supabase.
- React Query.
- Zustand.
- Formularios y validación con React Hook Form + Zod.
- Ejecución en Android, iOS y web.

Comandos principales:

```bash
npm run mobile:start
npm run mobile:android
npm run mobile:web
npm run mobile:typecheck
```

## 🧠 Arquitectura

El proyecto está dividido principalmente en cuatro áreas:

```text
Kingdoom/
├── src/                    # Aplicación web principal
│   ├── assets/             # Recursos gráficos
│   ├── components/         # Componentes reutilizables
│   ├── context/            # Estado global y sesiones
│   ├── data/               # Lore, mercado, grimorio y contenido
│   ├── sections/           # Secciones principales de la aplicación
│   ├── features/           # Funcionalidades agrupadas por dominio
│   ├── hooks/              # Hooks compartidos
│   └── utils/              # Supabase, jugadores y utilidades
│
├── apps/mobile/            # Aplicación Expo / React Native
│
├── api/                    # Endpoints server-side desplegables
├── server/                 # Lógica de servidor y proveedores
├── supabase/                # SQL, RPC y migraciones del proyecto
├── scripts/                # Herramientas de mantenimiento, QA y automatización
├── docs/                   # Documentación técnica y operativa
├── ai-memory/              # Memoria estructurada para asistentes de IA
└── vite.config.ts          # Configuración, chunks y optimización de build
```

## 🛠️ Stack web

- **React 18**
- **TypeScript 5.9**
- **Vite 7**
- **Tailwind CSS v4**
- **Framer Motion**
- **GSAP**
- **Lucide React**
- **SWR**
- **TanStack React Virtual**
- **Supabase JS**
- **Vercel Analytics**
- **Vercel Speed Insights**

## 📱 Stack móvil

- **Expo 54**
- **React Native 0.81**
- **React 19**
- **Expo Router 6**
- **React Navigation**
- **React Query**
- **Zustand**
- **React Hook Form**
- **Zod**
- **Supabase JS**
- **Reanimated**

## 🗄️ Datos y economía

Supabase es la capa principal de persistencia para los sistemas que necesitan estado compartido.

Entre otros datos, el proyecto utiliza persistencia para:

- Jugadores.
- Oro.
- Compras.
- Negocios de jugadores.
- Mejoras de negocios.
- Sistemas relacionados con la economía de la taberna.

Las operaciones económicas nuevas se están orientando hacia RPCs y operaciones atómicas. Por ejemplo, el sistema de mejoras de negocios utiliza `upgrade_player_business` para procesar en una sola operación el descuento de oro y la actualización correspondiente.

## 🚀 Rendimiento y code splitting

`vite.config.ts` contiene una estrategia explícita de **manual chunks** para evitar que funcionalidades grandes afecten al primer render.

Se separan, entre otros:

- `app-core`.
- `react`.
- `supabase`.
- `motion`.
- `icons`.
- `vercel`.
- `gsap`.
- `grimoire-data`.
- Mercado.
- Ranking.
- Biblioteca.
- Grimorio.
- Minijuegos individuales de la taberna.

Esto permite cargar funcionalidades pesadas de forma diferida y mejorar el comportamiento de la aplicación en dispositivos móviles.

## 🔧 Desarrollo local

Requisitos recomendados:

- Node.js compatible con las dependencias actuales.
- npm.
- Variables de entorno de Supabase para las funcionalidades que dependen de la base de datos.

Instalación:

```bash
npm install
```

Servidor de desarrollo:

```bash
npm run dev
```

Build de producción:

```bash
npm run build
```

Preview del build:

```bash
npm run preview
```

Chequeo de TypeScript:

```bash
npx tsc --noEmit
```

## 📲 Desarrollo móvil

Desde la raíz:

```bash
npm run mobile:start
```

Android:

```bash
npm run mobile:android
```

Web mediante Expo:

```bash
npm run mobile:web
```

TypeScript de la aplicación móvil:

```bash
npm run mobile:typecheck
```

## 🧪 Herramientas y QA

El repositorio contiene scripts adicionales para mantener sistemas complejos y comprobar integraciones.

Entre ellos:

```bash
npm run graphify:setup
npm run graphify:doctor
npm run graphify:update
npm run graphify:rebuild
npm run graphify:watch
```

También existen comprobaciones específicas para sistemas como Archivista y proveedores del Portal Anime.

## 🌐 Despliegue

### GitHub Pages

La SPA utiliza una base relativa en Vite:

```ts
base: "./"
```

Esto permite servir los assets correctamente en GitHub Pages.

El workflow de Pages contempla las variables necesarias para inicializar Supabase en builds limpios.

### Vercel

Kingdoom también dispone de infraestructura server-side para funcionalidades que no pueden resolverse únicamente desde un hosting estático, incluyendo APIs y servicios relacionados con el Portal Anime.

La configuración de Vite utiliza un proxy local para `/api` apuntando al servicio de sincronización desplegado.

## 🔐 Variables de entorno

No publiques secretos reales en el repositorio.

Las variables utilizadas por el proyecto pueden incluir credenciales públicas de cliente y configuración de servicios, por ejemplo:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Las credenciales privadas, claves de proveedores y secretos server-side deben mantenerse exclusivamente en los entornos de despliegue correspondientes.

## 📚 Documentación

La documentación interna se encuentra principalmente en:

```text
docs/
supabase/
AGENTS.md
AI_CHANGELOG.md
ai-memory/
```

Entre la documentación actual existen materiales para la reactivación móvil, matrices de paridad, QA manual, arquitectura operativa y seguimiento de cambios asistidos por IA.

## 🗺️ Estado del proyecto

Kingdoom se encuentra en desarrollo activo.

### Implementado / funcional

- [x] SPA web mobile-first.
- [x] Lore y mundo del reino.
- [x] Mercado con economía persistente.
- [x] Perfil global del jugador.
- [x] Taberna con múltiples minijuegos.
- [x] Grimorio y biblioteca.
- [x] Ranking y contenido dinámico.
- [x] Archivista con consultas inteligentes.
- [x] Arquitectura de proveedores para Portal Anime.
- [x] Integración Supabase.
- [x] Code splitting y optimización del bundle.
- [x] Infraestructura de aplicación móvil Expo.
- [x] Herramientas de Graphify y memoria operativa.

### En evolución

- [ ] Endurecimiento completo de la economía con liquidación exclusivamente server-side.
- [ ] Expansión de los sistemas de negocios y progresión.
- [ ] Paridad completa entre web y aplicación móvil.
- [ ] Nuevos sistemas de rol y administración.
- [ ] Mejoras continuas de rendimiento y UX móvil.
- [ ] Evolución de proveedores y tolerancia ante cambios externos.

## ⚠️ Consideraciones

Kingdoom integra servicios externos y contenido que puede cambiar independientemente del repositorio. La disponibilidad de proveedores externos, endpoints y servicios de terceros no está garantizada.

Los sistemas económicos y de minijuegos deben considerarse parte de una arquitectura en evolución; las operaciones críticas deben seguir migrando hacia validación y liquidación server-side para minimizar riesgos de manipulación desde clientes.

## 🤖 Desarrollo asistido por IA

El proyecto mantiene documentación específica para facilitar el trabajo colaborativo entre desarrolladores y asistentes de IA.

- `AGENTS.md` contiene instrucciones operativas para agentes.
- `AI_CHANGELOG.md` registra cambios técnicos recientes y decisiones relevantes.
- `ai-memory/` conserva memoria estructurada del proyecto para mantener continuidad entre sesiones.

## 👑 Visión

Kingdoom busca convertirse en una **companion app completa del Reino de las Sombras**: un lugar donde un jugador pueda entrar al mundo, conocer su historia, gestionar su personaje, consultar el conocimiento del reino, comerciar, progresar y participar en sus sistemas interactivos desde un único ecosistema.

No es solamente una landing page.

Es la infraestructura digital del reino.

---

## 📜 Créditos

Proyecto desarrollado para **Reino de las Sombras / Kingdoom**, con desarrollo colaborativo y asistencia de herramientas de IA en arquitectura, programación, diseño, documentación, QA y automatización.

**Repositorio:** [XxxRaiconxxX/Kingdoom](https://github.com/XxxRaiconxxX/Kingdoom)
