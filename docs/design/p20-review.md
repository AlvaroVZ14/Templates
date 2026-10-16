# Prompt 20 · dolor informativo, seguridad y cardio explícito

Requisitos del usuario Prompt 20; no corresponden a identificadores RC/RNF del
dominio SustentaChile. Implementación y revisión automatizada asistidas por Codex.
La aprobación humana y la revisión en teléfono físico permanecen pendientes.

## Dolor y seguridad

Se añaden al Diario registros opcionales por zona con escala, cualidad e inicio;
se conservan campos y texto libre anteriores. Los avisos usan 6/10, tres sesiones
registradas distintas consecutivas, cualidades punzante/articular y episodios que
abarcan más de 14 días. Un 0 cierra el episodio. Se muestra fecha y antigüedad:
no se transforma un registro viejo en una afirmación de dolor actual. Datos
separados no demuestran continuidad y una sesión sin diario no confirma dolor.

Las reglas son las solicitadas por el usuario, no criterios clínicos validados.
Se sugiere revisar carga/técnicas o sustituir; nunca se modifica el entrenamiento
automáticamente ni se diagnostica una causa. El mapa orientativo por ejercicio
es visible en Zonas con molestias. Los textos ambiguos piden completar zonas en
vez de atribuir una puntuación a varias partes del cuerpo. El historial conserva
también los textos originales. Los recordatorios al fallo se ocultan por ejercicio
sin silenciar los avisos de dolor.

## Cardio y conservación

La tarjeta diaria muestra minutos concretos, tipo, intensidad, momento, motivo y
semana hecha/recomendada. Base inicial: volumen 48 min, mini cut 125, mantención
45; pierna y descansos no asignados 0, con excepción de un descanso en mini cut.
Dos días seguidos de recuperación deficiente dividen exactamente por dos. Los
extras por estancamiento requieren confirmación. Auto sigue rutina/calendario;
las casillas manuales y minutos se guardan por fase en Ajustes.

Hecho usa un ID por fecha y editar no duplica. Se conservan las actividades antiguas
y las versiones de objetivos guardados; el plan actual se recalcula ante cambios
de calendario sin sobrescribir el histórico. Las omisiones no aumentan otros días.
Los resúmenes incluyen recomendados, registrados, días y dolor estructurado.
Exportar/importar valida nuevos campos; combinar une zonas por día con prioridad
local y religa las preferencias de seguridad entre instalaciones. Los dos estados
originales siguen archivándose por el mecanismo de respaldo existente.

Sin dependencias nuevas, backend, imágenes externas, cambio de IndexedDB ni borrado
de datos. Continúan PWA, modo gimnasio, offline y menú lateral único.

## Referencias y límites

- [NHS: dolor articular](https://www.nhs.uk/symptoms/joint-pain/): orientación general
  para consultar si el dolor persiste o recurre; no avala los umbrales propios de
  esta app ni el mapa de carga por ejercicio.
- [CDC: intensidad y habla](https://www.cdc.gov/physical-activity-basics/measuring/index.html):
  contexto para la explicación de intensidad. Poder hablar y el cálculo pedido de
  60–70% de 220−edad son guías aproximadas, no validación individual de zona 2.

La aplicación no consulta servicios médicos ni envía información del Diario.
Pruebas y capturas usan únicamente datos ficticios.

## Capturas revisadas

- [Aviso por ejercicio y zona](p20-pain-exercise.png).
- [Historial por zona en celular](p20-pain-history-mobile.png).
- [Pierna: 0 minutos obligatorios y caminata opcional](p20-cardio-leg-mobile.png).
- [Minutos configurados y guía opcional de pulsaciones](p20-cardio-settings-mobile.png).

La tarjeta y la nueva vista se comprobaron en anchos de 320, 390, 768 y 1440 px.
El bundle principal es de unos 541 kB minificado / 164 kB comprimido; Vite mantiene
su aviso de tamaño. No se han añadido librerías ni peticiones de red para calcular
dolor o cardio. La regresión verifica también las fuentes locales, offline y
conservación de los datos anteriores.

## Validación final

- `npm test`: 122 pruebas unitarias aprobadas, incluidas reglas de dolor,
  persistencia/repetición, mapeo, seguridad, calendario, fases, mitades exactas,
  confirmación de extras, conservación y combinación de respaldos.
- `npm run build`: aprobado; assets nuevos incluidos en el precaché de la PWA.
- 88 escenarios de navegador verificados: 76 aprobados en la regresión completa
  y 12 en el reintento focalizado final con `--last-failed`, tras precisar los
  selectores del título Hoy para distinguirlo de Cardio de hoy. La aplicación
  compilada es la misma en ambas ejecuciones.
- Las cinco pruebas nuevas comprueban avisos y conservación, ocultación por
  ejercicio, las tres fases, Hecho editable, resumen, calendario y offline.
- `git diff --check` sin errores y ningún `.env` versionado. Sin datos personales
  ni secretos añadidos. Capturas ficticias y aprobación humana pendiente.
