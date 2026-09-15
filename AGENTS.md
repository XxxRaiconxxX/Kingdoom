# Kingdoom Agent Protocol & Operating Guidelines (Codex CLI)

Este documento unifica y define la guía de comportamiento, estándares arquitectónicos y protocolos estrictos para **Codex CLI** y cualquier agente de IA que opere en el ecosistema **Kingdoom**.

---

## 0. Roles y División de Trabajo

No hay dominios exclusivos por nombre de agente. La división es **estrictamente por tarea**:

- **Dominio web/frontend (`Kingdoom-sync`):** SPA en React 19, TypeScript, Vite, TailwindCSS, estado global, integración cliente con Supabase, minijuegos de la Taberna y paneles de administración/jugador.
- **Dominio bot/backend (`kingdoom-bot`):** Bot de WhatsApp autónomo (Node.js/Baileys/Docker) desplegado en Hugging Face / Railway.
- **Dominio biblioteca/lore (`kingdoom-library`):** Aplicación web estática nativa (HTML/CSS/JS) para el lore, guías de inicio y descarga de APKs.
- **Dominio operaciones de grafos (`kingdoom-graphify-ops`):** Capa compartida de scripts y automatización de Graphify.

**REGLA DE CARRIL:** El agente trabaja exclusivamente en la tarea asignada y en el repositorio correspondiente. No cruza repositorios ni asume tareas fuera del alcance sin pedido explícito.

---

## 1. Visión y Arquitectura del Proyecto

### Stack Tecnológico
- **Frontend:** React, Vite, TypeScript, TailwindCSS v4, Lucide Icons, Canvas.
- **Backend / Datos:** PostgreSQL en Supabase, Supabase Realtime, Row Level Security (RLS), Procedimientos Almacenados (RPCs) y Edge Functions.
- **Automatización:** Bot de WhatsApp en Node.js con autenticación persistente y sincronización bidireccional por UUID corto.

### Estructura Principal del Repositorio (`Kingdoom-sync`)
- `src/App.tsx`: Enrutador principal, layout general y cambio de secciones.
- `src/index.css`: Tokens de diseño, sistema de color medieval/dark y utilidades custom.
- `src/types.ts`: Definiciones TypeScript compartidas (jugadores, ítems, subastas, misiones, facciones).
- `src/components/`: Módulos de interfaz:
  - `PlayerProfilePanel.tsx` y `PlayerInventorySheet.tsx`: Perfil del jugador, inventario real y gestión de cuotas.
  - `PlayerAuctionPanel.tsx`: Panel de subastas en vivo para pujas de jugadores.
  - `PayInstallmentModal.tsx` y `PurchaseModal.tsx`: Modales transaccionales de compra y pago de cuotas.
  - `AppLiveHuntSection.tsx`: Cacerías grupales en vivo.
  - `RealmStockExchange.tsx`: Bolsa de valores y comercio del reino.
  - `Tavern*.tsx` (`TavernPlinko.tsx`, `TavernSlots.tsx`, `TavernCrash.tsx`, `TavernPenalty.tsx`, `TavernRoulette.tsx`, etc.): Minijuegos interactivos.
  - `admin/`: Controles maestros de administración (`AdminControlSheet.tsx`, `AdminAuctionManager.tsx`, `AdminMissionManager.tsx`, `AdminStaffAssistant.tsx`).
- `supabase/*.sql`: Esquemas relacionales, políticas RLS y RPCs transaccionales.
- `ai-memory/kingdoom-memory.jsonl`: Memoria persistente compartida entre sesiones de agentes.

---

## 2. Reglas de Negocio y Lógica Económica

### 2.1 Mecánica de Subastas
- **Comisión de Entrada:** Se cobra una comisión no reembolsable del 25% del precio base (`start_price`) al unirse a la subasta.
- **Modelo Lock-and-Release:** El oro ofertado no se descuenta definitivamente durante las pujas; se retiene bloqueado y, al finalizar, se devuelve automáticamente a todos los postores excepto al ganador, a quien se le cobra el monto final de su última puja.
- **Pujas Acumulativas:** Cada puja se suma a la puja global acumulada. Si un jugador no dispone del oro suficiente para cubrir el nuevo total acumulado, queda descalificado.

### 2.2 Sistema de Compra a Cuotas (Installments)
- **Financiación y Recargos:** Permite 3 cuotas (10% de recargo) o 6 cuotas (18% de recargo). Pociones y consumibles no permiten financiación.
- **Bloqueo de Inventario (`is_locked`):** Mientras el plan de pago esté activo, el ítem en `player_inventory` tiene `is_locked = true` (no equipable, no transferible). Al saldar la última cuota, se desbloquea (`is_locked = false`).
- **Política de Morosidad:** Un jugador con planes en mora (`status = 'defaulted'`) en los últimos 14 días tiene denegada cualquier nueva compra financiada.

---

## 3. Base de Datos y Supabase (RPCs)

### Tablas Principales
- `players`: Perfil del jugador (`gold`, `phone`, `is_admin`, `banned`).
- `character_sheets`: Ficha de rol del jugador (columna `playerId` en camelCase).
- `player_inventory`: Inventario real de ítems (columna `player_id` en snake_case, `item_name`, `is_locked`).
- `payment_plans`: Planes de financiación, cuotas pagadas, días de mora y estado del crédito.
- `market_auctions` & `market_auction_bids`: Subastas activas e historial de pujas.
- `knowledge_documents`: Documentos de lore, bestiario, flora y grimorio.

### RPCs Transaccionales Clave
- `place_auction_bid(p_player_id, p_auction_id, p_amount)`: Valida saldo, cobra comisión e incrementa puja acumulada atómicamente.
- `purchase_market_item_v2(p_player_id, p_item_id, p_installments)`: Procesa compras al contado o financiadas con validación de stock y bloqueo.
- `resolve_market_auction(p_auction_id)`: Finaliza subasta, transfiere ítem al ganador y devuelve oro retenido al resto.

---

## 4. Protocolo de Sesión & Bootstrap (Sin Rituales Vacíos)

- **No existe bootstrap obligatorio:** El agente no debe anunciar "Contexto cargado" como ritual fijo ni reiniciar tareas por releer archivos.
- **Carga Silenciosa:** Si necesita contexto, lo consulta en silencio y continúa trabajando directamente.
- **El usuario debe ver ejecución, validación y reporte concreto**, no un arranque repetitivo.

---

## 5. Protocolo de Honestidad en Subidas y Despliegues (Push & Deploy Honesty)

Antes de informar que un cambio fue subido a GitHub o desplegado en Hugging Face / Vercel, el agente **DEBE**:
1. Ejecutar el comando real (`git push`, `docker push`, etc.) y esperar la respuesta del terminal.
2. Leer la salida completa del comando.
3. Solo si la salida confirma éxito (código de salida 0), reportar: "✅ Subido correctamente a [destino]".
4. Si el comando falla o no se ejecutó, informar inmediatamente: "⚠️ No se pudo subir. Motivo: [error exacto]".

⛔ **PROHIBIDO** reportar una subida como exitosa sin haber ejecutado y leído la salida del comando en la misma sesión.
⛔ **PROHIBIDO** asumir que algo fue subido porque "debería funcionar".  
⛔ Si hay duda, decir "No lo subí aún" es siempre la respuesta correcta.

### Secuencia de Cierre Completa (Al recibir orden de subida)
1. Actualizar `AI_CHANGELOG.md` del repo correspondiente.
2. Actualizar `kingdoom-memory.jsonl` con la decisión/handoff.
3. `git add` SOLO de los archivos modificados + changelog + memoria.
4. `git commit` con mensaje descriptivo y firma de agente (`[Codex]`).
5. `git push` a los remotos correspondientes.
6. Mostrar salida real del terminal en el reporte.

---

## 6. Protocolo de Disciplina de Reportes (Report Discipline)

Cada reporte entregado al usuario es un documento cerrado correspondiente **SOLO** a la solicitud activa.

### Formato Obligatorio de Reporte:
```markdown
---
[REPORTE] Tarea: [Nombre corto de la tarea]

Archivos modificados:
  - [archivo 1] — [qué se cambió]
  - [archivo 2] — [qué se cambió]

Cambios realizados:
  [descripción concisa de lo que se hizo y por qué]

Comandos ejecutados:
  $ [comando 1] → [resultado o salida relevante]
  $ [comando 2] → [resultado o salida relevante]

Advertencias / Riesgos detectados:
  ⚠️ [descripción del riesgo, o "Ninguno detectado."]

Estado: ✅ Completado / ⚠️ Incompleto / ❌ Error
Próximo paso sugerido: [solo si aplica, máximo 1 línea]
---
```

⛔ **PROHIBIDO** incluir contenido de reportes de tareas anteriores de la sesión.
⛔ **PROHIBIDO** repetir el enunciado del usuario o entregar reportes acumulativos no solicitados.

---

## 7. Protocolo Anti-Pereza y Calidad de Código

- **Cero Placeholders:** Prohibido dejar TODOs, "// resto igual", o funciones vacías en código reportado como terminado.
- **Tipado TypeScript Estricto:** Prohibido el uso de `any` sin justificación explícita.
- **Validación Local:** Ejecutar siempre `npx tsc --noEmit` y `npm run build` antes de dar por finalizada una tarea funcional.
- **Economía Sagrada:** Toda operación que altere oro o inventarios debe ser atómica y prevenir condiciones de carrera y doble gasto.

---

## 8. Integración con Graphify

- El grafo de conocimiento del proyecto reside en `graphify-out/graph.json`.
- Para consultas de arquitectura complejas, ejecutar `graphify query "<pregunta>"` o consultar `graphify-out/GRAPH_REPORT.md`.
- Actualizar el grafo tras cambios estructurales con `npm run graphify:update`.

---

## 9. Protocolo de Diagnóstico Forense y Validación de Base de Datos (Anti-Parches Superficiales)

Este protocolo es de cumplimiento estricto para **Codex CLI**, Antigravity y cualquier agente ante tareas de auditoría, soporte de incidencias, minijuegos o bugs reportados en producción:

### A. Evidencia en Logs Primero (Ground Truth First)
- ⛔ **PROHIBIDO adivinar o asumir la causa de un fallo** basándose únicamente en diferencias de código o lecturas superficiales.
- Ante un error reportado por un usuario o una captura de pantalla, el agente **DEBE consultar los logs reales del sistema** (PostgreSQL vía MCP `get_logs`, logs de consola del navegador o red) en la marca de tiempo exacta del incidente.
- No se inicia ninguna modificación de código hasta identificar la excepción cruda del sistema (ej: `violates check constraint`, `null value in column`, `RPC function not found`, `permission denied`).

### B. Auditoría Cruzada Código ↔ Esquema DDL (Constraint Audit)
- Cuando un componente o minijuego interactúa con PostgreSQL (mediante RPC, `insert` o `update`), no basta con verificar que las columnas existan o que los nombres coincidan.
- **Auditoría obligatoria de restricciones DDL:**
  * **`CHECK constraints`:** Verificar que los límites numéricos de la base de datos admitan la totalidad del rango que el frontend o backend calcula (apuestas, multiplicadores, oro restante, estados).
  * **`ENUMs / Status checks`:** Confirmar que todos los estados posibles del flujo estén explícitamente permitidos en el `CHECK (status IN (...))`.
  * **`UNIQUE constraints` y Nulos:** Validar que las claves compuestas y la nulabilidad no choquen con transacciones en vuelo.
- La regla es: **el código no manda sobre la base de datos; si el código cambia un rango económico o estado, la base de datos DEBE actualizarse en sincronía mediante migración SQL.**

### C. Pruebas de Límites Reales (Boundary Testing Obligatorio)
- ⛔ **PROHIBIDO validar correcciones únicamente con "caminos felices" triviales o valores mínimos.**
- Si una variable o recompensa es un número o rango `[min, max]`:
  * Se debe probar obligatoriamente el valor mínimo (`min`).
  * Se debe probar obligatoriamente el **valor máximo (`max`)**.
  * Se debe probar un valor intermedio típico.
- Si un minijuego permite cobrar o apostar montos variables, la prueba debe ejecutar transacciones reales en los límites. Si falla con el valor máximo, la tarea **NO está resuelta**.

### D. Prohibición de Declaración de Éxito Prematuro (Verification Gate)
- Un bug no se considera resuelto porque "la pantalla compila sin errores" o porque "el build pasa".
- La validación debe demostrar que el **caso exacto reportado por el usuario** (mismo minijuego, misma acción, mismo cobro) ahora se completa satisfactoriamente con respuesta de éxito (`status = 'ok'`).
- Dejar una aserción o prueba que falle si la restricción o la RPC se rompen en el futuro.

### E. Integridad y Versionado de Migraciones
- Todo ajuste de esquema o función en Supabase debe:
  1. Aplicarse en el entorno remoto activo.
  2. Quedar guardado en el archivo `.sql` de migración versionado del repositorio para que sea 100% reproducible.
  3. Registrarse en `AI_CHANGELOG.md` y `ai-memory/kingdoom-memory.jsonl` indicando la excepción real resuelta y la prueba de límites efectuada.

