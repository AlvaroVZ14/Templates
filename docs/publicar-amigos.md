# Publicar Olympia Amigos

URL de esta edición: **https://alvarovz14.github.io/Olympia-amigos/**.
GitHub Pages es gratuito para este repositorio público y sirve la app estática
por HTTPS, sin backend ni credenciales de terceros. El repositorio de publicación
es **AlvaroVZ14/Olympia-amigos**, creado desde una copia limpia de `version-amigos`,
sin los commits anteriores del proyecto personal. No se cambia el sitio Templates.

## Configuración exacta

En el repositorio **Olympia-amigos** → Settings → Pages:

1. Source: **GitHub Actions**.
2. Mantener **Enforce HTTPS** activado (github.io lo proporciona automáticamente).
3. El workflow `.github/workflows/friends.yml` prueba, compila y publica cada push
   a **version-amigos**. Solo despliega si el repositorio es Olympia-amigos; en
   el repositorio original ese mismo workflow solo verifica.

Comandos equivalentes para configurar Pages una vez que exista la rama:

```powershell
gh api --method POST repos/AlvaroVZ14/Olympia-amigos/pages -f build_type=workflow
gh api repos/AlvaroVZ14/Olympia-amigos/pages --jq '{url: .html_url, https: .https_enforced, tipo: .build_type}'
```

El POST se usa solo al crear el sitio; no hay que repetirlo si Pages ya existe.

## Trabajar y publicar una actualización

Usa este clon independiente, no añadas el nuevo remoto al repositorio que
contiene los commits personales:

```powershell
git clone --branch version-amigos https://github.com/AlvaroVZ14/Olympia-amigos.git
cd Olympia-amigos
npm ci
npm run dev
```

Abre `http://localhost:5173/Olympia-amigos/`. Después de editar:

```powershell
npm version patch --no-git-tag-version
npm test
npm run build
git add .
git commit -m "Actualiza Olympia Amigos"
git push origin version-amigos
gh run list --repo AlvaroVZ14/Olympia-amigos --limit 3
```

El número de versión está en `package.json`; Acerca de muestra versión y commit
de compilación. La caché se identifica por contenido, nunca por los datos del
usuario. El aviso aparece cuando la nueva descarga offline terminó. Se guardan
series y borradores antes de activar el worker; nunca se borra IndexedDB al actualizar.

`base` es `/Olympia-amigos/`. El manifest usa `./` para id, inicio y scope; el
worker se registra bajo esa base y solo limpia cachés de su propio scope. La base
IndexedDB exclusiva sigue siendo `olympia-friends`. Cambiar de dominio u origen
no mueve datos: para ello usa Exportar/Importar.

## Auditoría reproducible

```powershell
npx playwright install chromium
npm run audit:lighthouse -- https://alvarovz14.github.io/Olympia-amigos/
node scripts/audit-pwa.mjs https://alvarovz14.github.io/Olympia-amigos/
```

Lighthouse 12 y posteriores eliminaron la categoría PWA. Se reportan rendimiento,
accesibilidad y buenas prácticas con Lighthouse, y por separado el manifest,
errores de instalación de Chromium, dimensiones de iconos, scope y uso offline.
Fuentes: [Lighthouse](https://github.com/GoogleChrome/lighthouse/releases/tag/v12.0.0),
[HTTPS de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
Los resultados automatizados no equivalen a probar un iPhone o Android físico.

El QR está en `public/compartir-qr.png` y `.svg`, también en Ayuda / Instalar.
Las pantallas de inicio iPhone cubren seis tamaños habituales en vertical;
el arranque HTML se adapta a otros tamaños/orientaciones. Android usa el manifest,
los iconos de 192/512 y los maskable, además del mismo arranque con logo.

## Futuras migraciones

Hay dos versiones independientes:

- **Estado JSON:** `DATA_SCHEMA_VERSION` en `src/schema.js` (actual 7). Añade la
  siguiente entrada a `STATE_MIGRATIONS` en `domain.js`, devuelve el estado con
  la versión siguiente y aumenta la constante. El runner clona antes de migrar,
  exige cada paso, no modifica el origen si falla y rechaza versiones futuras.
- **IndexedDB:** `DATABASE_VERSION` y pasos numerados en `dbMigrations.js` (actual 2).
  Solo aumenta si cambian stores o índices. Añade un paso nuevo sin ejecutar otra
  vez el creador inicial. Todas las operaciones del upgrade pertenecen a la misma
  transacción; un error la aborta y conserva la base anterior. Conserva la copia
  original de la migración v1→v2 y verifica su proyección de sesiones.

No cambies el nombre de la base, no uses `deleteDatabase`, ni borres stores para
actualizar. Si cambias la versión física, adapta también la compatibilidad del
formato de respaldo en `backup.js`. Prueba un respaldo antiguo, un estado lleno,
la idempotencia, el fallo intermedio y la exportación/importación antes de publicar.
No se aumenta una versión de datos solo por un cambio visual.

## Checklist en un celular real

- [ ] Abrir el enlace HTTPS correcto y comprobar que se inicia sin datos personales.
- [ ] iPhone: Safari → Compartir → Agregar a pantalla de inicio. Android: Chrome
      → ⋮ → Instalar app / Agregar a pantalla de inicio.
- [ ] Cerrar y abrir desde el icono: logo sin cortes, fondo oscuro, sin barra de URL.
- [ ] Completar Perfil y guardar una serie; esperar «Offline listo».
- [ ] Activar modo avión, cerrar y reabrir; registrar otra serie y confirmar que
      ambas siguen después de recargar. Volver a activar la conexión.
- [ ] Exportar JSON; importar en otro navegador/dispositivo y comprobar perfil,
      sesiones, fotos y medidas. No borrar el original antes de validarlo.
- [ ] Mantener una sesión con datos guardados y publicar una versión patch desde
      el clon independiente. Volver con internet o Buscar actualizaciones.
- [ ] Tocar «Hay una versión nueva · Actualizar»: confirmar la nueva versión en
      Ajustes → Acerca de y que continúan las series y borradores anteriores.
- [ ] Escanear el QR desde otro celular y comprobar que abre la edición Amigos.
- [ ] Comprobar aparte que la app personal sigue mostrando sus propios registros.
