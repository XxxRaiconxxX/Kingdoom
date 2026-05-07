# Asistente virtual de WhatsApp para Kingdoom

## Objetivo

Crear un asistente de WhatsApp para **Kingdoom / Reino de las Sombras** que ayude a administrar el rol, orientar jugadores, responder dudas frecuentes y conectar la actividad de WhatsApp con los datos vivos del proyecto.

La idea no es un bot generico de ventas. Debe sentirse como un **maestre del reino**: util, claro, con tono medieval moderado y capaz de derivar al administrador cuando una conversacion requiere criterio humano.

## Rol del asistente

Nombre sugerido: **Maestre de Sombras**.

Funciones principales:

- Guiar a nuevos jugadores para unirse al reino.
- Explicar reglas, lore, facciones, mercado, grimorio y eventos.
- Consultar datos publicos de Kingdoom desde la misma fuente de la app.
- Ayudar a jugadores registrados con estado, oro, inventario, misiones y actividad.
- Recibir solicitudes de compra, retiro, intercambio o soporte.
- Crear resumenes diarios para el administrador.
- Detectar mensajes urgentes, reclamos o casos delicados y derivarlos.
- Proponer contenido nuevo para el reino: items, eventos, misiones, criaturas y textos de lore.
- Cargar contenido administrativo solo cuando tenga permiso confirmado.

## IA interactiva de Kingdoom

La evolucion ideal es que el asistente funcione como una IA viva del reino. No solo responde: tambien observa, propone y ayuda a mantener Kingdoom actualizado.

Capacidades sugeridas:

- **Consejero creativo**: propone nuevos items, misiones, eventos, rumores de taberna, reliquias, enemigos o recompensas segun el estado del reino.
- **Editor administrativo**: convierte una idea escrita en WhatsApp en un borrador listo para guardar.
- **Asistente de balance**: revisa si un item parece demasiado caro, barato o poderoso frente al mercado actual.
- **Narrador auxiliar**: crea textos breves para anuncios, eventos o misiones con tono de Reino de las Sombras.
- **Operador seguro**: ejecuta acciones en Supabase solo con permisos y confirmacion.

Ejemplo de uso:

```text
Admin: Maestre, crea una espada legendaria para un caballero caido, precio alto, efecto defensivo.
IA: Propongo "Juramento del Ultimo Alba"...
IA: Categoria: Espadas. Rareza: Legendaria. Precio sugerido: 1450 oro.
IA: Deseas guardarla en el mercado?
Admin: Confirmar.
IA: Item guardado en el mercado.
```

## Permisos administrativos

El asistente debe tener niveles de acceso. Esto evita que una IA modifique datos sensibles por accidente.

### Nivel 0: consulta publica

Puede responder sobre lore, reglas, eventos, mercado y preguntas frecuentes. No escribe en base de datos.

### Nivel 1: propuesta

Puede generar borradores de:

- items de mercado
- eventos
- misiones
- criaturas de grimorio
- anuncios del reino
- mensajes para WhatsApp

No guarda nada. Solo muestra una propuesta.

### Nivel 2: guardar con confirmacion

Puede guardar cambios en Supabase si el administrador confirma explicitamente.

Confirmaciones validas:

- `confirmar`
- `guardar`
- `si, cargar`
- `aprobar item`

Acciones permitidas:

- crear o editar items de mercado
- crear o editar eventos
- crear o editar misiones
- crear borradores de contenido para grimorio

Acciones bloqueadas en este nivel:

- borrar contenido
- modificar oro
- cambiar inventario de jugadores
- sancionar jugadores
- cambiar roles de administrador

### Nivel 3: admin avanzado

Solo recomendable mas adelante.

Puede ejecutar acciones delicadas, pero siempre con doble confirmacion y registro de auditoria:

- borrar items
- ajustar stock
- corregir oro
- editar inventario
- cerrar eventos
- resolver compras o reclamos

## Carga de items en el mercado

El proyecto ya tiene una base lista para esto:

- `src/features/market/market.types.ts` define `AdminMarketItemInput`.
- `src/features/market/market.adapter.ts` genera payloads para Supabase.
- `src/features/market/market.service.ts` tiene `upsertMarketItem`.
- `src/components/AdminControlSheet.tsx` ya usa el formulario administrativo de mercado.
- `supabase_admin_rls.sql` permite escribir en `market_items` solo a usuarios admin.

Para WhatsApp, el backend del asistente deberia usar una herramienta propia, por ejemplo:

```ts
type CreateMarketItemDraftInput = {
  prompt: string;
  category?: "potions" | "armors" | "swords" | "others";
  rarity?: "common" | "rare" | "epic" | "legendary";
  priceHint?: number;
};

type SaveMarketItemInput = {
  adminPhone: string;
  confirmationToken: string;
  item: {
    id: string;
    name: string;
    description: string;
    ability: string;
    price: number;
    rarity: "common" | "rare" | "epic" | "legendary";
    imageUrl: string;
    imageFit: "cover" | "contain";
    imagePosition: string;
    category: "potions" | "armors" | "swords" | "others";
    stockStatus: "available" | "limited" | "sold-out";
    featured: boolean;
  };
};
```

Flujo recomendado:

1. El admin pide un item por WhatsApp.
2. La IA consulta el mercado actual para balancear precio y rareza.
3. La IA devuelve un borrador con todos los campos.
4. El admin puede responder:
   - `ajustar precio a 900`
   - `hazlo epico`
   - `cambiar habilidad`
   - `confirmar`
5. Al confirmar, el backend guarda en `market_items`.
6. La IA responde con el resultado y el link o instruccion para verlo en la app.

## Formato de item sugerido por la IA

```text
Nombre: Juramento del Ultimo Alba
Categoria: Espadas
Rareza: Legendaria
Precio: 1450 oro
Stock: Limitado
Destacado: Si

Descripcion:
Una hoja ceremonial quebrada y reforjada con plata palida, portada por un caballero que defendio la frontera hasta el amanecer final.

Habilidad:
Guardia postrera: una vez por evento, permite reducir un golpe letal a una herida grave si el portador protege a un aliado o sostiene una posicion jurada.

Balance:
Precio alto por rareza legendaria y efecto defensivo fuerte. Recomendado como stock limitado.
```

## Registro de auditoria

Cada accion administrativa de la IA deberia guardar:

- telefono del admin
- accion solicitada
- payload antes de guardar
- resultado
- fecha
- modelo de IA usado
- mensaje original
- confirmacion recibida

Tabla sugerida:

```sql
create table if not exists public.assistant_admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_phone text not null,
  action_type text not null,
  status text not null default 'draft',
  original_message text not null,
  proposed_payload jsonb not null default '{}'::jsonb,
  confirmation_message text,
  result_message text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
```

## MVP recomendado

Primera version con bajo riesgo:

1. **FAQ del reino**
   - Responde que es Kingdoom.
   - Explica como unirse.
   - Resume reglas basicas.
   - Indica donde ver lore, biblioteca, grimorio y mercado.

2. **Consulta de jugador**
   - Pide el nombre registrado.
   - Busca el perfil en Supabase.
   - Devuelve datos seguros: oro, estado general, misiones publicas e inventario resumido.
   - Nunca muestra datos sensibles ni permite modificar saldo desde WhatsApp sin confirmacion.

3. **Asistente de mercado**
   - Busca objetos disponibles.
   - Explica rareza, precio, stock y requisitos.
   - Prepara una intencion de compra.
   - Deriva a la app o a un administrador para confirmar.

4. **Misiones y eventos**
   - Lista eventos activos.
   - Lista misiones publicas.
   - Explica dificultad, recompensa y estado.
   - Puede registrar interes del jugador para que el administrador lo revise.

5. **Derivacion humana**
   - Reclamos, bugs, conflictos entre jugadores, compras dudosas, cambios de oro, sanciones o temas de rol sensible se mandan a revision humana.

## Arquitectura propuesta

```text
Evolution API
  -> Webhook backend
  -> Clasificador de intencion
  -> Herramientas internas de Kingdoom
  -> OpenAI para redactar respuesta
  -> Reglas de seguridad
  -> WhatsApp
```

## Proveedor WhatsApp elegido

Proveedor recomendado para este proyecto: **Evolution API**.

Repositorio oficial:

```text
https://github.com/EvolutionAPI/evolution-api
```

Documentacion oficial:

```text
https://doc.evolution-api.com/v2/en/configuration/webhooks
https://docs.evolutionfoundation.com.br/es/evolution-api/installation
```

Evolution API funciona como una capa entre WhatsApp y el backend de Kingdoom. El asistente no se conecta directamente a WhatsApp: recibe eventos desde Evolution y responde usando los endpoints de Evolution.

Numero objetivo del reino:

```text
+595 0987273405
```

Formato recomendado para configuracion tecnica:

```text
595987273405
```

En formato internacional normalmente se quita el `0` inicial del numero local. Por eso `+595 0987273405` queda como `595987273405`.

Nombre de instancia sugerido:

```text
kingdoom-whatsapp
```

## Uso opcional de n8n

n8n puede ser una buena capa de automatizacion para Kingdoom, especialmente si se quiere editar flujos visualmente sin tocar codigo cada vez.

No se recomienda que n8n reemplace por completo al backend `assistant-api`, porque la IA de Kingdoom necesita:

- permisos finos
- validaciones de seguridad
- auditoria
- reutilizar logica del proyecto
- controlar confirmaciones admin
- evitar acciones peligrosas por error

Uso recomendado:

```text
Evolution API
  -> assistant-api Kingdoom
  -> n8n para automatizaciones opcionales
  -> Supabase / notificaciones / resumenes
```

Casos donde n8n suma mucho:

- Enviar resumen diario al administrador.
- Notificar compras pendientes.
- Crear una tarea cuando llega un reclamo.
- Guardar leads o nuevos jugadores en Google Sheets, Notion o Airtable.
- Enviar mensaje de seguimiento a jugadores que no completaron registro.
- Aprobar contenido con un flujo visual: propuesta IA -> confirmacion admin -> guardar.
- Conectar con Gmail, Google Drive, Discord, Trello u otras herramientas.

Casos donde conviene usar codigo en `assistant-api`:

- Procesar cada mensaje entrante de WhatsApp en tiempo real.
- Validar permisos de admin.
- Crear items de mercado con schema estricto.
- Modificar datos sensibles de Supabase.
- Controlar memoria, contexto e identidad de jugadores.
- Evitar loops de mensajes o respuestas duplicadas.

Arquitectura con n8n:

```text
WhatsApp
  -> Evolution API
  -> assistant-api
    -> OpenAI
    -> Supabase Kingdoom
    -> n8n webhook opcional
  -> Evolution API
  -> WhatsApp
```

Ejemplo de flujo n8n:

```text
Webhook desde assistant-api
  -> Filtrar tipo de evento: compra pendiente
  -> Guardar fila en Google Sheets
  -> Enviar aviso al admin
  -> Esperar aprobacion
  -> Llamar endpoint /api/admin/assistant/market/confirm
```

Hosting de n8n:

- **n8n Cloud**: mas facil, no requiere servidor propio, pero tiene costo mensual y limites por ejecucion.
- **n8n self-hosted**: se puede instalar en la misma VPS/EC2 con Docker Compose, pero requiere administrar servidor, seguridad, backups y actualizaciones.

Para Kingdoom, recomendacion inicial:

1. Empezar sin n8n para el primer webhook del asistente.
2. Agregar n8n cuando ya existan eventos claros que automatizar.
3. Usar n8n para flujos administrativos y notificaciones, no para reemplazar el nucleo de IA.

## Decision de stack minimo

Para avanzar con las opciones justas, esta es la ruta recomendada:

```text
AWS EC2 Ubuntu
  -> Docker Compose
    -> Evolution API
    -> PostgreSQL para Evolution
    -> Redis para Evolution
    -> assistant-api Kingdoom
  -> Supabase existente para datos del juego
```

n8n queda fuera del primer MVP. Se agrega despues solo si hace falta automatizar aprobaciones, resumenes o integraciones externas.

### MVP minimo

El primer MVP debe hacer solo esto:

1. Conectar el numero `+595 0987273405` a Evolution API.
2. Recibir mensajes de WhatsApp en `assistant-api`.
3. Responder saludos y preguntas basicas de Kingdoom.
4. Identificar si escribe un jugador o el administrador.
5. Permitir al admin pedir un borrador de item.
6. Guardar el item en `market_items` solo si el admin responde `confirmar`.

Queda fuera del MVP:

- n8n
- panel nuevo de administracion
- cambios de oro por WhatsApp
- cambios de inventario por WhatsApp
- borrado de items
- sanciones o permisos de jugadores
- automatizaciones complejas

### Proximo paso concreto

Antes de escribir codigo, se necesita:

- Cuenta AWS disponible.
- Crear una EC2 Ubuntu.
- Activar AWS Budget con alerta de `1 USD`.
- Tener una IP publica o dominio/subdominio para Evolution API.
- Definir `EVOLUTION_API_KEY`.
- Confirmar el numero admin que podra aprobar acciones.

## Instalacion de Evolution API

La documentacion de Evolution Foundation recomienda elegir el metodo de instalacion segun el escenario. Para Kingdoom, el camino mas conveniente es:

- **Docker** para produccion.
- **SetupOrion** si se parte de una VPS limpia y se quiere instalacion guiada con Docker, Traefik, Portainer y SSL.
- **NVM** solo para desarrollo o pruebas locales.

Requisitos previos:

- PostgreSQL o MySQL para los datos internos de Evolution API.
- Redis para cache distribuido.
- Un dominio o subdominio publico con HTTPS si se usara webhook en produccion.

Subdominios sugeridos:

```text
evo.kingdoom.app       -> Evolution API
assistant.kingdoom.app -> Backend IA de Kingdoom
```

Si todavia no hay dominio definitivo, se puede usar cualquier dominio propio o una URL publica temporal para pruebas.

### Opcion de hosting: AWS EC2

AWS puede usarse como VPS para Kingdoom, pero conviene tratarlo como **prueba con creditos/free tier**, no como "gratis para siempre".

Segun la documentacion actual de AWS:

- Las cuentas creadas antes del 15 de julio de 2025 tienen beneficios EC2 Free Tier distintos a las cuentas nuevas.
- Las cuentas creadas desde el 15 de julio de 2025 reciben creditos iniciales y un periodo Free Plan de hasta 6 meses o hasta consumir creditos.
- AWS marca ciertos tipos de instancia como elegibles para Free Tier, pero los limites dependen de la cuenta, region, AMI, almacenamiento, IPv4 publica y uso mensual.

Para evitar sorpresas:

- Activar AWS Budgets con alerta en `1 USD`.
- Usar una sola instancia.
- Evitar balanceadores, NAT Gateway y RDS al inicio.
- Usar Docker Compose en la misma EC2 para Evolution API, Redis y Postgres durante pruebas.
- Usar EBS pequeno, idealmente hasta el limite gratuito disponible de la cuenta.
- Revisar el panel Free Tier / Billing varias veces durante los primeros dias.

Tamanos sugeridos:

- `t3.micro`: sirve para prueba minima, pero puede quedar justo con Evolution API + Redis + Postgres + backend IA.
- `t3.small` o `t4g.small`: mejor para estabilidad si aparece como elegible o si se cubre con creditos.

Arquitectura inicial en AWS:

```text
EC2 Ubuntu
  -> Docker Compose
    -> Evolution API
    -> PostgreSQL Evolution
    -> Redis Evolution
    -> assistant-api Kingdoom
  -> Supabase externo para datos del juego
```

Para produccion mas estable, separar la base de datos de Evolution o subir recursos puede generar costos.

### Verificacion rapida de Evolution API

Cuando Evolution API este instalada, primero se verifica salud:

```bash
curl http://localhost:8080/
```

En produccion seria:

```bash
curl https://evo.kingdoom.app/
```

### Crear instancia para el numero de Kingdoom

Instancia sugerida:

```bash
curl -X POST https://evo.kingdoom.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{
    "instanceName": "kingdoom-whatsapp",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }'
```

Luego se solicita el QR:

```bash
curl https://evo.kingdoom.app/instance/connect/kingdoom-whatsapp \
  -H "apikey: $EVOLUTION_API_KEY"
```

Ese QR debe escanearse desde WhatsApp en el telefono del numero:

```text
+595 0987273405
```

Estado de conexion:

```bash
curl https://evo.kingdoom.app/instance/connectionState/kingdoom-whatsapp \
  -H "apikey: $EVOLUTION_API_KEY"
```

### Configurar webhook de la instancia

Cuando el backend de Kingdoom este publicado, se configura el webhook:

```bash
curl -X POST https://evo.kingdoom.app/webhook/instance/kingdoom-whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{
    "enabled": true,
    "url": "https://assistant.kingdoom.app/api/evolution/webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "QRCODE_UPDATED",
      "CONNECTION_UPDATE",
      "MESSAGES_UPSERT",
      "SEND_MESSAGE"
    ]
  }'
```

Para confirmar la configuracion:

```bash
curl https://evo.kingdoom.app/webhook/find/kingdoom-whatsapp \
  -H "apikey: $EVOLUTION_API_KEY"
```

## Flujo con Evolution API

```text
Jugador escribe a WhatsApp
  -> Evolution API recibe el mensaje
  -> Evolution envia webhook MESSAGES_UPSERT
  -> apps/assistant-api recibe el evento
  -> Kingdoom AI decide intencion
  -> consulta lore, mercado, misiones o Supabase
  -> genera respuesta
  -> apps/assistant-api llama a Evolution API para enviar mensaje
  -> jugador recibe respuesta en WhatsApp
```

Eventos necesarios en Evolution:

- `QRCODE_UPDATED`: para vincular el numero si se usa conexion por QR.
- `CONNECTION_UPDATE`: para saber si el numero sigue conectado.
- `MESSAGES_UPSERT`: para recibir mensajes entrantes.
- `SEND_MESSAGE`: para auditar mensajes enviados.

Configuracion de webhook por instancia:

```json
{
  "url": "https://TU-DOMINIO.com/api/evolution/webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "SEND_MESSAGE"
  ]
}
```

## Variables de entorno para Evolution API

```env
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=kingdoom-whatsapp
EVOLUTION_INSTANCE_NUMBER=595987273405
EVOLUTION_WEBHOOK_SECRET=
```

`EVOLUTION_API_KEY` y cualquier token de instancia deben vivir solo en backend.

## Endpoints del backend de Kingdoom

Backend sugerido:

```text
apps/assistant-api
```

Endpoints iniciales:

```text
POST /api/evolution/webhook
POST /api/admin/assistant/market/draft
POST /api/admin/assistant/market/confirm
GET  /api/assistant/health
```

`POST /api/evolution/webhook` debe:

1. Validar que el evento viene de Evolution.
2. Ignorar mensajes enviados por el propio bot (`fromMe = true`).
3. Extraer numero del usuario, nombre y texto.
4. Clasificar intencion.
5. Ejecutar herramientas permitidas.
6. Enviar respuesta por Evolution API.

Payload tipico de mensaje entrante:

```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "kingdoom-whatsapp",
  "data": {
    "key": {
      "remoteJid": "595XXXXXXXXX@s.whatsapp.net",
      "fromMe": false,
      "id": "MESSAGE_ID"
    },
    "pushName": "Jugador",
    "message": {
      "conversation": "quiero entrar al reino"
    },
    "messageType": "conversation"
  }
}
```

El formato exacto puede variar segun version y configuracion de Evolution, por eso el parser debe ser tolerante.

## Donde encaja en este repo

El frontend actual es una SPA estatica con React, Vite y Supabase. Para WhatsApp hace falta un backend porque los tokens de Evolution API, OpenAI y Supabase no deben vivir en el navegador.

Estructura sugerida:

```text
apps/
  assistant-api/
    src/
      index.ts
      evolution/
        webhook.ts
        sendMessage.ts
        parseIncomingMessage.ts
        verifyWebhook.ts
      admin/
        permissions.ts
        auditLog.ts
      kingdoom/
        knowledge.ts
        playerTools.ts
        marketTools.ts
        missionTools.ts
      ai/
        classifyIntent.ts
        generateReply.ts
        safety.ts
```

El frontend `src/` puede mantenerse como esta. Mas adelante se podria sumar una pestaña de administracion para revisar conversaciones, pero el MVP puede vivir separado.

## Fuentes de conocimiento existentes

Se puede alimentar al asistente con datos del proyecto:

- `src/data/home.ts`: estado del reino, pasos para unirse, anuncios y descarga de app.
- `src/data/lore.ts`: reglas, historia y facciones.
- `src/data/world.ts`: mundo, geopolitica y amenazas.
- `src/data/market.ts`: catalogo base del mercado.
- `src/data/events.ts`: eventos activos.
- `src/data/missions.ts`: misiones fallback.
- `src/data/grimorio.ts`: contenido extenso del grimorio.
- `src/utils/players.ts`: consultas de jugadores.
- `src/utils/inventory.ts`: inventario.
- `src/utils/missions.ts`: misiones desde Supabase.
- `src/utils/siteSettings.ts`: configuracion publica.

Para evitar duplicar contenido, conviene extraer una capa compartida de lectura en `src/features` o crear adaptadores en `apps/assistant-api` que importen solo datos seguros.

## Intenciones del asistente

Intenciones iniciales:

- `join_realm`: quiere unirse.
- `rules_question`: pregunta reglas.
- `lore_question`: pregunta historia, facciones o mundo.
- `market_browse`: busca objetos.
- `purchase_intent`: quiere comprar.
- `player_lookup`: quiere consultar su perfil.
- `mission_question`: pregunta por misiones.
- `event_question`: pregunta por eventos.
- `technical_support`: reporta bug o problema.
- `admin_request`: pide hablar con administrador.
- `sensitive_conflict`: conflicto, sancion, pelea o reclamo.
- `unknown`: no se entiende.

## Reglas de seguridad

- No cambiar oro, inventario, misiones ni compras directamente desde WhatsApp en el MVP.
- No revelar datos de otros jugadores.
- No inventar reglas, precios, stock ni recompensas.
- Si no hay informacion en la base, responder con prudencia y derivar.
- Para conflictos entre jugadores, sanciones o reclamos: derivar a humano.
- Para pagos o compras: confirmar identidad y pasar a revision.

## Variables de entorno necesarias

```env
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=kingdoom-whatsapp
EVOLUTION_INSTANCE_NUMBER=595987273405
EVOLUTION_WEBHOOK_SECRET=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_WHATSAPP_NUMBER=
```

`SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en backend. Nunca en la SPA.
`EVOLUTION_API_KEY` tampoco debe exponerse en el frontend.

## Prompt base sugerido

```text
Eres el Maestre de Sombras, asistente oficial de Kingdoom / Reino de las Sombras.
Ayudas a jugadores de un rol medieval organizado por WhatsApp.
Responde en español claro, con tono medieval sutil, sin exagerar.
Usa solo la informacion entregada por las herramientas y la base de conocimiento.
No inventes precios, reglas, stock, recompensas ni estados de jugadores.
Si el caso requiere criterio humano, deriva al administrador.
```

## Roadmap

### Fase 1

- Crear `apps/assistant-api`.
- Conectar Evolution API con la instancia `kingdoom-whatsapp`.
- Configurar webhook `MESSAGES_UPSERT`.
- Recibir y responder mensajes simples.
- Clasificador de intencion.
- FAQ desde datos locales.
- Registro basico de conversaciones en Supabase.

### Fase 2

- Consulta segura de jugador.
- Consulta de mercado.
- Consulta de misiones y eventos.
- Derivacion a administrador.
- Resumen diario.

### Fase 3

- Panel de administrador dentro de la app.
- Modo sugerencia para aprobar respuestas.
- Flujos de compra con confirmacion.
- Seguimiento automatico de jugadores nuevos.

## Primer entregable tecnico

El primer entregable deberia ser:

- Instancia Evolution API `kingdoom-whatsapp` para el numero `595987273405`.
- Endpoint `POST /api/evolution/webhook` para recibir mensajes.
- Cliente backend para enviar mensajes por Evolution API.
- Respuesta automatica para:
  - saludo
  - unirse al reino
  - reglas basicas
  - mercado
  - hablar con admin
- Sin acciones destructivas ni cambios de saldo.
