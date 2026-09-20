# Auditoría responsive — 20 de septiembre de 2026

## Hallazgos y correcciones

- El visor de mapas estaba dentro de un ancestro animado: su borde superior quedaba a 1224 px en una ventana de 749 px de alto. Ahora se monta en `document.body`, limita su altura al viewport y desplaza solo la imagen. El margen vertical reserva espacio para su desplazamiento animado de 18 px, también en ventanas bajas. Conserva las animaciones e incorpora foco inicial, ciclo de Tab, Escape, retorno del foco y bloqueo del scroll de fondo.
- A 360 px se recortaban «Sin perfil conectado» y la pestaña «Flora». El texto del perfil permite varias líneas; las pestañas reparten el ancho disponible y apilan icono y etiqueta en pantallas estrechas.
- En el perfil conectado, el acceso anime se superponía a «Panel». El espacio reservado depende del número de controles; en móvil, «Panel» ocupa una segunda fila.
- Durante la entrada animada, botones y leyendas de las portadas podían solaparse. El espacio inferior de la portada admite también el desplazamiento de entrada.
- La descripción de «El asedio de los reinos» quedaba demasiado estrecha junto al icono en móvil. Ahora ocupa todo el ancho de la tarjeta.
- Se añadieron transiciones de desplazamiento a los botones de portada y respuestas de pulsación, elevación y brillo a las pestañas. Se mantiene la escala de escritorio de 0.94 y el tamaño de la barra lateral.

## Comprobación reproducible

Con Vite en `http://127.0.0.1:5173` y un Chrome de prueba con depuración remota:

```powershell
python scripts/check-realm-layout.py --cdp-port 9333 --width 360 --width 700 --width 1358 --width 1920 --local-grimoire
```

El script comprueba las seis secciones, recortes, desbordamientos, separación de la barra lateral, animación de portada, modal de mapa y teclado. Comprueba también el perfil conectado a 360 y 1358 px. `--screenshots` guarda capturas adicionales; `--height` permite comprobar ventanas bajas.

El Grimorio usa datos locales de prueba porque su carga remota no terminó de forma consistente durante la inspección. El perfil conectado también se simula en el navegador aislado, bloqueando las escrituras remotas. Esta comprobación valida presentación y distribución, no autenticación, economía ni disponibilidad de Supabase. No se modifican datos remotos ni se añaden dependencias a la aplicación.

Resultados y capturas: `artifacts/realm-ui/layout-audit/`.

## Resultado de navegador

- Las seis secciones pasaron sin recortes ni superposiciones detectados a 360 × 844, 700 × 844, 1358 × 900 y 1920 × 900. Perfil conectado correcto a 360 y 1358 px; mapa y recorrido de teclado correctos en los cuatro tamaños. Evidencia: `verification-matrix.json`.
- La comprobación adicional a 844 × 390 pasó en las seis secciones y en el visor de mapa tras ampliar su margen vertical. Evidencia: `verification-short-window.json`.
- Capturas inspeccionadas de Inicio, Grimorio, Mercado y mapa en móvil, y Grimorio y mapa en escritorio. `map-loaded-360.jpg` comprueba la imagen real cargada; las primeras capturas de mapa se tomaron antes de terminar su carga.
- Validación final: `npx tsc --noEmit` y `npm run build` terminados con código 0. Build de 2257 módulos en 1 min 20 s; `git diff --check` sin errores.
