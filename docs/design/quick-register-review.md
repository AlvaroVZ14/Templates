# Registro compacto de ejercicios

Solicitud: anotar previas, calentamientos, efectivas y técnicas con menos texto y
menos desplazamiento, manteniendo todo el contenido y los datos existentes.

## Cambios

- Se muestra una tarea a la vez mediante pestañas. El resumen de cada pestaña
  conserva las cargas sugeridas y el contador de series.
- Efectiva: carga, reps y RPE en una fila, fallo y botón grande de guardado.
- Previas y técnicas: filas editables y botón ✓ por registro independiente.
  El descanso real se despliega cuando se necesita.
- Otras: selector de todos los tipos permitidos, incluidas técnicas avanzadas solo
  si el usuario las habilitó. No cambia la validación ni el enlace con la efectiva.
- La referencia conocida queda plegada; una referencia ausente pide los kg en el
  propio ejercicio. Se mantiene el peso por mano y el redondeo existente.
- Se evita mostrar dos veces las mismas previas cuando la tarjeta está abierta.
  Cerrada conserva sus fichas rápidas y la hoja de configuración Auto/manual.
- Series registradas, progresión/reglas/descansos y notas/historial están en
  desplegables. Se conserva eliminación con confirmación, gráfico, recomendaciones,
  edición del rango y acceso a notas también en modo gimnasio.
- Seguridad: recordatorio breve visible y explicación desplegable. Los avisos de
  dolor permanecen completos; no se modifica su cálculo.

Solo se cambian componentes de presentación y estilos. No se cambia IndexedDB,
sus migraciones, los pesos registrados, las recomendaciones ni el volumen.
Las pruebas anteriores se adaptan mediante acciones explícitas que abren la
pestaña o el desplegable correspondiente; la fixture no abre el registro sola.

## Comprobación manual

1. En Hoy, abre un ejercicio sin referencia. Introduce el peso y guárdalo.
   La referencia se pliega y Previas muestra las cargas redondeadas.
2. Abre Previas, ajusta reps y toca ✓. Comprueba el contador y el descanso.
   La previa no aumenta el volumen efectivo.
3. En Efectiva, anota kg, reps y RPE, marca o desmarca fallo y guarda.
4. En un ejercicio con drop, consulta la carga antes de la efectiva: no se permite
   guardar la caída todavía. Guarda la efectiva y luego registra cada caída.
5. En uno con rest-pause, comprueba el mismo peso por mano, sus dos mini-series y
   la posibilidad de modificar las reps reales antes de guardarlas.
6. En Otras, registra un calentamiento y consulta los tipos permitidos. Las
   forzadas/negativas aparecen solo tras activarlas en Rutina.
7. Abre los tres desplegables inferiores y comprueba registros, notas, gráfico,
   reglas, rango, recomendaciones y descansos manuales. Eliminar exige confirmar.
8. Edita sin guardar, cambia de pestaña, cierra/abre el ejercicio y recarga sin
   conexión: los borradores siguen. Los registros guardados no se alteran.

## Entrega

Verificación:

- `npm test`: 134 pruebas aprobadas.
- `npm run build`: compila la PWA bajo `/Templates/`. Se conserva el aviso previo
  del bloque JavaScript de más de 500 kB (552,80 kB; 168,31 kB gzip).
- 103 escenarios de navegador comprobados: 97 pasaron en la ejecución completa;
  seis pruebas antiguas necesitaban abrir explícitamente pestañas/desplegables.
  Se actualizaron y los seis casos pasaron al repetirse.
- Tras los últimos ajustes de presentación se repitieron los seis escenarios
  nuevos, todos aprobados: referencias ausentes, previas sin volumen, drop vinculado,
  rest-pause por mano, selector completo, notas/borradores offline y controles
  accesibles por teclado. Sin errores de página ni desbordamiento a 320, 390,
  768 y 1440 px.
- Migración histórica, versiones conservadas al eliminar, respaldo de ida/vuelta,
  actualización de la PWA, modo gimnasio, dolor, descarga y progresión comprobados
  por los escenarios existentes. No se añaden dependencias, secretos, archivos
  `.env` ni registros personales; las capturas usan datos ficticios.

Capturas revisadas:

- [Efectiva en celular](quick-register/effective-mobile.png).
- [Previas en celular](quick-register/preparations-mobile.png).
- [Drop set](quick-register/drop-mobile.png).
- [Previas a 320 px](quick-register/preparations-320.png).
- [Efectiva en escritorio](quick-register/effective-desktop.png).

La PWA recibe esta interfaz tras aprobar/fusionar el PR a `main` y finalizar
GitHub Actions. Toca el aviso de versión nueva; no borres los datos del sitio.

Uso de IA: Codex implementó la reorganización y ejecutó verificaciones con datos
ficticios. No se declara revisión humana ni prueba en un teléfono físico.
