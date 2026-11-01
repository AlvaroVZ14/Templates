# Clip ficticio para probar el fondo

`theme-loop.webm` es un video original de 1 segundo, 192 × 192 px, VP9 sin audio. Se generó localmente con 10 fotogramas del icono SVG de este repositorio y FFmpeg incluido en Playwright. No contiene fotos, datos personales ni material descargado. Es exclusivo de las pruebas; no se incluye en la PWA publicada.

## Rutina histórica

`legacy-routine.json` conserva únicamente la rutina, perfiles sin pesos cargados y metas del plan anterior a PPL + Torso + Leg. `legacy-state.js` combina esos datos con el estado actual y regenera los identificadores de ejercicio por instalación de prueba. No contiene registros personales.

Las pruebas anteriores lo usan para conservar su cobertura de rutinas ya configuradas, equipos, técnicas, migraciones antiguas y funcionamiento offline. La fixture de navegador común siembra ese estado en un perfil Chromium aislado; no toca el navegador del usuario.

Las pruebas nuevas `routine-plan.test.js` y `browser/routine-plan.spec.js` importan el dominio actual o Playwright sin esa semilla. Verifican instalación nueva y migración real de un estado sin marcador `routineVersion`; así, la fixture histórica no sustituye la comprobación de la nueva rutina.
