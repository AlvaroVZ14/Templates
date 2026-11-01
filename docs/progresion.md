# Progresión en el registro rápido

Implementación asistida por Codex. Las reglas numéricas proceden de la solicitud
del usuario. La inspiración general es ejecución controlada y progresión de carga,
descritas públicamente en https://fabriciopacholok.com.br/; no se consultó ni copió
material de pago, ni se presenta esta función como un programa oficial del entrenador.

## Uso

- Cada tarjeta muestra `Hoy: carga × rango`. Las filas sugieren las reps concretas.
- Para subir deben estar completas **todas** las efectivas del mismo ejercicio y
  sesión de rutina, cada una al tope de su propio rango. Drop, RP y previas no cuentan.
- Al completar el ejercicio, confirma si **todas** estuvieron a 0–2 RIR con técnica
  limpia y toca fuerte, normal o flojo. No se inventa un RIR exacto ni se deduce de
  un emoji. Sin declaración, mantener e intentar +1 rep, hasta el máximo del rango.
- Al cumplir: +2,5 kg en barra, mancuerna (por mano) y máquina; reps al mínimo.
  Polea: una placa pequeña. En `Regla y motivo` se configura su masa en kg;
  inicialmente usa el incremento del equipo, que debes ajustar a tu polea real.
- Flojo mantiene; dos sesiones consecutivas flojo aconsejan revisar sueño y comida.
  Cambiar la sensación varias veces en una fecha no equivale a varias sesiones.
- Back-off: Top real del día −10% por defecto, con redondeo del equipo.
  Porcentaje editable en Rutina. Si cambias el Top, cambia la sugerencia Back-off.
  Drop: −30% por caída. RP: mismo peso, 15–20 s y reps extra.
- No aumenta en descarga ni a partir de una sesión de descarga. Rangos distintos
  (p. ej. pesadas/ligeras) se evalúan individualmente. Se compara la misma instancia
  de rutina y equipo: las tres series de Torso no prueban las cuatro de Push.

## Historial y conservación

La primera confirmación guarda la sugerencia usada, sus fuentes y el motivo.
Cada sensación guarda una revisión nueva con la propuesta para la próxima sesión.
Los valores realmente registrados quedan vinculados a la decisión, incluidos los
ajustes manuales. Ver `Historial > Decisiones de progresión`, con paginación.
La referencia solo cambia al guardar una efectiva con su carga real; no por abrir
una tarjeta. Back-off y ligeras conservan su comportamiento existente.

Se añaden `exerciseFeedback` y `progressionDecisions` al estado local de IndexedDB.
No cambia la versión de la base ni se reescriben series antiguas. Exportar/Importar
incluye estas colecciones; valida estructura y versión antes de combinar o reemplazar.
Combinar entre instalaciones vuelve a enlazar los IDs de ejercicio. La comparación
de valores con la declaración original impide reutilizarla tras editar un registro.

## Comprobación manual con datos de prueba

1. Completa todas las efectivas al máximo; marca técnica limpia/0–2 RIR y normal.
   La próxima sesión propone +2,5 kg y reps mínimas. Si falta una serie o queda
   una rep por debajo del máximo, propone mantener e intentar +1 rep.
2. Repite marcando flojo: mantener aunque completes los rangos. Dos sesiones flojo
   muestran el consejo de sueño y comida. Recargar conserva la sensación.
3. Cambia el Top manualmente: comprueba Back-off −10%; cambia su porcentaje en
   Rutina. Activa Drop o RP en la última fila y verifica las sugerencias existentes.
4. Abre Historial y despliega Decisiones: revisa carga propuesta, registrada y motivo.
   Exporta un respaldo y comprueba que contiene ambas colecciones antes de importar.
5. Sin historial ni peso: pide elegir carga; no propone una subida inventada.

Pruebas automatizadas: `npm test`, `npm run build`, `npm run test:e2e`.
La compilación mantiene el aviso previo sobre un bundle superior a 500 kB.

Verificación de esta etapa: 167 pruebas unitarias aprobadas. Se ejecutaron los 51
casos activos de navegador; los 20 de los módulos afectados se repitieron tras las
correcciones y pasaron 20/20, junto con los 31 restantes ya aprobados. Incluye
recarga offline, migración, sesión antigua abierta, decisiones, navegación y cardio.
Captura móvil revisada a 390 px; comprobaciones de ancho a 320/390/768/1440 px.
