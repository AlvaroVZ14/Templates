# Prompt 21 · Auditoría y robustez

Auditoría del 16/10/2026. Alcance: código de la PWA, rutina inicial, cálculos,
IndexedDB, respaldos, actualización offline, navegación y pruebas en Chromium.
Se usaron perfiles de navegador aislados y registros ficticios; no se abrió ni
modificó la base del navegador personal del usuario.

## Hallazgos corregidos

| ID | Hallazgo | Corrección y comprobación |
|---|---|---|
| A21-01 | El service worker activaba versiones nuevas inmediatamente, sin aviso. | Instalación completa en caché, espera y aviso «Hay una versión nueva, tocar para actualizar». Activación solo tras tocar y guardar borradores; recarga tras `controllerchange`. Prueba con dos versiones reales y actualización sin red. |
| A21-02 | El editor de rutina conservaba cambios solo mientras la página seguía abierta. | Borrador recuperable en IndexedDB y copia local síncrona, con el mismo mecanismo de los formularios. Actualizar recupera el nombre editado y las reps sin registrar. Guardar la rutina limpia su borrador. |
| A21-03 | Un borrador de rutina importado podía tener JSON con estructura no renderizable. | Validación estructural antes de importar; admite campos a medio editar y mantiene la validación final al guardar. Combinar respeta los IDs locales de ejercicios equivalentes. |
| A21-04 | Operaciones de calendario mezclaban fecha civil, hora local del equipo y fecha de Chile. | Aritmética de fechas civiles en UTC; el día actual sigue `America/Santiago` mediante `Intl`. Se corrigieron semana/volumen, cardio, alimentación, revisión semanal, mes anterior y etiquetas de gráficos. |
| A21-05 | Al cambiar de día no había un contexto claro para la sesión que seguía abierta. | El reloj actualiza el día de Chile al minuto y al volver a la pestaña. Conserva la fecha y borrador abiertos; muestra la fecha vista y «Ir a hoy». Prueba cruzando las 00:00 chilenas. |
| A21-06 | Hoy, el cajón y sesiones históricas nuevas usaban nombres de sesión fijos. | Nombres derivados de los músculos de la sesión configurada. Los títulos ya guardados del historial se conservan. Se eliminó la lista de títulos sin uso. |
| A21-07 | Cambiar de fase reponía fechas y pesos objetivos fijos; instalar después del plan inicial creaba fases vencidas. | Se reutiliza la configuración vigente/futura del tipo elegido; sin ella, fechas relativas editables y objetivo por completar. Mantención puede usar el último peso observado. Una instalación posterior al plan original parte de su fecha real. Las fases y objetivos ya guardados no se reescriben. |
| A21-08 | Comida podía fallar con una base vacía y el generador suponía cuatro alimentos presentes. | Estado vacío explícito, sin acceso a `foods[0].id`, registro protegido y mensaje claro antes de generar un plan incompleto. Los planes/consumos históricos mantienen sus snapshots. |
| A21-09 | El volumen planeado ignoraba sesiones movidas o canceladas por fecha. | Suma el calendario efectivo de esa semana, incluyendo sus descansos y sesiones reasignadas. Prueba de cancelar lunes y moverlo al miércoles. |
| A21-10 | Recuperación mostraba siempre el rango inicial de pasos. | Usa la meta de pasos configurada para esa fecha y la meta de sueño existente. |
| A21-11 | Sin medición inicial, el recordatorio seguía anclado a una fecha fija. | Usa el primer registro real; sin registros pide el primer control en la fecha actual. La precarga solicitada sigue siendo la referencia cuando existe. |
| A21-12 | La actualización podía reutilizar recursos del caché HTTP y limpiar cachés de otra pestaña abierta. | Precache con `cache: reload`; conserva cachés anteriores cuando hay varias ventanas y no recarga otros formularios. Limpieza limitada al scope `/Templates/`, sin borrar IndexedDB ni localStorage. |

## Fechas y rutina

- Semana de lunes a domingo, incluso cruzando diciembre/enero y febrero bisiesto.
- Pruebas ejecutadas con el proceso en Santiago, UTC, Los Ángeles y Kiritimati:
  las fechas civiles y semanas son iguales en las cuatro zonas.
- Casos de Chile: medianoche normal, hora repetida de abril y salto de septiembre
  de 2026. No se codificaron offsets UTC fijos; dependen de los datos horarios de
  `Intl` del navegador/sistema.
- Revisión de todos los ejercicios y los siete días: equipo separado de carga,
  compuestos pesados con mínimo dos previas antes de registrar otro pesado del
  mismo patrón, excepción de una previa tras hacerlo, ajustes manuales y límite
  del 80% tras redondear. [Tabla completa](routine.md).
- Se conservaron valores de configuración solicitados: rutina, metas semanales,
  fases iniciales personales y medidas iniciales. Son datos de configuración,
  no valores usados para sustituir los registros faltantes de seguimiento.

## Datos, persistencia y respaldos

Esta etapa mantiene IndexedDB versión 2 y el formato de respaldo 1: no necesita
otra migración de esquema ni elimina registros. Se ejecutan las pruebas de:

1. Migración real de IndexedDB 1 a 2 con comparación exacta de series, diario,
   medidas, cardio y fases; copia del estado original e índices por fecha/mes/
   ejercicio. Un fallo aborta y mantiene versión 1 y datos originales.
2. Recarga offline conservando referencias, historial, borradores, notas,
   duración, descansos reales y sesión de gimnasio abierta.
3. Exportar JSON, validar, reemplazar o combinar e importar nuevamente sin
   duplicados. Se preservan snapshots y revisiones; fallos después de `clear`
   revierten toda la transacción. Versiones futuras y datos corruptos se rechazan.
4. Actualización real de PWA con registros y borradores abiertos: espera el toque,
   guarda y recarga sin red. Otra pestaña permanece abierta sin recarga forzada.

No se presenta el permiso de almacenamiento persistente como garantía absoluta:
su concesión depende del navegador y sigue existiendo exportación manual.

## Verificación y evidencias

- `npm test`: **134 pruebas**, todas aprobadas.
- `npm run build`: compilación correcta bajo `/Templates/`.
- Regresión completa: **92 escenarios de navegador aprobados** (5,7 minutos).
  Tras los últimos ajustes del recordatorio vacío y del scope de caché, se
  aprobaron otras **8 comprobaciones de los escenarios afectados** y la nueva
  prueba de ida y vuelta de un JSON descargado por la propia app: **93 escenarios
  únicos verificados**, sin fallos pendientes. Un selector demasiado estricto
  de la prueba nueva se corrigió antes de aprobar su ejecución final.
- Todas las secciones verificadas sin desbordamiento horizontal a **320 y 390 px**;
  también se ejecutan los escenarios existentes de escritorio, gestos y áreas
  seguras. Navegación solo por cajón; estados sin historial/pesos/diario/medidas/
  fases/alimentos/rutina abren sin errores de JavaScript.
- [Captura de actualización y borrador ficticio](update-mobile.png).
- [Captura de Comida con datos vacíos](empty-mobile.png).
- [Perfil local de efectos](performance.json), muestra de 3 segundos por estado:
  móvil emulado 390×844, DPR 3 limitado a canvas 585×1266, 20 partículas;
  escritorio 1440×900, 200 partículas. Cadencia RAF observada alrededor de 60/s,
  mediana 16,7 ms y percentil 95 entre 17 y 17,1 ms, sin tareas largas en las
  muestras. En modo gimnasio hay cero partículas móviles. No se alteraron los
  relojes/RAF durante esta medición; no certifica fps de composición ni 60 fps
  en un teléfono físico. Repetible con
  `node scripts/profile-effects.mjs` después de compilar; usa perfiles aislados.

## Seguridad y privacidad

- `npm audit --json`: **0 vulnerabilidades reportadas** en las dependencias
  instaladas, incluidas las de desarrollo. Es el resultado del registro al momento
  de ejecutar, no una garantía de ausencia de vulnerabilidades desconocidas.
- Se revisaron 173 archivos ya versionados y los diffs de 40 commits accesibles:
  sin coincidencias de claves privadas, tokens de GitHub, identificadores AWS,
  claves Google o JWT; sin archivos `.env` versionados. Revisión final de archivos
  nuevos antes del commit: **183 archivos** en el índice, sin coincidencias ni
  `.env`. No se imprimieron valores de posibles secretos.
- Solo se detectaron peticiones de la app a recursos de su propio origen; sin API
  externa para datos personales, fuentes, planes ni resúmenes.
- La portada tiene 114.683 bytes y no contiene etiquetas EXIF comunes de GPS,
  autor, fabricante ni modelo de cámara. Se conserva el recurso solicitado.
- **Excepción explícita autorizada:** las medidas iniciales del Prompt 3B siguen
  públicas en código/README y commits antiguos. El usuario confirmó conservar la
  precarga durante esta auditoría. Por ello no se afirma que el repositorio esté
  libre de datos corporales personales. No se añadieron registros personales
  actuales, exportaciones del usuario ni credenciales.

## Cómo comprobarlo

1. En Ajustes, exporta un respaldo. Anota en Historial el total de entrenamientos
   y rango de fechas; revisa una sesión con sus series.
2. Deja reps escritas sin guardar una serie y un nombre editado sin confirmar en
   Rutina. Cuando haya otra versión instalada en espera, toca el aviso de
   actualización: vuelves a Hoy y ambos borradores se recuperan. El editor sigue
   requiriendo «Guardar cambios» para aplicar su rutina.
3. Comprueba el mismo conteo/rango y sesión del historial después de actualizar;
   cierra y abre la app sin conexión y repite la consulta.
4. Prueba importar el respaldo en otro perfil de navegador, donde no haya tus
   datos: reemplazar recupera los registros; combinar dos veces no los duplica.
   No uses borrar los datos del sitio para actualizar.
5. Mueve una sesión en el calendario o cancélala: Hoy, el cajón, el volumen
   planeado y el descanso siguiente deben corresponder a esa configuración.

## Pendientes y límites

- Verificación en un Android/iPhone físico, Safari/WebKit, batería y rendimiento
  con una base de muchos años. Se verificó Chromium con tamaños móviles; no se
  simulan garantías sobre hardware real.
- El JS principal aún supera el aviso de 500 kB minificados de Vite (aprox.
  545 kB / 165 kB gzip). La división por pantallas es una mejora futura; no se
  ocultó el aviso ni se agregaron dependencias.
- Publicación: requiere revisión/aprobación de otra persona y merge del PR a
  `main`, conforme a `AGENTS.md`. Pages publica al pasar el workflow de main.
- Para pasar de una versión anterior que todavía no tiene este aviso, cierra
  todas las ventanas de la PWA y pestañas del sitio y vuelve a abrir con conexión.
  A partir de esta versión, las siguientes se ofrecen con el botón de actualizar.
- Cualquier eliminación de datos personales de commits antiguos queda fuera de
  esta etapa y contradice la decisión de conservar la precarga; no se reescribió
  el historial de Git.

## Referencias técnicas y uso de IA

El flujo de espera/activación sigue el [ciclo de vida del service worker de
web.dev](https://web.dev/articles/service-worker-lifecycle) y la
[actualización de PWA](https://web.dev/learn/pwa/update). Fechas mediante
[`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).

Implementación, auditoría y pruebas asistidas por Codex. Se revisaron diferencias,
resultados y capturas automáticamente. La aprobación formal y las comprobaciones
en un teléfono real por otra persona siguen pendientes; no se atribuyen como ya
realizadas.
