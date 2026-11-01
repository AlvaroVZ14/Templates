# Auditoría de Olympia — 1 de noviembre de 2026

Alcance: código y build local, perfiles de navegador aislados con datos ficticios,
y comprobación de la publicación real. No se accedió a la base privada del celular.
No se añadieron funciones ni se cambiaron rutina, nutrición o reglas de progresión.

## Rutina normal

| Día | Sesión | Ejercicios | Efectivas |
|---|---|---:|---:|
| Martes | PUSH | 7 | 17 |
| Miércoles | PULL | 7 | 17 |
| Jueves | LEG A | 7 | 17 |
| Sábado | TORSO | 7 | 17 |
| Domingo | LEG B | 7 | 17 |
| **Total** | | **35 posiciones** | **85** |

Lunes y viernes: descanso. Los números se verificaron en el modelo y en las
filas reales de los cinco días en la interfaz, durante la semana del 2–8 de
noviembre de 2026. Los ejercicios repetidos cuentan como posiciones del plan.

| Músculo | Planeado / solicitado |
|---|---:|
| Pecho | 14 / 14 |
| Espalda | 13 / 13 |
| Bíceps | 10 / 10 |
| Tríceps | 4 / 4 |
| Deltoides laterales | 6 / 6 |
| Deltoides posteriores | 4 / 4 |
| Cuádriceps | 10 / 10 |
| Femorales | 6 / 6 |
| Glúteos | 4 / 4 |
| Aductores | 2 / 2 |
| Abductores | 4 / 4 |
| Gemelos | 4 / 4 |
| Abdomen | 4 / 4 |
| **Total** | **85 / 85** |

Drop y rest-pause permanecen dentro de la última efectiva. Sus caídas/mini-series
se guardan como subregistros ligados a la efectiva, para conservar el detalle;
el volumen cuenta únicamente kind=effective. Pruebas de registro y volumen
verifican que no se sumen como series adicionales.

Los 17/85 corresponden al plan completo normal. Una descarga, una edición del
calendario/rutina o una semana de transición pueden cambiar el plan mostrado.
Las fechas anteriores a la activación conservan la rutina archivada; convertirlas
a la nueva rutina alteraría el contexto histórico y no se hizo.

## Historial y conservación

Las pruebas comparan el contenido anterior y posterior de migraciones, su copia
original, sesiones y subseries, cardio, diario, medidas, fases y respaldos. Se
comprueba consulta por año/mes/ejercicio, recuperación tras recargar offline y
exportar/importar de ida y vuelta. El fallo transaccional revierte sin borrar la
base anterior. No hay purga automática del historial.

Existe backup-rutina-anterior tanto localmente como en origin; es un respaldo del
código, no una copia de la base del celular. Esta auditoría no modificó la DB ni
sus migraciones. Las pruebas no permiten afirmar que todos tus registros reales
están presentes: eso requiere compararlos con un respaldo real anterior.

## Offline, PWA y pantallas pequeñas

Se revisaron todas las secciones y el registro a 360 × 800; también se verificaron
320 px y fuentes alternativas. Se comprobó recarga sin conexión, recursos de
marca cacheados, restauración de sesión abierta y actualización PWA conservando
series y borradores.

Captura con datos ficticios: [registro a 360 px](design/audit-360-workout.png).

Chromium en un perfil normal informó cero errores del manifest y cero errores de
instalabilidad mediante CDP. También se validaron tamaños reales de íconos,
maskable, id/scope/start_url y service worker. Es una comprobación técnica de
navegador; no equivale a instalarla manualmente en un Android o iPhone físico.

## Errores corregidos

1. Los títulos largos del historial y respaldo podían provocar scroll horizontal
   si se usaba una fuente alternativa más ancha. Ahora ajustan su ancho y pueden
   partir palabras largas, sin ocultar el contenido ni cambiar la estética base.
2. Una prueba leía IndexedDB justo después del ✓ optimista, antes de acabar la
   escritura. Las comprobaciones de persistencia esperan la cola; la prueba que
   exige confirmar antes del commit sigue comprobándolo expresamente.
3. Las pruebas podían confundir un panel retenido/oculto durante la carga diferida
   o el estado inicial de arranque con la pantalla final. Ahora esperan el área
   principal lista, la ruta de entrenamiento y el ejercicio abierto.

Los dos últimos son correcciones de las pruebas; no se ralentizó el ✓ ni se
cambió el guardado de la app. No se desactivaron comprobaciones para publicar.

## Publicación y límites pendientes

La consulta real al sitio devolvió HTTP 200, pero su título y manifest todavía
eran BLOOD & GUTS. El despliegue de Olympia había fallado en GitHub Actions:
https://github.com/AlvaroVZ14/Templates/actions/runs/41313136581

El JavaScript público sí contiene el marcador ppl-torso-leg-v1, pero no la marca
Olympia ni la pantalla simple-home. Esa inspección del código publicado no permite
leer la rutina personalizada ni el historial privado de un usuario instalado.

La corrección debe integrarse a main y completar Pages antes de que llegue al
celular. Después: Ajustes → Buscar actualizaciones → Actualizar ahora.

Pendientes: comparar el historial real con un respaldo anterior; probar instalación
manual y comportamiento del sistema en un teléfono físico; completar el despliegue
de la corrección. No se certifican 60 fps constantes: el informe de rendimiento
previo documenta pausas en CPU simulada 4×.

Validación final: **182 pruebas unitarias, 68 pruebas de navegador y build
correctos**. La suite completa terminó sin fallos en 5,8 minutos. Las bases usadas
en las pruebas y sus perfiles de navegador son aislados; no son los del usuario.
