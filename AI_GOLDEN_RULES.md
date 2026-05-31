# 👑 Reglas de Oro para Asistentes de IA (Kingdoom)

Este documento es de LECTURA OBLIGATORIA para cualquier asistente de IA (Antigravity, Jarvis, Codex, etc.) antes de comenzar a trabajar en los proyectos de Kingdoom (Bot, Web Sync, Mobile).

## 🛑 1. REGLA DE ORO: La fuente de la verdad es GitHub, NUNCA el entorno local
*   **Prohibido:** No asumas que el código local en tu entorno está actualizado. NUNCA verifiques si un cambio existe leyendo solo los archivos locales.
*   **Obligatorio:** Antes de modificar o auditar código, DEBES comunicarte con GitHub (`git fetch origin`, `git status`, revisar commits en `origin/main`).
*   Si el repositorio local tiene commits de retraso (`behind`), sincroniza ANTES de programar (`git pull`).
*   Los asistentes trabajan de forma asíncrona; si un agente hizo un cambio, estará en GitHub, no necesariamente en el disco local que estás leyendo.

## 📝 2. Documentación Estricta (Changelog)
*   **Obligatorio:** SIEMPRE que finalices *cualquier* cambio (incluso arreglos mínimos), debes añadir una nueva entrada al archivo `AI_CHANGELOG.md`.
*   Mantén el formato histórico exacto: `### [Fecha] - [Autor]` con listas de Archivos, Resumen y Cambios Clave.

## 🧠 3. Memoria Compartida (MCP Kingdoom Memory)
*   Usa el servidor MCP `kingdoom-memory` (herramienta `remember_decision`) para registrar cambios en reglas de negocio (ej. "purga a 3 días"), migraciones o arquitecturas.
*   Esto asegura que en futuras sesiones, los agentes estén al tanto sin adivinar.

## 🛠️ 4. Restricciones del Entorno
*   **Hugging Face (Bot):** El servidor del bot en Hugging Face es EFÍMERO. Se reinicia y borra el sistema de archivos local (`fs`). Cualquier persistencia de estado debe ir directamente a **Supabase** (usando la tabla `knowledge_documents` como bot_state u otra solución DB).
*   **Headless:** Tu entorno de comandos de terminal es headless. No intentes ejecutar flujos que requieran abrir el navegador e iniciar sesión manualmente (ej. Vercel OAuth).

---
## ✅ Checklist Obligatorio de Ejecución
Cada vez que recibas una instrucción del usuario, procesa este checklist mentalmente:
- [ ] 1. ¿Revisé `git fetch` y comprobé que mi rama local está 100% sincronizada con GitHub?
- [ ] 2. ¿Resolví el problema escribiendo código persistente y seguro?
- [ ] 3. ¿El código compila/funciona?
- [ ] 4. ¿Escribí la bitácora de mis cambios en `AI_CHANGELOG.md`?
- [ ] 5. ¿Guardé la decisión o cambio conceptual en `kingdoom-memory`?
- [ ] 6. ¿Hice `git commit` y `git push` a GitHub con el trabajo terminado?
