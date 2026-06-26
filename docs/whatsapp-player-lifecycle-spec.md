# WhatsApp Player Lifecycle Spec

## Objetivo

Definir el flujo oficial para cuando un jugador sale del grupo principal de WhatsApp de Kingdoom, de modo que:

- el bot anuncie la salida con contexto legible;
- el perfil no quede "varado" sin estado;
- exista una ventana de gracia antes de archivar;
- staff y admins puedan listar, archivar, reactivar y reciclar;
- el reciclaje preserve la ficha como activo reutilizable sin reutilizar la identidad historica del jugador.

## Alcance de esta fase

Esta fase define e implementa la base de ciclo de vida del jugador.

Incluye:

- deteccion de salida del grupo principal;
- anuncio en grupo;
- transicion automatica a estado de gracia;
- archivado automatico a los 14 dias;
- comandos de consulta y administracion;
- base de datos y auditoria del ciclo de vida;
- regla de reciclaje de ficha.

No incluye todavia:

- el asistente conversacional completo para reasignar una ficha reciclada a otro usuario;
- clonacion o edicion profunda de ficha reciclada;
- reglas de UX web para mostrar fichas reciclables en el panel admin.

## Politica oficial

### 1. Salida del grupo

Cuando un usuario abandona el grupo principal:

- el bot detecta la salida;
- busca su `player` vinculado por telefono / auth link;
- publica un mensaje en el grupo mencionando al numero y el nombre de su perfil;
- cambia su estado a `left_grace`;
- guarda la fecha de salida y la fecha limite de gracia.

### 2. Periodo de gracia

La gracia dura exactamente 14 dias en horario `America/Asuncion`.

Durante ese tiempo:

- no se elimina nada;
- el perfil sigue existiendo;
- la ficha sigue intacta;
- el usuario puede volver al grupo y ser reactivado sin perder nada.

### 3. Archivado automatico

Si el usuario no regresa dentro de la gracia:

- el scheduler del bot lo pasa a `archived`;
- se conserva todo el perfil y toda la ficha;
- desde ese momento queda habilitado para `purga` o `reciclaje`.

### 4. Reactivacion

Si el usuario vuelve al grupo:

- si estaba en `left_grace`, vuelve a `active` automaticamente;
- si estaba en `archived`, staff/admin puede usar comando de reactivacion;
- la reactivacion restaura el estado normal del perfil sin recrear identidad nueva.

### 5. Regla de reciclaje

La regla central es:

- **se recicla la ficha, no la identidad del jugador**.

Esto significa:

- el `player_id` historico no se reasigna a otra persona;
- el registro viejo del jugador queda como entidad historica;
- la ficha puede separarse del jugador archivado y pasar a estado reciclable;
- oro, inventario, deudas, notificaciones, progreso y cualquier otra posesion del usuario saliente no pasan al nuevo usuario.

## Estados oficiales

Se recomienda manejar estos estados en `players.lifecycle_status`:

- `active`: jugador presente y operativo.
- `left_grace`: salio del grupo, dentro de la ventana de 14 dias.
- `archived`: no regreso dentro de la gracia; perfil congelado.
- `recycled`: el perfil historico ya tuvo su ficha desacoplada para reutilizacion.
- `purged`: perfil vaciado o retirado del circuito activo, sin ficha reutilizable.

## Modelo de datos recomendado

### A. Tabla `players`

Agregar columnas:

- `lifecycle_status text not null default 'active'`
- `left_group_at timestamptz null`
- `archive_due_at timestamptz null`
- `archived_at timestamptz null`
- `reactivated_at timestamptz null`
- `recycled_at timestamptz null`
- `purged_at timestamptz null`
- `last_known_group_jid text null`
- `last_exit_reason text null`

### B. Tabla de auditoria `player_lifecycle_log`

Crear una tabla append-only para registrar cada cambio relevante:

- `id uuid primary key`
- `player_id uuid not null`
- `phone text null`
- `group_jid text null`
- `action text not null`
- `from_status text null`
- `to_status text null`
- `sheet_id uuid null`
- `performed_by text not null`
- `details jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Acciones esperadas:

- `group_left`
- `group_rejoined`
- `auto_archived`
- `manual_archived`
- `reactivated`
- `recycle_started`
- `recycle_completed`
- `purged`

### C. Ficha reciclable

No se recomienda reasignar directamente `character_sheets.playerId` a otra persona sin trazabilidad.

Base recomendada:

- agregar en `character_sheets` una marca de reciclaje o desacople controlado;
- o mover temporalmente la ficha a una tabla `recyclable_character_sheets`.

Para la primera implementacion, la recomendacion mas segura es:

- mantener la ficha original;
- marcarla como reciclable;
- registrar el `player_id` anterior;
- bloquear cualquier uso automatico hasta que exista el flujo admin de reasignacion.

## Registro web de fichas recicladas

El menu publico `Buscar fichas` debe tener dos apartados:

- `Fichas publicas`: fichas activas o ya asignadas a jugadores actuales.
- `Fichas recicladas`: fichas de jugadores archivados con `recycleStatus = 'available'`.

La vista reciclada sirve como inventario operativo para staff/admin. No debe mostrar oro, inventario ni datos economicos del jugador saliente; solo la ficha reutilizable.

Cuando una ficha reciclada se asigna a un nuevo jugador:

- deja de aparecer en `Fichas recicladas`;
- pasa al apartado normal de fichas del jugador destino;
- queda marcada como `assigned`;
- conserva `originalPlayerId` y `originalPlayerUsername` para auditoria.

## Comportamiento del bot

### 1. Anuncio de salida

Cuando detecte que un participante salio del grupo principal:

- mencionar al numero;
- mostrar el nombre del perfil del reino si existe;
- avisar que entra en gracia de 14 dias antes de archivarse.

Formato recomendado:

`[Salida del Reino] @5959XXXXXXX abandono el grupo principal. Perfil detectado: NombreDelPerfil. Su registro entra en gracia de 14 dias antes de archivarse.`

### 2. Reactivacion automatica al volver

Si el bot detecta que el mismo numero vuelve al grupo y su estado es `left_grace`:

- restaurar a `active`;
- limpiar `left_group_at` y `archive_due_at`;
- registrar `group_rejoined`;
- publicar un mensaje breve de retorno.

Si vuelve ya estando `archived`:

- no reactivar automaticamente;
- dejarlo visible para comando staff/admin.

## Scheduler

Proceso diario en horario `America/Asuncion`:

1. Buscar jugadores con `lifecycle_status = 'left_grace'`.
2. Filtrar los que tengan `archive_due_at <= now()`.
3. Pasarlos a `archived`.
4. Registrar `auto_archived` en auditoria.
5. Opcionalmente publicar un resumen discreto para staff o log interno.

## Comandos administrativos

Todos estos comandos deben ser solo para `admin` y `staff`.

### `!salidos`

Lista jugadores en `left_grace` con:

- nombre del perfil;
- telefono;
- fecha de salida;
- fecha de archivo automatico;
- dias restantes.

### `!archivados`

Lista perfiles ya archivados y pendientes de decision:

- mantener archivado;
- reciclar ficha;
- purgar.

### `!archivar @usuario`

Uso manual para forzar archivo antes de los 14 dias si staff lo necesita.

### `!reactivar @usuario`

Devuelve un perfil `archived` o `left_grace` a `active`.

### `!reciclarficha @usuario`

Ejecuta el reciclaje controlado del perfil archivado.

Efectos:

- el perfil deja de estar operativo;
- la ficha queda marcada como reciclable;
- el jugador viejo pasa a `recycled`;
- todo lo no-ficha queda fuera del circuito activo.

### `!asignarficha <ficha|nombre> @usuario`

Asigna una ficha reciclada disponible a un jugador activo.

Entrada permitida:

- por mencion de WhatsApp del jugador destino;
- por nombre exacto del perfil web del jugador destino.

Efectos:

- busca una ficha reciclada disponible por nombre o identificador;
- valida que el jugador destino exista;
- cambia `character_sheets.playerId` al jugador destino;
- actualiza `playerUsername` al nombre actual del destino;
- cambia `recycleStatus` a `assigned`;
- registra auditoria en `player_lifecycle_log`.

### `!purgarperfil @usuario`

Operacion administrativa mas dura para casos donde no se quiere conservar nada reutilizable.

## Efectos exactos por estado final

### Si se archiva

Se mantiene:

- perfil;
- ficha;
- oro;
- inventario;
- historico;
- deudas;
- vinculos y trazabilidad.

### Si se recicla

Se conserva:

- el perfil historico del jugador saliente;
- la ficha como activo reciclable;
- la auditoria del proceso.

Se elimina o desacopla del circuito activo:

- oro;
- inventario;
- creditos / deudas activas;
- notificaciones;
- progreso de minijuegos o estados transitorios;
- vinculos activos de WhatsApp;
- cualquier dato operativo que pertenezca a la persona y no a la ficha.

## Reglas de seguridad

- Nunca reasignar el `player_id` viejo a un nuevo humano.
- Nunca reciclar una ficha antes de que el perfil este `archived`.
- Nunca purgar o reciclar sin registrar auditoria.
- Toda accion de reciclaje o purga debe exigir confirmacion de staff/admin.
- La ficha reciclable no debe quedar visible como si siguiera perteneciendo al usuario saliente.

## Flujo recomendado de implementacion

### Fase 1

- columnas nuevas en `players`;
- tabla `player_lifecycle_log`;
- deteccion de salida;
- anuncio en grupo;
- gracia de 14 dias;
- scheduler de archivado;
- comandos `!salidos`, `!archivados`, `!reactivar`.

### Fase 2

- comando `!reciclarficha`;
- desacople controlado de ficha;
- limpieza de posesiones no-ficha;
- trazabilidad total del reciclaje.

### Fase 3

- flujo admin para reasignar una ficha reciclable a un nuevo jugador;
- UX web para inventario de fichas reciclables;
- confirmaciones mas ricas y filtros operativos.

## Veredicto de diseño

La politica mas sana para Kingdoom es:

- **salida detectada**
- **14 dias de gracia**
- **archivo automatico**
- **reactivacion si vuelve**
- **reciclaje solo de ficha y solo despues del archivo**

Con esto se evita:

- perder trazabilidad historica;
- dejar perfiles colgados sin estado;
- mezclar identidades de dos personas distintas;
- borrar de inmediato a alguien que podria volver.
