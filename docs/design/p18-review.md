# Prompt 18 · fuego lateral y mensajes de descanso

Implementación asistida por Codex: motor canvas propio, disponibilidad/activación
de inclinación, textos calculados del calendario y pruebas. Sin dependencias
nuevas ni imágenes externas. Esta etapa no añade campos persistidos ni cambia
rutinas, series, alimentos, cálculos de entrenamiento o estructura de IndexedDB.

## Fuego y recursos

Un solo canvas se recorta a los márgenes. Las chispas y brasas tienen vida finita,
ascenso, balanceo, encogimiento y apagado; el color pasa por amarillo/naranja,
rojo activo, sangre y rojo oscuro. Sprites de halos precalculados, mezcla aditiva
`lighter`, estelas cortas y calor lento en las bases. Los clics en los laterales
generan ráfagas acotadas, sin recibir ni bloquear eventos desde el canvas.

Completos usa 100 partículas por lado en escritorio, con adaptación a 80 y hasta
120 durante ráfagas. En móvil son 20 en total, con máximo 25. Reducidos usa la
mitad sin ráfagas. Al registrar se limita a 30 dibujos/s, se baja la densidad y se
impiden ráfagas; el resto de tiempo se dibuja con `requestAnimationFrame` hasta
60/s. La pestaña oculta cancela el bucle. Movimiento reducido del sistema deja
solo calor estático. El ajuste Apagados elimina el fuego. Retina acotado a 2×,
1,5× móvil y 2,5 millones de píxeles.

## Inclinación y calendario

La inclinación está apagada al entrar en Hoy. No se ofrece en computador aunque
el navegador exponga la API. En móvil sin permiso obligatorio se confirma con
lecturas finitas antes de ofrecerla; donde es obligatorio el permiso, se solicita
solo tras el botón y se confirma después. Se toleran muestras vacías iniciales y
se oculta el control si pasan tres segundos sin datos válidos. La función siempre
tiene alternativa con cursor/dedo. Las pruebas simulan hardware y permisos; la
compatibilidad física debe comprobarse también en el teléfono de destino.

El próximo entrenamiento se busca desde la fecha consultada usando rutina y
excepciones del calendario. Cruza semanas y bloques largos, deriva el nombre de
la sesión de sus músculos y distingue hoy/mañana/otra fecha. La auditoría de
fuentes deja los nombres literales de días únicamente en la constante `DAYS` del
calendario. Medidas calcula el día del recordatorio desde su fecha; recuperación
usa el texto «Revisión semanal».

## Capturas para revisión humana

Navegadores aislados con datos ficticios:

- [Fuego en escritorio](p18-fire-desktop.png).
- [Descanso de otra fecha, móvil](p18-rest-mobile.png).
- [Inclinación compatible, apagada inicialmente](p18-tilt-mobile.png).

Las pruebas cubren ciclos, repulsión, bordes, topes y conservación de datos;
calendario, cambios del editor, miércoles/domingo, años y rutina vacía; sensor
ausente, permiso denegado/concedido, activación voluntaria, pausa y offline. La
aprobación humana del PR permanece pendiente.

## Verificación final

`npm run build`, 101 pruebas unitarias y 75 pruebas de navegador aprobadas.
`git diff --check` sin errores. Capturas y pruebas con datos ficticios;
sin archivos `.env`, claves ni exportaciones del historial personal.

Medición local en Chromium, 120 cuadros por muestra (no representa un teléfono
físico):

| Escenario | Partículas | Dibujos/s observados | CPU del canvas, mediana / p95 |
|---|---:|---:|---:|
| Escritorio 1920 × 1080, DPR 2 | 200 | 49,2 | 1,5 / 2,1 ms |
| Escritorio, campo de registro activo | 160 | 30,0 | 1,4 / 2,0 ms |
| Móvil emulado 390 × 844, DPR 3 | 20 | 59,0 | 0,4 / 0,8 ms |
| Móvil emulado, campo de registro activo | 16 | 30,0 | 0,4 / 0,8 ms |

El tiempo CPU mide las llamadas de dibujo, no la composición GPU completa.
Se respetan los topes de 2,5 millones de píxeles en escritorio y 1,5× en móvil.
El registro reduce actividad; la frecuencia final depende del dispositivo.
