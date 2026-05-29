# Prompt Operativo - Antigravity 1

Trabaja solo en `C:\Users\e_grado\Documents\New project 2\Kingdoom-sync\apps\mobile`.

Objetivo:
- llevar la superficie movil a calidad de beta interna sin tocar reglas sensibles de economia.

Contexto congelado:
- la web en `src/` es la fuente de verdad funcional.
- el target movil oficial es `apps/mobile`.
- `android/` en raiz no es el producto movil principal.
- admin movil queda fuera de este sprint.

Tu alcance:
- `app/(tabs)/home.tsx`
- `app/(tabs)/library.tsx`
- `app/(tabs)/market.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/grimoire.tsx`
- `app/(tabs)/archivist.tsx`
- `app/(tabs)/anime.tsx`
- componentes UI moviles reutilizables en `src/components`

Lo que debes hacer:
- mejorar navegacion, jerarquia visual y feedback de uso
- unificar estados de:
  - loading
  - error
  - empty
  - success
  - refresh
- hacer mas consistente la experiencia entre tabs
- pulir layout para uso en telefono real
- mejorar legibilidad, spacing, densidad y CTA sin reescribir arquitectura

No debes hacer:
- cambiar RPCs o reglas de negocio
- redefinir contratos de dominio
- tocar flujo economico salvo feedback visual
- inventar nuevas features fuera del backlog congelado

Prioridad:
1. `home`
2. `library`
3. `market`
4. `profile`
5. `grimoire`
6. `archivist`
7. `anime`

Validacion:
- `npm run mobile:typecheck`
- prueba manual visual de los tabs principales
- si haces cambios amplios en UX, deja una nota corta de deuda restante

Entrega esperada:
- resumen de pantallas tocadas
- mejoras de UX implementadas
- riesgos visuales pendientes
- validacion ejecutada
