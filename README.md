# Kingdoom

> Reino de las Sombras  
> Una SPA medieval, mobile-first y estatica para un grupo de rol por WhatsApp.

## El proyecto

**Kingdoom** es la web oficial de **Reino de las Sombras**, un universo de rol medieval con intrigas de corte, guerra entre facciones, mercado de objetos, ranking de jugadores y una taberna clandestina con minijuegos de apuesta.

La app esta pensada para funcionar bien en movil, ser facil de mantener desde GitHub web y crecer por etapas sin depender de un backend complejo.

## Lo que incluye

- `Inicio` con presentacion del reino, estado actual, eventos, anuncios y pasos para unirse.
- `Lore` con reglas, historia y facciones principales.
- `Mundo` con demografia, geopolitica y amenazas del continente.
- `Mercado` con catalogos por categoria, objetos destacados y compras por formulario.
- `Ranking` con jugadores destacados del reino.
- `Taberna Clandestina` dentro del mercado, con minijuegos de:
  - cofres
  - ruleta
  - cartas

## Caracteristicas clave

- SPA estatica desplegable en GitHub Pages.
- Enfoque **Mobile-First** con adaptacion responsive para escritorio.
- Estetica medieval oscura con Tailwind CSS v4.
- Transiciones animadas con Framer Motion.
- Catalogo del mercado con imagen, descripcion, habilidad, rareza, stock y precio.
- Compras conectadas a Supabase para verificar jugador y descontar oro.
- Perfil global de jugador para no repetir login en mercado y minijuegos.
- Taberna conectada al mismo saldo persistente en base de datos.
- Formularios externos con Formspree para pedidos y retiros.

## Stack

- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide React**
- **Framer Motion**
- **Supabase**
- **Formspree**
- **GitHub Pages**

## Flujo actual del jugador

1. El jugador conecta su perfil desde el panel superior usando su nombre registrado.
2. La app consulta Supabase y muestra su oro disponible.
3. Ese mismo perfil activo se reutiliza en:
   - compras del mercado
   - cofres
   - ruleta
   - cartas
   - retiro de ganancias
4. Cuando compra o apuesta, el saldo se actualiza en la base de datos.

## Estructura del proyecto

```text
src/
  assets/          Imagenes locales del proyecto
  components/      Componentes visuales reutilizables
  context/         Estado compartido de la app
  data/            Contenido editable: lore, eventos, mercado, ranking, mundo
  utils/           Helpers de pedidos, jugadores y Supabase
  App.tsx          Estructura general de la SPA
  main.tsx         Punto de entrada
  index.css        Estilos globales
```

## Archivos importantes

- `src/App.tsx`: organiza la navegacion y las secciones principales.
- `src/data/*`: contenido editable del reino.
- `src/components/PurchaseModal.tsx`: compra de objetos con descuento de oro.
- `src/components/TavernGame.tsx`: minijuego de cofres.
- `src/components/TavernRoulette.tsx`: ruleta.
- `src/components/TavernCards.tsx`: cartas.
- `src/components/PlayerProfilePanel.tsx`: panel global del jugador.
- `src/context/PlayerSessionContext.tsx`: sesion compartida del perfil activo.
- `src/utils/players.ts`: lectura y actualizacion de jugadores en Supabase.
- `src/utils/supabaseClient.ts`: conexion a Supabase.

## Mercado y compras

El mercado funciona con dos capas:

- **Supabase**
  - verifica que el jugador exista
  - consulta su oro
  - descuenta el total de la compra
- **Formspree**
  - envia el pedido al correo configurado

Si el formulario falla despues del descuento, la app intenta restaurar el saldo.

## Taberna Clandestina

La taberna comparte el mismo perfil conectado del mercado.

Los minijuegos usan el saldo del jugador en Supabase para:

- descontar apuestas
- pagar premios
- reflejar el oro actualizado en tiempo real

## Despliegue

### GitHub Pages

El proyecto usa Vite con:

```ts
base: "./"
```

Esto es importante para evitar pantallas en blanco al publicar en GitHub Pages.

### GitHub Actions

El workflow compila con:

```bash
npm install
npm run build
```

No se usa `package-lock.json`.

## Desarrollo local

```bash
npm install
npm run dev
```

Build de produccion:

```bash
npm run build
```

Chequeo de TypeScript:

```bash
npx tsc --noEmit
```

## Estado actual

El proyecto ya tiene una base funcional para seguir creciendo en:

- contenido de lore y mundo
- expansion del mercado
- nuevos minijuegos
- mejoras visuales y responsive
- evolucion futura a sistemas mas avanzados

## Vision

La idea de **Kingdoom** no es solo ser una landing, sino convertirse en una companion app del reino:

- un punto de entrada para nuevos jugadores
- una guia viva del mundo
- un mercado funcional
- una interfaz para sistemas del rol

## Creditos

Desarrollado como base viva para **Reino de las Sombras**, con trabajo colaborativo entre el desarrollador del proyecto y asistentes de IA enfocados en diseno, arquitectura, contenido y automatizacion del flujo web.
