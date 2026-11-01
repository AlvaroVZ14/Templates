# Revisión de arquitectura frontend

Fecha: 31 de octubre de 2026. Base revisada: `3ce7a5c`, rama `templates/inicio`.

## Alcance y responsabilidades

Revisión estática del frontend de BLOOD & GUTS; no modifica comportamiento, datos, dependencias ni configuración. Este agente solo escribe este informe. La ejecución de pruebas y compilación corresponde al agente de testing; la persistencia y las migraciones corresponden al agente de backend local. Se leyeron las reglas aplicables de `C:/Users/alvar/Downloads/AGENTS.md`, respetando el alcance de la app solicitado por el usuario y las rutas asignadas.

`src/main.jsx:1` arranca React e incorpora los estilos. `src/App.jsx:70` concentra carga de datos, cambios, navegación, sesión activa, pantallas y cronómetro. `src/Navigation.jsx:19` implementa el cajón y `src/ExerciseCard.jsx:1` el registro de series. La lógica de cálculos se importa desde módulos como `preparation.js`, `training.js` y `classification.js`, en vez de duplicarse en la presentación. Los efectos se encapsulan en componentes y hojas de estilo propios.

## Aspectos correctos observados

- El cajón usa `dialog.showModal()`, nombre accesible, cierre por Escape, gesto y botón, y coordinación con el historial del navegador (`src/Navigation.jsx:19`). Las secciones Hoy, pesos, molestias, Historial, Medidas, Diario, Progreso, Rutina, Comida, Método y Ajustes están declaradas en su lista; las pantallas correspondientes aparecen en `src/App.jsx:171`.
- Los gestos excluyen controles, gráficos SVG y canvas (`src/Navigation.jsx:8`), evitando capturar intencionalmente los cambios numéricos o interacciones con gráficos. Hay estilos para las áreas seguras del dispositivo (`src/navigation.css:7`).
- El registro compacto implementa pestañas con estado seleccionado, controles asociados, foco itinerante y teclas de navegación (`src/ExerciseCard.jsx:140`). Las explicaciones secundarias se conservan en desplegables.
- La navegación espera el guardado de borradores y solicita confirmación ante una sesión incompleta (`src/App.jsx:84`). Los errores de guardado se presentan con `role="alert"` (`src/App.jsx:166`). Esto es evidencia de diseño; no sustituye la prueba dinámica de recuperación.
- Las partículas emplean RAF, se detienen con la pestaña oculta, limpian listeners y cancelan el frame al desmontar (`src/VisualEffects.jsx:57`). El modo de movimiento reducido se consulta con `matchMedia` (`src/VisualEffects.jsx:8`), y el canvas no captura toques (`src/effects.css:1`). El registro enfocado reduce su presupuesto y frecuencia de dibujo (`src/VisualEffects.jsx:32`).

## Hallazgos priorizados: máximo tres

### 1. P2 — Resiliencia: falta un límite de errores de renderizado

**Comprobado en código:** `src/main.jsx:21` monta directamente `<App />`; no se encontró un `ErrorBoundary` ni `componentDidCatch` en el arranque y los componentes revisados. El manejo de errores de `change()` en `src/App.jsx:125` protege la operación de guardado, no los errores producidos al renderizar una pantalla.

**Consecuencia potencial:** una excepción no prevista al representar datos puede interrumpir toda la interfaz. No se reprodujo una excepción ni se constató pérdida de datos.

**Recomendación verificable:** incorporar un límite alrededor de la aplicación o de la pantalla activa con recuperación explícita, sin borrar IndexedDB ni recargar automáticamente en bucle. Probar con un componente de prueba que lance una excepción y verificar que se muestra una salida recuperable y que los datos permanecen intactos.

### 2. P2 — Accesibilidad: falta traslado explícito del foco al cambiar de sección

**Comprobado en código:** `navigate()` cambia fecha/página y cierra el cajón (`src/App.jsx:93`), pero no mueve el foco al contenido. `main#main-content` carece de `tabIndex` y la actualización de página no anuncia su título (`src/App.jsx:168`). El cajón sí usa un diálogo modal; su comportamiento de restauración de foco no garantiza por sí mismo orientar al usuario hacia la pantalla recién elegida.

**Consecuencia potencial:** con teclado o lector de pantalla, el foco puede volver al botón de menú sin indicar dónde comienza la nueva sección. Esta consecuencia requiere verificación en navegador y con tecnología de asistencia; no se declara como fallo reproducido.

**Recomendación verificable:** al completar una navegación entre secciones, enfocar el título o el contenido con `tabIndex={-1}` y mantener un nombre de página accesible; no secuestrar el foco al editar números, guardar series o refrescar datos. Probar teclado: abrir menú, elegir Historial, comprobar que el foco llega al encabezado de Historial; repetir con atrás y comprobar que el cajón no queda abierto.

### 3. P3 — Mantenibilidad y carga inicial: composición y estilos concentrados

**Comprobado en código:** `src/App.jsx:1` importa de forma estática las pantallas, los efectos y numerosos módulos de dominio; el mismo archivo define `Today`, `Routine`, `Volume` y `Timer` (`src/App.jsx:190`, `239`, `293`, `312`). `src/main.jsx:4` carga dieciséis hojas CSS, incluidas capas históricas de tema, grunge y registro compacto. No hay carga diferida mediante `React.lazy` o `Suspense` en estos puntos de entrada.

**Consecuencia potencial:** aumenta el coste de revisar dependencias entre pantallas y el riesgo de regresiones por cascada de estilos. La importación estática obliga a incluir código de pantallas secundarias en el grafo inicial, pero esta inspección no cuantifica su coste ni demuestra lentitud en un celular.

**Recomendación verificable:** extraer primero las pantallas internas y el cronómetro conservando las mismas props; después medir el resultado de diferir pantallas secundarias y ordenar los estilos por componentes. Antes de introducir fragmentos de carga, asegurar que el service worker los precachea: abrir cada sección sin conexión después de actualizar. Comparar tamaño comprimido, carga de Hoy y resultados de pruebas antes/después; evitar una reescritura masiva.

## Límites y seguimiento

No se ejecutaron builds, tests, Lighthouse, medición de FPS ni comprobaciones de contraste o lector de pantalla; esas verificaciones no pueden deducirse de leer JSX/CSS. La ausencia de un límite de errores, la ausencia de traslado explícito de foco y las importaciones estáticas son observaciones comprobadas del código. Sus consecuencias se presentan como riesgos, no como incidentes confirmados. Ningún hallazgo autoriza alterar la lógica de entrenamiento o el esquema de almacenamiento.

Uso de IA: revisión y redacción asistidas por Codex. No hubo revisión humana registrada en esta subtarea. No se reproducen datos personales precargados, historiales ni secretos.
