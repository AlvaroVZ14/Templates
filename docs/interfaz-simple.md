# Inicio y entrenamiento simplificados

El inicio tiene cuatro elementos: día y sesión de hoy, minutos de cardio, botón
**EMPEZAR ENTRENAMIENTO** y barra fina de sesiones semanales completadas/planeadas.
Con la rutina PPL actual, el objetivo es cinco. Si cambias tu calendario, la barra
respeta el nuevo plan; no cuenta preparaciones ni extensiones como sesiones.
En descanso muestra 0 min cuando corresponde y el botón queda desactivado.
La fecha se actualiza con el día civil de Chile, sin mover un entrenamiento abierto.

El botón inicia la sesión y Wake Lock cuando está disponible. Si hay una sesión
abierta, la recupera, también tras recargar offline. Una sesión terminada se puede
consultar sin sobrescribir sus series. Solo un ejercicio aparece desplegado; toca
el nombre de otro para abrirlo. Cada encabezado mantiene su avance, por ejemplo
3/4. El cronómetro sigue siendo una franja discreta durante el entrenamiento.
Las filas y borradores conservan pesos, reps, Drop, RP, sensación, seguridad y
progresión. Cerrar un ejercicio no destruye su formulario.

## Cajón

- **Ir a otra sesión:** Hoy, abrir la sesión seleccionada, calendario semanal,
  fecha libre, anterior/siguiente y comparación con la semana pasada.
- **Historial y progreso:** tres indicadores existentes; volumen semanal y
  revisiones mensuales. Despliega Historial de sesiones para detalles y decisiones.
- **Check mensual:** medidas, fotos locales, comparación y recordatorio existentes.
- **Comida y sueño:** Comida; Sueño y diario; Cardio y recuperación. Esta última
  conserva cardio detallado, fases, notas/duración, calendario, descarga, plan de
  comidas, pasos y recuperación. Usa la sesión seleccionada para su fecha.
- **Medidas** y **Método:** conservan sus funciones y prioridades Classic Physique.
- **Ajustes:** configuración de la app, pesos iniciales, rutina y zonas con molestias.
  Persisten los respaldos, actualización de PWA, instalación y efectos visuales.

El menú respeta el lado elegido, toque exterior, Atrás y gestos desde el borde.
Los cambios pendientes siguen avisando antes de salir. No hay barra inferior ni
espacio reservado para ella en el inicio; solo se respetan las áreas del sistema.

## Estilo y datos

Carbón #0B0B0D, paneles #16161A, rojo #E10600 → #FF3B1F, blanco #F2F0EB y gris
cálido #ADA8A2. Títulos condensados autoalojados; números legibles y grandes.
Verde apagado reservado a la confirmación de series; sin acentos amarillos.
Brasas y laterales tenues; en entrenamiento se desmontan los canvas/efectos, sin
animación ni parallax. Se restablece la preferencia al salir; la preferencia guardada
no se modifica. El inicio reduce el presupuesto de partículas; modo reducido y
prefers-reduced-motion siguen teniendo prioridad.

No cambia el esquema de IndexedDB, los datos históricos, la rutina, las técnicas
ni los cálculos de progresión, nutrición o cardio. El cambio de inicio de sesión
guarda su hora al tocar Empezar, para medir la duración real desde ese momento.

## Verificación

`npm test`, `npm run build`, `npm run test:e2e`. Las pruebas existentes se adaptan
a las ubicaciones nuevas mediante los controles visibles del cajón; no se eliminan
ni se archivan escenarios. Los nuevos casos comprueban los cuatro elementos,
descanso/medianoche, paleta, ausencia de barra inferior, un solo ejercicio abierto,
persistencia offline, ausencia de efectos al entrenar y acceso a todas las secciones.
Las imágenes de prueba y capturas emplean únicamente datos ficticios.

Resultado de esta etapa: 174 pruebas unitarias aprobadas, compilación correcta y
58 escenarios distintos de navegador comprobados. Tras ajustar los accesos, los
41 casos de módulos afectados pasaron 41/41; los otros 17 ya estaban aprobados.
El último ajuste de cabecera se verificó de nuevo con 12/12 casos de inicio y
registro. Capturas móviles revisadas a 390 px; anchos 320/390/1440 comprobados.
Se mantiene el aviso preexistente de bundle superior a 500 kB.

Implementación y comprobaciones asistidas por Codex. Revisión humana del PR pendiente.
