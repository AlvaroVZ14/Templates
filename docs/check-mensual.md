# Check mensual

Acceso exclusivo desde el menú lateral: **Check mensual**. Hoy mantiene su vista
de entrenamiento. El punto rojo del cajón indica que no hay checks o que han
pasado 28 días civiles desde el último, usando la fecha de Chile. No envía una
notificación al sistema ni pide permisos de cámara o notificaciones.

## Registrar y comparar

1. Elige la fecha; registra peso corporal y las seis medidas existentes: bíceps en
   pose, antebrazo, cintura, pecho, muslo y pantorrilla.
   **Registrar check** aparece abierto la primera vez y después se despliega al tocarlo,
   para dejar la comparación y la línea de tiempo al alcance sin un formulario largo.
2. Elige fotos frontal, lateral y espalda. Los campos y las fotos son opcionales,
   pero un check necesita al menos un dato. Las ausencias se muestran sin inventar valores.
3. Las fotos se convierten localmente con canvas: luminancia en escala de grises,
   contraste 1,5, JPEG de calidad 0,78, altura máxima 1200 px y ancho máximo 1200 px.
   Conserva la proporción y no amplía imágenes pequeñas. El archivo original y sus
   metadatos no se guardan; la previsualización ya muestra el resultado procesado.
4. Toca **Guardar check**. Las fotos y el registro se confirman en una sola
   transacción; si falla, no queda un registro parcial y puedes reintentar.
5. En **Comparar meses**, elige dos meses y una pose; usa lado a lado o antes/después.
   El deslizador funciona con toque y teclado, sin gestos que interfieran con el menú.
   Cuando falta una foto se indica. La tabla calcula segundo menos primero, con
   flechas numéricas; subir o bajar una medida no se interpreta como bueno o malo.

La comparación usa el último check de cada mes. La línea de tiempo conserva todos
los checks, incluidos varios del mismo mes. Los checks guardan sus propias
instantáneas y no reemplazan el diario, las mediciones ni los entrenamientos.
Salir del formulario con cambios pide confirmación; las fotos sin guardar solo
están en memoria, sin copia en localStorage.

## Datos y respaldo

Se reutiliza IndexedDB `heavy-duty-personal`, versión 2, sin migrar ni borrar
colecciones existentes. El estado principal contiene únicamente `monthlyChecks`
con referencias a las fotos. Los JPEG se guardan por separado en el object store
`app`, bajo `check-photo:<id>`, con año, mes, pose y dimensiones. Las lecturas
habituales de entrenamiento no cargan esos JPEG; Comparar lee solo las fotos elegidas.

Exportar respaldo incluye registros y fotos procesadas. Importar valida versión,
valores, formato JPEG, dimensiones y referencias antes de modificar datos. Los
respaldos anteriores sin checks siguen siendo compatibles. Combinar conserva los
checks distintos y evita duplicados por ID; reemplazar restaura sus fotos junto
con los demás datos. El JSON exportado contiene tus fotos: guárdalo como tus demás
registros privados. Nada se envía a un servidor.

## Verificación

`npm test`, `npm run build` y los escenarios de
`tests/browser/monthly-check.spec.js`, junto a los de respaldo, historial,
navegación, auditoría y registro rápido. Se utilizan fotos sintéticas generadas
con canvas, sin imágenes ni datos personales. Se comprueban píxeles grises reales,
dimensiones, compresión, recordatorio al día 28, persistencia offline, comparación,
ancho de móvil, recuperación ante cuota y exportación/importación de fotos.

Resultado: 172 pruebas unitarias aprobadas y 27 escenarios distintos de navegador
verificados en los módulos afectados. Los tres escenarios nuevos se repitieron
tras el ajuste visual final: 3/3 aprobados. Compilación correcta, con el aviso
preexistente de bundle superior a 500 kB. Captura final de 390 px revisada y anchos
320/390/1440 px comprobados sin desbordamiento.

Implementación y pruebas asistidas por Codex; pendiente revisión humana del PR.
