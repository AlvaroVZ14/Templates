# Primer inicio y Perfil

El primer inicio de una instalación nueva abre la bienvenida y once temas, una
pantalla por tema, seguidos del resumen. Las instalaciones anteriores conservan
su entrada habitual: pueden crear o editar el perfil en **Ajustes → Perfil**.
También hay acceso desde la pantalla de configuración.

Las reglas se ajustan al tacto con deslizamiento o botones ±. Altura y peso se
conservan en cm/kg, aunque se muestren en ft/in y lb. Nombre y objetivo no se
saltan; las demás preguntas son opcionales. Se recupera el borrador tras recargar.
Las transiciones duran 180 ms y respetan movimiento reducido.

## Pantallas con un perfil ficticio

[Vista conjunta de las 13 pantallas](design/onboarding/galeria.png).

| Pantalla | Captura |
|---|---|
| Bienvenida | [00](design/onboarding/paso-00.png) |
| Nombre | [01](design/onboarding/paso-01.png) |
| Edad o nacimiento y sexo para la fórmula | [02](design/onboarding/paso-02.png) |
| Altura, peso y unidades | [03](design/onboarding/paso-03.png) |
| Grasa corporal opcional | [04](design/onboarding/paso-04.png) |
| Objetivo | [05](design/onboarding/paso-05.png) |
| Peso y fecha meta, aviso de ritmo | [06](design/onboarding/paso-06.png) |
| Experiencia y días | [07](design/onboarding/paso-07.png) |
| Horarios | [08](design/onboarding/paso-08.png) |
| Comidas y alimentos | [09](design/onboarding/paso-09.png) |
| Suplementos | [10](design/onboarding/paso-10.png) |
| Disponibilidad de cardio | [11](design/onboarding/paso-11.png) |
| Plan listo | [12](design/onboarding/paso-12.png) |

## Cálculo de ejemplo

23 años, 175 cm, 75 kg, volumen y 5 días de entrenamiento. Se muestran ambos
coeficientes porque el ejemplo solicitado no especifica sexo. Los días eligen un
factor **orientativo**, no una medición: 0 → 1,2; 1–2 → 1,375; 3–5 → 1,55;
6–7 → 1,725. El número de días no borra ni redistribuye la rutina existente.

Mifflin-St Jeor: `10 × kg + 6,25 × cm − 5 × edad + coeficiente`, con +5 o −161.
Fórmula pública del [artículo original, resumen en PubMed](https://pubmed.ncbi.nlm.nih.gov/2305711/).
Es una estimación de gasto en reposo; el factor de actividad y los ajustes de fase
son reglas orientativas de esta app, no una precisión atribuida al artículo.

| Concepto | Coeficiente masculino | Coeficiente femenino |
|---|---:|---:|
| Gasto basal estimado | 1.733,75 kcal | 1.567,75 kcal |
| Actividad | ×1,55 | ×1,55 |
| Mantención estimada | 2.687,31 kcal | 2.430,01 kcal |
| Volumen (+10%, redondeado) | **2.956 kcal** | **2.673 kcal** |
| Proteína (2 g/kg) | 150 g | 150 g |
| Grasas (0,9 g/kg) | 67,5 g | 67,5 g |
| Carbohidratos restantes | 437,1 g | 366,4 g |

Definición usa −17,5% por defecto, dentro de la guía solicitada de −15–20%.
Nunca se baja de 75% de la mantención ni del basal estimado. Se redondean los
límites hacia arriba. Si hacen falta más calorías para cubrir proteína y grasa,
se respeta ese mínimo y se informa. Las ediciones manuales tampoco eluden el
límite cuando existe un perfil calculable.

La guía de ritmo es 0,25–0,5% del peso por semana en volumen y 0,5–1% en
definición. Para 75 kg, volumen equivale a 0,1875–0,375 kg/semana. El aviso de
fecha propone una alternativa, pero permite conservar la elección; no fuerza
un déficit para cumplirla. Las preguntas omitidas no inventan sexo, talla ni peso.
Sin los datos necesarios —o sin edad adulta— se pide completarlos al abrir Comida.
El resto sigue disponible.

## Integraciones y conservación

- Hoy muestra nombre, distancia a la meta y avance. Al vencer la fecha, acercarse
  o superar la meta ofrece cambiar de fase; requiere un toque explícito.
- Comida aplica las metas del perfil y genera el número elegido de comidas con
  alimentos permitidos. Las exclusiones prevalecen. Si la selección no permite
  cubrir macros, informa del desfase y no introduce otros alimentos.
- El horario de sueño produce una meta entre 7 y 9 h. Los recordatorios son
  avisos dentro de la app abierta, no notificaciones en segundo plano.
- El cardio conserva calendario y reglas de recuperación; el máximo personal
  limita los minutos. Volumen mantiene la base menor y definición la mayor.
- Check mensual precarga peso y medidas previos, y muestra trayectoria a la meta.
- Progresión conserva sus reglas de carga; en definición explica que mantenerla
  es un resultado válido. Los indicadores de cuerpo usan el ritmo porcentual
  cuando hay perfil y conservan las reglas anteriores para instalaciones previas.
- Un cambio de perfil recalcula el día actual explícitamente y archiva sus metas
  y plan previos. Conserva consumos, entrenamientos, fotos y días anteriores.

## Almacenamiento y borrado

Perfil y borrador viven en el registro de app de **IndexedDB**, con versión 1
del perfil y versiones históricas por fecha. No hace falta cambiar el esquema
de almacenes ni renombrar la base. Los respaldos incluyen el perfil y validan su
estructura antes de importar. No hay API ni servidor de datos.

**Borrar mis datos** pide confirmación. Se detiene el guardado pendiente y se
limpian todas las colecciones, fotos y respaldos internos en una sola transacción,
junto con un estado inicial vacío. Un fallo revierte el borrado. Se avisa a otras
pestañas abiertas para que no restauren su copia anterior. No borra archivos JSON
que el usuario haya descargado fuera de la app.

Las pruebas usan perfiles y navegadores aislados; no se accedió ni borró el
historial real de un teléfono. Trabajo realizado por Codex con un solo agente.

## Verificación

- 192 pruebas de cálculos y almacenamiento aprobadas.
- 78 pruebas de navegador aprobadas, incluido el recorrido completo, uso offline,
  borrador recuperado, edición, respaldo de ida y vuelta y conservación del historial.
- Borrado probado con cancelación, error simulado de IndexedDB (reversión completa)
  y dos pestañas abiertas, sin resurrección de los datos.
- Compilación de producción aprobada. Capturas reales del recorrido en 390 px.
