# Heavy Duty · Registro personal

PWA mobile-first de fisicoculturismo natural, inspirada en Heavy Duty / Blood and
Guts: poco volumen, series efectivas al fallo técnico y ejecución controlada.
Construida con React + Vite. Sin backend, cuentas, analítica ni servicios externos.
El repositorio conserva el nombre **Templates**.

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
2. Instala desde el botón de descarga de la cabecera o el menú del navegador.
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
  preparaciones (1–3), redondeo de cargas, caídas de drop (1–3), mini-series de
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

Primer ejercicio por músculo y compuestos pesados: 2 preparaciones; resto: 1.
Puedes elegir de 1 a 3 por ejercicio en Rutina. No se recalculan al reordenar.

| Preparaciones | Sugerencias desde el peso de trabajo |
| --- | --- |
| 1 | 60% × 8 reps |
| 2 | 50% × 10; 75% × 5 |
| 3 | 40% × 10; 60% × 6; 80% × 3 |

Redondeo al múltiplo más cercano, configurable por ejercicio: barra 2,5 kg,
mancuernas 1 kg, máquina y polea 5 kg. Se redondean las sugerencias; la carga
efectivamente registrada no se altera. Cargas muy pequeñas pueden dar 0 kg o el
mismo peso al redondear: ajusta la sugerencia al material disponible.

Cada preparación muestra el peso en grande, reps y RPE editables. Con un toque en
**Guardar** se registra y queda marcada, siempre sin fallo y fuera del volumen.

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
   Ingresa **100 kg**: aparecen **50 kg × 10** y **75 kg × 5**. Guarda una
   preparación con un toque; debe quedar marcada y no sumar volumen.
2. En **Press declinado**, ingresa **100 kg**: antes de la efectiva se ve una
   caída a **80 kg**. Guarda la efectiva con **90 kg**: la referencia pasa a 90
   y la caída a **72,5 kg**. Escribe las reps de la caída y guárdala aparte.
3. En **Curl mancuernas sentado**, ingresa **20 kg por mano**: aparecen dos
   mini-series de **20 kg × 4**. Guarda la efectiva y luego ambas mini-series;
   el temporizador debe iniciar 20 s y el volumen sumar solo la efectiva.
4. En Rutina, cambia preparación a **1** para ver **60% × 8** o a **3** para
   ver **40% × 10; 60% × 6; 80% × 3**. Con máquina/polea y **100 kg**, tres
   caídas dan **80, 65 y 50 kg** usando redondeo a 5 kg.
5. Recarga: referencia, series, RPE y notas deben seguir ahí. Registra otra
   fecha para ver un segundo punto en el gráfico. Añade cardio y pasos, activa
   Offline en DevTools y vuelve a recargar: todo debe permanecer disponible.

## Datos locales

IndexedDB (`heavy-duty-personal`, versión 1) guarda rutina, metas, registros y
temporizador, además de referencias, notas, cardio, pasos, diario, comidas y medidas.
El estado interno se migra a esquema 5 en una transacción, sin borrar series ni cambiar IDs,
volumen o descansos personalizados. La preparación adopta los nuevos valores
por defecto (2 en primeros/compuestos, 1 en el resto); la referencia se recupera
de la última efectiva registrada cuando existe.
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
