# 👑 Kingdoom

> **Reino de las Sombras** — plataforma digital y companion app para un universo de rol medieval, con lore, economía persistente, mercado, jugadores, minijuegos, grimorio, biblioteca, Archivista, Portal Anime y aplicación móvil.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Expo](https://img.shields.io/badge/Expo-Mobile-000020?logo=expo&logoColor=white)](https://expo.dev/)

---

## 📖 Índice

- [Introducción](#-introducción)
- [Qué es Kingdoom](#-qué-es-kingdoom)
- [Objetivos del proyecto](#-objetivos-del-proyecto)
- [Experiencia del jugador](#-experiencia-del-jugador)
- [Sistemas principales](#-sistemas-principales)
- [Arquitectura general](#-arquitectura-general)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Stack tecnológico](#-stack-tecnológico)
- [Estado y persistencia](#-estado-y-persistencia)
- [Economía](#-economía)
- [Mercado](#-mercado)
- [Taberna y minijuegos](#-taberna-y-minijuegos)
- [Archivista](#-archivista)
- [Grimorio y biblioteca](#-grimorio-y-biblioteca)
- [Portal Anime](#-portal-anime)
- [Aplicación móvil](#-aplicación-móvil)
- [Rendimiento](#-rendimiento-y-code-splitting)
- [API y servidor](#-api-y-servidor)
- [Supabase](#-supabase)
- [Desarrollo local](#-desarrollo-local)
- [Variables de entorno](#-variables-de-entorno)
- [Build y despliegue](#-build-y-despliegue)
- [QA y herramientas](#-qa-y-mantenimiento)
- [Documentación interna](#-documentación-interna)
- [Desarrollo asistido por IA](#-desarrollo-asistido-por-ia)
- [Seguridad y riesgos conocidos](#-seguridad-y-riesgos-conocidos)
- [Roadmap](#-roadmap)
- [Filosofía del proyecto](#-filosofía-del-proyecto)

---

## 🌑 Introducción

**Kingdoom** es la infraestructura digital de **Reino de las Sombras**, un universo de rol medieval creado para que la experiencia del reino no dependa únicamente de conversaciones, mensajes y documentos dispersos.

La idea es convertir el mundo del rol en un ecosistema interactivo donde la información, los jugadores, la economía y los sistemas del reino puedan convivir dentro de una misma plataforma.

Kingdoom comenzó con la idea de una SPA web para presentar el reino, pero su arquitectura ha evolucionado hacia un sistema mucho más amplio. Actualmente el repositorio contiene una aplicación web, infraestructura server-side, integración con Supabase, herramientas de automatización y una aplicación móvil basada en Expo/React Native.

El proyecto está diseñado con una premisa sencilla:

> **El reino debe sentirse como un mundo vivo, no como una página estática.**

Por eso existen sistemas para consultar información, comprar objetos, administrar oro, participar en actividades de la taberna, explorar el grimorio, consultar al Archivista y extender la experiencia hacia dispositivos móviles.

---

## 🏰 Qué es Kingdoom

Kingdoom puede entenderse como una **companion app de un MMORPG/rol de mesa ficticio**, aunque su propósito principal está adaptado al universo de Reino de las Sombras.

La plataforma reúne varias capas:

```text
                         KINGDOOM
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       MUNDO              JUGADOR          SISTEMAS
          │                 │                 │
     ┌────┴────┐       ┌────┴────┐      ┌─────┴─────┐
     │         │       │         │      │           │
    Lore     Mundo    Perfil    Oro   Mercado    Taberna
    Facciones Eventos Ranking   Datos  Compras   Minijuegos
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                       SUPABASE / API
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           Archivista    Portal Anime   Mobile
```

La web actúa como el núcleo visual del proyecto, mientras que Supabase y los servicios server-side proporcionan persistencia y operaciones que no deberían depender exclusivamente del navegador.

---

## 🎯 Objetivos del proyecto

Kingdoom persigue varios objetivos simultáneos.

### 1. Centralizar el universo

El jugador debe poder encontrar en un mismo lugar la historia, reglas, facciones, mundo, eventos, objetos y demás información del reino.

### 2. Crear una economía persistente

El oro no debe ser simplemente un número mostrado en pantalla. El proyecto utiliza una base de datos compartida para que el estado económico pueda persistir entre sesiones.

### 3. Convertir el mercado en un sistema real

El mercado no es solamente un catálogo visual. Está conectado con el perfil del jugador y puede modificar su saldo.

### 4. Hacer que la taberna sea interactiva

Los minijuegos convierten una sección narrativa en una actividad jugable y reutilizable.

### 5. Crear una capa de conocimiento

El Archivista, el Grimorio y la Biblioteca buscan convertir la información del reino en algo consultable y navegable.

### 6. Mantener una experiencia mobile-first

La plataforma está pensada principalmente para usuarios móviles, pero mantiene adaptación para pantallas de escritorio.

### 7. Preparar una evolución multiplataforma

El repositorio contiene una aplicación Expo/React Native para llevar progresivamente los sistemas de Kingdoom a Android, iOS y web móvil.

---

# 🎮 Experiencia del jugador

El flujo conceptual de un jugador es:

```text
Entrada al reino
      │
      ▼
Explorar Home / Lore / Mundo
      │
      ▼
Conectar perfil de jugador
      │
      ▼
Consultar oro y progreso
      │
      ├───────────────┐
      ▼               ▼
   Mercado         Taberna
      │               │
   Comprar        Apostar/Jugar
      │               │
      └───────┬───────┘
              ▼
       Estado persistente
              │
              ▼
      Progresión del reino
```

El perfil activo se utiliza como punto común para diferentes sistemas. La intención es evitar que el usuario tenga que autenticarse o identificarse repetidamente al pasar del mercado a la taberna u otras funcionalidades.

---

# ✨ Sistemas principales

## 🏰 Reino, Lore y Mundo

La capa narrativa contiene la información que da identidad al universo.

Incluye contenido relacionado con:

- Historia.
- Lore.
- Facciones.
- Geopolítica.
- Demografía.
- Amenazas.
- Eventos.
- Misiones.
- Estado del reino.
- Anuncios.
- Información para nuevos jugadores.

La separación del contenido en módulos de datos permite modificar gran parte del mundo sin tener que reconstruir toda la lógica de los componentes visuales.

---

## 👤 Perfil y sesión del jugador

El sistema de jugador proporciona un contexto compartido para las funcionalidades que dependen de identidad y economía.

La arquitectura utiliza, entre otros elementos:

- `PlayerSessionContext` para mantener el jugador activo.
- Utilidades de jugadores para consultar y actualizar datos.
- Supabase como fuente persistente.
- Componentes de perfil reutilizables.

El objetivo es que el estado del jugador pueda viajar entre distintas secciones sin duplicar lógica.

Ejemplo conceptual:

```text
PlayerSessionContext
        │
        ├── Mercado
        │     └── Compra
        │
        ├── Taberna
        │     ├── Ruleta
        │     ├── Slots
        │     ├── Crash
        │     └── otros juegos
        │
        └── Panel del jugador
              ├── Nombre
              └── Oro
```

---

# ⚔️ Mercado

El mercado es uno de los sistemas centrales de Kingdoom.

Su función es permitir que los jugadores consulten objetos y realicen compras utilizando su economía persistente.

Cada objeto puede contener información como:

- Nombre.
- Categoría.
- Rareza.
- Precio.
- Stock.
- Descripción.
- Habilidad o efecto.
- Imagen.

La interfaz de compra está encapsulada en componentes específicos, como `PurchaseModal`, mientras que las operaciones relacionadas con jugadores y Supabase se mantienen en utilidades separadas.

### Flujo de compra

```text
Jugador
   │
   ▼
Selecciona objeto
   │
   ▼
PurchaseModal
   │
   ├── Verifica jugador
   ├── Consulta saldo
   ├── Comprueba coste
   └── Procesa operación
            │
            ▼
        Supabase
            │
            ▼
      Nuevo saldo
```

El proyecto también contempla el envío de pedidos mediante formularios externos para completar el flujo administrativo.

### Por qué separar las responsabilidades

La interfaz no debería conocer todos los detalles de la base de datos. Por eso la arquitectura separa:

- UI.
- Estado del jugador.
- Utilidades de datos.
- Cliente Supabase.
- Formularios/pedidos.

Esto facilita cambiar el backend o modificar la interfaz sin tener que reescribir todo el sistema.

---

# 🍺 Taberna Clandestina

La Taberna Clandestina es la zona de entretenimiento y riesgo del reino.

Su característica más importante es que comparte la economía del jugador con el resto de la plataforma.

Actualmente existen componentes para diferentes experiencias:

| Juego | Componente | Concepto |
|---|---|---|
| Cofres | `TavernGame` | Abrir cofres y obtener resultados |
| Ruleta | `TavernRoulette` | Apuestas y resultados de ruleta |
| Cartas | `TavernCards` | Juego basado en cartas |
| Crash | `TavernCrash` | Multiplicador y cashout |
| Slots | `TavernSlots` | Máquina de slots |
| Tower Defense | `TavernTowerDefense` | Defensa y progresión |
| Plinko | `TavernPlinko` | Caída y multiplicadores |
| Carrera | `TavernHorseRace` | Carrera con resultados variables |
| Scratch | `TavernScratch` | Sistema de tarjetas/raspaditas |

Cada juego se mantiene relativamente aislado para que añadir o modificar uno no obligue a modificar toda la taberna.

### Arquitectura de los juegos

```text
                Player Session
                      │
                      ▼
                 Tavern UI
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
    Roulette         Crash          Slots
       │              │              │
       └──────────────┼──────────────┘
                      ▼
               Economía / DB
```

### El problema de la economía cliente

Uno de los puntos técnicos importantes del proyecto es que una economía donde el navegador puede determinar directamente resultados o modificaciones de saldo debe tratarse con cuidado.

Por eso la evolución prevista es mover progresivamente las operaciones críticas hacia funciones server-side/RPCs atómicas.

El README documenta esta limitación deliberadamente para que futuros desarrolladores entiendan que **la lógica visual de un juego no debe considerarse una autoridad financiera**.

---

# 📚 Grimorio y Biblioteca

El Grimorio y la Biblioteca representan la capa de conocimiento estructurado de Kingdoom.

La aplicación maneja grandes cantidades de contenido, por lo que los datos pesados se separan del código visual siempre que resulta conveniente.

En `vite.config.ts` existe un chunk específico para:

```text
grimoire-data
```

Esto permite que los datos puedan ser cacheados de forma independiente de la interfaz.

La idea es sencilla:

```text
UI del Grimorio ────────┐
                        ├── aplicación
Datos del Grimorio ─────┘
```

Si cambia la interfaz, no necesariamente debe invalidarse el contenido completo del Grimorio y viceversa.

---

# 🧙 Archivista

El **Archivista** es uno de los sistemas más ambiciosos del proyecto.

Su propósito es convertir el conocimiento disponible en Kingdoom en una interfaz de consulta.

Puede trabajar con fuentes relacionadas con:

- Jugadores.
- Mercado.
- Eventos.
- Misiones.
- Grimorio.
- Biblioteca.
- Datos administrativos.

### Diseño de resiliencia

Una fuente externa o interna puede fallar sin que necesariamente deba desaparecer toda la experiencia.

Por eso el Archivista trabaja con estados parciales y tolerancia por fuente.

```text
                 Archivista
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
    Mercado        Eventos      Grimorio
       │             │             │
     OK            Error         OK
       │             │             │
       └─────────────┼─────────────┘
                     ▼
              Respuesta parcial
```

### Experiencia de usuario

El sistema contempla:

- Carga.
- Error.
- Respuesta parcial.
- Reintento.
- Cancelación.
- Sugerencias rápidas.
- Follow-ups.
- Historial limitado.
- Autoscroll controlado.
- Adjuntos validados.
- Controles adaptados a pantallas táctiles.

La interfaz normal del jugador también se separa de las herramientas administrativas para evitar exponer controles internos innecesarios.

---

# 📺 Portal Anime

El repositorio contiene un Portal Anime separado conceptualmente del núcleo del reino.

La arquitectura utiliza un sistema de **proveedores intercambiables**, lo que permite que diferentes fuentes puedan implementar el mismo contrato.

Conceptualmente:

```text
                  Anime Hub
                     │
              Provider Contract
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     Provider A   Provider B   Provider C
        │            │            │
        └────────────┼────────────┘
                     ▼
             Resultado normalizado
```

Esto evita que la interfaz tenga que conocer los detalles particulares de cada proveedor.

El proyecto ha trabajado con proveedores como AnimeFLV y TioAnime y mantiene integraciones adicionales documentadas en `AI_CHANGELOG.md`.

### Importante

Los proveedores externos no están bajo el control del repositorio. Sus dominios, HTML, endpoints, disponibilidad y condiciones pueden cambiar.

Por ello el Portal Anime incorpora aislamiento de errores y contratos internos para reducir el impacto de cambios externos.

---

# 📱 Aplicación móvil

El repositorio incluye una segunda aplicación en:

```text
apps/mobile/
```

Esta aplicación utiliza:

- Expo 54.
- React Native 0.81.
- React 19.
- Expo Router 6.
- React Navigation.
- React Query.
- Zustand.
- React Hook Form.
- Zod.
- Supabase.
- Reanimated.

### Estructura conceptual

```text
apps/mobile/
├── app/                 # Rutas Expo Router
├── src/
│   └── components/      # Componentes nativos
├── package.json
└── ...
```

La aplicación móvil no es simplemente una versión redimensionada de la web. Su objetivo es permitir interfaces y comportamientos propios de plataformas móviles cuando sea necesario.

### Comandos

```bash
npm run mobile:start
```

```bash
npm run mobile:android
```

```bash
npm run mobile:web
```

```bash
npm run mobile:typecheck
```

---

# 🧠 Arquitectura general

Kingdoom utiliza una arquitectura híbrida.

La web es principalmente una SPA React, pero existen funcionalidades que requieren backend, base de datos o proveedores externos.

```text
                        Cliente
                          │
              ┌───────────┴───────────┐
              │                       │
          Web React              Mobile Expo
              │                       │
              └───────────┬───────────┘
                          │
                   Servicios / API
                          │
            ┌─────────────┼─────────────┐
            │             │             │
         Supabase      Server/API    Providers
            │             │             │
            ▼             ▼             ▼
         Datos         Lógica       Servicios
       persistentes    segura        externos
```

La separación permite que el proyecto evolucione sin convertir todos los sistemas en un único bloque monolítico.

---

# 📂 Estructura del repositorio

Una vista simplificada del repositorio es:

```text
Kingdoom/
│
├── src/                         # Aplicación web
│   ├── assets/                  # Recursos gráficos
│   ├── components/              # Componentes reutilizables
│   ├── context/                 # Contextos globales
│   ├── data/                    # Datos y contenido del reino
│   ├── features/                # Funcionalidades por dominio
│   ├── hooks/                   # Hooks compartidos
│   ├── sections/                # Secciones principales
│   ├── utils/                   # Utilidades y acceso a datos
│   ├── App.tsx                  # Shell principal
│   └── main.tsx                 # Entry point
│
├── apps/
│   └── mobile/                  # Aplicación Expo / React Native
│
├── api/                         # Rutas server-side
├── server/                      # Lógica y servicios de servidor
├── supabase/                    # SQL, RPCs y scripts de BD
├── scripts/                     # Automatización y QA
├── docs/                        # Documentación técnica
├── ai-memory/                   # Memoria estructurada del proyecto
│
├── AGENTS.md                    # Instrucciones para agentes
├── AI_CHANGELOG.md              # Historial técnico reciente
├── package.json                 # Dependencias y scripts web
├── vite.config.ts               # Build y code splitting
└── README.md                    # Documentación principal
```

---

# 🛠️ Stack tecnológico

## Web

| Tecnología | Uso |
|---|---|
| React 18 | UI y componentes |
| TypeScript 5.9 | Tipado estático |
| Vite 7 | Desarrollo y build |
| Tailwind CSS 4 | Estilos |
| Framer Motion | Animaciones |
| GSAP | Animaciones avanzadas |
| Lucide React | Iconografía |
| SWR | Fetching/cache de datos |
| TanStack Virtual | Virtualización |
| Supabase JS | Persistencia/backend |
| Vercel Analytics | Analítica |
| Vercel Speed Insights | Rendimiento |

## Mobile

| Tecnología | Uso |
|---|---|
| Expo 54 | Plataforma móvil |
| React Native 0.81 | UI nativa |
| Expo Router 6 | Routing |
| React Query | Datos remotos |
| Zustand | Estado cliente |
| React Hook Form | Formularios |
| Zod | Validación |
| Reanimated | Animaciones nativas |
| Supabase JS | Persistencia |

---

# 🗄️ Estado y persistencia

Supabase actúa como una de las principales capas persistentes del proyecto.

El sistema se utiliza para mantener información que debe sobrevivir a una recarga o a una sesión diferente.

Entre los dominios persistentes se encuentran:

- Jugadores.
- Oro.
- Compras.
- Negocios.
- Mejoras de negocios.
- Datos asociados a sistemas económicos.

La filosofía es separar claramente:

```text
Estado efímero
    ↓
React / Context / hooks

Estado persistente
    ↓
Supabase / RPC / API
```

No todo estado necesita ir a la base de datos. La persistencia se reserva para aquello que debe existir más allá de la sesión actual.

---

# 💰 Economía

La economía es una parte crítica de Kingdoom porque conecta múltiples sistemas.

```text
                  Oro del jugador
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
    Mercado          Taberna         Negocios
       │               │                │
    Compra          Apuesta          Upgrade
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                 Base de datos
```

El proyecto ya incorpora operaciones atómicas para determinados sistemas. Por ejemplo, existe un RPC para mejoras de negocios que procesa conjuntamente el coste y la actualización del negocio.

### Dirección futura

Las operaciones económicas críticas deberían continuar migrando a una autoridad server-side.

La regla arquitectónica recomendada es:

> **El cliente solicita una operación; el servidor decide si la operación es válida.**

Esto es especialmente importante para:

- Apuestas.
- Premios.
- Compras.
- Retiros.
- Mejoras.
- Modificaciones de oro.

---

# 🚀 Rendimiento y code splitting

El proyecto contiene una estrategia explícita de `manualChunks` en `vite.config.ts`.

La intención es evitar que funcionalidades grandes terminen dentro del bundle inicial.

Entre los chunks definidos se encuentran:

```text
app-core
react
supabase
motion
icons
vercel
gsap
grimoire-data
MarketSection
RankingSection
LibrarySection
GrimoireSection
TavernCrash
TavernSlots
TavernTowerDefense
TavernPlinko
TavernRoulette
TavernHorseRace
TavernScratch
```

### Por qué es importante

Una aplicación móvil no debería descargar todo el reino antes de mostrar la pantalla inicial.

La idea es:

```text
Primer render
    ↓
Core mínimo
    ↓
Carga progresiva
    ↓
Funcionalidad solicitada
```

Esto reduce el coste inicial y permite que sistemas pesados se carguen cuando realmente son necesarios.

---

# 🌐 API y servidor

Aunque la aplicación puede funcionar como SPA estática en determinadas configuraciones, existen funcionalidades que requieren servidor.

El repositorio separa:

```text
api/
```

para rutas desplegables y:

```text
server/
```

para lógica auxiliar, proveedores y servicios internos.

Esta separación también permite controlar qué archivos se convierten en funciones serverless al desplegar.

La configuración actual de Vite utiliza un proxy de desarrollo para `/api` hacia el servicio de sincronización correspondiente.

---

# 🧩 Supabase

El proyecto mantiene scripts SQL versionados dentro de:

```text
supabase/
```

Esto permite que cambios importantes de base de datos puedan quedar documentados junto al código.

La utilización de RPCs es especialmente importante para operaciones que deben ser atómicas.

Ejemplo conceptual:

```text
BEGIN
  validar jugador
  validar negocio
  validar coste
  descontar oro
  actualizar negocio
COMMIT
```

La ventaja es evitar estados intermedios donde el oro se descuente pero la mejora no se aplique, o viceversa.

---

# 🔧 Desarrollo local

## Requisitos

Se recomienda disponer de:

- Node.js compatible con las versiones utilizadas por el proyecto.
- npm.
- Acceso a las variables de entorno necesarias.
- Git.

## Instalación

```bash
npm install
```

## Servidor de desarrollo

```bash
npm run dev
```

Vite iniciará el entorno local y permitirá desarrollar la SPA con hot reload.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## TypeScript

```bash
npx tsc --noEmit
```

---

# 🔐 Variables de entorno

Las variables sensibles nunca deben introducirse directamente en el código fuente.

Para el cliente web, el proyecto utiliza variables como:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Las variables con prefijo `VITE_` forman parte del entorno accesible por la aplicación cliente. Por tanto, **no deben contener secretos que deban permanecer privados**.

Las claves privadas de servicios y proveedores deben permanecer del lado server-side y configurarse mediante los mecanismos de secretos del entorno de despliegue.

---

# 🌍 Build y despliegue

## GitHub Pages

Kingdoom puede funcionar como SPA estática en GitHub Pages.

La configuración de Vite utiliza:

```ts
base: "./"
```

La base relativa es importante cuando la aplicación se publica bajo una ruta que no corresponde a la raíz absoluta del dominio.

El workflow de Pages también contempla la configuración necesaria para que Supabase pueda inicializarse en builds limpios.

## Vercel

Vercel se utiliza para las funcionalidades que requieren infraestructura server-side.

El proyecto ha sido preparado para separar rutas reales de funciones auxiliares y evitar que la cantidad de funciones serverless crezca innecesariamente.

La combinación resultante es:

```text
GitHub Pages
     │
     └── SPA / contenido estático

Vercel
     │
     └── API / server-side

Supabase
     │
     └── Persistencia / RPC
```

---

# 🧪 QA y mantenimiento

El repositorio contiene herramientas para verificar sistemas específicos y mantener la arquitectura.

## Graphify

Los scripts disponibles incluyen:

```bash
npm run graphify:setup
npm run graphify:doctor
npm run graphify:update
npm run graphify:rebuild
npm run graphify:watch
```

Graphify ayuda a mantener una representación de las relaciones del proyecto y facilita tareas de diagnóstico y mantenimiento.

## Validaciones generales

Antes de considerar un cambio importante listo, se recomienda ejecutar:

```bash
npx tsc --noEmit
npm run build
```

Cuando un cambio afecta un sistema específico, también deben ejecutarse sus scripts de comprobación correspondientes.

---

# 📚 Documentación interna

El repositorio contiene documentación adicional que complementa este README.

### `AGENTS.md`

Contiene instrucciones operativas destinadas a agentes y herramientas de desarrollo asistido.

### `AI_CHANGELOG.md`

Mantiene el historial técnico reciente del proyecto, incluyendo correcciones, cambios arquitectónicos, validaciones y riesgos conocidos.

### `ai-memory/`

Contiene memoria estructurada del proyecto para facilitar continuidad entre sesiones de trabajo asistidas por IA.

### `docs/`

Contiene documentación especializada, incluyendo material relacionado con:

- Reactivación móvil.
- QA móvil.
- Matrices de paridad.
- Backlog móvil.
- Arquitectura.
- Marketing.
- Operaciones.

### `supabase/`

Contiene SQL y definiciones relacionadas con la persistencia y las operaciones de base de datos.

---

# 🤖 Desarrollo asistido por IA

Kingdoom mantiene una infraestructura documental específica para trabajar con asistentes de IA.

La intención no es almacenar simplemente prompts, sino mantener contexto técnico suficiente para que un agente pueda comprender:

- Arquitectura.
- Decisiones anteriores.
- Cambios recientes.
- Riesgos.
- Sistemas existentes.
- Reglas de operación.
- Estado de funcionalidades.

El flujo conceptual es:

```text
Código
  │
  ├── AGENTS.md
  ├── AI_CHANGELOG.md
  └── ai-memory/
          │
          ▼
    Contexto para IA
          │
          ▼
   Cambios más consistentes
```

Esto resulta especialmente útil en un repositorio que evoluciona rápidamente y contiene múltiples subsistemas.

---

# ⚠️ Seguridad y riesgos conocidos

Kingdoom es un proyecto en evolución y algunos sistemas tienen riesgos conocidos que deben mantenerse documentados.

## Economía cliente/servidor

Los minijuegos y operaciones de economía no deben considerar el navegador como una autoridad confiable.

El objetivo de largo plazo es que el servidor valide:

1. Identidad del jugador.
2. Saldo disponible.
3. Coste.
4. Resultado válido.
5. Premio.
6. Actualización atómica.

## Proveedores externos

Los proveedores externos del Portal Anime pueden cambiar su estructura o dejar de funcionar.

Por ello no debe asumirse que una integración externa es permanente.

## Variables de entorno

Las claves privadas no deben incluirse en el bundle web ni en commits.

## Operaciones administrativas

Las herramientas administrativas deben permanecer protegidas por mecanismos de autorización apropiados y nunca deben depender únicamente de ocultar botones en la interfaz.

---

# 🗺️ Roadmap

El roadmap está orientado a convertir Kingdoom progresivamente en un ecosistema completo.

## Economía

- [x] Oro persistente.
- [x] Compras conectadas a jugador.
- [x] Mejoras de negocios mediante operaciones atómicas en sistemas concretos.
- [ ] Migración completa de liquidaciones críticas a server-side.
- [ ] Auditoría económica más completa.
- [ ] Historial transaccional más profundo.

## Reino

- [x] Lore.
- [x] Mundo.
- [x] Eventos.
- [x] Facciones.
- [x] Ranking.
- [ ] Expansión continua del contenido.
- [ ] Sistemas adicionales de progresión.

## Mercado

- [x] Catálogo.
- [x] Rareza.
- [x] Stock.
- [x] Precio.
- [x] Compra.
- [x] Perfil global.
- [ ] Sistemas comerciales más avanzados.
- [ ] Mayor integración con progresión y negocios.

## Taberna

- [x] Múltiples minijuegos.
- [x] Integración con el saldo.
- [x] Chunks independientes.
- [ ] Liquidación server-side completa.
- [ ] Nuevos juegos.
- [ ] Mejoras de progresión y estadísticas.

## Archivista

- [x] Consulta de fuentes.
- [x] Sugerencias.
- [x] Estados parciales.
- [x] Herramientas administrativas separadas.
- [x] Mejoras de rendimiento.
- [ ] Evolución continua de fuentes y capacidades.

## Mobile

- [x] Proyecto Expo.
- [x] Expo Router.
- [x] Mercado móvil.
- [x] Componentes nativos de sistemas de la taberna.
- [x] Integración Supabase.
- [ ] Paridad completa con la experiencia web.
- [ ] Evolución de builds de producción.

---

# 🧭 Filosofía del proyecto

Kingdoom intenta mantener una separación clara entre tres cosas:

### Presentación

Lo que el jugador ve.

```text
React / React Native
Tailwind / estilos
Animaciones
Componentes
```

### Estado y dominio

Lo que la aplicación necesita saber durante su ejecución.

```text
Context
Hooks
SWR
React Query
Zustand
```

### Persistencia y autoridad

Lo que debe sobrevivir y ser validado fuera del cliente.

```text
Supabase
RPCs
API
Server-side
```

La separación permite que la interfaz pueda cambiar radicalmente sin tener que reconstruir los sistemas de datos desde cero.

---

# 🧱 Principios para contribuir

Cuando se añada una funcionalidad nueva, se recomienda:

### 1. Mantener el dominio aislado

Una nueva funcionalidad debería tener sus componentes, utilidades y datos claramente identificados.

### 2. Evitar duplicar estado global

Si un dato ya existe en un contexto o servicio compartido, reutilizarlo en lugar de crear una segunda fuente de verdad.

### 3. No colocar lógica crítica únicamente en UI

Las decisiones relacionadas con dinero, permisos o administración deben validarse fuera del cliente cuando corresponda.

### 4. Pensar primero en móvil

Los controles deben ser utilizables con tacto, textos legibles y layouts que soporten pantallas pequeñas.

### 5. Mantener el bundle controlado

Las funcionalidades grandes deben considerar lazy loading y code splitting.

### 6. Documentar cambios arquitectónicos

Los cambios importantes deben reflejarse en la documentación correspondiente y, cuando proceda, en `AI_CHANGELOG.md`.

### 7. Validar antes de publicar

Como mínimo:

```bash
npx tsc --noEmit
npm run build
```

---

# 📊 Estado actual

Kingdoom se encuentra en **desarrollo activo**.

### Base consolidada

- SPA React/TypeScript.
- Diseño mobile-first.
- Mercado funcional.
- Perfil persistente.
- Economía conectada a Supabase.
- Múltiples minijuegos.
- Grimorio y Biblioteca.
- Archivista.
- Portal Anime.
- Infraestructura server-side.
- Aplicación móvil Expo.
- Code splitting avanzado.
- Scripts de QA y Graphify.
- Documentación y memoria para desarrollo asistido por IA.

### Áreas que continúan evolucionando

- Seguridad económica server-side.
- Sistemas de negocios.
- Progresión del jugador.
- Paridad web/mobile.
- Nuevos sistemas del reino.
- Rendimiento.
- Proveedores externos.
- Experiencia administrativa.

---

# 👑 Visión

La visión de Kingdoom es que un jugador pueda abrir la plataforma y sentir que está entrando al **Reino de las Sombras**, no visitando una página web.

Desde un mismo ecosistema debería poder:

```text
Explorar el mundo
      ↓
Conocer el lore
      ↓
Consultar el Archivista
      ↓
Gestionar su perfil
      ↓
Administrar su oro
      ↓
Comprar en el mercado
      ↓
Participar en la taberna
      ↓
Progresar
      ↓
Volver al mundo
```

El objetivo final no es tener muchas páginas.

Es construir una infraestructura coherente donde cada sistema tenga una razón para existir y donde el estado de un jugador tenga consecuencias en el resto del reino.

> **Kingdoom no pretende ser solamente la web de Reino de las Sombras. Pretende ser su infraestructura digital.**

---

# 📜 Créditos

Proyecto desarrollado para **Reino de las Sombras / Kingdoom**, con desarrollo colaborativo y asistencia de herramientas de IA en arquitectura, programación, diseño, documentación, QA y automatización.

**Repositorio:** https://github.com/XxxRaiconxxX/Kingdoom

---

## 📄 Licencia

Consultar la configuración y archivos de licencia del repositorio antes de redistribuir, modificar o utilizar el proyecto fuera de su contexto original.
