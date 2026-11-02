# Edición amigos · auditoría y entrega

Trabajo en la rama `version-amigos`, separada de la rama personal. No se publica
sobre el sitio personal ni se propone integrar esta edición en su `main`.

## Auditoría antes de modificar

Se revisaron el estado inicial y las migraciones, fuentes, recursos de `public`,
documentación/capturas históricas, fixtures, archivos ocultos de configuración y
dependencias declaradas. Se buscaron nombres de personas, precargas corporales,
metas y fechas personales, referencias a métodos comerciales y patrones de claves,
tokens, claves privadas, credenciales y `.env`. No se imprimieron posibles secretos.

| Hallazgo | Acción en esta edición |
|---|---|
| Medición corporal inicial con fecha y seis valores personales, en `src/measurements.js` y documentación | Se eliminó la precarga; instalar/migrar sin mediciones deja una colección vacía. No se reproducen aquí sus valores. |
| Fases iniciales con pesos meta y fechas particulares en `src/program/state.js` | Se eliminaron ambas fases automáticas; se crean con las elecciones del nuevo usuario. |
| Edad usada por defecto para pulsaciones y referencias iniciales de las reglas del perfil | La edad de cardio queda sin dato hasta indicarla o completar Perfil; las reglas tienen referencias genéricas y omitirlas no guarda datos físicos. |
| README, informes, prompts de imagen y capturas del desarrollo personal en `docs/` y `design/` | Se retiraron del árbol distribuido y se sustituyó el README por instrucciones de esta edición. Los artefactos locales ignorados no se empaquetan. |
| Portada `public/hero.jpg`, documentada anteriormente como generación inspirada en una persona real | Se retiró, sin afirmar que fuera una fotografía descargada o una infracción comprobada. La reemplaza `public/hero-generic.svg`, ilustración propia genérica; se conserva el respaldo SVG. |
| Texto de Método vinculado a una estética/método con nombre comercial | Texto genérico «método de alta intensidad», sin atribución ni afiliación. |
| Expectativas de pruebas ligadas a las precargas personales | Fixtures sintéticos explícitos, separados del código de navegador. Los valores originales completos no se conservan como ejemplo. |

No se encontraron archivos de historial personal, fotos de checks reales ni
exportaciones personales rastreadas por Git. No se leyó el almacenamiento de un
teléfono real. Las fechas de las pruebas de calendario y los perfiles ficticios
de regresión no se precargan en la aplicación.

El emblema y sus variantes son gráficos vectoriales propios del proyecto; no se
detectaron logos de entrenadores o deportistas. Anton y Barlow se conservan
autoalojadas, junto con sus licencias OFL, también copiadas a `public/licencias`
para que acompañen al sitio compilado. No se añadieron imágenes externas.
La auditoría de recursos no constituye una verificación jurídica de marca registrada.

No se detectaron secretos en el árbol de fuentes revisado ni archivos `.env`.
El navegador no usa API de terceros, analytics ni rastreadores. Sus solicitudes
son los archivos estáticos y la configuración visual del mismo sitio. Las URLs
de licencia en los textos de fuentes no producen solicitudes de la aplicación.
Si se incorporara una clave en el futuro: retirarla del cliente y del paquete,
revocarla/rotarla y revisar los commits afectados; `.env` o `VITE_*` no ocultan
secretos incluidos en un bundle. Esta edición no necesita credenciales.

**Excepción autorizada:** el correo de comentarios indicado por el propietario
se incluye públicamente en el botón `mailto:` y en el README. No es un secreto.
No se incluye otro nombre o dato corporal personal en el producto distribuido.

## Separación y privacidad

- Base exclusiva `olympia-friends`, versión 2, sin lectura automática de la base personal.
- Claves locales `olympia-friends-*` para recuperación y coordinación entre pestañas.
- El borrado se limita a esta base y a ese prefijo; la base personal y sus claves
  se prueban con centinelas para comprobar que siguen intactas.
- Perfil, fotos y registros viven en IndexedDB. Los borradores de series usan
  también la recuperación local ya existente, dentro del prefijo exclusivo.
- Primer inicio sin perfil, peso, medidas, fase, fotos, sesiones ni historial.
  Catálogo de alimentos y plantillas de ejercicio son contenido general.
- Respaldo JSON validado antes de combinar/reemplazar. Incluye fotos y versiones;
  debe guardarse y compartirse con cuidado por decisión del usuario.
- `noindex, nofollow` añadido. Es una indicación para buscadores, no una contraseña.

## Cambios funcionales

| Plantilla | Días de entrenamiento | Series semanales de partida |
|---|---|---:|
| PPL + Torso + Leg | Martes, miércoles, jueves, sábado y domingo | 85 |
| Full Body | Lunes, miércoles y viernes | 36 |
| Torso/Pierna | Lunes, martes, jueves y viernes | 52 |
| Push/Pull/Legs | Lunes a sábado | 52 |

Son puntos de partida generales editables. El editor permite nombre, músculo,
equipo, tipo de carga, orden, cantidad de series, reps mínimas/máximas por serie,
Top/Back-off, reducción de Back-off y Drop/RP en la última efectiva. Un desplegable
conserva descansos, redondeos y técnicas opcionales sin llenar la vista principal. Las técnicas
no añaden volumen. Se puede dejar un día vacío o añadirle ejercicios. La vista
del volumen se calcula desde la rutina, sin imponer los objetivos de una plantilla
anterior. La semana en curso respeta las rutinas que estuvieron vigentes cada día.

Los cambios guardan revisiones planas por intervalo de fechas, conservan las
series originales y reutilizan referencias solo con coincidencia inequívoca de
nombre y equipo. Se bloquea reemplazar una rutina durante una sesión abierta.
Los borradores se recuperan tras recargar. Ningún cambio borra el historial.

Ajustes incluye Acerca de, Exportar mis datos, Importar datos, Borrar todo y Enviar
comentarios. El correo abre el cliente del usuario, sin adjuntos ni datos capturados.
La nota de dieta/déficit recomienda mayoría de edad y consulta profesional en
caso de condición médica; los cálculos siguen exigiendo edad adulta.

## Distribución y pendientes

La ruta preparada es `/Olympia-amigos/`, con manifest relativo y caché offline.
El despliegue posterior se configura en el repositorio independiente
`AlvaroVZ14/Olympia-amigos`, servido por HTTPS en
`https://alvarovz14.github.io/Olympia-amigos/`. El workflow solo publica en ese
repositorio, nunca sobre el sitio personal. Consulta [la guía actual](publicar-amigos.md).

El historial Git anterior contiene la documentación/precargas retiradas, además
de la identidad del autor de los commits. No se reescribe porque afectaría al
repositorio personal. Para compartir solo los archivos saneados: ZIP del árbol
actual o repositorio nuevo desde ese ZIP, sin `.git`; no clonar toda la historia.
Un ZIP de la compilación contiene únicamente recursos de la aplicación, sin tests,
capturas antiguas ni datos de usuarios.

## Verificación final

- **197 pruebas unitarias aprobadas**, incluida instalación vacía, las cuatro
  plantillas, volumen, conservación de logs y fechas de rutinas y validación de respaldo.
- **80 pruebas de navegador aprobadas** en la suite completa. Después se repitieron
  las cinco de Perfil y edición amigos con los ajustes finales y el nuevo ejemplo
  ficticio: todas aprobadas.
- Compilación de producción y revisión de diferencias sin errores.
- Exportación/importación real, archivo inválido sin mutación, fallo transaccional
  con reversión, borrado confirmado y cancelado, recuperación de borrador y uso offline.
- Prueba con base personal y claves locales centinela: instalar, importar y borrar
  la edición amigos las deja intactas. El botón de correo contiene solo destinatario
  y asunto; no incluye cuerpo ni adjuntos automáticos.
- PWA instalable, ruta propia, caché offline y pantallas de 320/360/390 px cubiertas
  por las regresiones. [Editor revisado a 360 px](capturas/rutina-360.png).
- Las pruebas usan perfiles aislados y datos ficticios. No se accedió al historial
  de un teléfono real. La rama personal conserva su commit y no recibió cambios.
