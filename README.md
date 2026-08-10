<div align="center">

# 👑 KINGDOOM

### ⚔️ REINO DE LAS SOMBRAS ⚔️

*Un reino. Cuatro fuerzas. Una historia que todavía no ha terminado.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:090014,25:1a0633,55:4c1d95,80:6d28d9,100:0f172a&height=180&section=header&text=KINGDOOM&fontSize=62&fontColor=ffffff&fontAlignY=40&animation=twinkling" width="100%" />

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-111827?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)

<br />

[![Estado](https://img.shields.io/badge/ESTADO-EN_DESARROLLO-6D28D9?style=flat-square)](#-estado-del-proyecto)
[![Mobile First](https://img.shields.io/badge/MOBILE--FIRST-4C1D95?style=flat-square)](#-experiencia)
[![Medieval Fantasy](https://img.shields.io/badge/MEDIEVAL--FANTASY-312E81?style=flat-square)](#-el-mundo)

<br /><br />

> **Bienvenido a Kingdoom.**  
> Donde el oro tiene valor, las alianzas tienen precio y cada decisión puede cambiar el destino del reino.

</div>

---

## 🏰 El Reino

**Kingdoom — Reino de las Sombras** es una plataforma digital para un universo de rol medieval construido alrededor de una idea sencilla: **convertir el mundo del rol en un ecosistema vivo**.

No es solamente una página informativa.

Kingdoom funciona como el punto de encuentro entre el **lore**, los **jugadores**, la **economía**, el **mercado**, los **eventos**, los **minijuegos** y los futuros sistemas del reino.

La experiencia está diseñada principalmente para dispositivos móviles, manteniendo una interfaz adaptable para escritorio y una arquitectura preparada para crecer por módulos.

<div align="center">

### ⚔️ LORE · 💰 ECONOMÍA · 🛒 MERCADO · 🎲 TABERNA · 🏆 RANKING · 🌑 MUNDO

</div>

---

## 🌑 El Mundo

El universo de Kingdoom gira alrededor de un reino medieval marcado por **intrigas políticas, conflictos entre facciones, comercio, poder y supervivencia**.

El sitio actúa como una enciclopedia viva del mundo: los jugadores pueden descubrir la historia, comprender las reglas, consultar las facciones y seguir el estado del reino desde una única interfaz.

### Los pilares del mundo

| Sistema | Propósito |
|:---|:---|
| 📜 **Lore** | Historia, reglas, acontecimientos y contexto del universo. |
| 🗺️ **Mundo** | Demografía, geopolítica, territorios, amenazas y estructura del continente. |
| ⚔️ **Facciones** | Fuerzas políticas y grupos que compiten por influencia. |
| 🏆 **Ranking** | Progresión y posición de los jugadores dentro del reino. |
| 📢 **Eventos** | Acontecimientos que mantienen el mundo en evolución. |
| 🧭 **Misiones** | Actividades y objetivos para impulsar la participación. |

---

## ✨ Experiencia

Kingdoom está construido alrededor de una experiencia **mobile-first**, rápida y visualmente inmersiva.

```text
                         👑 KINGDOOM
                              │
             ┌────────────────┼────────────────┐
             │                │                │
           🏰 REINO         🛒 MERCADO       🍺 TABERNA
             │                │                │
        Lore / Mundo      Objetos / Oro    Minijuegos
             │                │                │
             └────────────────┼────────────────┘
                              │
                         👤 JUGADOR
                              │
                         💰 SUPABASE
                              │
                    Estado persistente
```

La sesión global del jugador permite que su identidad y saldo puedan reutilizarse entre las diferentes experiencias, evitando repetir el mismo flujo de identificación.

---

## 🛒 Mercado del Reino

El **Mercado** es uno de los sistemas centrales de Kingdoom.

Los jugadores pueden consultar un catálogo de objetos y descubrir información como:

- ⚔️ Nombre y descripción.
- ✦ Rareza.
- 📦 Stock disponible.
- 💰 Precio.
- 🧬 Habilidad o efecto.
- 🖼️ Imagen del objeto.
- 🛍️ Flujo de compra.

### Flujo de compra

```text
👤 Jugador
   │
   ▼
🔐 Perfil conectado
   │
   ▼
🗄️ Consulta de Supabase
   │
   ├── ¿Jugador existe?
   │        │
   │       Sí
   │        ▼
   │    💰 Consultar oro
   │        │
   │        ▼
   │    🛒 Seleccionar objeto
   │        │
   │        ▼
   │    💸 Descontar saldo
   │        │
   │        ▼
   │    📩 Procesar pedido
   │
   ▼
⚔️ Compra registrada
```

La persistencia permite que el saldo utilizado por el mercado sea el mismo que alimenta otras partes de la experiencia.

---

## 🍺 Taberna Clandestina

> *“En la taberna nadie pregunta de dónde viene tu oro. Solo quieren saber cuánto estás dispuesto a apostar.”*

La **Taberna Clandestina** es el espacio de entretenimiento del reino.

Actualmente reúne diferentes experiencias independientes conectadas al saldo persistente del jugador:

| 🎲 Juego | Concepto |
|:---|:---|
| 🧰 **Cofres** | Riesgo y recompensa a través de cofres. |
| 🎡 **Ruleta** | Apuestas sobre resultados de ruleta. |
| 🃏 **Cartas** | Sistema de apuestas basado en cartas. |
| 🎰 **Slots** | Experiencia de máquinas tragamonedas. |
| 📈 **Crash** | Multiplicador creciente con riesgo de retirada. |
| 🏗️ **Tower Defense** | Defensa estratégica con progresión. |
| 🟠 **Plinko** | Caída aleatoria y multiplicadores. |
| 🐎 **Carrera de caballos** | Predicciones y resultados competitivos. |
| 🎫 **Scratch** | Tarjetas con premios instantáneos. |

### Economía compartida

```text
                    💰 ORO DEL JUGADOR
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       🛒 Mercado       🍺 Taberna       👤 Perfil
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                       🗄️ Supabase
```

> **Nota técnica:** los sistemas económicos continúan evolucionando hacia una arquitectura donde las operaciones críticas se validan y liquidan server-side mediante operaciones atómicas.

---

## 📚 Archivista

El **Archivista** es la interfaz de conocimiento del reino.

Su objetivo es permitir que la información de Kingdoom pueda consultarse de una manera más natural, conectando diferentes fuentes y dominios del proyecto.

Puede trabajar conceptualmente con información relacionada con:

- 📜 Lore.
- 🛒 Mercado.
- 📅 Eventos.
- ⚔️ Misiones.
- 📚 Biblioteca.
- 🧙 Grimorio.
- 👥 Jugadores.
- 🌑 Mundo.

La arquitectura está preparada para que un fallo en una fuente externa no tenga que derribar toda la experiencia.

---

## 🧙 Grimorio & Biblioteca

Los grandes volúmenes de conocimiento del reino se mantienen separados del núcleo de la aplicación cuando es conveniente.

Esto permite:

- reducir el peso inicial de la aplicación;
- cargar contenido bajo demanda;
- mantener los datos organizados;
- actualizar grandes bloques de conocimiento sin convertirlos en lógica de interfaz;
- preparar la plataforma para un sistema de consulta mucho más amplio.

---

## 🏗️ Arquitectura

Kingdoom está evolucionando desde una SPA sencilla hacia una arquitectura con dominios especializados.

```text
Kingdoom/
│
├── src/
│   ├── assets/             Recursos gráficos
│   ├── components/         Componentes reutilizables
│   ├── context/            Estado y sesión global
│   ├── data/               Lore, mercado, mundo, eventos...
│   ├── sections/           Secciones principales
│   ├── features/           Funcionalidades por dominio
│   ├── hooks/              Hooks compartidos
│   └── utils/              Utilidades y servicios
│
├── apps/mobile/             Aplicación Expo / React Native
├── api/                     Endpoints server-side
├── server/                  Servicios y proveedores
├── supabase/                SQL, RPC y migraciones
├── scripts/                 Automatización y QA
├── docs/                    Documentación técnica
├── ai-memory/               Memoria estructurada del proyecto
│
├── vite.config.ts           Optimización y code splitting
└── package.json             Scripts y dependencias
```

### Principios

**Modularidad** · **Mobile-first** · **Persistencia** · **Separación de dominios** · **Carga bajo demanda** · **Tolerancia a fallos** · **Evolución progresiva**

---

## 🛠️ Stack Tecnológico

<div align="center">

### Web

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animation-6D28D9?style=flat-square&logo=framer&logoColor=white)

### Datos & Backend

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)
![API](https://img.shields.io/badge/API-Server--Side-4C1D95?style=flat-square&logo=fastapi&logoColor=white)

### Mobile

![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=white)

### Deploy & Tooling

![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

</div>

---

## 📱 Aplicación móvil

El repositorio incluye una aplicación móvil basada en **Expo + React Native**.

```text
apps/mobile/
        │
        ├── Expo Router
        ├── React Native
        ├── React Query
        ├── Zustand
        ├── React Hook Form
        ├── Zod
        └── Supabase
```

La aplicación móvil busca llevar la experiencia del reino a una interfaz nativa manteniendo los mismos conceptos de producto y sistemas persistentes.

### Comandos

```bash
npm run mobile:start
npm run mobile:android
npm run mobile:web
npm run mobile:typecheck
```

---

## 🚀 Rendimiento

El proyecto utiliza una estrategia explícita de **code splitting** para evitar que todo el contenido del reino tenga que descargarse al mismo tiempo.

Entre los dominios que pueden mantenerse separados se encuentran:

- Mercado.
- Ranking.
- Biblioteca.
- Grimorio.
- Taberna.
- Minijuegos.
- Vercel.
- Supabase.
- GSAP / Motion.

Esto permite que una funcionalidad pesada no tenga que convertirse automáticamente en coste para el primer render.

---

## 🔐 Datos & Economía

Supabase funciona como capa de persistencia para los sistemas que necesitan estado compartido.

Entre los datos manejados por el ecosistema se encuentran:

- 👤 Jugadores.
- 💰 Oro.
- 🛒 Compras.
- 🏪 Negocios.
- ⬆️ Mejoras.
- 🎲 Operaciones relacionadas con la taberna.

Las operaciones económicas críticas se están orientando hacia **RPCs y operaciones atómicas**, reduciendo progresivamente la dependencia de cálculos confiables ejecutados exclusivamente en el cliente.

---

## 🌐 Despliegue

### GitHub Pages

La SPA utiliza una base relativa para facilitar el despliegue:

```ts
base: "./"
```

### Vercel

La infraestructura server-side permite alojar funcionalidades que requieren ejecución fuera de un hosting estático, incluyendo APIs y servicios asociados a proveedores externos.

---

## 🔧 Desarrollo Local

### Requisitos

- Node.js.
- npm.
- Variables de entorno necesarias para Supabase y servicios externos.

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm run preview
```

### TypeScript

```bash
npx tsc --noEmit
```

---

## 🧪 QA & Herramientas

El repositorio incluye herramientas internas para mantenimiento, diagnóstico y automatización.

```bash
npm run graphify:setup
npm run graphify:doctor
npm run graphify:update
npm run graphify:rebuild
npm run graphify:watch
```

También existen comprobaciones específicas para sistemas complejos y proveedores externos.

---

## 🤖 Desarrollo asistido por IA

Kingdoom incorpora documentación específica para mantener continuidad durante el desarrollo asistido por IA.

```text
AGENTS.md
    │
    ├── Reglas operativas
    └── Convenciones para agentes

AI_CHANGELOG.md
    │
    └── Historial de cambios técnicos

ai-memory/
    │
    └── Memoria estructurada del proyecto
```

Esto permite que las decisiones arquitectónicas, procedimientos y contexto técnico no dependan únicamente del contenido de una sesión de desarrollo.

---

## 🗺️ Estado del Proyecto

<div align="center">

| Área | Estado |
|:---|:---:|
| 🏰 Reino / Lore | 🟢 Activo |
| 🌑 Mundo | 🟢 Activo |
| 🛒 Mercado | 🟢 Activo |
| 👤 Perfil de jugador | 🟢 Activo |
| 🍺 Taberna | 🟢 Activo |
| 📚 Grimorio / Biblioteca | 🟢 Activo |
| 🤖 Archivista | 🟡 En evolución |
| 📺 Portal Anime | 🟡 En evolución |
| 📱 Aplicación móvil | 🟡 En desarrollo |
| 💰 Economía server-side | 🟡 En endurecimiento |
| 🏗️ Nuevos sistemas del reino | 🔵 Planificado |

</div>

---

## 🧭 Roadmap

```text
[██████████████████░░]  Ecosistema Web
[██████████████░░░░░░]  Economía Persistente
[████████████░░░░░░░░]  Sistemas Interactivos
[███████████░░░░░░░░░]  Archivista
[████████░░░░░░░░░░░░]  Aplicación Mobile
[███████░░░░░░░░░░░░░]  Nuevos Sistemas de Rol
```

### Próximas líneas de evolución

- ⚔️ Nuevos sistemas de progresión.
- 🏪 Expansión de negocios y economía.
- 📱 Mayor paridad entre web y mobile.
- 🧙 Expansión del Grimorio y Biblioteca.
- 🤖 Evolución del Archivista.
- 🌐 Nuevos servicios y proveedores.
- 🛡️ Endurecimiento de operaciones económicas críticas.
- 🎮 Nuevas experiencias para la Taberna.

---

## 📂 Documentación

La documentación técnica y operativa se encuentra distribuida en:

```text
docs/
supabase/
AGENTS.md
AI_CHANGELOG.md
ai-memory/
```

El objetivo es que el proyecto pueda ser comprendido y mantenido incluso cuando sus sistemas continúen creciendo.

---

## ⚠️ Consideraciones

Kingdoom integra servicios externos y contenido que puede cambiar independientemente del repositorio.

La disponibilidad de proveedores externos, APIs y servicios de terceros no está garantizada por el proyecto.

Los sistemas económicos se encuentran en evolución y las operaciones críticas deben priorizar validación, autorización y liquidación server-side.

---

## 👑 Visión

Kingdoom busca convertirse en la **infraestructura digital del Reino de las Sombras**.

Un lugar donde un jugador pueda:

> **Entrar al reino.**  
> **Conocer su historia.**  
> **Construir su identidad.**  
> **Comerciar.**  
> **Progresar.**  
> **Arriesgar su oro.**  
> **Consultar el conocimiento del mundo.**  
> **Y participar en una historia que continúa evolucionando.**

<div align="center">

### ⚔️ EL REINO NO ESTÁ TERMINADO. ⚔️

*Solo está comenzando.*

<br />

[![Repositorio](https://img.shields.io/badge/EXPLORAR_REPOSITORIO-6D28D9?style=for-the-badge&logo=github&logoColor=white)](https://github.com/XxxRaiconxxX/Kingdoom)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,20:4c1d95,50:6d28d9,80:4c1d95,100:090014&height=140&section=footer" width="100%" />

**KINGDOOM · REINO DE LAS SOMBRAS**

</div>
