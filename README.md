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

Abre la URL que imprime Vite, normalmente `http://localhost:5173`.
Si ya tienes este repositorio, ejecuta los comandos npm desde la carpeta que
contiene `package.json` (en la copia original: `Templates-main/Templates-main`).

### Instalación y modo offline

El service worker se genera únicamente al compilar, para no cachear el entorno de
desarrollo. Prueba la PWA con:

```sh
npm run build
npm run preview -- --port 4173
```

1. Abre `http://localhost:4173` con conexión y espera **Offline listo**.
2. Instala desde el botón de descarga de la cabecera o el menú del navegador.
   En iPhone: Safari → Compartir → Añadir a pantalla de inicio.
3. En DevTools → Network, activa **Offline** y recarga. Navega por las tres
   pantallas y guarda una serie; seguirá disponible después de otra recarga.
4. Para instalar desde un teléfono, sirve `dist/` en un alojamiento estático con
   **HTTPS**. `localhost` es la excepción permitida para pruebas en el computador;
   abrir la IP local por HTTP en el teléfono no habilita el service worker.

El servidor de preview sirve archivos estáticos; la aplicación no necesita un
backend. La configuración `base: './'` permite publicar `dist/` en un subdirectorio,
por ejemplo `/Templates/`. Este cambio no configura ni publica GitHub Pages.

## Tres pantallas

- **Hoy:** selector de fecha y semana, sesión del día, aproximaciones sugeridas,
  registro y eliminación de series, carga en kg, repeticiones, fallo técnico y
  temporizador. Miércoles y domingo son descanso por defecto.
- **Rutina:** editor por día; añade, quita y ordena ejercicios. Ajusta músculo
  principal, equipo, tipo compuesto/aislamiento, efectivas, extensión planeada,
  aproximaciones y descansos. Pulsa **Guardar cambios** para persistir. Un borrador
  se conserva al cambiar de pantalla dentro de la app, pero no al recargar.
- **Volumen:** meta original, plan actual y efectivas realizadas por músculo,
  para la semana local de lunes a domingo. Permite consultar semanas anteriores.

La rutina viene cargada exactamente con los ejercicios, orden, series y
extensiones solicitados. Se considera `+drop` o `+rp` una extensión de una de las
series efectivas del ejercicio, sin multiplicarla automáticamente por cada serie.

## Registro y conteo de series

| Tipo | Registro | Volumen semanal |
| --- | --- | --- |
| Calentamiento / aproximación | Separados; siempre sin fallo | No suma |
| Efectiva | Carga, repeticiones y fallo técnico editable | 1 serie para su músculo principal |
| Drop set / rest-pause | Vinculados a una efectiva del mismo ejercicio y fecha | Extensión; no suma otra efectiva |
| Forzadas / negativas | Desactivadas por defecto; habilitación individual en el editor | Extensión; no suma otra efectiva |

Cada mini-serie de rest-pause y cada reducción de un drop puede registrarse como
otra extensión vinculada a la misma efectiva. No se atribuye volumen indirecto a
otros músculos. El contador registra la efectiva incluso si desmarcas el fallo,
y el historial conserva ese dato. Eliminar una efectiva elimina sus extensiones.

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

Primer ejercicio de cada músculo por día: 3 aproximaciones en peso libre y 1 en
máquina/polea. Los siguientes empiezan con 0. Todo es editable por ejercicio.
Al cambiar equipo o músculo se recalcula ese valor inicial; al reordenar, revisa
las aproximaciones, porque se conserva tu configuración individual.

La sugerencia usa la carga efectiva introducida como referencia y redondea a
0,5 kg: 45% × 11, 75% × 7 y 87,5% × 3, dentro de los rangos solicitados
(40–50% × 10–12; 70–80% × 6–8; 85–90% × 2–3). La sugerencia se puede editar antes
de guardar; no crea registros por sí sola.

Descansos iniciales, editables en segundos:

- Calentamientos / aproximaciones: 90 s (1–2 min).
- Antes de efectiva compuesta: 210 s (3–4 min).
- Antes de efectiva de aislamiento: 150 s (2–3 min).
- Rest-pause: 20 s entre mini-series.
- Drop set: 15 s para cambiar la carga.

Guardar una serie inicia el descanso correspondiente. La última aproximación
inicia el descanso previo a la efectiva. Los botones de descanso permiten iniciar
manualmente los intervalos entre técnicas. El temporizador usa una hora de fin
persistida, por lo que se recupera al recargar o volver del segundo plano. La
vibración depende del navegador; no se prometen alarmas con la app cerrada.

## Datos locales

IndexedDB (`heavy-duty-personal`, versión 1) guarda rutina, metas, registros y
temporizador. Las modificaciones se confirman después de completar la transacción;
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
