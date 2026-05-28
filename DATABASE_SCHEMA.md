# 🗄️ Esquema de Base de Datos (Kingdoom Supabase)

Este documento contiene un mapeo de las tablas principales que el bot y la web utilizan, asegurando que las futuras consultas SQL apunten exactamente a las columnas correctas, previniendo errores como el del inventario.

---

## 1. Tabla `players`
Contiene la información central de la cuenta del jugador (su oro, número y estado).

| Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `uuid` | PK (Primary Key). Identificador principal. |
| `username` | `text` | Nombre del usuario (Ej: "Alexander"). |
| `gold` | `numeric` / `integer` | Oro actual del usuario. |
| `phone` | `text` | Número de WhatsApp o ID de 15 dígitos de comunidad. |
| `is_admin` | `boolean` | Determina si tiene privilegios en la web y bot. |
| `banned` | `boolean` | Si es true, el jugador fue destituido con `!ban`. |
| `auth_user_id` | `uuid` | Vinculación con el sistema de Autenticación de Supabase. |
| `created_at` | `timestamptz` | Fecha de creación de la cuenta. |

---

## 2. Tabla `character_sheets`
Almacena la Ficha de Rol creada desde la web (`Kingdoom-sync`). 
*(Nota: Históricamente usa nombres en camelCase para sus columnas, en vez de snake_case)*

| Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `uuid` | PK. |
| `playerId` | `uuid` | FK a `players(id)`. **[Nota de atención: la columna es con 'I' mayúscula]** |
| `name` | `text` | Nombre de rol del personaje. |
| `race` | `text` | Raza (Ej: Humano, Elfo, etc.). |
| `birthRealm`| `text` | Reino de origen. |
| `powers` | `text` | Descripción de poderes y habilidades. |
| `weapon` | `text` | Arma principal descrita en el lore inicial. |
| `personality` | `text` | Descripción psicológica del personaje. |
| `history` | `text` | Lore de trasfondo del personaje. |
| `inventory` | `text` | *Obsoleto / Sólo texto del lore de inventario inicial.* |
| `imageUrl` | `text` | URL de la imagen del avatar. |
| `isApproved`| `boolean` | Aprobación de la ficha por parte del staff. |

---

## 3. Tabla `player_inventory`
Contiene los objetos reales comprados en el Mercado de la web.

| Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `uuid` | PK. |
| `player_id` | `uuid` | FK a `players(id)`. **[Nota de atención: snake_case]** |
| `item_id` | `text` | ID lógico del objeto (Ej: `espada_hierro`). |
| `item_name` | `text` | Nombre visible del objeto (Ej: "Espada de Hierro"). |
| `item_category` | `text` | Categoría (`armors`, `swords`, `others`). |
| `item_description` | `text` | Breve lore del objeto. |
| `item_ability`| `text` | Habilidad especial del ítem, si la tiene. |
| `item_rarity` | `text` | `common`, `rare`, `epic`, `legendary`, `mythic`. |
| `quantity` | `integer` | Cantidad de ese ítem (agrupado). |

---

## 4. Tabla `knowledge_documents`
Base de conocimientos (Lore y Secretos) que consume el Oráculo (`Archivista`).

| Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `uuid` | PK. |
| `title` | `text` | Título del documento o secreto. |
| `content` | `text` | Contenido completo del documento. |
| `summary` | `text` | Resumen usado en las inyecciones de IA. |
| `type` | `text` | Ej: `lore`, `rule`, `secret`. |
| `category` | `text` | Ej: `bot-upload`, `history`. |
| `source` | `text` | Ej: `whatsapp`, `web`. |
| `visible` | `boolean` | Si es false, el Oráculo no lo puede leer. |
| `tags` | `text[]` | (Opcional) Array de palabras clave. |

---

## ⚠️ Puntos de Control y Errores Comunes
1. **Diferencias de casing en ID:**
   - La tabla de Fichas (`character_sheets`) usa `playerId` (camelCase).
   - La tabla de Inventario (`player_inventory`) usa `player_id` (snake_case).
   - Esta inconsistencia puede generar fallos silenciosos si no se tiene en cuenta.
2. **El inventario se lee por `item_name`:** 
   - El bot debe extraer `item_name` para inyectar en el Oráculo, no `item_id`.
3. **El campo de la base de datos es `item_category`, no `category`.**
   - Supabase fallará sin arrojar una excepción grave si consultas una columna inexistente, simplemente no traerá el resultado esperado, como ocurrió con el inventario.
