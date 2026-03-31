# 🤖 AI Collaboration Log & Project Context

Este archivo sirve como puente de comunicación y registro de actividad entre los asistentes de IA (**Antigravity** y **Jarvis**) y el desarrollador (**e_grado**). 
Su propósito es mantener un historial claro de los cambios en el proyecto **Kingdoom-sync** para evitar conflictos y asegurar que todos estemos en la misma página.

---

## 📋 Instrucciones para Inteligencias Artificiales (Antigravity y Jarvis)

1. **Leer antes de actuar:** Cada vez que inicies sesión o recibas una tarea compleja, revisa rápidamente la sección `Historial de Cambios` para saber qué se modificó recientemente.
2. **Registrar después de actuar:** **SIEMPRE** que se finalice un cambio importante, un nuevo componente o una refactorización, el asistente responsable debe añadir una nueva entrada al `Historial de Cambios`.
3. **Formato estricto:** Usa el formato de plantilla de la sección de historial. Las entradas más recientes van **arriba**.
4. **Claridad ante todo:** Deja notas claras. Si un componente quedó a medias o tiene un error conocido, márcalo bajo "Notas/Advertencias".

---

## 🏛️ Contexto Base del Sistema (Referencia Rápida)

*   **Proyecto:** Kingdoom (Reino de las Sombras) - SPA para rol medieval.
*   **Alojamiento:** GitHub Pages (`https://xxxraiconxxx.github.io/Kingdoom/`).
*   **Stack:** React 18, TypeScript, Vite (base "./"), Tailwind CSS v4, Framer Motion.
*   **Reglas clave:** 
    *   Trabajar SIEMPRE en la carpeta `Kingdoom-sync`.
    *   No usar `package-lock.json`.
    *   Debe ser Mobile-First y fácil de actualizar.
    *   Formspree maneja las compras del mercado (sin backend propio).

---

## 📝 Historial de Cambios (Changelog)

*(Añade nuevas entradas siempre en la parte superior de esta lista)*

### Plantilla de Nueva Entrada (Copiar y usar)
```markdown
### [Fecha: DD/MM/AAAA] - [Autor: Antigravity / Jarvis / Usuario]
*   **Archivos Modificados:** `ruta/al/archivo.ext`, `ruta2/al/archivo2.ext`
*   **Resumen de Tareas:** Breve descripción de lo que se hizo.
*   **Cambios Clave:** 
    *   Detalle 1
    *   Detalle 2
*   **Notas/Advertencias:** (Ej: Falla tal cosa, falta conectar tal otra. Dejar vacío si todo OK).
```

---
### [Fecha: 31/03/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/TavernRoulette.tsx` (Nuevo), `src/components/TavernCards.tsx` (Nuevo)
*   **Resumen de Tareas:** Adición de dos nuevos minijuegos a la Taberna Clandestina (Ruleta y Cartas) con integración a Supabase.
*   **Cambios Clave:** 
    *   Creación de `TavernRoulette.tsx`: Juego de ruleta con multiplicadores aleatorios y animación de giro fluida preparada para usar una imagen personalizada (`ruleta.png`).
    *   Creación de `TavernCards.tsx`: Juego de adivinar si la siguiente carta será mayor o menor.
    *   Modificación de `App.tsx`: Se añadió un selector de juegos (pestañas) en la sección del Mercado para alternar entre Cofres, Ruleta y Cartas.
    *   Integración directa con Supabase en ambos juegos para descontar la apuesta y sumar los premios al oro del jugador en tiempo real.
*   **Notas/Advertencias:** El usuario debe subir su archivo pixel art `ruleta.png` a la carpeta `src/assets/` para reemplazar el placeholder temporal que se dejó configurado.

---
### [Fecha: 30/03/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/TavernGame.tsx` (Nuevo), `src/components/TavernCashoutModal.tsx` (Nuevo)
*   **Resumen de Tareas:** Integración de "Taberna Clandestina", minijuego de apuestas Doble o Nada con Formspree.
*   **Cambios Clave:** 
    *   Nuevo componente reactivo `TavernGame.tsx` para el ciclo de apuestas con animaciones Framer Motion y modificador dinámico de dificultad.
    *   Nuevo `TavernCashoutModal.tsx` para cobros usando Formspree (hacia xvzvavvd).
    *   Se incrustó la "Taberna Clandestina" dentro de la pestaña `Mercado` mediante un panel colapsable (`<details>`).
*   **Notas/Advertencias:** El factor de dificultad aumenta probabilísticamente cada 2 tiros ganadores bajando las chances de x2 y subiendo las de x0 (Mimic).

---
### [Fecha: 30/03/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AI_CHANGELOG.md` (Creación)
*   **Resumen de Tareas:** Configuración inicial del log de colaboración entre IA.
*   **Cambios Clave:** 
    *   Se creó este archivo para establecer un canal de comunicación y registro entre Antigravity y Jarvis.
    *   Se definieron las reglas de uso y la plantilla estándar de registro.
*   **Notas/Advertencias:** Ninguna. Todo listo para empezar.
