# Auditoria de balance del Grimorio

Fecha: 06/05/2026
Autor: Jarvis

## Objetivo

Revisar todas las magias del Grimorio y aplicar una capa de balance para que las habilidades de Lv1 a Lv5 mantengan progresion, utilidad narrativa y margen de respuesta. La meta es evitar Mano Negra, instakill gratuito, invulnerabilidad permanente, control mental absoluto o destruccion masiva sin aviso.

## Regla de escala

Lv1 es una tecnica inicial: lectura, ventaja corta, utilidad o dano menor.

Lv2 permite presion real: requiere posicionamiento, preparacion visible o una condicion previa.

Lv3 cambia una escena: conserva coste fisico, mental o una ventana clara de respuesta.

Lv4 es decisivo: exige concentracion, anclaje, recurso caro o una desventaja inmediata.

Lv5 es pinaculo narrativo: puede definir una escena, pero necesita aviso, coste severo y resolucion con margen para jugadores, jefes o defensas preparadas.

## Reworks fuertes aplicados

Se rebalancearon habilidades con riesgo de romper rol o combate:

- Bestias Divinas: Manifestacion del Primordial, Juicio de la Bestia y Resurreccion por Sacrificio Divino.
- Invocacion de Sombras: Reino de la Penumbra y Transformacion en Sombra Pura.
- Naturaleza y Heroicos: Jardin del Fin del Mundo, Avatar del Bosque e Intervencion del Mito.
- Hemomancia: Exanguinacion Total, Cuerpo Hemo-Inmortal y Mar Rojo.
- Metal, Plasma y Sonido: Fundicion Absoluta, Desintegracion Atomica, Cataclismo Sonico y Cero Sonico.
- Transmutacion y Pociones: Fision Atomica Controlada y Gas de Nervios Cero Absoluto.
- Homunculos y Tulpa: Homunculo Perfecto y Quimera de Carne Eterna.
- Tiempo: Estasis Cinetica, Camara de Evento Eterno y Condena del Segundo Eterno.
- Espacio y Dimensiones: Exilio Dimensional, Arsenal Infinito y Compresion del Punto Cero.
- Gravedad: Shinra Tensei Cataclismo y Chibaku Tensei Nucleo de Captura.
- Control Mental: Esclavitud Permanente y Conversion de Masas.
- Runas: Guardian Eterno, Inmunidad Transitoria, Descomposicion, Asfixia, Forja del Mito y Teclado de Dios.
- Divina, Luz, Demoniaca, Acido y Vacio: resurrecciones, invulnerabilidades, muerte instantanea y borrado existencial fueron convertidos en efectos condicionados.

## Correccion global

Ademas de los reworks concretos, se normalizan frases peligrosas como:

- "muerte instantanea"
- "defensa absoluta"
- "invulnerabilidad total"
- "cualquier objetivo"
- "sin limites de distancia"
- "exito automatico"

Estas frases pasan a versiones condicionadas, con coste y respuesta.

## Resultado esperado

El Grimorio conserva fantasia alta, pero cada poder vuelve a tener friccion narrativa:

- el usuario debe preparar, marcar, sostener o pagar un coste;
- el objetivo conserva una respuesta razonable;
- el master puede arbitrar sin que la descripcion lo obligue a aceptar victorias automaticas;
- los niveles altos siguen siendo espectaculares sin romper el sistema.

## Nota tecnica

La correccion se aplica mediante `src/utils/magicBalance.ts`, integrado en `fetchGrimoireContent` y `fetchAdminMagicStyles`. Esto permite balancear tanto el contenido local como el contenido administrado desde Supabase sin borrar el material original.
