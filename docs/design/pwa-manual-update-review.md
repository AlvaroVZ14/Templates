# Búsqueda manual y publicación de actualizaciones

Solicitud: añadir un botón para actualizar porque el aviso automático no aparece.

## Hallazgo

El PR #20 fue fusionado, pero tanto la ejecución del PR como su despliegue a main
fallaron en la prueba `stage17` de parallax lateral: se observó `--edge-x = 0`
tras un único movimiento del ratón durante el arranque. Las otras 102 pruebas
pasaron en GitHub. Por ello Pages continuó sirviendo la versión anterior;
un botón no puede descargar una versión que aún no se ha publicado.

Se reintentó una vez el despliegue de main ya autorizado. La corrección de la
prueba espera a que termine el arranque y repite movimientos reales dentro de la
comprobación. Se mantiene el umbral del parallax, sus verificaciones de pausa y
modos visuales, y toda la batería de publicación; no se omiten pruebas.

## Cambio

- Ajustes → Actualizaciones: Buscar actualizaciones, versión instalada y resultado.
- La búsqueda manual omite el intervalo automático de un minuto, evita peticiones
  simultáneas y comunica fallos o ausencia de conexión sin afirmar que está al día.
- Espera a que se descargue la caché offline completa antes de ofrecer Actualizar
  ahora. La comprobación y la instalación tienen plazos de espera limitados.
- Guarda los borradores antes de activar la versión y recargar, igual que el aviso
  automático existente. La actualización preparada también puede aplicarse offline.
- La versión instalada identifica el commit de GitHub; en desarrollo/compilación
  local usa una marca de compilación. No contiene datos personales ni claves.
- No se cambia el almacenamiento, las migraciones, las series ni la rutina.

## Cómo probar

1. Abre Ajustes → Actualizaciones y toca Buscar actualizaciones dos veces: cada
   búsqueda termina con un resultado y los botones quedan habilitados otra vez.
2. Prueba sin conexión: explica que necesitas internet para buscar y conserva el
   funcionamiento local. Un error de descarga no debe mostrar «última versión».
3. Con una nueva compilación publicada, busca y espera a que termine la descarga.
   Solo entonces aparece Actualizar ahora. Conserva un borrador antes de navegar
   a Ajustes; tras actualizar deben seguir el borrador y las series guardadas.
4. La prueba de navegador reproduce dos versiones con workers reales, retiene
   parte de la descarga para comprobar la espera y aplica la actualización offline.

Uso de IA: Codex asistió implementación, revisión de logs y pruebas con datos
ficticios. La aprobación humana y el merge no se realizan automáticamente.

## Verificación local

- `npm test`: 137 pruebas aprobadas, incluidas descarga pendiente, instalación
  fallida, tiempo agotado, búsqueda repetida y errores de red.
- `npm run build`: correcto bajo `/Templates/`; se conserva el aviso del bloque
  JS principal >500 kB (555,90 kB; 169,38 kB gzip).
- 16 escenarios de navegador aprobados: actualización real automática y manual,
  respaldo, fechas, navegación, borradores, configuración y prueba lateral.
- Tras el último ajuste, cuatro casos se repitieron tres veces: 12 ejecuciones
  aprobadas, incluidas API no disponible, mensajes/reintento, descarga completa y
  aplicación offline sin perder datos, y sincronización de la prueba lateral.
- Sin desbordamiento a 320, 390 y 1440 px; capturas revisadas con datos ficticios:
  [Buscar actualizaciones](pwa-updates/settings-mobile.png) y
  [Actualización preparada](pwa-updates/ready-mobile.png).

La validación completa en GitHub sigue siendo necesaria antes de publicar.
