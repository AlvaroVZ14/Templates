# BLOOD & GUTS · Registro personal

PWA mobile-first de fisicoculturismo natural, inspirada en Heavy Duty / Blood and
Guts: poco volumen, series efectivas al fallo técnico y ejecución controlada.
Construida con React + Vite. Sin backend, cuentas, analítica ni servicios externos.
El repositorio conserva el nombre **Templates**.

**URL final de publicación:** [https://alvarovz14.github.io/Templates/](https://alvarovz14.github.io/Templates/).
GitHub Pages está configurado con **GitHub Actions**; cada integración en `main`
publica si pasan las comprobaciones. La ruta `/Templates/` distingue mayúsculas.
Hasta que termine el primer despliegue correcto, la URL puede responder 404.

## Probar en tu computador

Requiere Node.js 20.19+ o 22.12+ (se recomienda Node 24) y npm.

```sh
git clone --branch templates/inicio https://github.com/AlvaroVZ14/Templates.git
cd Templates
npm ci
npm run dev
```

Abre la URL que imprime Vite, normalmente `http://localhost:5173/Templates/`.
Si ya tienes este repositorio, ejecuta los comandos npm desde la carpeta que
contiene `package.json` (en la copia original: `Templates-main/Templates-main`).

### Instalación y modo offline

El service worker se genera únicamente al compilar, para no cachear el entorno de
desarrollo. Prueba la PWA con:

```sh
npm run build
npm run preview -- --port 4173
```

1. Abre `http://localhost:4173/Templates/` con conexión y espera **Offline listo**.
2. Instala desde **Menú → Ajustes → Instalar app** o el menú del navegador.
   En iPhone: Safari → Compartir → Añadir a pantalla de inicio.
3. En DevTools → Network, activa **Offline** y recarga. Navega por las
   pantallas y guarda una serie; seguirá disponible después de otra recarga.
4. Para instalar desde un teléfono, sirve `dist/` en un alojamiento estático con
   **HTTPS**. `localhost` es la excepción permitida para pruebas en el computador;
   abrir la IP local por HTTP en el teléfono no habilita el service worker.

El servidor de preview sirve archivos estáticos; la aplicación no necesita un
backend. `base: '/Templates/'` corresponde al nombre real del repositorio.
El manifest mantiene `id`, `start_url`, `scope` e iconos relativos a esa ruta;
el service worker se registra en `/Templates/sw.js` con alcance `/Templates/`.

### Publicar automáticamente en GitHub Pages

El workflow `.github/workflows/pages.yml` prueba y compila con Node 24 y `npm ci`.
Los Pull Requests a `main` ejecutan las pruebas sin desplegar; cada push a `main`
publica `dist/` si pasan las pruebas de lógica y navegador. También admite ejecución
manual sobre `main` desde Actions. Utiliza el token automático de GitHub, sin
secretos ni tokens personales. Las acciones oficiales se fijan por revisión.

Para activar por primera vez:

1. En [Settings → Pages](https://github.com/AlvaroVZ14/Templates/settings/pages),
   en **Build and deployment → Source**, elige **GitHub Actions**.
2. Si Actions está deshabilitado, actívalo en **Settings → Actions → General** y
   permite las acciones oficiales de GitHub. No necesitas dar permisos de escritura
   globales: el job de publicación declara `pages: write` e `id-token: write`.
3. Integra el Pull Request que contiene la app y este workflow en `main`.
   Si ya estaba integrado antes de activar Pages, abre **Actions → Publicar PWA
   en GitHub Pages → Run workflow**, selecciona `main` y ejecútalo.
4. Espera que **Probar y compilar** y **Publicar en Pages** aparezcan en verde.

URL de instalación una vez completado el primer despliegue:
**https://alvarovz14.github.io/Templates/**

Abre esa URL en Chrome para Android y selecciona **Instalar aplicación**; en
iPhone, Safari → Compartir → Añadir a pantalla de inicio. Espera **Offline listo**
antes de desconectarte. El historial local del computador no se transfiere al
teléfono ni al nuevo origen HTTPS.

El primer despliegue requiere habilitar Pages e integrar este workflow en `main`.
Un push a `templates/inicio` conserva el código en GitHub; la publicación se
dispara al integrar sus cambios en `main`. Si cambias el nombre del repositorio,
actualiza `base`, la URL del README y la ruta de las pruebas de navegador.

## Pantallas

- **Hoy:** selector de fecha y semana, sesión del día, aproximaciones sugeridas,
  registro y eliminación de series, peso de trabajo persistente, carga en kg,
  repeticiones, RPE, fallo y temporizador. Dentro de cada ejercicio: notas e
  historial con gráfico. Al final: cardio y pasos. Miércoles y domingo son descanso.
- **Rutina:** editor por día; añade, quita y ordena ejercicios. Ajusta músculo
  principal, equipo, tipo compuesto/aislamiento, efectivas, extensión planeada,
  previas automáticas o personales (0–3), zona de preparación, redondeo de cargas, caídas de drop (1–3), mini-series de
  rest-pause (1–10) y descansos. Pulsa **Guardar cambios** para persistir. Un borrador
  se conserva al cambiar de pantalla dentro de la app, pero no al recargar.
- **Volumen:** meta original, plan actual y efectivas realizadas por músculo,
  para la semana local de lunes a domingo. Permite consultar semanas anteriores.
- **Diario:** peso corporal, sueño, energía, fatiga, estrés, dolor por zona y comidas
  para una fecha. Meta de sueño editable, aviso por dos noches cortas y gráfico semanal
  de peso con promedio móvil de 7 días. Todo se guarda en IndexedDB, también offline.
- **Medidas:** seis medidas corporales en cm con fecha, cambios contra la anterior
  y la inicial, gráficos y relaciones. Recordatorio quincenal al abrir la app; el
  seguimiento de cintura también aparece en Volumen.
- **Comida:** fases, metas confirmadas, base editable de siete alimentos, registro
  rápido de consumo y gráficos diarios de kcal/proteína contra sus metas.
- **Historial:** navegación año → mes → sesión, detalle completo y comparación
  con la sesión anterior del mismo día de rutina. Filtro por ejercicio y equipo,
  con evolución de 3, 6, 12 meses o todo el historial.

### Fases, alimentación y recuperación

**Primer uso:** registra tu peso real en Diario. En Comida, introduce tu consumo
promedio actual en kcal/día, pulsa **Calcular propuesta**, revisa las metas y
**Confirmar metas nutricionales**. La app no presupone tu consumo ni tu peso.
La propuesta inicial usa consumo +250 kcal en volumen, −400 en mini cut y el
consumo como estimación inicial de mantenimiento; son valores editables. Proteína
inicial: 1,8 g/kg (configurable entre 1,6 y 2,2); grasa mínima: 0,6 g/kg;
carbohidratos: las calorías restantes. Se informa si las metas son incompatibles.

Hoy muestra la fase y el progreso. En Comida puedes editar o cambiar fase, consultar
su trayectoria y el historial de pesos, cintura, cumplimiento y calorías confirmadas.
Volumen apunta inicialmente a 74 kg el 31/12/2026; mini cut está programado desde
el 01/01/2027 hasta 71 kg entre el 15 y el 31/03/2027. Puedes modificar las fechas
y objetivos. Las fases futuras se activan al abrir o guardar desde su fecha y
conservan la fase previa. Cambiar de fase no confirma nuevas calorías.

El ritmo observado compara dos semanas con al menos cuatro pesos por semana;
el peso de referencia diario es el promedio móvil de siete días disponibles.
No se rellenan fechas sin datos. Se informa el ritmo necesario aunque sea
incompatible con el rango previsto. Para sugerir ajustes de 100–200 kcal se
requieren al menos dos semanas de fase, diez días completos de alimentación en
los últimos catorce y 80% de cumplimiento (kcal ±10% y proteína ≥90%). Una subida
de cintura superior a 1 cm impide sugerir aumentar calorías. Preparar un ajuste
solo rellena el formulario: siempre debes confirmarlo.

En Hoy, **Generar 4 comidas** calcula cantidades usando exclusivamente pan, huevo,
arroz cocido, pollo, sopaipillas, empanadas de queso y galletas. Usa pollo y huevo
para proteína, arroz y pan para carbohidratos y busca respetar la grasa mínima.
Las cantidades discretas pueden dejar diferencias: se muestran, sin inventar
alimentos. Los snacks se incorporan si hacen falta o los seleccionas, con un
máximo del 20% de kcal en volumen, 10% en mini cut y hasta 20% configurable en
mantención. El reparto de proteína muestra la referencia de 30–40 g por comida.

Las comidas alrededor de pesas reciben más carbohidratos; pierna concentra una
proporción mayor. La hora de entrenamiento es editable: comida previa 90 minutos
antes y posterior una hora después. En descanso se mantienen las cuatro comidas
y la proteína; puedes reducir 0–10% las kcal desde carbohidratos. El calendario
permite cambiar tipo de día, rutina y hora; regenera explícitamente el plan para
aplicar la distribución. El presupuesto semanal distingue metas de consumo real.

**Comida realizada** registra una sola entrada por comida. Puedes ajustar las
cantidades reales, añadir alimentos, desmarcar y volver a marcar sin duplicar.
Plan y consumo se guardan por separado. Comida permite también registrar alimentos
sueltos, editar o eliminar consumos y consultar otras fechas. Marca **Registros
del día completos** solo cuando corresponda: la alerta de proteína necesita tres
fechas consecutivas completas bajo meta; las fechas vacías no cuentan como fallo.
Descartar una alerta evita repetirla durante la misma racha.

Los siete alimentos tienen porción y macros editables permanentemente; el pollo
indica crudo o cocido. **Valores aproximados. Edítalos según la etiqueta nutricional
de tu producto.** Las referencias iniciales de alimentos comunes se basan en la
[tabla de composición de USDA](https://www.ars.usda.gov/ARSUserFiles/oc/np/NutritiveValueofFoods/NutritiveValueofFoods.pdf);
las kcal orientativas de sopaipilla y empanada de queso en la
[referencia de Universidad Autónoma de Chile](https://www.uautonoma.cl/noticias/cuantas-calorias-consumiremos-en-estas-fiestas-patrias/).
Las porciones, recetas y macros varían; no sustituyen una etiqueta específica.
Editar la base recalcula los registros nuevos, mientras que los planes y consumos
guardados conservan la composición original. Las comidas antiguas de Diario se
incluyen una sola vez en kcal y proteína; no se inventan sus carbohidratos ni grasa.

Las metas de un día se congelan al planificar o registrar consumo. Las revisiones
confirmadas no sobrescriben esas metas históricas. Un cambio de calendario conserva
la versión anterior y recalcula únicamente la distribución del día seleccionado;
los consumos anteriores mantienen su propia referencia. Los planes regenerados
tienen historial. Todas las fechas usan el calendario de **America/Santiago**.

Cardio aparece después de las pesas: volumen 10–15 min, 3–4 días/semana;
mini cut 20–30 min zona 2, 4–5 días; mantención 15–20 min, 3 días. Pierna propone
solo caminata suave opcional. Fatiga ≥8 o dos noches consecutivas con menos de 7 h
recomiendan reducir o saltar. Un estancamiento de dos semanas durante mini cut
permite confirmar 5–10 minutos adicionales; nunca se aplica solo. Registrar una
sesión marca realizado; también puedes marcar omitido. La frecuencia cuenta días
distintos, conserva minutos e historial y no compensa omisiones.

En descanso aparece **Recuperación de hoy** con casillas persistentes por fecha
para sueño, pasos según tolerancia, movilidad, hidratación, peso y sensaciones.
El domingo añade revisión semanal y medidas si corresponde. **Descanso cumplido**
se puede marcar independientemente de las tareas opcionales.

Para probar el flujo nuevo:

1. Registra 70 kg y consumo base de 2200 kcal: la propuesta de volumen debe ser
   2450 kcal; no cambia ninguna meta hasta confirmar.
2. Genera cuatro comidas en Hoy. Marca una, recarga, desmárcala y vuelve a marcar:
   debe existir un único consumo. Edita un alimento en Comida: los registros
   anteriores conservan sus valores; los nuevos usan la edición.
3. Cambia el calendario entre pesas, pierna y descanso; regenera para comprobar
   horarios, carbohidratos y presupuesto. En domingo marca Descanso cumplido sin
   completar las otras casillas y recarga.
4. Confirma una fase diferente y revisa el historial. No deben cambiar las calorías
   sin una confirmación aparte. Registra fatiga 9 para ver la recomendación de
   reducir cardio. Cierra tres días completos bajos en proteína para ver la alerta.
5. Espera Offline listo, desconecta y recarga: planes, consumos, fases y casillas
   siguen disponibles. Prueba también con un ancho de pantalla de 390 px.

### Medidas corporales

Se cargan una sola vez los valores iniciales del **15/10/2026**: bíceps en pose
35 cm, antebrazo 31,5 cm, cintura 70 cm, pecho 100 cm, muslo 59 cm y pantorrilla
35,2 cm. Cada fecha tiene una medición editable; guardar otra vez la misma fecha
actualiza el registro, sin duplicarlo. Puedes guardar medidas parciales; vacío
significa «sin dato», nunca 0 cm. La medición inicial también es editable si necesitas
corregirla; los cambios contra la inicial usarán sus valores corregidos.

El cuadro muestra el último dato disponible hasta la fecha elegida para cada medida,
con su fecha y diferencias contra la medición anterior disponible y la inicial.
Las relaciones **pecho/cintura** y **bíceps/pantorrilla** usan valores de la misma
fecha, sin mezclar días. Cada medida tiene gráfico de los últimos 20 registros y
tabla de todos los datos guardados.

El calendario parte del jueves 15/10/2026 y repite cada **14 días**: 29/10, 12/11,
26/11, etc. Un control completo con las seis medidas cierra el recordatorio del
período, aunque se registre tarde, sin mover el próximo jueves. Una anotación
parcial no lo cierra. La app recuerda medir en ayunas y en las mismas condiciones,
con el cuerpo relajado y el bíceps en pose. La casilla permite registrar si se
cumplieron esas condiciones; no se presupone que los datos iniciales las confirmen.

Cuando hay un control pendiente, aparece un aviso al abrir la app con acceso a
Medidas. Es un recordatorio dentro de la PWA; no depende de notificaciones push ni
de un servicio que se ejecute con la app cerrada.

En **Volumen** aparece un aviso si la última cintura registrada subió **más de
1 cm** frente al primer dato disponible dentro del mes calendario anterior a esa
medición. Exactamente 1 cm no lo activa. Los límites de mes se ajustan al último
día válido (por ejemplo, de 31 de marzo a 28 de febrero). Se muestran ambas fechas
y el cambio real, sin extrapolar si falta una comparación dentro del mes. Un
registro de cintura de hace más de un mes respecto de la fecha seleccionada no
genera un aviso actual.

Para probar: abre Medidas el 15/10 y verifica los valores precargados. Registra las
seis medidas el 29/10 y el 12/11 para ver los cambios y el gráfico. Una cintura de
71,2 cm el 12/11 frente a 70 cm del 15/10 debe activar el aviso en Volumen. Recarga
sin conexión y comprueba que las mediciones y el diario permanecen guardados.

### Diario y comidas

Los campos del diario son opcionales: dejar vacío significa «sin dato», y 0 horas
de sueño sigue siendo un dato válido. La calidad del sueño y el estrés usan escala
1–5; energía y fatiga 1–10. La fecha corresponde al día en que termina la noche.
La meta de sueño es 8 h inicialmente y se configura dentro de Diario.

El aviso requiere dos fechas consecutivas con menos de 7 h cada una. No interpreta
una noche ausente como 0 h. Se muestra para el último par registrado hasta la fecha
seleccionada si termina ese día o el anterior; 7 h exactas no activa el aviso.

El gráfico cubre la semana local de lunes a domingo. Cada promedio utiliza los pesos
disponibles de los 7 días calendario terminados en esa fecha, incluidos los de la
semana anterior. Se muestra el número de observaciones (por ejemplo, 3/7); no se
inventan pesos para completar días vacíos. La tabla permite leer cada valor del gráfico.

Las comidas guardan nombre, kcal y gramos de proteína de tu porción, con totales
diarios, edición y eliminación. Pan con huevo, Pollo con arroz y Snack vienen como
favoritos sin valores nutricionales: introduce tus kcal/proteína y pulsa **Guardar
como favorito**. Después, tocar el favorito carga esos valores sin registrar una
comida automáticamente. También puedes guardar otros favoritos.

Para probar: registra 6 h de sueño en dos fechas consecutivas y comprueba el aviso;
registra 70 y 72 kg en esas fechas y comprueba un promedio de 71 kg con 2/7 datos.
Guarda una comida y un favorito, recarga sin red y verifica que ambos se conservan.

La rutina viene cargada exactamente con los ejercicios, orden, series y
extensiones solicitados. Se considera `+drop` o `+rp` una extensión de una de las
series efectivas del ejercicio, sin multiplicarla automáticamente por cada serie.

## Registro y conteo de series

| Tipo | Registro | Volumen semanal |
| --- | --- | --- |
| Calentamiento / aproximación | Separados; siempre sin fallo | No suma |
| Efectiva | Carga, repeticiones, RPE 0–10 y casilla «llegué al fallo» | 1 serie para su músculo principal |
| Drop set / rest-pause | Vinculados a una efectiva del mismo ejercicio y fecha | Extensión; no suma otra efectiva |
| Forzadas / negativas | Desactivadas por defecto; habilitación individual en el editor | Extensión; no suma otra efectiva |

Cada mini-serie de rest-pause y cada reducción de un drop puede registrarse como
otra extensión vinculada a la misma efectiva. No se atribuye volumen indirecto a
otros músculos. El contador registra la efectiva incluso si desmarcas el fallo,
y el historial conserva ese dato. Eliminar una efectiva elimina sus extensiones.
Todas las series nuevas guardan RPE; puedes ajustar el valor propuesto antes de
guardar (6 en preparación y 10 en trabajo a fallo). Los registros antiguos sin
RPE muestran «sin dato»; no se inventa un esfuerzo retrospectivo.

Las metas solicitadas se conservan como referencia, sin modificar la rutina para
hacerlas coincidir con el plan:

| Músculo | Meta | Plan inicial |
| --- | ---: | ---: |
| Pecho | 8 | 9 |
| Espalda | 9 | 9 |
| Hombro | 8 | 8 |
| Bíceps | 8 | 8 |
| Tríceps | 6 | 7 |
| Cuádriceps | 6 | 6 |
| Femoral | 4 | 3 |
| Aductor | 1 | 1 |
| Gemelo | 1 | 2 |

Hiperextensiones se asigna a femoral; sóleo y gemelos a gemelo. Puedes cambiar
el músculo principal en el editor. Editar la rutina modifica el plan mostrado para
cualquier semana; los registros ya realizados conservan nombre y músculo originales.

## Preparación y descanso

Cada ejercicio conserva un peso de trabajo y reps objetivo. Sin referencia ni
historial aparece **Ingresa tu peso de trabajo** en el propio ejercicio. Al
escribirlo ya se ven todas las sugerencias, antes de registrar la efectiva.
**Guardar peso de trabajo** persiste la referencia; guardar una preparación o
serie también conserva la referencia introducida. Una efectiva actualiza
automáticamente el peso de trabajo con su carga real; las reps objetivo se
mantienen según tu elección. En mancuernas todo se expresa **por mano**.

Los ejercicios de la rutina original con el mismo nombre y equipo comparten
referencia, notas e historial entre días. Las series del día y las extensiones
siguen vinculadas a su ejercicio y fecha, sin duplicar volumen.

Las previas dependen del orden de la rutina elegida para la fecha, sin exigir
historial previo. **Auto** recalcula al reordenar, editar músculo/equipo/tipo o
corregir el calendario. Cada ejercicio muestra **Series previas: N** y su motivo.

| Contexto automático | Sugerencias desde el peso de trabajo |
| --- | --- |
| Primero del músculo o zona | 2: 50% × 10–12 (se propone 10), 75% × 8 |
| Compuesto posterior del músculo ya trabajado | 1 ligera: 60% × 8 |
| Primer aislamiento o máquina tras trabajar el músculo | 1 muy ligera: 45% × 10 |
| Aislamiento o máquina posterior | 0 |

La clasificación de máquina tiene prioridad sobre compuesto; el tipo y equipo se
pueden corregir en Rutina. Cada músculo tiene preparación independiente: hombro
tras pecho cuenta como primero. **Zona o articulación de preparación**, opcional
en Rutina, permite distinguir otra articulación dentro del mismo músculo; la
primera aparición de esa combinación músculo/zona vuelve a tener dos previas.

En Hoy, pulsa **0, 1, 2 o 3** bajo el ejercicio para guardar una elección con un
toque; **Auto** vuelve a las reglas. La elección pertenece a esa entrada de la
rutina y se recuerda entre fechas, sin copiarse a otros días. También se edita en
Rutina. Si eliges dos se usan 50% × 10 y 75% × 8; tres usa 40% × 10, 60% × 6 y
80% × 3. Una usa 45% × 10 si el contexto es aislamiento/máquina ya trabajado, o
60% × 8 en el resto. Cambiar la cantidad no borra previas realizadas.

En **Preparación: ajustes globales y opcionales**, el **mínimo de previas** es
0 inicialmente y admite 0 o 1. Actúa como límite inferior también sobre las
elecciones personales; elegir 0 con mínimo 1 conserva tu preferencia, pero muestra
y propone una hasta que bajes el mínimo. Los botones y motivos aclaran ese ajuste.

Redondeo al múltiplo más cercano, configurable por ejercicio: barra 2,5 kg,
mancuernas 1 kg, máquina y polea 5 kg. Si subir al múltiplo más cercano superaría
el **80% de la referencia**, se baja al mayor incremento permitido. Cargas muy
pequeñas pueden dar 0 kg. Las previas manuales o sugeridas se rechazan si superan
ese 80% o indican fallo; no se altera silenciosamente una carga real registrada.

Cada preparación muestra el peso en grande, reps y RPE editables. Con un toque en
**Guardar** se registra y queda marcada, siempre sin fallo y fuera del volumen.
Conserva su referencia original, aunque después cambie el peso de trabajo.

Los opcionales están **apagados inicialmente**: calentamiento general de 5–10 min
(duración editable, inicialmente 5) y dos series de rotadores de 12 repeticiones
sin fallo antes de un día de press. Se considera día de press si hay un ejercicio
con «press» en el nombre o un compuesto principal de pecho/hombro. Cada actividad
tiene casilla persistente por fecha; los rotadores solo aparecen en esos días.
No suman volumen ni sustituyen las previas individuales. En descanso no se
proponen estas actividades de pesas. Funcionan también durante descarga sin
reactivar técnicas de intensidad.

**Drop set:** 1 caída por defecto, hasta 3. Cada una propone 20% menos que la
anterior, con redondeo. Si ajustas y registras una caída, la siguiente se calcula
desde ese peso real. Introduce las reps reales y guarda cada caída por separado,
a fallo, con 10–15 s solo para cambiar carga.

**Rest-pause:** 2 mini-series por defecto (editable de 1 a 10). Mismo peso exacto
de la efectiva, sin redondearlo otra vez, descanso de 15–20 s y meta 3–5 reps a
fallo (se propone 4, editable). Cada mini-serie se guarda por separado.

Antes de guardar una efectiva las extensiones son una vista previa del peso de
trabajo. Después usan su carga real y se habilita el guardado. Si hay varias
efectivas, puedes elegir a cuál vincular las extensiones.

Descansos iniciales, editables en segundos:

- Calentamientos / aproximaciones: 90 s (1–2 min).
- Antes de efectiva compuesta: 210 s (3–4 min).
- Antes de efectiva de aislamiento: 150 s (2–3 min).
- Rest-pause: 20 s entre mini-series.
- Drop set: 15 s para cambiar la carga.

Guardar una serie inicia el descanso correspondiente. La última aproximación
inicia el descanso previo a la efectiva; una efectiva con técnica planeada inicia
el intervalo corto de drop o rest-pause. Los botones de descanso permiten iniciar
manualmente los intervalos entre técnicas. El temporizador usa una hora de fin
persistida, por lo que se recupera al recargar o volver del segundo plano. La
vibración depende del navegador; no se prometen alarmas con la app cerrada.

### Historial, notas y cardio

La serie anterior del mismo ejercicio permanece visible encima del formulario,
con fecha, peso, reps, RPE y fallo. **Historial del ejercicio** muestra todas las
series (20 por página) y un gráfico de la mayor carga efectiva por sesión para
el equipo actual, con las últimas 20 sesiones. Cada punto conserva fecha y reps.
Las notas son editables y persisten por ejercicio.

**Cardio y pasos**, dentro de Hoy, guarda sesiones independientes de caminata
inclinada, bici o trote suave: minutos e intensidad suave/moderada/alta. Puedes
añadir varias sesiones en una fecha y eliminarlas individualmente. Los pasos son
un total diario opcional; guardar el campo vacío elimina ese dato, sin ponerlo a 0.
Ni cardio ni pasos alteran el volumen semanal.

### Cómo probar cada sugerencia

1. Abre el lunes y **Press banca** sin historial. Debe pedir el peso de trabajo.
   Ingresa **100 kg**: aparecen **50 kg × 10** y **75 kg × 8**. Guarda una
   preparación con un toque; debe quedar marcada y no sumar volumen.
2. En **Press declinado**, ingresa **100 kg**: antes de la efectiva se ve una
   caída a **80 kg**. Guarda la efectiva con **90 kg**: la referencia pasa a 90
   y la caída a **72,5 kg**. Escribe las reps de la caída y guárdala aparte.
3. En **Curl mancuernas sentado**, ingresa **20 kg por mano**: aparecen dos
   mini-series de **20 kg × 4**. Guarda la efectiva y luego ambas mini-series;
   el temporizador debe iniciar 20 s y el volumen sumar solo la efectiva.
4. Bajo Press banca, cambia previas a **1** para ver **60% × 8** o a **3** para
   ver **40% × 10; 60% × 6; 80% × 3**. Con máquina/polea y **100 kg**, tres
   caídas dan **80, 65 y 50 kg** usando redondeo a 5 kg.
   En Auto, Press declinado muestra 60% × 8, Aperturas mancuernas 45% × 10 y
   Aperturas máquina ninguna. Elevaciones laterales vuelve a tener dos por ser el
   primer ejercicio de hombro. Cambia el mínimo global a 1 y comprueba que ya no
   se propone cero; recarga offline para verificar tus ajustes y casillas.
5. Recarga: referencia, series, RPE y notas deben seguir ahí. Registra otra
   fecha para ver un segundo punto en el gráfico. Añade cardio y pasos, activa
   Offline en DevTools y vuelve a recargar: todo debe permanecer disponible.

## Progresión, técnicas y descarga

En cada ejercicio de Hoy, **Progresión · regla y motivo** explica la recomendación.
El rango de doble progresión es editable en ese panel (inicialmente 8–12 reps;
si tu objetivo previo era mayor, se conserva). Se compara la primera efectiva de
cada fecha, del mismo ejercicio y equipo, sin mezclar preparaciones, extensiones
o series marcadas como descarga. Varias series de una fecha no cuentan como
varias sesiones.

- Llegar al tope del rango al fallo propone el menor aumento disponible entre
  **2,5 y 5%**, respetando el incremento del equipo. Si ningún incremento cabe en
  ese intervalo, lo informa y conserva la referencia. La propuesta usa una sesión
  de los últimos 14 días y se puede aplicar una sola vez por efectiva.
- **Aplicar referencia** actualiza el peso de trabajo compartido, reinicia la meta
  de reps al mínimo del rango y conserva un evento con motivo y valor anterior.
  Las preparaciones se recalculan inmediatamente; las futuras sugerencias de drop
  y rest-pause usan la nueva referencia. Las extensiones de una efectiva ya
  registrada siguen usando su carga real, sin alterar esa serie retrospectivamente.
- Si carga o reps bajan en **dos sesiones consecutivas**, prioriza mantener y
  revisar ejecución y recuperación; no propone subir simultáneamente.
- Estancamiento: al menos tres sesiones de los últimos 28 días abarcan 21 días,
  ninguna supera la carga o las reps a igual carga de la primera, y la última
  ocurrió hace no más de siete días. Los días sin entrenamiento no bastan para
  detectar estancamiento. Ofrece probar **drop set o rest-pause** en esa sesión.

Se introduce como máximo una técnica nueva por fecha, tanto desde la recomendación
como al registrar una extensión no planeada. No se mezclan técnicas en un mismo
ejercicio y sesión. Se conservan las técnicas que ya trae tu rutina. Forzadas y
negativas siguen desactivadas por defecto: requieren activación manual en Rutina y
se pueden registrar en **dos ejercicios como máximo por sesión entre ambas**.
El límite se comprueba también al guardar, no solo en los controles de pantalla.

**Estímulo y recuperación**, en Hoy, muestra los días desde el estímulo efectivo
anterior por músculo principal. Si ya lo trabajaste hoy, lo identifica como esta
sesión, sin confundir la siguiente serie con otra sesión. Advierte antes de
entrenar si pasaron menos de **48 horas** desde la sesión anterior. Las series
guardadas en la fecha actual conservan su hora real; las antiguas o fechadas otro
día no reciben una hora inventada. Sin hora, un día de separación activa el aviso;
dos fechas de separación muestran que no se pueden confirmar 48 horas completas.
Para otras fechas se usa la hora de entrenamiento configurada en Chile.

La descarga se sugiere desde **42 días (6 semanas)** sin una registrada, destacando
cuando se alcanzan 56 días (8 semanas). El inicio del seguimiento o la primera
efectiva disponible sirven de referencia si no hay descargas. También se sugiere
antes cuando coinciden dos semanas con al menos cuatro días por semana de
**fatiga ≥8 y sueño <7 h**, y dos sesiones consecutivas a la baja en un ejercicio
dentro de esos catorce días. No se inventan noches ni fatiga ausentes.

**Confirmar descarga de 7 días** aplica un período por fecha, sin sobrescribir la
rutina base: misma carga de referencia, **50% de series por ejercicio redondeando
hacia arriba** (una serie permanece una), sin técnicas, sin fallo y **RPE máximo 6**.
Las aproximaciones y sus pesos siguen visibles; drop set y rest-pause se ocultan,
y todas las extensiones se bloquean. También se limita el número de efectivas al
guardar. Las cargas reales registradas durante descarga no cambian automáticamente
la referencia normal ni alimentan las recomendaciones de progresión.

Al terminar los siete días vuelve el plan normal automáticamente. Puedes finalizar
al cierre de una fecha anterior; el plan normal vuelve al día siguiente. El historial
de períodos se conserva, incluso al cerrar o recargar sin conexión. Activar una
descarga no cambia los valores de las series que ya habías guardado.

Para probar: registra Press banca con 100 kg, 12 reps y fallo. Aplica la propuesta
de **102,5 kg**: las aproximaciones serán **52,5 y 77,5 kg**. En una sesión futura,
un drop planeado sugerirá **82,5 kg**, y rest-pause **102,5 kg**. Confirma una
descarga: Press banca pasa de dos a una efectiva; permanecen las aproximaciones,
desaparecen las extensiones y el registro propone RPE 6 sin fallo. Recarga offline
y consulta el octavo día para verificar el regreso de la rutina normal.

## Datos locales

IndexedDB (`heavy-duty-personal`, versión 2) guarda rutina, metas, registros y
temporizador, además de referencias, notas, cardio, pasos, diario, comidas y medidas.
El estado interno se migra a esquema 7 en una transacción, sin borrar series ni cambiar IDs,
volumen o descansos personalizados. Las cantidades predeterminadas antiguas pasan
a Auto; las personalizadas que se pueden identificar por diferir del valor
predeterminado anterior se conservan como elección personal. Los datos antiguos
no distinguían una elección igual al valor predeterminado. La referencia se
recupera de la última efectiva registrada cuando existe.

### Base histórica y migración de IndexedDB 1 a 2

La versión de la base (2) y el esquema del estado de la app (7) son independientes.
Al abrir una base de versión 1, una única transacción de actualización crea:

| Colección | Contenido e índices |
| --- | --- |
| `sessions` | Sesiones con ejercicios y series anidadas; fecha, mes, año, ejercicio/equipo y día de rutina |
| `cardio` | Sesiones de cardio separadas; fecha y mes |
| `journal` | Diario por fecha; fecha y mes |
| `measurements` | Mediciones originales; fecha y mes |
| `phases` | Fases, cierres históricos y revisiones nutricionales confirmadas; fecha y mes |
| `sessionRevisions` | Versiones anteriores de sesiones editadas; sesión, fecha y mes |
| `migrationBackups` | Copia íntegra del estado anterior e informe de verificación |

`app` conserva configuración y una caché de compatibilidad para las pantallas
existentes. Al leer, las colecciones históricas son la fuente de los registros;
al guardar, todas las colecciones y la caché cambian en la misma transacción.
Las consultas de Historial usan los índices de año, mes o ejercicio. No hay
depuración por antigüedad ni límite de meses/años; «3 meses» solo filtra la vista.

Cada fecha agrupa los registros antiguos en una sesión, acorde al modelo previo
de una sesión diaria. Conserva todas las series y sus datos originales, incluso
preparaciones y técnicas. La migración comprueba que se puede reconstruir el
contenido anterior sin pérdidas ni duplicados; claves de colección duplicadas
impiden completar la actualización. Si hay un fallo o falta espacio, IndexedDB
revierte la transacción y mantiene la base anterior. No se borra ni sustituye
manualmente la base. Si otra pestaña impide actualizarla, ciérrala y reintenta.

La copia `migrationBackups/v1-original` permanece intacta dentro del mismo
navegador. El informe guarda los recuentos de antes/después. No existe ese informe
en una instalación nueva que empieza directamente con versión 2.

La sesión conserva su día de rutina y fase al crearse, para que editar una fase
o el calendario después no reescriba el pasado. Las series antiguas sin duración,
descanso real, RPE o fase identificable muestran **Sin dato**; no se deducen esos
valores de pausas entre guardados ni de los descansos planeados. Las notas por
ejercicio de las nuevas series se guardan como instantánea.

En Hoy o en el detalle del Historial, **Sesión: duración y notas** permite guardar
minutos reales y notas. En la fecha actual también puedes **Iniciar sesión** y
**Finalizar sesión** para medir la duración real. Cada formulario de serie permite
introducir **Descanso real antes (s, opcional)**; vacío significa desconocido y 0
es válido. El cronómetro de descanso planeado sigue funcionando por separado.

Eliminar series explícitamente desde Hoy conserva una versión anterior de la
sesión, accesible en **Versiones anteriores**; tampoco desaparece la sesión si
queda sin series actuales. Las versiones no se purgan automáticamente. La
comparación usa la sesión anterior con el mismo día de rutina, aunque esté en
otro mes/año, y compara la mayor efectiva con sus reps dentro del mismo equipo.

La app solicita `navigator.storage.persist()` y consulta `persisted()`. Si el
navegador deniega, no admite o no puede completar la petición, muestra un aviso
con reintento. La denegación no bloquea la app. El permiso reduce la posibilidad
de limpieza automática; no impide borrar manualmente el sitio, desinstalar el
perfil o perder el dispositivo. La copia de migración también es local y no es
una copia remota ni una garantía frente al borrado de todo el navegador.

En Edge/Chrome el navegador puede aprobar o denegar sin abrir un diálogo. Al
pulsar **Solicitar almacenamiento persistente**, el botón muestra **Solicitando…**
y después un resultado numerado, aunque vuelva a denegarlo. La app no puede
forzar esa autorización. Véanse las referencias de
[persistencia de MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
y [criterios de almacenamiento del navegador](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

**Descargar copia de seguridad**, disponible en el aviso y en Historial, genera
un JSON con todas las colecciones, configuración, versiones anteriores y copia
de migración, leído en una sola transacción. Guarda ese archivo fuera del
navegador. No modifica los registros ni envía datos a un servidor. La confirmación
indica que se inició la descarga; comprueba el archivo en Descargas. Esta etapa
incluye exportación; todavía no hay un importador de copias en la interfaz.

**Cómo comprobar que conservó tus datos:**

1. Abre la app actualizada en el mismo navegador, perfil y URL donde entrenabas.
   No borres los datos del sitio ni cambies de origen para actualizarla.
2. En **Historial**, abre **Comprobación de la migración v1 → v2**. Debe indicar
   **Migración verificada**, con los mismos recuentos antes/después para series,
   sesiones, cardio, diario, medidas, fases y su historial.
3. Comprueba el total de entrenamientos y el rango de fechas. Elige un año y mes
   antiguos, abre una sesión y revisa pesos, reps, RPE, fallo y técnicas. Contrasta
   también un registro conocido en Diario, Medidas y Cardio.
4. Elige un ejercicio y **Todo**: deben aparecer también las fechas anteriores
   a los últimos 12 meses. Los otros filtros solo cambian la vista.
5. Espera **Offline listo**, desconecta y recarga: las sesiones y las versiones
   anteriores deben seguir disponibles.

Si estás usando el servidor de desarrollo en `localhost:5173`, ese modo no instala
service worker. Para comprobar offline con tus mismos datos locales, detén Vite,
ejecuta `npm run build` y sirve `npm run preview -- --port 5173` en ese mismo
origen. Cambiar a 4173 o a GitHub Pages muestra un almacenamiento distinto;
eso no significa que la migración haya borrado el de 5173.

Verificación técnica opcional: DevTools → Application → IndexedDB →
`heavy-duty-personal` debe mostrar versión 2, las colecciones anteriores y
`migrationBackups/v1-original`. El estado original no se envía a GitHub ni a un
servidor. Las pruebas crean una base v1 aislada, comprueban la copia exacta y sus
índices, y fuerzan un fallo para demostrar la reversión a v1 sin cambios.
Las modificaciones se confirman después de completar la transacción;
si el navegador rechaza el almacenamiento se muestra un error, sin fingir un guardado.
Las actualizaciones usan transacciones de lectura/escritura para conservar registros
añadidos desde otra pestaña. Para refrescar su vista, recarga la pestaña.

El service worker precachea HTML, JavaScript, CSS, manifest e iconos locales.
No se necesitan fuentes, CDN ni APIs remotas durante el uso. La primera visita
necesita conexión para descargar la aplicación completa.

Los datos pertenecen al navegador, perfil y origen usados (host y puerto).
Cambiar de puerto, navegador o dispositivo crea otro almacenamiento. No hay
sincronización ni copia de seguridad remota; borrar los datos del sitio elimina el
historial. El modo privado o la limpieza automática pueden descartar datos locales.

## Menú lateral y navegación entre sesiones (PROMPT 9)

El botón **Menú** abre un cajón desde la derecha. En **Menú → Ajustes → Lado
del menú** puedes elegir izquierda; la preferencia se guarda en IndexedDB.
También se abre deslizando hacia dentro desde los 16 px del borde elegido.
Se cierra con ×, Escape, tocando fuera o deslizando su encabezado hacia el borde.
El diálogo mantiene el foco dentro y lo devuelve al botón al cerrar.

El cajón muestra los siete días de la semana seleccionada, los descansos, la fecha
actual marcada **Hoy** y la sesión seleccionada. Incluye Historial, Medidas,
Diario, Progreso (volumen semanal), Rutina, Comida, Método y Ajustes. Los accesos
inferiores existentes siguen disponibles.

En **Hoy**, las flechas y la franja **Una sesión a la vez** cambian entre las
sesiones de la semana seleccionada; saltan descansos y se desactivan en los
extremos. El calendario y el cajón permiten consultar también los descansos.
**Ver la misma sesión de la semana pasada** abre una comparación del día exacto
de siete días atrás: carga de referencia actual frente a todas las efectivas
registradas, con opción de abrir aquella sesión. Si falta un registro, se indica
sin inventar pesos. Las mancuernas siguen expresadas por mano.

Antes de abandonar Hoy con registros pendientes, una sesión iniciada sin finalizar
o series parcialmente completadas, se guardan los borradores y se pide confirmar.
Cancelar mantiene la pantalla; aceptar permite cambiar y recuperar los campos al
volver. Se conservan carga, reps, tipo, RPE, fallo, descanso real, ajustes de
aproximaciones/extensiones, notas de ejercicio y sesión, duración, cardio y pasos.
Los borradores se guardan aparte en `app/state.trainingDrafts` de IndexedDB 2;
no se convierten en series ni suman volumen hasta pulsar Guardar. Hay una copia
local de recuperación para recargas anteriores a la transacción. No se borran
automáticamente y la copia JSON de la base también incluye los ya confirmados
en IndexedDB. No se cambian ni eliminan las colecciones históricas.

Si falla el guardado del borrador, la navegación permanece en la pantalla con un
error y permite reintentar. Los gestos solo actúan en el borde reservado y en la
franja de navegación, nunca sobre gráficos, tablas ni campos de entrada. El
desplazamiento vertical permanece disponible.

El aviso de almacenamiento ahora es una tarjeta oscura compacta; despliega
**Protección y copias de seguridad** para solicitar permiso, consultar el resultado
o descargar el respaldo. La decisión del navegador no ha cambiado.

Para comprobarlo:

1. Recarga en el mismo navegador, origen y puerto que usabas, sin borrar datos.
   Abre el aviso desplegable: el permiso y la descarga siguen funcionando.
2. Abre Menú, comprueba Hoy y los descansos. Cambia el lado en Ajustes, recarga
   y prueba deslizar desde ese borde. Comprueba también Escape y ×.
3. Selecciona un lunes: siguiente va a martes y después a jueves. Desliza la
   franja en ambos sentidos; la primera/última sesión limita el recorrido.
4. Escribe una carga y reps sin guardar, cambia de sesión y cancela el aviso.
   Repite y acepta. Regresa: deben mantenerse; recarga y vuelve a esa fecha.
   Repite con una aproximación, caída o mini-serie y con notas/cardio.
5. Compara una sesión que tenga registros exactamente siete días antes. Comprueba
   las cargas anteriores y mueve el dedo sobre un campo o gráfico: no debe navegar.

La suite de navegación comprueba confirmación y cancelación explícitas. Los tests
de funciones previas aceptan esa confirmación mediante un fixture compartido
porque sus escenarios dejan entrenamientos parciales al ir a otra pantalla.
Implementación y pruebas asistidas por Codex; las capturas usan datos ficticios.

## Verificación

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas de lógica verifican la rutina, descansos, fechas locales, volumen y
extensiones. Las de navegador comprueban IndexedDB tras recargar, edición de
rutina, técnicas opcionales, recarga y escritura offline, días de descanso y
ausencia de desbordamiento horizontal entre 320 y 1440 px.
También verifican fases y cierres programados, promedios, elegibilidad de ajustes,
metas congeladas, base alimentaria e historial, planes de cuatro comidas, límites
de snacks, calendario, consumo sin duplicados, alertas, cardio y recuperación.
Los cálculos y componentes nuevos se organizan en `src/program/`; la persistencia
reutiliza las transacciones existentes de `src/db.js`.

Los iconos PNG se incluyen en `public/`; para regenerarlos a partir de la marca
geométrica propia: `node scripts/generate-icons.mjs`.

Referencias de implementación: [build de Vite](https://vite.dev/guide/build)
y [service workers de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

## Flujo del repositorio

- Rama de este proyecto: `templates/inicio`.
- Un commit por etapa, con mensaje claro; push al terminar cada etapa.
- Proponer cambios a `main` mediante Pull Request.
- Nunca subir claves, tokens ni archivos `.env`.
- Revisar `git diff --cached` antes de cada commit.

`.gitignore` excluye dependencias, `dist/`, archivos de entorno, claves locales y
resultados de pruebas. Implementación asistida por Codex; la revisión humana queda
a cargo del propietario del repositorio.

## Navegación simplificada (PROMPT 10 A)

La barra inferior fue eliminada, incluido su espacio reservado. El botón discreto de menú queda en la esquina del lado elegido en Ajustes; la app respeta las áreas seguras del sistema. El cajón es la única navegación y se cierra tocando fuera, con gesto, Escape o Atrás. Allí están Hoy, Historial, Medidas, Diario, Comida, Progreso, Método, Ajustes y Rutina, además de fechas y comparación semanal.

Al abrir siempre se entra en Hoy, recuperando la última fecha de entrenamiento seleccionada en IndexedDB. El permiso de almacenamiento y la instalación se consultan desde Ajustes. Los paneles secundarios de Hoy están plegados; el registro y sus borradores conservan su lógica.

Comprobación: recarga y confirma que no hay barra inferior ni hueco fijo; abre el menú y visita cada sección; elige otra fecha, recarga y comprueba que vuelve a ella en Hoy; cambia izquierda/derecha en Ajustes y prueba Atrás con el cajón abierto.

## Progreso y revisión mensual (PROMPT 10 B)

**Menú → Progreso** muestra un mensaje calmado y tres tarjetas con icono, estado,
motivo, acción y reglas desplegables. No cambia pesos, rutina, técnicas ni metas.
El volumen semanal anterior sigue disponible en **Series semanales por músculo**.

- **Rendimiento:** mejor carga × reps efectiva por ejercicio y sesión, promediada
  en bloques consecutivos de 28 días. Compara el mismo ejercicio y equipo en ambos
  bloques, con al menos dos sesiones por bloque; cada ejercicio comparable tiene
  el mismo peso en el indicador. Incluye press banca/inclinado/militar, jalón,
  remos, hack squat y prensa; excluye gemelos en prensa, previas, extensiones y
  descarga. Verde desde +1%; ámbar para ±1% y descensos aislados, incluida la zona
  de −1% a −2%. Rojo solo si tanto la comparación actual como la anterior caen
  más de 2%, con los mismos ejercicios en tres bloques de cuatro semanas.
- **Cuerpo:** diferencia entre los promedios de las dos últimas semanas de siete
  días, con al menos cuatro pesos por semana, dentro de la fase actual. En volumen,
  verde exige +0,25–0,5 kg/semana, cintura ≤1 cm/mes y las otras cinco medidas
  estables o subiendo. Compara medidas quincenales separadas 10–21 días y recientes
  (≤21 días). Para cintura necesita una separación de 21–40 días y muestra su ritmo
  normalizado a 30 días; superar 1 cm/mes marca rojo. Si faltan mediciones no da
  verde. En mini cut exige −0,5 a −0,7 kg/semana y rendimiento ≥−1%. Mantención no
  reutiliza los objetivos de otra fase y se muestra como observación.
- **Constancia y recuperación:** sesiones completadas del plan de los últimos 28
  días, promedio de sueño observado y semanas desde descarga/inicio. Verde exige
  ≥85%, ≥7 h (mínimo 14 registros de sueño) y menos de seis semanas desde descarga
  o inicio. Una descarga activa reinicia ese contador; no se activa automáticamente.
  Sesión completada: cierre con efectivas o todas las efectivas previstas. Para
  fechas sin plan histórico se usa la rutina actual con las excepciones del calendario;
  por eso modificar retrospectivamente la rutina puede cambiar este cálculo actual.

Cada tarjeta exige al menos cuatro semanas observadas antes de evaluar; los días
ausentes no se rellenan. Muestra «datos insuficientes, vuelve en X semanas». La
comparación de rendimiento necesita además un bloque previo comparable: con solo
cuatro semanas disponibles todavía no hay ocho semanas para comparar. Un
estancamiento de una a tres semanas nunca produce rojo de rendimiento.

El día 1 se guarda la revisión del **mes recién cerrado**, con los tres estados,
sus valores y el cambio frente a la revisión anterior (puntos porcentuales para
rendimiento/constancia; kg/semana para cuerpo). Sin referencia comparable indica
«sin comparación disponible». Si la app estaba cerrada, prepara los meses pendientes
al abrir; si permanece abierta, comprueba el cambio de fecha cada minuto y al
volver a primer plano. No necesita conexión ni un servidor en segundo plano.

Las revisiones se guardan una sola vez por mes en `app/state.monthlyReviews` de
IndexedDB 2, sin sobrescribirse al editar registros posteriores ni purgarse por
antigüedad. Se consultan todas en **Historial → Revisión mensual**; Progreso solo
muestra la más reciente. La copia JSON también las incluye. No se requiere un cambio
de versión de la base: se añade un campo al estado existente sin borrar colecciones.

Prueba con tus registros habituales: entra en Progreso, abre «Cómo se calcula» y
comprueba que los periodos incompletos no reciben una evaluación. En Historial,
despliega una revisión mensual, recarga y confirma que conserva su mes y sus valores.
Las pruebas automatizadas usan fechas y datos ficticios para comprobar subidas,
dos caídas consecutivas, cambios de equipo, cintura, mini cut, sueño, descarga y
cierre mensual con recarga offline, sin tocar datos del navegador del usuario.

## Guía del método (PROMPT 11)

En **Menú → Método** hay siete secciones desplegables: Filosofía, Tipos de serie, Técnicas de intensidad, Descansos, Recuperación, Progresión y Cómo leer esta app. La primera empieza abierta y puedes consultar el resto de forma independiente, también sin conexión. El texto resume las ideas solicitadas y las reglas ya implementadas, sin citas atribuidas ni cambios de entrenamiento o almacenamiento.

Para comprobar: abre Método desde el cajón, abre y cierra cada apartado (también con Tab y Enter) y comprueba que conserva la lectura en una pantalla estrecha.

## Resúmenes copiables (PROMPT 12)

En **Progreso** e **Historial**, usa **Resumen semanal** o **Resumen mensual**, elige la fecha de corte y pulsa **Copiar**. El semanal compara los últimos siete días con los siete previos; el mensual compara el mes hasta el corte con el mes calendario anterior completo. Las fechas y duraciones quedan explícitas. El texto no se envía a servidores; solo se copia al pulsar el botón. Si el navegador no permite el portapapeles, se selecciona para copiar manualmente.

Incluye series guardadas y técnicas, RPE, fallo y descanso real, volumen por músculo, cardio y pasos, peso y ritmo respecto a la fase, medidas, nutrición, sueño, estrés, energía, fatiga y dolor, fase, descarga y Progreso al cierre de cada período. Los promedios muestran cuántos días tienen datos y no rellenan ausencias con cero. El dolor se conserva como texto por fecha, sin un promedio ficticio. Los borradores no cuentan.

La tendencia de cada ejercicio es descriptiva (media de la mejor carga por reps efectiva de cada día, mismo ejercicio y equipo, sin descarga); no convierte una semana corta en una evaluación de Progreso. Cada período usa su referencia cronológica anterior. En mes, el ritmo de peso compara primera y última media de siete días, normalizado por semana; si el período aún es corto usa los últimos 14 días y lo indica. Los indicadores mantienen sus ventanas propias de cuatro semanas. Ambos textos terminan con la solicitud de análisis indicada por el usuario; la app no genera ni aplica esas recomendaciones automáticamente.

## Exportar e importar todos los datos (PROMPT 13)

En **Ajustes** e **Historial**, abre **Exportar/Importar respaldo**. **Exportar
respaldo** descarga un JSON local con todos los almacenes: rutina, perfiles y pesos
de trabajo, previas y redondeos, sesiones/series y sus versiones, cardio/pasos,
diario, comida, medidas, fases, revisiones mensuales, ajustes y borradores guardados.
El archivo no se envía a servidores. Comprueba que se guardó antes de cerrar el navegador.

Para importar, despliega **Importar un archivo JSON**, elige el archivo y revisa
sus contadores. Seleccionarlo no escribe nada: primero valida identificador,
formato 1, base 2, esquema de datos compatible hasta 7, colecciones, claves, tipos,
rangos y coherencia entre estado e historial. Rechaza versiones futuras, JSON
inválido, claves inseguras y registros inconsistentes antes de habilitar la acción.
Los JSON exportados por versiones anteriores de esta app con formato 1 y base 2
siguen siendo compatibles; las migraciones de esquema necesarias son no destructivas.

- **Combinar** añade registros de IDs distintos. En coincidencias por ID o fecha,
  conserva lo local y completa campos nulos/ausentes. Une ejercicios del mismo día
  con perfil, nombre y equipo equivalentes, aunque dos instalaciones hayan generado
  IDs distintos, y enlaza sus series y borradores al ejercicio local. Los ejercicios
  diferentes se añaden a la rutina. Repetir el mismo archivo no duplica series,
  cardio ni ejercicios. Las variantes en conflicto también quedan en la copia del
  origen importado, aunque la versión local sea la que se muestre.
- **Reemplazar** sustituye la rutina, configuración y registros actuales por los del
  archivo. Es la opción para recuperar la configuración y los registros de una instalación anterior. Las
  copias de seguridad históricas del navegador se conservan.

Solo al pulsar **Combinar este respaldo** o **Reemplazar con este respaldo** se
aplica la operación completa en una única transacción IndexedDB. En esa misma
transacción se archivan el estado anterior (`before-import`) y el origen importado
(`import-source`) en `migrationBackups`; ambos quedan incluidos en futuras
exportaciones. Las versiones históricas con IDs en conflicto se conservan con un
ID nuevo y referencia al original. Si una escritura o la cuota fallan, se revierte
todo, incluso las eliminaciones del reemplazo, y se puede reintentar.

Guarda tus ediciones abiertas antes de importar. Al terminar se recarga la app en
Hoy y se recuperan los borradores incluidos en el estado restaurado. Si tienes
otras pestañas abiertas, recárgalas también para consultar la nueva base.
Los archivos y copias de seguridad pertenecen a ti: mantenlos fuera del navegador.

Junto a **Revisión mensual**, tanto en Progreso como en Historial, aparece un
recordatorio de exportación. Se oculta al iniciar una exportación ese mes y vuelve
el siguiente. El navegador no permite confirmar que conservaste el archivo:
la app registra la descarga iniciada, no una copia externa verificada. Exportar
solo actualiza este marcador; no cambia entrenamientos ni revisiones. El JSON
contiene el estado anterior a actualizar el marcador.

Comprobación recomendada: exporta, conserva el archivo, elígelo en Importar y
revisa los contadores sin aplicar nada. Prueba primero **Combinar**, recarga y
comprueba el historial y los ajustes. Usa **Reemplazar** cuando quieras restaurar
todo el estado de ese archivo. Las pruebas automatizadas verifican ambos modos,
la repetición sin duplicados, importación offline, preservación de campos y
reversión ante una escritura fallida; usan bases aisladas con datos ficticios.
# Diseño BLOOD & GUTS

La interfaz usa fondo `#0A0A0A`, paneles `#161616`, rojo sangre `#C8102E`, activo `#FF1A1A`, texto hueso y gris acero. Anton para títulos/números y Barlow para el cuerpo se sirven desde la propia app; sus licencias OFL están en `src/assets/fonts/`. No depende de Google Fonts ni de fotos externas. Las señales de Progreso conservan sus colores e iconos y sus reglas originales.

En **Menú → Ajustes → Tu identidad** puedes cambiar el nombre BLOOD & GUTS y el lema, pausar el fondo o desactivar tu medio propio. El nombre personalizado se guarda localmente y se incluye en el respaldo; el nombre instalado que muestra el sistema parte del manifest. Los cálculos, datos históricos y reglas de entrenamiento conservan su funcionamiento.

El inicio contiene una silueta SVG original, grano suave y un resplandor rojo lento. Se detienen al ocultar la pestaña o activar movimiento reducido. Guardar una efectiva produce un destello rojo; marcar fallo, una sacudida breve. Las previas se distinguen en gris y las efectivas en rojo. El descanso muestra un anillo que se vacía y termina con una vibración de 120 ms en dispositivos compatibles. `prefers-reduced-motion` desactiva las animaciones, transiciones y la reproducción del video.

## Tu propia imagen o video

1. Coloca un archivo propio en `public/`, por ejemplo `mi-fondo.webp` o `mi-fondo.mp4`. Para video usa un bucle corto, comprimido y sin audio; la reproducción también se fuerza a silenciado. Se admiten MP4/WebM e imágenes WebP/AVIF/PNG/JPG/GIF/SVG.
2. Edita `public/appearance.json`:

   ```json
   {"media":{"type":"video","src":"mi-fondo.mp4"},"poster":"mi-fondo.webp"}
   ```

   Para una imagen: `{"media":{"type":"image","src":"mi-fondo.webp"},"poster":null}`. Para volver a la silueta: `{"media":null,"poster":null}`. El póster es opcional y sirve como fondo estático mientras el video está pausado.
3. Usa rutas relativas a `public/`, sin `/` inicial ni direcciones externas. La compilación comprueba formatos, existencia y que los archivos permanezcan dentro de esa carpeta. El límite conjunto de medio y póster es **8 MiB**; se incluyen en la caché offline y en la versión del service worker.
4. Ejecuta `npm run build`, comprueba `npm run preview -- --port 4175` y publica los archivos mediante commit/PR. No añadas claves ni `.env`.

## Comprobar y publicar este diseño

- URL final: **https://alvarovz14.github.io/Templates/** (respeta la mayúscula de la ruta).
- En GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**. Ya configurado en este repositorio; el workflow publica cada cambio que llega a `main`. Si el cambio está en una rama personal, primero debe aprobarse e integrarse su PR.
- Tras un despliegue correcto de **Publicar PWA en GitHub Pages**, abre la URL con conexión y recarga. Si ya estaba instalada, ciérrala y ábrela otra vez para que tome el nuevo service worker. No borres los datos del sitio. El icono del sistema puede tardar en actualizarse aunque el diseño ya esté actualizado.
- Prueba Hoy, el cajón de ambos lados, Historial, Progreso y Método en móvil; edita nombre/lema en Ajustes y recarga. Ingresa un peso, guarda una previa y una efectiva y marca fallo para ver las diferencias. Activa movimiento reducido para comprobar que se detienen las animaciones. Después de la primera carga, activa modo avión y vuelve a abrirla: fuentes, iconos y fondo configurado siguen disponibles.

## Escenario y previas compactas · Prompt 15

La portada predeterminada está en **`public/hero.jpg`**. La incluida es una ilustración original generada con IA, inspirada en la silueta y el escenario de la referencia aportada por el usuario: no es una fotografía documental de Dorian Yates. Se optimizó a JPEG de 1536 × 1024 px y unos 115 KB. El [prompt de generación](docs/design/p15-image-prompt.md) queda documentado. Puedes reemplazar ese archivo por tu propia imagen en grises y conservar el nombre. Si no existe o no puede abrirse, aparece la silueta SVG original. `appearance.json` sigue permitiendo escoger otro medio para Hoy; el resto de pantallas usa la portada fija de forma muy sutil, sin duplicar reproducción de video.

La compilación añade `hero.jpg` al precaché solo si está presente y renueva la versión al cambiar sus bytes. Se recomienda menos de 2 MiB; el límite combinado de portada, medio propio y póster es 8 MiB. Humo, luz roja y haces suaves se mueven lentamente; se pausan al ocultar la pestaña. Movimiento reducido también detiene el destello del marcador y la pequeña sacudida al marcar fallo. Las imágenes animadas muestran un fotograma estático cuando están pausadas.

Las tarjetas usan corchetes rojos, cortes diagonales decorativos, números de sección y líneas finas; el cajón sigue siendo la única navegación. No cambian las fórmulas de cargas, redondeo, volumen, recuperación ni el formato del historial.

### Probar las series previas

1. En Hoy, toca **PREVIAS · N (Auto)** bajo cualquier ejercicio. La hoja inferior explica el motivo automático y permite elegir 0–3 o Auto.
2. Si falta referencia, escribe ahí el peso de trabajo. Cambia el número y comprueba la vista previa en vivo; guarda para recordar el ajuste. La etiqueta Manual y **Volver a Auto** permiten recuperarlo sin borrar series registradas.
3. Con la tarjeta del ejercicio cerrada, toca una ficha gris con porcentaje, peso y repeticiones. Queda marcada, inicia su descanso y se registra aparte, sin sumar volumen. Un doble toque no crea duplicados.
4. Si necesitas corregir peso, reps, RPE o descanso antes de registrar, abre el ejercicio y usa el formulario de la previa correspondiente, que se conserva.

### Frases del día

Hoy sustituye «A entrenar» por una frase grande. El banco inicial contiene 30 textos originales sin atribuciones. La selección es estable para la fecha de sesión mostrada: en descanso usa el banco de recuperación; entrenando alterna contexto muscular y fase (volumen, mini cut o mantención), con frases generales como alternativa. No cambia mientras registras series.

En **Menú → Ajustes → Frases del día** puedes editar, añadir, eliminar o restaurar los originales; pulsa **Guardar frases** para aplicar. El banco se conserva localmente y viaja en el respaldo JSON. No se consultan APIs externas para elegir frases. El nombre y el lema siguen editándose en Tu identidad.

Para publicar, integra el PR en `main` y espera el workflow de GitHub Pages. La URL continúa siendo **https://alvarovz14.github.io/Templates/**. Con conexión, recarga y vuelve a abrir la PWA para recibir el nuevo service worker, conservando los datos del sitio.

## Escenario interactivo y efectos visuales

El escenario The Shadow reutiliza `public/hero.jpg` o la silueta SVG local. Con efectos completos, el cursor o el dedo controla las capas y el foco rojo; mantener pulsado tensa la figura y hace latir el marcador. Soltar produce un pulso y un toque muestra una frase del banco local durante 2,8 segundos. Con teclado: Enter para frase, espacio para mantener y Escape para detener. El scroll vertical conserva su funcionamiento.

En **Menú → Ajustes → Tu identidad → Efectos visuales** se elige Completos, Reducidos o Apagados y se pulsa **Guardar apariencia**. El fuego lateral y la inclinación se describen en el Prompt 18, al final de este README. La configuración y el banco de frases continúan incluidos en el respaldo; los efectos no modifican datos de entrenamiento.

## Previas, laterales y manzana · Prompt 17

**Rutina → Tipo de carga** separa Compuesto pesado, Compuesto liviano y Aislamiento del **Equipo**. También puedes corregir el patrón de movimiento. El tipo pesado exige dos previas en Auto aunque sea máquina o polea; el liviano, una. Un aislamiento primero para el músculo conserva dos. Se aplica el mayor entre el orden y el mínimo de carga. El editor estima la secuencia; en Hoy la excepción de una previa solo se activa después de registrar una efectiva de un pesado anterior del mismo patrón/zona y fecha. Presses de pecho comparten patrón; press militar, jalón, remo y empuje de pierna tienen patrones distintos. No se deduce la excepción de otra fecha ni solo de una previa.

Las pesadas usan **50% × 10–12 y 75% × 6–8**; la excepción, **60% × 6**. Las cargas mantienen el redondeo por equipo y el límite del 80 %. Manual 0 se permite con el aviso **Compuesto pesado sin calentar**, incluso con mínimo global 1. Se conserva tu elección y puedes Volver a Auto. La [tabla completa para revisar](docs/rutina-previas.md) incluye todos los ejercicios de lunes a sábado y la aclaración del equipo existente de hiperextensiones.

La actualización añade clasificación y manzana una sola vez mediante marcadores aditivos del estado. No cambia las tablas de IndexedDB, IDs, referencias de carga, elecciones manuales, registros de series, consumos ni planes históricos. No reescribe sus nutrientes. El respaldo conserva los nuevos campos y continúa aceptando respaldos anteriores.

**Laterales:** por encima de 1320 px, texto vertical, discos/barra SVG originales, humo y rasguños ocupan solo los márgenes. El canvas existente concentra las brasas allí; en móvil se limitan a bandas finas (actualizadas a 12 px en Prompt 18) y un resplandor fino. No se reserva espacio ni se reciben toques. La pestaña oculta pausa las animaciones; Reducidos deja estática la decoración SVG; el fuego usa su propio modo reducido. Apagados/movimiento reducido del sistema desactiva esa decoración SVG.

**Manzana:** fruta, no snack, unidad mediana con piel de referencia (~182 g); valores aproximados editables: 95 kcal, 0,5 g proteína, 25,1 g carbohidratos, 0,3 g grasa y 4,4 g fibra. Referencias: [guías alimentarias oficiales, tabla de fibra](https://www.dietaryguidelines.gov/sites/default/files/2019-05/2015-2020_Dietary_Guidelines.pdf) y [composición USDA por 100 g, tabla 43](https://www.aphis.usda.gov/sites/default/files/10_16101p.pdf). Las cantidades se redondean a una unidad mediana; pueden variar por tamaño y variedad. No se consultan esas fuentes desde la app.

En **Hoy → Plan de hoy → Manzanas al día** elige 0–2 (por defecto 1) y genera/regenera las cuatro comidas. Se coloca antes de las pesas o en el desayuno durante descanso; se incluye al calcular el resto de porciones y queda fuera del límite de snacks de 20 %/10 %. Solo se sugieren los ocho alimentos de la base. Los planes previos se archivan y los consumos no cambian al regenerar.

En **Comida**, **Fruta del día** registra solo lo que falta para la cantidad configurada. Si luego marcas la comida del plan que ya contiene esa manzana, retira el registro auxiliar para no duplicarla. Si ya procede de una comida o registro rápido, la casilla lo refleja y debes editar ese consumo para modificarla. **Fibra diaria** suma únicamente los valores guardados con cada consumo; indica «Sin datos» o «parcial» cuando falta fibra histórica. Puedes editar fibra en cada alimento, sin cambiar el pasado.

Para probar: abre viernes con una sesión vacía y comprueba hack/prensa con dos previas; registra una efectiva de hack y verifica prensa a 60 % × 6. Elige Manual 0 en hack, recarga y vuelve a Auto. Revisa el resto de días con la tabla. En escritorio ancho mueve el cursor por los márgenes y después prueba ocultar la pestaña y los tres modos visuales. Genera planes con 0, 1 y 2 manzanas; marca Fruta del día y luego su comida, y comprueba que no se duplican. Edita la fibra de la manzana: los consumos anteriores deben conservar 4,4 g. Recarga sin conexión para verificar persistencia.

## Fuego lateral y descansos dinámicos · Prompt 18

El canvas propio reemplaza el polvo/ondas anteriores por chispas rápidas y brasas lentas. Cada partícula nace abajo, asciende con balanceo, se encoge y pasa de amarillo anaranjado a naranja, rojo activo, rojo sangre y rojo oscuro antes de apagarse. Los halos y estelas usan mezcla aditiva `lighter`; los brillos se precalculan, sin desenfoques por partícula. Un calor rojo-anaranjado pulsa lentamente en la base y aparecen ráfagas ocasionales.

El dibujo se recorta a los márgenes fuera de la columna central: nunca pinta en su centro. En ventanas estrechas usa bandas de 10 px y en móvil, 12 px, sin reservar espacio ni recibir eventos. Mover el cursor por un lateral aparta las partículas; hacer clic allí lanza una ráfaga desde ese punto. Los controles quedan excluidos. Se reutiliza un solo canvas y se conserva la decoración SVG anterior.

- **Completos:** 100 partículas por lado en escritorio (80 si se adapta a un equipo lento), hasta 120 con ráfagas; 20 en total en móvil, con máximo 25 al hacer ráfagas.
- **Reducidos:** mitad de partículas, sin ráfagas ni parpadeo, a un máximo de 30 dibujos por segundo. El escenario conserva su imagen fija.
- **Apagados:** sin fuego. La preferencia de movimiento reducido del sistema y el control de pausa del fondo dejan solo calor estático, sin partículas ni parallax.
- Retina se limita a 2× (1,5× en móvil) y 2,5 millones de píxeles. Mientras un campo de series, previas, referencia o notas tiene el foco, se reducen cantidad/intensidad, se limita a 30 dibujos/s y se desactivan las ráfagas. Ocultar la pestaña cancela el bucle y las escuchas; no se acumulan ráfagas para la vuelta.

**Inclinación opcional:** está apagada al abrir Hoy y no se guarda como preferencia activa. Los computadores y dispositivos sin API compatible no muestran la opción. En móviles sin permiso obligatorio se confirma disponibilidad con una lectura válida; en los que exigen permiso, aparece el botón compatible y solo se solicita al tocarlo. Las primeras muestras vacías se toleran durante tres segundos; si no llega ninguna válida después de activar, se oculta el control y sigue funcionando el dedo. La mera existencia de la API no demuestra que haya hardware; algunos navegadores solo permiten confirmarlo después del permiso. No se fuerzan solicitudes ni se activa el efecto al detectar el sensor. [Especificación de orientación](https://www.w3.org/TR/orientation-event/).

**Descanso:** el mensaje busca la siguiente fecha con ejercicios desde la fecha consultada, aplicando rutina y excepciones del calendario. Cruza semanas y bloques de descansos; no fija un límite arbitrario de siete días. Muestra «mañana» cuando corresponde, el nombre del día calculado y la sesión derivada de los músculos configurados. Si no hay sesiones, lo indica. El título distingue hoy, mañana y otra fecha. Los recordatorios de Medidas también calculan su día desde su fecha quincenal; la revisión de recuperación se llama Revisión semanal. La lista de nombres del calendario se centraliza en `DAYS`.

### Probar esta etapa

1. En escritorio ancho, mira ambos márgenes: las chispas ascienden rápido, las brasas flotan y se apagan antes de arriba. Mueve el cursor y haz clic en el lateral para ver la repulsión y la ráfaga. En móvil, comprueba los bordes finos y el scroll.
2. Escribe un peso en Hoy: el fuego se atenúa y no aparecen ráfagas mientras registras. Cambia a otra pestaña y vuelve. Prueba Reducidos, Apagados y movimiento reducido del sistema. Con el último debe quedar solo el calor fijo.
3. En computador, no debe aparecer Activar inclinación. En un teléfono compatible, comprueba que está desactivada y lee la explicación. Actívala voluntariamente, inclina suavemente y luego desactívala. Si rechazas el permiso o no hay sensor, usa el dedo.
4. Consulta miércoles: debe anunciar jueves y su sesión, normalmente «mañana (jueves): Hombro + Brazo». Consulta domingo: «mañana (lunes)». Si esa fecha no es hoy, el título no debe decir Hoy. El día siguiente al actual usa Mañana.
5. En Rutina, deja libre el siguiente día de entrenamiento y guarda: el mensaje debe saltarlo. Prueba también una excepción de descanso desde Tipo de día y hora de entrenamiento. Si cambias los músculos de la siguiente sesión, su nombre se actualiza.
6. Carga una vez con conexión y recarga offline: todo sigue disponible. La etapa no añade campos persistidos, cambia el formato de IndexedDB ni modifica historial, rutinas o registros por sí sola.
