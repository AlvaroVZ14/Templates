# Prompt 17 · evidencia para revisión

Implementación asistida por Codex: separación de tipo de carga y equipo, reglas de
preparación, decoración SVG/CSS, concentración del canvas existente y registro de
manzana/fibra. No se añaden dependencias ni imágenes de internet. El menú lateral
continúa como única navegación.

## Datos y reglas

La migración del estado es aditiva e idempotente: añade la clasificación y la
manzana sin modificar los IDs, referencias de peso, series realizadas, consumos,
nutrientes históricos ni planes anteriores. Conserva elecciones manuales y
alimentos editados. No cambia la estructura de IndexedDB. La nueva fibra es
opcional en alimentos y respaldos; un valor ausente permanece desconocido.

Los mínimos automáticos se resuelven por tipo de carga, independientemente del
equipo. La excepción del mismo patrón requiere una efectiva de otro pesado en la
misma fecha, aunque el usuario haya entrenado fuera del orden de la rutina. La
[tabla de los 36 ejercicios](../rutina-previas.md) muestra el cálculo inicial y la
reducción condicionada. No se reemplaza una rutina personalizada por esa tabla.

La fruta se incorpora al cálculo de porciones, fuera del límite de snacks. La
casilla registra solo lo pendiente y evita el doble registro al marcar después
la comida del plan. Regenerar archiva el plan anterior y conserva lo consumido.
Editar nutrientes cambia solo futuros registros. Los valores aproximados y sus
fuentes oficiales están documentados en el README.

## Evidencia visual

Capturas de navegadores de prueba aislados, con registros ficticios:

- [Previas pesadas en móvil](p17-heavy-mobile.png).
- [Laterales en escritorio ancho](p17-sides-desktop.png).

Las pruebas incluyen toda la semana, el paso de prensa de dos previas a una tras
hacer hack, Manual 0 con aviso y vuelta a Auto, separación de equipo/tipo,
persistencia offline, fruta 0–2, presupuestos de snacks en volumen/mini cut,
conservación de nutrientes y planes, fibra desconocida y bloqueo de duplicados.
También comprueban los márgenes, el scroll, la pausa de la pestaña y los modos de
efectos. La aprobación humana del PR está pendiente.

Verificación local: `npm test` (95 pruebas), `npm run build` y
`npm run test:e2e` (69 pruebas de Chromium, todas correctas). Los escenarios de
respaldo, migración, historial, progresión, técnicas, gráficos y navegación
existentes se ejecutan junto con los de esta etapa.
