# Auditoría de la publicación HTTPS

**Web:** https://alvarovz14.github.io/Olympia-amigos/

**Código publicado:** versión 1.1.0, compilación `e2da410`, repositorio limpio
https://github.com/AlvaroVZ14/Olympia-amigos, rama `version-amigos`.
El repositorio personal Templates y su sitio mantienen su configuración anterior.

## Resultados

| Comprobación | Resultado |
|---|---|
| Workflow de pruebas y despliegue | Aprobado: [ejecución](https://github.com/AlvaroVZ14/Olympia-amigos/actions/runs/41382179557) |
| Pruebas unitarias / navegador en GitHub | 199 / 81 aprobadas |
| Lighthouse 13.5.0 · móvil simulado | Rendimiento 87, accesibilidad 100, buenas prácticas 100 |
| HTTPS y scope | Correctos; scope `/Olympia-amigos/` |
| Instalabilidad Chromium, perfil normal | Cero errores |
| Iconos normales y maskable | 192×192 y 512×512 reales |
| Recarga e interacción sin conexión | Aprobadas sobre la URL pública |
| Errores JavaScript durante el control PWA | Ninguno |
| Actualización con datos y borrador abiertos | Aprobada mediante dos versiones reales de worker en pruebas |
| Migración v1→v2 y fallo intermedio | Aprobadas: copia, proyección verificada y reversión sin pérdida |
| Futuras migraciones JSON | Runner ordenado, idempotente; rechazo de versiones futuras sin mutar origen |
| Auditoría npm (incluido desarrollo) | Sin vulnerabilidades detectadas tras usar Lighthouse 13.5.0 |

[Informe Lighthouse HTML](lighthouse.html), [JSON](lighthouse.json) y
[comprobación PWA independiente](pwa.json). Estos archivos contienen mediciones,
no datos de un usuario real. Las herramientas usan perfiles nuevos aislados.

Lighthouse eliminó la categoría PWA desde la versión 12; por ello no se inventa
una puntuación PWA. La instalación y el offline se verifican aparte con Chromium.
SEO se omite deliberadamente: esta app conserva `noindex, nofollow`.

## Correcciones realizadas

- Fuentes autoalojadas convertidas de TTF a WOFF2: de unos 383 KB a 136 KB en
  recursos de fuente, conservando diseño y licencias. Formato convertido con
  FontTools 4.68.0 y Brotli; los TTF fuente y las licencias siguen en el repositorio.
- Logo de inicio con preload y prioridad alta. Rendimiento móvil simulado local
  pasó de 73 a 87; no se presenta como una medición de hardware de un celular real.
- QR generado localmente y disponible offline; inicio nativo iPhone en seis
  tamaños verticales, icono Apple de 180 y manifest Android con maskable.
- Ayuda accesible desde Ajustes, número de versión y compilación en Acerca de.
- Aviso de actualización también en Hoy, con activación explícita tras guardar.
- Registro de migraciones de estado y de IndexedDB separado y documentado.

## Límites y prueba pendiente

Lighthouse todavía señala CSS/JavaScript no usados en la pantalla inicial:
parte corresponde a otras secciones de la aplicación. No impide instalación
ni offline; la puntuación de rendimiento no se presenta como 100.

El arranque nativo de Safari/iOS y Android, el ajuste visual en cada modelo,
vibración y Wake Lock requieren validación física. No se usó un celular real.
Las imágenes de inicio iPhone cubren seis tamaños habituales en vertical;
otros modelos/orientaciones usan el arranque HTML adaptable cuando está disponible.

[Configuración exacta, comandos y checklist de celular](../publicar-amigos.md).
[QR descargable](https://alvarovz14.github.io/Olympia-amigos/compartir-qr.png).
