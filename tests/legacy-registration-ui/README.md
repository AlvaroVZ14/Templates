# Especificaciones de la interfaz retirada

Estos archivos conservan como referencia los escenarios de la interfaz anterior: pestañas Previas/Efectiva/Otras, formularios de RPE/fallo/descanso, registro individual de extensiones y cabecera escénica. No pertenecen al `testDir` activo de Playwright y **no se presentan como pruebas aprobadas de la interfaz nueva**. Sus imports relativos reflejan su ubicación original en `tests/browser`.

La petición del registro rápido retira esos controles: solo efectivas, 17 filas visibles, teclados optativos, técnica dentro de la última fila y finalización directa. `tests/browser/fast-registration.spec.js` comprueba su sustitución y los casos de guardado, recuperación, técnicas, volumen y dimensiones. `tests/quick-registration.test.js` verifica también las operaciones puras y su atomicidad. Las pruebas de lógica de las funciones históricas permanecen activas.

Las suites activas de diario, medidas, nutrición, Progreso, respaldos, base de datos y PWA continúan ejecutándose; sus interacciones de registro se adaptan a steppers y ✓. No se deshabilita el workflow ni se agregan `test.skip`. Al ampliar la interfaz futura, recuperar aquí una prueba requiere adaptar sus criterios, no volver a habilitar formularios retirados.
