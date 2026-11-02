# Olympia · edición amigos

PWA privada de entrenamiento. Sin cuentas, backend, analytics ni rastreadores.
Cada instalación empieza sin perfil, pesos, medidas, fases, fotos ni entrenamientos.
El onboarding guarda sus datos exclusivamente en IndexedDB del dispositivo.

Esta edición vive en la rama **version-amigos**. No debe integrarse en `main`
del repositorio personal ni desplegarse sobre su sitio. Su alojamiento independiente
es **https://alvarovz14.github.io/Olympia-amigos/**, en el repositorio limpio
**AlvaroVZ14/Olympia-amigos**. Cada push de código a `version-amigos` en ese
repositorio prueba y publica mediante GitHub Actions. En el repositorio original
el workflow solo verifica; nunca modifica la web personal.

[Configuración, comandos, migraciones y checklist en celular](docs/publicar-amigos.md).
Dentro de la app: **Ajustes → Ayuda / Instalar** y **Ajustes → Acerca de**.

## Ejecutar

```powershell
npm ci
npm run dev
```

Abre `http://localhost:5173/Olympia-amigos/`. Para revisar el paquete de producción:

```powershell
npm run build
npm run preview
```

La instalación y el uso offline necesitan HTTPS o localhost y una primera carga
con conexión. El manifest y el service worker usan rutas relativas a esta edición.

## Rutinas

En **Ajustes → Rutina** puedes elegir Full Body 3 días, Torso/Pierna 4,
PPL + Torso + Leg 5 o Push/Pull/Legs 6. La plantilla de cinco días es la
predeterminada, sin pesos personales. Las otras son puntos de partida generales.
Puedes añadir, quitar y reordenar ejercicios, cambiar músculo, equipo, carga,
series, rango por serie, Top/Back-off, Drop y RP. Drop y RP se aplican dentro de
la última serie y no aumentan el volumen. El volumen semanal se recalcula.
Guarda para aplicar; los borradores se recuperan y el historial no se borra.
Termina una sesión abierta antes de sustituir su rutina.

## Datos y respaldo

**Ajustes → Configuración**: Exportar mis datos, Importar datos (combinar o
reemplazar) y Borrar todo. El JSON incluye las fotos e historial y debe guardarse
en un lugar privado. La importación valida antes de cambiar datos. El borrado
requiere confirmación y afecta solo a la base `olympia-friends` y sus claves
`olympia-friends-*`; no lee, migra ni borra la base de la edición personal.
No hay sincronización automática entre celulares ni envío de registros.

El sitio incluye `noindex, nofollow`; esto no es autenticación ni protege una
URL compartida. Los datos no están incluidos en la página pública.

## Comentarios

El botón **Enviar comentarios** está en Configuración y abre un mensaje a
`alvaro.valdes@alumnos.ucn.cl`, dirección autorizada para este fin. Puedes cambiarla
con la variable pública `VITE_FEEDBACK_EMAIL` al compilar:

```powershell
$env:VITE_FEEDBACK_EMAIL = 'correo-a-configurar@example.org'
npm run build
```

No incluyas claves en variables `VITE_*`: pasan al navegador. Este correo será
visible en el código público. El botón abre el cliente de correo, sin adjuntar
datos automáticamente. Sin dirección configurada explica que aún está pendiente.

## Acerca de

Accesible desde Ajustes en el menú. Los cálculos y sugerencias son orientativos,
no reemplazan a un médico o nutricionista. Las personas con condiciones médicas
deben consultar antes de empezar. Dieta y déficit se recomiendan para mayores
de 18 años; el cálculo de calorías requiere edad adulta.

## Recursos y revisión

La portada es un SVG genérico propio (`public/hero-generic.svg`), sin fotos ni
semejanzas solicitadas con personas reales. El emblema existente es vectorial
propio. Las fuentes locales Anton y Barlow mantienen sus licencias OFL en
`src/assets/fonts` y `public/licencias`. No se afirma afiliación con marcas o entrenadores.

[Informe de auditoría y entrega](docs/version-amigos.md).
[Auditoría de la web publicada](docs/publicacion/README.md).

La eliminación de archivos en esta rama no borra el historial Git previo. Para
compartir únicamente el código saneado, usa un ZIP de esta rama o un repositorio
nuevo creado desde ese ZIP, sin copiar `.git`. La rama personal queda intacta.

```powershell
npm test
npm run test:e2e
```
