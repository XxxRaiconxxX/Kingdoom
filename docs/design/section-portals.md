# Portadas y paleta del reino

Base global: negro `#000000`, carbón y oro `#F5C542`. Los colores de rareza y los estados funcionales conservan su significado.

| Sección | Acento ambiental |
| --- | --- |
| Inicio | Oro `#F5C542` |
| Grimorio | Lavanda `#C39BFF` |
| Mercado | Ámbar `#FFB65C` |
| Biblioteca | Azul hielo `#7BC7F6` |
| Archivista | Jade `#6BE0C8` |
| Anime | Sakura `#FF8EC3`, detalles cian |

La navegación y el acceso mantienen negro y contorno dorado. El acento cambia en la iluminación, iconos, divisores y portadas. La transición de color dura 800 ms; las entradas escalonadas, 650–850 ms. Las portadas añaden movimiento de imagen, partículas, anillos y luz; Anime añade pétalos y un icono SVG kitsune original. Se conservan las animaciones anteriores y la preferencia de movimiento reducido del sistema.

## Imágenes

Generadas con la herramienta integrada `imagegen`, revisadas y convertidas a WebP de calidad 86, sin cambiar su resolución de 1536 × 1024. Se guardan en `public/img/realm-market.webp`, `public/img/realm-grimoire.webp` y `public/img/realm-anime.webp`.

## Prompts finales

### market

Use case: stylized-concept. Asset type: wide website hero background, landscape 1536x1024. Create a lavish dark fantasy medieval night market in Kingdoom, an ornate vaulted bazaar, antique gold lanterns, a merchant stall with swords, treasure chest, coins and rare relics, smoky depth, cinematic painterly detail. Black charcoal and luminous amber gold, some copper. Composition: richly detailed focal subject on right half, darker quiet space on left for HTML heading overlay. No text, no lettering, no watermarks. Premium RPG concept art, deep contrast, not a UI mockup.

### grimoire

Use case: stylized-concept. Asset type: wide website hero background landscape 1536x1024. Create a dark fantasy arcane sanctuary for Kingdoom: an ancient open gilded grimoire levitating above a black stone pedestal, luminous violet and lavender magical ribbons and fine golden celestial rings, towering shadowed library arches and candles. Cinematic highly detailed painted concept art. Black charcoal with violet magic and gold accents. Place the book and luminous magic on right half, quiet dark space on left for HTML text overlay. No text, no legible writing, no watermarks, not a UI mockup.

### anime

Use case: illustration-story. Asset type: wide anime portal website hero background landscape 1536x1024. Original polished anime key visual, a silver-haired adult fantasy traveler with flowing black cloak and gold trim, looking back over their shoulder, dramatic expressive anime eyes, on a rooftop above a Japanese fantasy city at night. Pink sakura petals, cyan moon rim light, hot pink sky streaks, golden stars, atmospheric architecture. Dynamic clean ink linework and gorgeous cel shading, cinematic diagonal composition. Character on right half, left half dark open sky reserved for HTML title overlay. Black, cherry pink, cyan with golden accents. No text, no symbols pretending to be writing, no watermarks. Not a UI mockup.

## Verificación reproducible

`python scripts/check-realm-portals.py --browser <agent-browser executable>` comprueba seis acentos distintos, negro y oro del acceso, carga de las imágenes, animaciones activas, ausencia de desbordamiento a 390 y 1440 px, apertura/cierre del acceso y preferencia de movimiento reducido. Guarda capturas en `artifacts/realm-ui/`.
