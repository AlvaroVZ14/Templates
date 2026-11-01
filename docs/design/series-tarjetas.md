# Tarjetas de series

Solo cambia la presentación y la elección inicial de carga en la pantalla de
entrenamiento. La progresión, las funciones de registro y el almacenamiento
siguen siendo los existentes.

- Cada serie tiene una tarjeta S1, S2…; las etiquetas TOP, BACK-OFF, DROP y RP
  aparecen cuando corresponden. No se repite «Efectiva».
- En escritorio las series caben en una fila; en celular se distribuyen en dos
  columnas. Peso y reps son botones grandes y el ✓ es circular, de 48 px.
- La siguiente serie lleva borde rojo y brillo suave. Las anteriores se atenúan
  y muestran ✓ verde apagado. Las pendientes se mantienen grises.
- Peso y reps abren un stepper; el teclado solo se abre al pedirlo. Sin historial
  se muestra —: hay que elegir carga antes de confirmar. Si ya existe un peso de
  trabajo configurado, se puede aceptar dentro del stepper sin escribirlo.
- Debajo queda una línea de rango, RIR y sugerencia de hoy. La última marca y las
  reglas siguen disponibles en ⓘ y en el panel derecho de escritorio.
- El recordatorio de seguridad abre un popover con ⓘ, cerrable con Escape o
  tocando fuera. Se conserva la opción de ocultarlo por ejercicio.
- El check tiene un pulso de anillo de 200 ms; se mantiene la vibración de 20 ms
  y la animación de los segmentos. Movimiento reducido elimina el pulso.
- Drop y RP conservan sus mini-registros dentro de la última tarjeta y no suman
  series efectivas. Se mantienen borradores, autoguardado y recuperación offline.

Capturas con datos ficticios: [390 px](series-390.png) y [1400 px](series-1400.png).

Pruebas: registro y reversión ante fallo, steppers, técnicas, progresión, vibración,
filas memoizadas, seguridad persistente, vacío sin historial, cinco tarjetas en
escritorio, dos columnas en celular y recarga offline.

Resultado: build correcto, suite completa de 72 pruebas aprobada y 6
comprobaciones adicionales aprobadas sobre el ajuste final de tamaño y forma.

Trabajo realizado por Codex con un único agente.
