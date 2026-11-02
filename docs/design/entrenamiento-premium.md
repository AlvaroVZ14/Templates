# Acabado de entrenamiento y resumen

Las tarjetas usan superficie carbón translúcida, borde de 1 px, sombra interior,
esquinas de 16 px y un degradado rojo discreto. El efecto de vidrio se obtiene con
capas de color; no aplica un desenfoque costoso detrás de toda la pantalla.

La silueta anatómica es SVG propio, decorativo y fuera del flujo: no ocupa espacio
ni recibe toques. Se seleccionan vista frontal/posterior y zona roja a partir del
músculo principal del ejercicio, sin modificar su clasificación.

Los cambios de ejercicio y carga dan respuesta inmediata. Sus animaciones usan
solo transform y opacity durante 200 ms, se cancelan al volver a cambiar y se
omiten con prefers-reduced-motion. El carrusel conserva su scroll-snap nativo.
Al completar el plan aparece un sello breve con el número real de series.

«Terminar sesión» abre inmediatamente el resumen y guarda el cierre existente.
El resumen incluye series efectivas, volumen registrado (carga × reps, técnicas
incluidas y previas excluidas), incrementos de carga contra la última sesión y
promedio de descansos medidos. No convierte descansos ausentes en ceros. El botón
«Terminar» vuelve a Hoy y «Revisar ejercicios» permite consultar los registros.
Si falla el cierre se puede reintentar, conservando los datos.

Capturas con registros ficticios:

- [390 px](premium-390.png).
- [1400 px](premium-1400.png).
- [Resumen final](resumen-390.png).

Verificación: build, 2 pruebas unitarias del resumen, 18 pruebas de navegador y
3 comprobaciones finales de cierre, interacción y apertura offline a 360 px.
Incluye anatomía de cuádriceps/glúteos, datos sin modificar, movimiento reducido,
steppers, registro optimista, técnicas, temporizador y conservación del historial.

Medición local con Chromium y viewport de 390 px: 8 ajustes de peso dieron un
máximo de **19 ms** y 17 confirmaciones de serie un máximo de **46 ms**, desde el
evento click hasta el siguiente requestAnimationFrame tras actualizar el DOM.
Son estimaciones de respuesta visual con datos ficticios, sin CPU ralentizada;
no certifican todos los toques por debajo de 100 ms en un teléfono físico.

Implementación y verificación por Codex, con un único agente.
