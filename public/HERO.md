# Portada local opcional

Coloca tu imagen en `public/hero.jpg`. La app comprueba si está disponible y conserva la silueta SVG cuando falta o no puede cargarla. No requiere cambiar `appearance.json`.

Usa una imagen propia y comprimida, idealmente de **2 MiB o menos**. La compilación avisa si supera ese tamaño y rechaza un total superior a **8 MiB** entre `hero.jpg`, el medio y el póster configurados en `appearance.json`.

La portada se incluye automáticamente en el caché offline bajo `/Templates/`. Si cambias su contenido, cambia también la versión del caché al compilar. Para publicar la imagen, inclúyela en el commit y publica la nueva compilación; no uses enlaces externos.
