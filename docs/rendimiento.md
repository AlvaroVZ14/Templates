# Rendimiento móvil y guardado inmediato

## Cambios

- El ✓ se refleja en memoria antes de escribir en IndexedDB. Una cola ordenada
  guarda las series en un worker del propio dispositivo, sin peticiones de red.
  Solo proyecta la sesión afectada; no reescribe los demás meses ni las fotos.
- Una copia pequeña de operaciones pendientes en localStorage cubre un cierre
  durante el guardado. Los identificadores deterministas permiten recuperar sin
  duplicar series. IndexedDB sigue siendo la fuente permanente. Si falla una
  escritura se revierten las confirmaciones pendientes, se conservan los números
  y aparece un error para reintentar. Sin Worker se utiliza el mismo guardado local.
- Las filas y tarjetas están memoizadas: confirmar actualiza la fila y habilita
  la siguiente, sin repintar los otros ejercicios. Los borradores y la selección
  del ejercicio tampoco vuelven a proyectar todo el historial.
- El inicio lee el estado sin reescribirlo cuando no hay una migración o cambio
  pendiente. Se prepara la configuración de la sesión de hoy en tiempo ocioso.
  Las pantallas secundarias se cargan al necesitarlas; el service worker incluye
  todos sus módulos, el worker y las fuentes en la caché offline.
- Navegar a la raíz de la PWA utiliza el HTML en caché. Las nuevas versiones
  siguen esperando la actualización explícita; antes de actualizar o terminar se
  vacían la cola y los borradores. No se cambia la versión ni el formato de la DB.
- Transiciones de 160 ms limitadas a transform/opacity; sin animaciones CSS
  costosas de filtros, sombras, tamaño o posición. Con movimiento reducido se
  desactivan. El descanso usa scaleX en su barra y conserva espacio fijo.
  Las fuentes autoalojadas usan font-display: optional para evitar cambios tardíos
  de geometría; si no llegan a tiempo en la primera visita se usa la alternativa
  local hasta una apertura posterior. Permanecen disponibles offline.
- Vibración de 20 ms al confirmar y aviso corto al acabar el descanso; ambas
  opcionales según el navegador. Se mantiene Wake Lock durante el entrenamiento.
- El canvas mantiene su presupuesto acotado, tope retina y pausa con pestaña
  oculta. En Hoy es reducido; durante el registro se apaga. Las fotos del check y
  las imágenes tienen carga diferida; la comparación lee fotos de IndexedDB al
  aproximarse al área visible. Las fotos nunca entran en localStorage ni se envían.

## Medición reproducible

Chromium 156.0.8078.4, ventana móvil 390 × 844, DPR 2, CPU ralentizada 4×,
red simulada de 1,6 Mbps y 40 ms. Base ficticia con 130 sesiones y 2210 efectivas.
Son mediciones en un computador con emulación, **no en un celular físico** ni
resultados de Lighthouse. El servidor local de preview no representa exactamente
la compresión, latencia ni hardware de GitHub Pages y del teléfono.

Apertura: desde navegación hasta el botón de inicio visible y dos frames.
Respuesta: desde el evento click hasta el siguiente frame tras confirmar la
clase visual del ✓; no es una medición de INP ni de latencia táctil física.
Cinco aperturas con caché, cinco offline y 17 confirmaciones. La primera visita
tiene una sola muestra e incluye la migración de la base ficticia desde v1.

| Medida | Antes | Después |
|---|---:|---:|
| Primera visita, una muestra | 3466 ms | 3946 ms |
| Apertura con caché, mediana / p95 | 1076 / 1266 ms | 682 / 708 ms |
| Apertura offline, mediana / p95 | 1082 / 1131 ms | 681 / 773 ms |
| Confirmación, mediana / p95 | 761 / 845 ms | 61 / 144 ms |
| Intervalo entre frames, mediana / p95 | 16,7 / 450,3 ms | 16,7 / 49,7 ms |
| Peor intervalo entre frames | 533,3 ms | 150,1 ms |
| Frames de más de 20 ms durante la sesión | 126 de 466 | 24 de 343 |
| CLS observado | 0,4793 | 0 |

La apertura habitual mejora aproximadamente 37 % y la respuesta del ✓, 92 %.
El archivo principal JS pasa de 548,10 kB a 337,48 kB (168,34 a 106,41 kB gzip).
Hay módulos compartidos: el conjunto inicial es aproximadamente 145 kB gzip;
la reducción del 37 % del archivo principal no equivale a esa reducción de todas
las descargas iniciales.

**Límites pendientes:** no hay 60 fps constantes en la CPU simulada 4×. Quedan
pausas al abrir/cambiar ejercicios y confirmar, con p95 de frames cercano a
50 ms y máximo de 150 ms; se observaron tareas largas de hasta 151 ms. El canvas
reducido dibuja a 30 fps intencionalmente para ahorrar batería; está apagado en
el entrenamiento. La primera visita fue 480 ms más lenta en esta única muestra:
la descarga inicial y la migración siguen siendo un coste pendiente. No se
presenta esa primera visita como una mejora ni se garantiza rendimiento de un
modelo de teléfono que no se haya probado.

Datos crudos: [rendimiento-mediciones.json](rendimiento-mediciones.json).

Para repetir, en dos terminales desde la carpeta del repositorio:

```powershell
npm run build
npm run preview -- --port 4175 --strictPort
```

```powershell
node scripts/measure-performance.mjs after
```

El script usa un perfil aislado y datos ficticios; no lee el navegador personal.
Escribe el resultado en test-results/performance-after.json, ignorado por Git.

## Verificación

179 pruebas unitarias correctas. 61 escenarios de navegador verificados: 56
pasaron en la ejecución general y cuatro afectados por las nuevas cargas
diferidas pasaron al corregir las esperas de las pruebas; se añadió además el
caso sin Worker. Una última ejecución de cuatro casos críticos confirmó también
el movimiento reducido, offline, descanso, recuperación y renderizado por fila.
Build de producción correcto.

En el celular: actualizar desde Ajustes, abrir una vez conectado y después en
modo avión. Empezar, confirmar varias series, cerrar y abrir para comprobar que
siguen registradas. Al finalizar el descanso debe vibrar si el dispositivo lo
permite; la pantalla se mantiene encendida cuando concede Wake Lock. Durante el
registro no debe haber partículas. Comprobar además las fotos en Check mensual
y la preferencia del sistema de reducir movimiento.
