# Registro rápido de pesos

Interfaz de Hoy, actualizada el 01/11/2026. Las demás secciones y los registros históricos se conservan. No hay migración ni borrado de datos.

- Cada ejercicio muestra todas sus efectivas, una por fila de 44 px, con rol, peso, reps y ✓. Las series se confirman en orden dentro del ejercicio; puedes alternar ejercicios.
- Se recupera la última sesión anterior del mismo ejercicio y equipo, con los valores de cada serie. Los valores propuestos se ven en gris. Sin historial se usa la referencia disponible; si falta, toca el peso para introducirlo. Una serie ligera no hereda automáticamente una carga pesada.
- Tocar un número abre un stepper: ±2,5 kg o ±1 rep. «Teclado» permite escritura manual y «Listo», Escape o tocar fuera cierra el control. Las ediciones pendientes sobreviven a navegación y recarga como borradores.
- ✓ confirma la efectiva sin pedir RPE, fallo ni descanso. RPE y fallo quedan sin dato, no se inventan. Las reglas que exigen conocer el esfuerzo siguen usando los registros donde ese dato exista.
- No se ofrecen controles de calentamiento ni aproximación. En compuestos pesados aparece únicamente: «Calentamiento: 1–2 progresivas + 1 de ajuste (no se registra)». Los registros antiguos de preparación siguen en Historial y en los respaldos.
- Drop/RP se activa en la última fila. Una mini-línea contiene las caídas o reps de RP; el mismo ✓ guarda la efectiva y sus extensiones en una transacción. Un fallo revierte el conjunto y permite reintentar. Las extensiones conservan sus registros vinculados y no suman volumen.
- Drop propone −30% por caída, con el redondeo del equipo y edición opcional. RP mantiene el peso y recupera las reps anteriores de sus mini-series, o propone 4 si no existen. Se respetan el número de caídas/mini-series y la descarga. En dominadas, bajar el lastre no reduce el peso corporal.
- Al confirmar, una barra inferior fina muestra el descanso del ejercicio (por defecto 150 s en compuestos y 105 s en aislamientos del plan PPL; ajustes por ejercicio conservados). Vibra al terminar y respeta el sonido opcional existente. Se guarda automáticamente el tiempo entre confirmaciones en la serie anterior, identificado como `restMeasurement: 'between-confirmations'`. Es una **estimación**: sin un gesto de inicio de serie no se puede separar descanso y ejecución. La última serie queda sin descanso posterior medido; no se rellena con el tiempo prescrito.
- La primera efectiva de hoy activa el modo gimnasio y Wake Lock cuando está disponible. Al completar el plan aparece un único botón «Terminar sesión»; cierra y guarda sin otro formulario. Duración automática desde la primera confirmación; las marcas previas se conservan.
- Cardio, fase, notas y recuperación continúan en «Cardio y opciones del día». Dolor y avisos de seguridad siguen disponibles. El menú lateral continúa como única navegación.

## Comprobar en el celular

1. Abre una sesión con historial: confirma ✓ y comprueba peso y reps repetidos, con la fila marcada.
2. Toca el peso: suma/resta sin teclado. Usa «Teclado» solo si quieres escribir. Recarga antes de confirmar para verificar el borrador.
3. En la última fila de aperturas, toca Drop: con 100 kg propone 70 kg. Introduce las reps y confirma. No aparece otra fila efectiva. RP muestra sus mini-series dentro de esa misma fila.
4. Confirma dos series separadas por un descanso: la barra se reinicia y el historial conserva la estimación automática en la anterior. Recarga offline para comprobar persistencia.
5. Tras las 17 efectivas, toca «Terminar sesión»: aparece la confirmación de guardado y se libera Wake Lock.

## Verificación y alcance

Pruebas de lógica en `tests/quick-registration.test.js` y navegador en `tests/browser/fast-registration.spec.js`. Las suites activas de datos, PWA, nutrición y otras secciones se adaptan al nuevo registro. Los escenarios de la interfaz retirada se conservan como referencia en `tests/legacy-registration-ui`; no se contabilizan como casos aprobados del registro nuevo. No se afirma que las 111 pruebas de la interfaz anterior sigan siendo la suite actual.

La comprobación usa Chromium y dimensiones móviles simuladas, sin acceder a datos personales del navegador. Codex realizó la implementación y verificación; la revisión humana del PR queda pendiente.

Resultados: `npm test` 157/157; `npm run test:e2e` 50/50 en 4,2 minutos; compilación correcta. Tras corregir únicamente el ajuste CSS del título se repitió el escenario de dimensiones: 1/1 aprobado a 320, 390 y 1440 px, con captura móvil revisada. El JavaScript principal queda en 520,82 kB (160,81 kB gzip); persiste el aviso de Vite por fragmento mayor de 500 kB. `git diff --check` correcto. No se modifican dependencias, esquema de IndexedDB ni workflow.
