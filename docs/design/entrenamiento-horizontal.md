# Entrenamiento horizontal

El cambio afecta la presentación de la pantalla de entrenamiento de Olympia.
No modifica las funciones de registro, progresión, rutina, migración o volumen.

- En celular se muestra una tarjeta por ejercicio. El desplazamiento horizontal
  nativo usa scroll-snap; también hay flechas y siete selectores numerados.
- La barra superior tiene un segmento por serie efectiva configurada. Drop y
  rest-pause mantienen su comportamiento dentro de la última serie.
- Los selectores muestran el ejercicio actual en rojo y los terminados con ✓
  verde apagado. Los paneles fuera de vista no reciben foco ni interacción.
- Desde 1000 px hay riel de ejercicios, tarjeta central y panel lateral con el
  mismo temporizador de descanso, última marca y sugerencia calculada existente.
- El registro ahora usa [tarjetas de series](series-tarjetas.md), conservando
  controles, borradores, selección recuperable,
  autoguardado optimista, vibración, sonido opcional y Wake Lock.
- Sin movimiento reducido, las flechas desplazan suavemente el carrusel. Con
  prefers-reduced-motion el desplazamiento es inmediato.

Capturas de navegador con registros ficticios, sin datos personales:

- [Celular: 390 × 844](entrenamiento-390.png).
- [Escritorio: 1400 × 900](entrenamiento-1400.png).

Verificación: build correcto y **70 pruebas de navegador aprobadas** en 5,3 minutos;
pruebas nuevas de gesto táctil nativo,
flechas/selectores, borrador al cambiar de tarjeta, segmentos completados,
recarga offline, riel de escritorio, referencias y cambio de tamaño.
La auditoría existente sigue comprobando 7 ejercicios/17 series en los 5 días.

Implementación y comprobación asistidas por Codex, usando un único agente.
