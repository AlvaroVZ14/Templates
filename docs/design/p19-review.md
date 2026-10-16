# Prompt 19 · configuración inicial y modo gimnasio

Implementación asistida por Codex de los requisitos del usuario Prompt 19.
Sin nuevas dependencias, servicios externos, cambios de IndexedDB ni borrado de
registros. La aprobación y revisión humana del PR permanecen pendientes.

## Comportamiento

- Configuración inicial y enlace en el único menú lateral. Una fila por perfil
  compartido de ejercicio, días de uso, kg por mano para mancuernas, validación y
  pendientes explícitos. Posponer conserva el borrador sin aplicar referencias.
- Una sesión de gimnasio abierta: fecha y ejercicio guardados; usa los metadatos
  de duración existentes y recupera el inicio sin reiniciarlo. Guardar cada serie
  sigue utilizando la transacción existente; no añade un búfer hasta terminar.
- Vista de entrenamiento sin cabecera animada ni paneles secundarios, ejercicio
  actual destacado, siguiente visible y botones grandes. Descanso fijo incluso
  en estado vacío. Efectos estáticos temporales sin editar preferencias guardadas.
- Wake lock con estados visibles, liberación al salir/ocultar/terminar, recuperación
  al volver y protección contra una solicitud que se resuelva después de salir.
  Denegación/API ausente no impiden registrar. Hardware real pendiente de revisión.
- Sonido opcional sintetizado y habilitado mediante gesto, apagado por defecto.
  Vibración y un aviso por temporizador; no vuelve a sonar un descanso ya vencido
  después de recargar. No se promete aviso del sistema con el navegador cerrado.
- Resumen con tiempo total (incluye pausas), efectivas y máximos de carga/reps
  frente a la última fecha del mismo perfil y equipo. Sin antecedentes no inventa
  récords. Los borradores no se convierten en registros al cerrar.
- Exportar/importar conserva y valida configuración, sesión abierta y resumen;
  combinar instalaciones distintas religa la selección al ejercicio equivalente.

## Evidencia

Las pruebas usan únicamente datos ficticios. Se cubren las primeras aperturas,
referencias compartidas, cero/vacíos/valores inválidos, recuperación offline de
series y borradores, errores de escritura, permisos y solicitud tardía de pantalla,
sonido/vibración, resumen comparable, copia JSON y anchos de 320 a 1440 px.

Fuentes primarias consultadas: [MDN, Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
y [MDN, AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume).
La comprobación con hardware de teléfono y la aprobación humana no se sustituyen
por las simulaciones automatizadas de Chromium.

Capturas revisadas con datos ficticios:

- [Configurar pesos en celular](p19-weights-mobile.png).
- [Modo gimnasio con menú y descanso fijo](p19-gym-mobile.png).
- [Resumen de la sesión](p19-summary-mobile.png).

## Validación

- `npm test`: 109 pruebas unitarias aprobadas.
- `npm run build`: compilación y precaché offline aprobados. Vite avisa que el
  JavaScript principal supera 500 kB minificado (155 kB comprimido); no se añadieron
  dependencias. El fondo queda estático durante gimnasio.
- La regresión completa comprobó los escenarios de historial, migración, respaldo,
  diario, comida, medidas, preparación y progresión. Las pruebas antiguas posponen
  explícitamente la nueva pantalla inicial por la interfaz; las ocho nuevas usan
  la apertura real sin ese asistente de pruebas.
- La ejecución focalizada final vuelve a comprobar las 24 pruebas afectadas de
  gimnasio, navegación limpia, efectos, calendario y tema. Los otros 59 escenarios
  se verificaron en la ejecución completa: 83 escenarios de navegador en total.
- `git diff --check` sin errores; no se incluyen `.env`, secretos ni registros
  personales. No hay una verificación humana declarada ni merge automático.
