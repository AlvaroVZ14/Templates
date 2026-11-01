# Temporizador de descanso

La barra anterior mezclaba altura fija y ocultación del texto secundario.
El nuevo componente utiliza altura adaptable y nombres que pueden ocupar varias
líneas, con estilos propios para evitar esas reglas heredadas.

- En celular aparece al comenzar el descanso: píldora centrada, separación de
  12 px más safe-area inferior y márgenes laterales seguros. No aparece en reposo.
- En escritorio permanece dentro del panel derecho.
- El anillo muestra el tiempo, el tipo de descanso y el ejercicio que lo originó.
  Cambiar de ejercicio no reinicia ni renombra el descanso anterior.
- −15 s y +15 s ajustan la cuenta atrás persistida. Saltar la oculta.
- Se conserva el reloj independiente del descanso real: sigue midiéndose entre
  confirmaciones, incluso al ajustar o saltar la cuenta atrás.
- Al terminar vibra una vez durante 80 ms; el anillo queda verde apagado y pulsa
  brevemente. Movimiento reducido desactiva ese pulso. El sonido opcional sigue
  usando el ajuste existente.

Verificación: build, 3 pruebas unitarias y 17 pruebas de navegador. Incluye ±15,
fin sin avisos duplicados, continuidad entre ejercicios, descanso real guardado,
recarga offline y texto largo sin recorte a 320/390 px, horizontal y escritorio.
Los perfiles y registros utilizados son ficticios.

[Captura a 390 px](descanso-390.png) · [Captura a 1400 px](descanso-1400.png).

Implementación y comprobación asistidas por Codex, sin subagentes.
