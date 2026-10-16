# Prompt 16 · efectos propios

Implementación asistida por Codex: motor de partículas canvas, escenario CSS/React,
pruebas y documentación. Se reutiliza la portada local del Prompt 15; esta etapa no
genera ni descarga imágenes ni añade dependencias. No modifica reglas de cargas,
series, recuperación, navegación, formato de sesiones ni versión de IndexedDB.

## Comportamiento

- Canvas fijo decorativo detrás del contenido, sin recibir eventos. Sprites de
  brillo reutilizados, repulsión suave y hasta cuatro ondas simultáneas.
- 80/40 partículas en escritorio/móvil; reduce a 60/30 tras fotogramas lentos
  sostenidos. Retina acotado a 2×/1,5× y un máximo de 2,5 millones de píxeles.
- Humo, silueta y haces en capas distintas; foco radial sobre el punto señalado.
  La pulsación mantenida escala un 3 %, activa vibración visual y latido del
  marcador. Soltar produce un pulso. El toque corto elige una frase contextual
  del banco local y la oculta tras 2,8 segundos. Espacio/Enter/Escape permiten
  usarlo con teclado.
- En móvil el gesto vertical cancela la tensión y conserva el scroll. No se
  capturan punteros ni se cancela el desplazamiento. El foco y el parallax
  funcionan sin sensor. La orientación solo se solicita desde el botón cuando
  la API requiere permiso; se toleran ausencia, rechazo y error del sensor.
- `requestAnimationFrame`, escuchas de orientación y temporizadores se limpian
  al salir; al ocultar la pestaña se pausa la animación. Completos, Reducidos y
  Apagados se guardan dentro de los ajustes de apariencia existentes. La
  preferencia de movimiento reducido del sistema tiene prioridad.
- Las partículas se atenúan en Hoy y al enfocar campos de registro. Se mantienen
  offline la imagen, las frases y los efectos, sin peticiones a APIs externas.

## Evidencia para revisión humana

Capturas generadas con Playwright en una base aislada, sin datos personales:

- [Hoy móvil, tensión mantenida](p16-shadow-mobile.png).
- [Hoy escritorio, sin conexión](p16-shadow-desktop.png).

La revisión automatizada comprueba las interacciones y el diseño de Hoy a
320/390/768/1440 px, más la navegación existente en todos esos anchos. Las pruebas
de sensores simulan la API; la fluidez y los permisos reales deben comprobarse
también en el teléfono de destino. No se garantiza una tasa fija de fotogramas
para todos los dispositivos. Revisión y aprobación humana del PR pendientes.

Verificación de esta entrega: compilación de producción correcta, 89 pruebas
unitarias, 61 pruebas de regresión de navegador y 5 pruebas nuevas de efectos.
En Chromium local, tras cargar imagen/fuentes y 700 ms de estabilización, una
muestra de 120 fotogramas dio unos 60 fps tanto a 1440 × 900 (DPR 2) como a
390 × 844 (DPR 3, emulación táctil). El percentil 95 del intervalo fue 17 ms y
el del dibujo del canvas, 1 ms en ambos casos. Es una medición de este equipo,
sin limitación artificial de CPU; no equivale a una prueba en hardware móvil.
