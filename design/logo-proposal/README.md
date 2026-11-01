# Olympia — identidad aprobada

El usuario aprobó el escudo y eligió **Olympia** como nombre. El emblema original
se mantiene; el lettering se convirtió a OLYMPIA en trazados de Anton. Sin fotos,
recursos externos, fuentes remotas ni dependencias nuevas.

Los SVG de esta carpeta son las fuentes vectoriales. Los archivos de producción
están en public/; la app usa sus rutas relativas bajo /Templates/.

- logo.svg: logo completo sobre carbón.
- wordmark.svg: nombre inclinado y subtítulo, sin fondo.
- emblem.svg: emblema a color transparente.
- logo-monochrome.svg y emblem-monochrome.svg: una tinta con recortes
  transparentes reales.
- favicon.svg: adaptación simplificada. El render genera ICO y PNG 16/32.
- icon.svg: emblema con fondo carbón. PNG 192/512 y Apple 180.
- icon-maskable.svg: área segura central, con PNG 192/512 separados.
- splash.html: muestra del brillo de 180 ms; respeta movimiento reducido.
- presentation.png: lámina de revisión de la identidad final.

build-proposal.ps1 necesita Windows/WPF y la fuente Anton local para reconstruir
los trazados. Su licencia SIL OFL está en ../../src/assets/fonts/Anton-OFL.txt.
Los SVG finales conservan curvas Bézier, no requieren la fuente para mostrarse.

render-proposal.mjs utiliza Chromium de Playwright, ya instalado. Verifica el
área segura maskable (radio visible 195,9 px dentro de 204,8 px) y la transparencia
monocroma. Las exportaciones reproducibles y el ZIP se ignoran en esta carpeta;
los PNG de producción sí se versionan en public/.
