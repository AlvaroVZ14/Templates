# PPL + Torso + Leg

Especificación solicitada por el usuario, 31/10/2026. Reemplaza la rutina activa, conserva el historial. Respaldo de código anterior: rama `backup-rutina-anterior` en `28fa5c7`.

## Calendario y ejercicios

Lunes: descanso. Viernes: descanso. Cada sesión contiene 7 ejercicios y 17 series efectivas; total semanal 85. Drop y rest-pause son extensiones dentro de la última serie y no suman series efectivas.

| Día / sesión | Ejercicio | Series | Detalle |
| --- | --- | --- | --- |
| Martes PUSH | Press inclinado | 4 | S1 Top Set, S2–4 Back-off |
| | Press banca | 2 | Top + Back-off |
| | Aperturas en polea | 3 | Drop en la última |
| | Elevaciones laterales mancuerna | 2 | Rest-pause en la última |
| | Elevaciones laterales polea | 2 | |
| | Extensión tríceps tras nuca | 2 | Drop en la última |
| | Fondos | 2 | Pecho |
| Miércoles PULL | Curl polea | 3 | |
| | Dominadas | 3 | Drop en la última |
| | Remo libre | 2 | |
| | Remo mancuerna | 2 | |
| | Jalón al pecho | 3 | Drop en la última |
| | Deltoides posterior | 2 | Drop en la última |
| | Curl mancuerna | 2 | |
| Jueves LEG A | Extensiones | 2 | Drop en la última |
| | Hack squat | 3 | S1 Top, S2–3 Back-off |
| | Femoral sentado | 4 | |
| | Hiperextensiones (glúteos) | 2 | Glúteos |
| | Aductores máquina | 2 | |
| | Sóleo máquina | 2 | Gemelos |
| | Crunch con disco | 2 | Abdomen |
| Sábado TORSO | Press inclinado | 3 | Top + Back-off |
| | Jalón al pecho | 2 | |
| | Remo en polea | 1 | Drop |
| | Curl mancuerna | 5 | 3 pesadas + 2 ligeras |
| | Elevaciones laterales polea | 2 | Drop en la última |
| | Deltoides posterior polea | 2 | |
| | Extensión tríceps tras nuca | 2 | |
| Domingo LEG B | Prensa unilateral | 3 | |
| | Gemelo en prensa | 2 | |
| | Hack squat | 2 | Top + Back-off |
| | Femoral de pie | 2 | Drop en la última |
| | Hiperextensiones (glúteos) | 2 | Glúteos |
| | Abductores máquina | 4 | |
| | Crunch con disco | 2 | Abdomen |

## Reglas

- Compuestos: 6–10 reps. Aislamientos: 8–15. Laterales y gemelos: 12–20. Abdomen: 10–20.
- Curl mancuerna de TORSO: 3 series pesadas de 6–10 y 2 ligeras de 12–15.
- Intensidad 0–2 RIR; excéntrica 2–3 segundos. Descanso compuestos 2–3 minutos; aislamientos 1,5–2 minutos.
- Top Set es la serie pesada principal. Back-off sugiere un 10% menos que el Top, editable.
- Prioridades estéticas Classic Physique, informativas en Método: pecho superior, dorsales, bíceps, cuádriceps, glúteos, femorales.

## Volumen exigido y comprobado

| Grupo | Series |
| --- | --- |
| Pecho | 14 |
| Espalda | 13 |
| Bíceps | 10 |
| Tríceps | 4 |
| Deltoides laterales | 6 |
| Deltoides posteriores | 4 |
| Cuádriceps | 10 |
| Femorales | 6 |
| Glúteos | 4 |
| Aductores | 2 |
| Abductores | 4 |
| Gemelos | 4 |
| Abdomen | 4 |
| **Total** | **85** |

No se deben reescribir ni borrar registros anteriores. Reutilizar referencias de peso solo ante coincidencias inequívocas; conservar perfiles antiguos y guardar instantánea de la rutina anterior antes de migrar. Una variante nueva no hereda automáticamente el peso de otra distinta. La rama Git respalda código; los datos personales viven en IndexedDB y necesitan su propio respaldo.

## Decisiones de implementación

- Press inclinado conserva la variante con mancuernas de la rutina anterior. Remo libre se registra con barra; deltoides posterior sin especificación, en máquina. Las variantes explícitas en polea se mantienen distintas.
- Dominadas y fondos registran **lastre añadido**, con 0 kg para el peso corporal sin lastre. Reducir el lastre en dominadas no se presenta como reducir el peso corporal total; no se inventa una carga de asistencia.
- La migración de dominio `ppl-torso-leg-v1` es aditiva e idempotente; no necesita cambiar la versión 2 de IndexedDB. `routineMigrationBackups` conserva una instantánea completa anterior en el estado y en los respaldos JSON. No se reescriben nombres, grupos ni valores de series pasadas.
- Los ejercicios repetidos comparten peso de referencia, conservando identificadores diferentes por sesión. Las coincidencias ambiguas y las variantes distintas quedan sin peso para configurarlas.
- `routineActivatedOn` conserva el calendario anterior para fechas previas al cambio. Las excepciones futuras anteriores se marcan para revisión, sin eliminarlas. Si hay una sesión antigua abierta hoy, se conserva y el cambio entra mañana; Hoy muestra el aviso.
- Top/Back-off y pesada/ligera son roles de efectivas. Un Back-off o una ligera no rebaja el peso de referencia. No se inventa un porcentaje para la carga ligera del curl: se solicita elegirla para 12–15 reps.
- Los avisos de recuperación reconocen los grupos históricos en singular. Un registro antiguo de Hombro se considera conservadoramente como antecedente para ambos deltoides, con una aclaración de que no especifica la zona; no se altera el registro.
- La importación valida la rutina original antes de migrar, para que el reemplazo no oculte valores inválidos. Los roles y rangos del plan se mantienen sincronizados cuando se editan series o técnicas.

## Cómo comprobarlo

1. Antes de actualizar en el teléfono, exporta un JSON desde Ajustes como respaldo externo. La migración también conserva su instantánea local automáticamente.
2. Tras actualizar, abre Hoy en martes, miércoles, jueves, sábado y domingo: deben aparecer PUSH, PULL, LEG A, TORSO y LEG B, con 7 ejercicios y 17 efectivas. Lunes y viernes son descanso. En una instalación migrada, revisa fechas posteriores a la activación indicada.
3. En Progreso, abre Series semanales: una semana completa nueva, sin excepciones de calendario ni descarga, debe sumar 85 y coincidir con la tabla anterior. Las semanas de transición pueden incluir parte del plan anterior.
4. Registra un Top de press inclinado con 40 kg por mano: el Back-off sugiere 36 kg. Edita el porcentaje en Rutina y comprueba que cambia; registrar Back-off no rebaja la referencia del Top.
5. Aperturas PUSH: registra tres efectivas y después la caída. Laterales mancuerna: dos efectivas y después mini-series RP. Las extensiones se guardan individualmente, vinculadas a la última efectiva, sin incrementar volumen.
6. En TORSO, el curl muestra tres pesadas 6–10 y luego dos ligeras 12–15 con el peso por elegir. Los demás rangos siguen las reglas anteriores.
7. Revisa Historial antes y después de recargar offline: los entrenamientos anteriores conservan sus datos. Exporta otro JSON y comprueba que contiene `routineMigrationBackups` y sus registros originales. No borres los datos del sitio para actualizar.

Implementación asistida por Codex con agentes de frontend, persistencia local y testing, en archivos separados; integración y cierre por el agente principal. No se presume una validación en teléfono físico ni una aprobación humana.

## Verificación de la etapa

- `npm test`: 151 pruebas aprobadas, sin fallos.
- `npm run build`: correcto. JavaScript principal 572,47 kB / 175,09 kB gzip; Vite mantiene la advertencia de fragmento mayor de 500 kB. No es una medición de rendimiento en un teléfono.
- `npm run test:e2e`: 111 escenarios aprobados en 11,8 minutos: 106 regresiones y 5 nuevos PPL. Los escenarios históricos usan una rutina congelada como datos de prueba; los nuevos arrancan con un contexto limpio o una migración real de IndexedDB.
- Tras ajustar los valores iniciales de reps desde los rangos del plan, se repitieron las 151 unitarias y la compilación. Al retomar la etapa el 01/11/2026 se confirmó `npm run test:e2e -- tests/browser/routine-plan.spec.js`: 5/5 aprobados en 45,8 segundos sobre el artefacto final, sin fallos pendientes.
- El plan exacto, los 13 grupos, los roles y rangos, el calendario anterior, la sesión abierta diferida, la conservación de registros, la importación inválida y las correspondencias de recuperación tienen pruebas de lógica. Navegador cubre Top/Back-off y recarga offline, Drop/RP sin volumen extra, migración con respaldo, edición de series/técnicas y transición a cargas ligeras.
- `git diff --check`: correcto. No se modificaron dependencias, esquema de IndexedDB ni workflow de publicación.
