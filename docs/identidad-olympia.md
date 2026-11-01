# Identidad Olympia

Escudo aprobado: torso en V con cortes de luz, barra con discos detrás, borde
biselado, rojo #E10600 → #FF3B1F, blanco hueso y carbón. El nombre es Olympia,
con tipografía Anton condensada e inclinada convertida a trazados SVG.

Se integra en el inicio, cabecera del menú, encabezado de las otras secciones y
pantalla de carga. El splash tiene un brillo de 180 ms con transform/opacity,
desactivado con prefers-reduced-motion. No añade una espera artificial: desaparece
cuando la app está lista. Las imágenes tienen dimensiones reservadas y las del
menú usan carga diferida. El inicio conserva sus cuatro elementos funcionales.

El manifest instala **Olympia**, con íconos normales 192/512 y maskable 192/512
separados. También hay favicon SVG/ICO/PNG y apple-touch-icon de 180 px. Todos los
recursos usados se precachean para abrir offline. El escudo maskable queda dentro
del círculo seguro (radio 195,9 px, máximo permitido 204,8 px en 512 × 512).

No se cambia el id, start_url ni scope de la PWA, la URL del sitio, el nombre de
IndexedDB, el formato del respaldo ni sus claves de almacenamiento. No se
reescriben ejercicios ni entrenamientos. Un nombre predeterminado anterior
«BLOOD & GUTS» se presenta como Olympia sin alterar el historial. Los nombres
personalizados se conservan y siguen editables en Ajustes → Tu identidad.

## Archivos y reconstrucción

Los SVG y PNG finales están en public/. Los trazados fuente y la lámina están en
design/logo-proposal/. Para regenerar los íconos desde los SVG de producción:

```powershell
node scripts/generate-icons.mjs
```

Usa Chromium local de Playwright, sin imágenes de Internet ni dependencias nuevas.
Las letras provienen de la fuente Anton autoalojada; su licencia OFL sigue en
src/assets/fonts/Anton-OFL.txt. La marca no incorpora fuentes como texto SVG ni
necesita JavaScript para verse.

## Verificación y publicación

182 pruebas unitarias correctas y ocho escenarios de navegador verificados:
logo y nombre, nombre personalizado, splash/movimiento reducido, menú único,
inicio en 320/390/1440 px, funciones secundarias y dos actualizaciones reales
que conservan series y borradores. Se comprobó lectura de todos los recursos de
marca en modo offline y conservación de un diario previo. Build correcto.

El despliegue conserva https://alvarovz14.github.io/Templates/. Tras integrar el
PR y completar GitHub Actions, usar Ajustes → Actualizaciones → Buscar
actualizaciones y luego Actualizar ahora para ver Olympia dentro de la app.
No borrar datos ni desinstalar como parte de la actualización.
