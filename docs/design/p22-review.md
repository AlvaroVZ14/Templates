# Prompt 22 · Afiche grunge Blood & Guts

Presentación de gimnasio clásico: rojo sangre, negro, blanco hueso y grises.
La única excepción cromática es el verde apagado de «va bien» en Progreso,
solicitada en el punto 6. No se añadieron imágenes de internet ni dependencias.

## Cambios

- Anton autoalojada, condensada y de trazo pesado, inclinada con `skewX(-8deg)`,
  refuerzo de trazo de 0,3 px y halo rojo en capas. Hoy apila el músculo principal,
  «Y» más pequeña en blanco y el resto en itálica con espaciado. Las otras
  pantallas comparten la tipografía; campos, pesos y números de registro siguen
  rectos. Los títulos y sesiones siguen derivándose de la rutina configurada.
- Polvo, puntos y rayones SVG propios, con animaciones CSS por pasos y viñeta.
  La textura queda detrás del contenido; formularios y tarjetas son opacos.
  Las grietas están enmascaradas a las esquinas para no cruzar textos ni números.
- Se reutiliza `public/hero.jpg`, con escala de grises, contraste y dos capas a
  distintas opacidades. Una silueta original SVG de máquinas, discos y barras
  completa el fondo y sirve también cuando falta la imagen. Se mantienen la
  silueta principal, el humo, las brasas y la navegación solo por cajón.
- Grietas SVG en cabecera y tarjetas principales: destello tenue entre 14 y 19 s,
  con desfase; brillo al pasar el cursor en dispositivos que permiten hover.
- Sellos inclinados «FALLO», «DESCARGA» y «RÉCORD». El récord usa los datos ya
  calculados del resumen de sesión, sin inventar una nueva regla de progreso.
  Su texto blanco es grande y grueso sobre rojo vivo para mantener contraste.
  Un registro recién guardado destella y su número tiembla brevemente; no se
  animan como nuevas las series antiguas al abrir su tarjeta.
- Progreso conserva sus cálculos y textos: ✓ verde apagado, = gris acero para
  estable/sin evaluación, ! rojo para atención. Método y texto de resúmenes usan
  la misma terminología. Los IDs internos e históricos no cambian.
- Apertura de máximo 1.300 ms, omitible tocando cualquier punto. Solo se ofrece
  al abrir, una vez al día en America/Santiago. Cruzar medianoche con un formulario
  abierto no la dispara. El nombre respeta el que elijas en Ajustes.
- Corte diagonal rojo de 340 ms entre pantallas. Es decorativo y no recibe
  eventos de puntero; no modifica la navegación ni los borradores.

## Movimiento y rendimiento

Completos muestra la película y las animaciones. Reducidos deja textura muy
tenue estática, sin grietas animadas, apertura ni cortes. Apagados y la preferencia
de movimiento reducido del sistema eliminan polvo/rayones/grietas en movimiento.
En modo gimnasio desaparecen película y grietas; se conservan las reducciones
previas de humo, parallax y brasas. Una pestaña oculta pausa las animaciones.

No hay un bucle JavaScript nuevo de animación. Solo temporizadores de apertura,
corte y marca de guardado, con limpieza al desmontar. Se reutiliza el canvas y su
presupuesto existente, con una rampa de color sin amarillo ni naranja.

El estado de entrenamiento y el esquema de IndexedDB no cambian. La única clave
nueva es `heavy-duty-grunge-intro-day` en localStorage, que recuerda la apertura
decorativa de ese dispositivo; no contiene datos de entrenamiento ni limpia
otras claves. Importación, exportación y migraciones se mantienen.

## Verificación

- `npm test`: 134 pruebas de lógica aprobadas; solo se adapta la expectativa
  cromática del fuego a la nueva paleta.
- `npm run build`: correcto; fuentes y recursos siguen precacheados bajo
  `/Templates/`. Se conserva el aviso ya existente del JS principal >500 kB.
- Pruebas nuevas: apertura por día chileno, omitir/expirar, medianoche sin
  interrupción, collage, tres tamaños de pantalla, ausencia de amarillo en
  colores calculados (incluidos SVG, sombras y pseudoelementos), señales de
  Progreso, transición, registro, ajustes de efectos y modo gimnasio.
- Barrido estático de colores hexadecimales, incluidos SVG codificados, en
  `src/`, icono, manifest e index: cero colores amarillos/naranjas saturados.
  Iconos PNG y la portada existente también se inspeccionaron por píxeles: cero
  píxeles amarillos/naranjas saturados. Los medios propios futuros se muestran
  con filtro en grises.
- Todas las secciones: 320, 390 y 1440 px, sin desbordamiento horizontal.
- **97 escenarios de navegador verificados:** 93 pasaron en la ejecución
  completa; cuatro pruebas antiguas necesitaban identificar la imagen principal
  porque el collage ahora añade otra. Se corrigieron sus selectores y pasaron.
  Tras el ajuste de ancho se repitieron ocho casos afectados, todos aprobados;
  se verificó también el sello real de récord y su tamaño en el resumen móvil.
- [Perfil local](p22/performance.json): muestras de 3 s, sin alterar relojes ni
  RAF. 390×844 táctil DPR 3 (canvas limitado a 585×1266), 20 partículas; escritorio
  1440×900, 200 partículas. Cadencia RAF alrededor de 60/s, mediana 16,7 ms y
  percentil 95 de 17 ms, sin tareas largas en las muestras. Modo gimnasio: cero
  partículas móviles. Repetible tras compilar con
  `node scripts/profile-effects.mjs docs/design/p22/performance.json`.
  No certifica fps de composición, consumo de batería ni rendimiento en un
  Android/iPhone físico; esa comprobación sigue pendiente.

Capturas con instalación vacía y configuración inicial autorizada:

- [Hoy móvil](p22/p22-hoy-mobile.png).
- [Hoy escritorio](p22/p22-hoy-desktop.png).
- [Progreso escritorio](p22/p22-progreso-desktop.png).
- [Récord en el resumen móvil](p22/p22-record-mobile.png).

## Cómo ver cada efecto

1. Después del merge y despliegue, toca «Hay una versión nueva, tocar para
   actualizar». En Ajustes, usa **Efectos visuales: Completos** y activa la
   animación de fondo. El sistema debe permitir movimiento.
2. Abre la app por primera vez ese día: aparece la apertura; tócala para omitir.
   No se repite al recargar ese día y no exige borrar datos para continuar.
3. En Hoy, observa los títulos, la cabecera por músculo, el collage y las brasas.
   Espera unos 20 segundos para el destello ocasional de grietas. En escritorio,
   pasa el cursor por una tarjeta.
4. Cambia de sección desde el cajón: cruza el corte rojo. Consulta Progreso y
   Método para ver el estado neutro con «=» y el resto de la tipografía.
5. Guarda una serie: destello y número breve. Una serie con fallo muestra su
   sello; una descarga ya activa y un récord del resumen usan sus sellos reales.
6. Prueba Reducidos, Apagados y «Empezar sesión»: cesan los efectos de adorno
   indicados, sin cambiar series, descansos ni datos guardados.

Uso de IA: Codex asistió implementación, revisión de CSS/SVG, pruebas y
documentación. Las capturas y resultados se revisaron automáticamente. No se
atribuye aprobación humana ni prueba en teléfono físico como ya realizadas.
