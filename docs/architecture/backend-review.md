# Revisión de persistencia y backend local

Fecha: 31 de octubre de 2026, America/Santiago. Base revisada: `3ce7a5c`, rama `templates/inicio`.

## Alcance y arquitectura real

La app no tiene backend de servidor. React ejecuta la lógica y conserva los datos en IndexedDB, bajo el origen del navegador. GitHub Pages sirve los archivos de la PWA; instalarla en otro dispositivo no sincroniza registros. Esta revisión inspecciona código y pruebas existentes; no ejecuta pruebas ni compilaciones y no modifica lógica, datos ni esquema. La ejecución corresponde al agente de testing.

`src/db.js` define la base `heavy-duty-personal`, versión 2. Los almacenes son `app`, `sessions`, `cardio`, `journal`, `measurements`, `phases`, `sessionRevisions` y `migrationBackups`. Las sesiones contienen ejercicios y series con su copia de origen; tienen índices por fecha, mes, año, ejercicio y día de rutina. Las demás colecciones principales tienen índices por fecha y mes (`src/db.js:5`, `src/db.js:9`).

El estado de dominio se transforma mediante `projectCollections` y `hydrateCollections` (`src/history.js:7`, `src/history.js:30`). `app/state` conserva configuración, rutina, perfiles y otros datos de dominio; también conserva copias de varias colecciones. Por tanto, el formato actual combina una instantánea de estado y colecciones consultables, en vez de ser una base completamente normalizada.

## Garantías observadas en el código

- La migración de IndexedDB 1 a 2 ocurre en la transacción de actualización: conserva el estado original, crea las colecciones y verifica su reconstrucción antes de completar. Si la transformación falla, aborta (`src/db.js:22`, `src/db.js:27`). `verifyProjection` compara contenidos, no solo contadores (`src/history.js:38`).
- `updateState` lee y escribe dentro de la misma transacción `readwrite`; devuelve el resultado al completarse, no al encolar un `put` (`src/db.js:59`). Se conservan revisiones de sesiones modificadas; no hay caducidad automática en esta capa (`src/db.js:54`).
- La importación valida formato, versiones, claves, estructura y valores antes de abrir la transacción de escritura (`src/backup.js:14`, `src/backup.js:53`, `src/db.js:80`). Combinar prioriza los valores locales en colisiones y religa ejercicios equivalentes entre instalaciones. Reemplazar y combinar archivan el estado anterior y el origen recibido; un fallo aborta toda la operación (`src/db.js:89`).
- Los borradores usan escritura diferida en IndexedDB y una copia síncrona de recuperación en `localStorage`; al actualizar la PWA se espera el vaciado de borradores (`src/drafts.jsx:8`, `src/App.jsx:180`).
- La persistencia se solicita mediante la API del navegador y se informa si no se concede (`src/storage.js:1`, reexportada por `src/SessionRecord.jsx:4`). Es una medida frente a limpieza automática, no una copia externa.
- Las pruebas existentes incluyen migración con igualdad de datos, reversión por fallo, consulta histórica, exportación y modos de importación en `tests/browser/database-history.spec.js` y `tests/browser/backup-import.spec.js`. Su existencia no se presenta aquí como ejecución satisfactoria.

## Hallazgos priorizados

### B-01 · P2 · El respaldo no espera los borradores pendientes

**Tipo:** riesgo de consistencia identificado por inspección; reproducción de navegador pendiente. No se ha demostrado pérdida de datos en el uso normal.

`src/drafts.jsx:20` retrasa la escritura de borradores 250 ms y mantiene los cambios pendientes en memoria y `localStorage`. `src/BackupButton.jsx:7` llama directamente a `exportBackup`, que únicamente lee IndexedDB (`src/db.js:73`), sin esperar `drafts.flush()`. La navegación normal sí espera ese vaciado (`src/App.jsx:89`), por lo que cambiar desde Hoy hacia Ajustes protege el caso habitual. Sin embargo, Historial muestra tanto la exportación (`src/History.jsx:22`) como un `SessionEditor` con borrador (`src/History.jsx:35`, `src/SessionRecord.jsx:8`): una edición y exportación dentro de esa misma pantalla no pasan por la navegación. Existe una ventana antes de confirmarse la escritura en la que el JSON podría no incluir el último borrador visible. El dato no se pierde por exportar: continúa en el dispositivo de origen. El riesgo aparece al usar ese JSON para trasladar o recuperar todo el trabajo.

**Acción propuesta:** pasar al control de exportación una función previa que espere el vaciado de borradores. Ante un fallo, no afirmar que la copia contiene el borrador actual y permitir reintentar. Mantener la transacción de lectura consistente de `exportBackup`.

**Comprobación propuesta:** con datos ficticios, abrir una sesión en Historial, editar sus notas o duración y exportar en esa misma pantalla antes de vencer el debounce; importar el JSON en un contexto nuevo y comprobar el borrador exacto. Controlar el reloj o la escritura en la prueba para que la ventana no dependa de la velocidad del operador. Añadir también un fallo de vaciado para verificar que el usuario recibe un resultado explícito, y verificar que navegar normalmente antes de exportar ya conserva el borrador. No requiere cambiar la versión de IndexedDB.

### B-02 · P2 · Cada escritura procesa el historial completo

**Tipo:** riesgo de escalabilidad identificado en código; no se ha medido una ralentización en un teléfono.

`readTransaction` ejecuta `getAll()` sobre todas las colecciones (`src/db.js:42`). `writeState` proyecta y verifica el estado entero, compara cada sesión mediante `previous.find` y vuelve a escribir todas las filas (`src/db.js:52`). La búsqueda repetida introduce trabajo cuadrático respecto al número de sesiones en esa comparación. Esto también sucede al guardar borradores (`src/drafts.jsx:26`), aunque no cambie el entrenamiento histórico. Las revisiones añaden instantáneas de la sesión anterior y las importaciones conservan copias adicionales; el coste y tamaño crecen con el uso.

**Acción propuesta:** primero sustituir la búsqueda repetida por un mapa por ID y medir. Después separar escrituras de configuración/borradores y persistencia de las sesiones modificadas, preservando la atomicidad y la verificación de migración/importación. Conservar el historial solicitado: no resolver el crecimiento borrando registros automáticamente.

**Comprobación propuesta:** medir percentiles de tiempo de guardado y tamaño exportado con historiales sintéticos de 100, 500 y 2.000 sesiones, tanto al guardar una serie como al editar un borrador; ejecutar luego las pruebas de migración, importación y recuperación. Los volúmenes son escenarios de prueba, no cantidades observadas del usuario.

## Límites y decisiones pendientes

Los JSON exportados contienen datos legibles y las copias internas viven en el mismo origen: no sustituyen un respaldo guardado fuera del navegador. Tampoco existe sincronización o recuperación de cuenta, en consonancia con el requisito de funcionar sin servidor. No se propone añadirlos sin una petición funcional.

No se certifica ausencia absoluta de vulnerabilidades ni se realizó una auditoría de dependencias o del despliegue en este trabajo. No se han copiado valores personales ni secretos a este informe. Las dos acciones propuestas quedan como recomendaciones para una etapa posterior; esta entrega es documental y no cambia el funcionamiento existente.

Uso de IA: revisión estática y redacción realizadas con Codex. La aprobación humana y la verificación de ejecución se registran en la entrega de integración; no se presumen realizadas aquí.
