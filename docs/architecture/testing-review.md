# Verificación independiente

Fecha: 31 de octubre de 2026, America/Santiago. Base revisada: `3ce7a5c`, rama `templates/inicio`. Alcance: ejecutar la verificación existente sin modificar fuentes, pruebas ni configuración.

## Resultados

Entorno: Windows, Node.js `v24.20.0`, npm `11.19.0`; dependencias ya instaladas. Desde la raíz del proyecto:

| Comando | Resultado real |
| --- | --- |
| `npm test` | 137 pruebas aprobadas, 0 fallidas; salida 0. |
| `npm run build` | Compilación aprobada; salida 0. 100 módulos transformados. |
| `npm run test:e2e` | 106 escenarios Playwright aprobados, 0 fallidos, en 10,9 minutos; salida 0. |

Los intentos iniciales de pruebas unitarias y compilación dentro del sandbox fallaron con `spawn EPERM` antes de verificar la aplicación. Los mismos comandos se ejecutaron después con la escalación autorizada y aprobaron. Es una restricción de ejecución, no un fallo de lógica de la aplicación. Playwright se ejecutó con esa escalación desde el inicio.

La compilación advierte un paquete JavaScript de **555,90 kB**, **169,39 kB gzip**, superior al umbral de 500 kB. No impide generar `dist/`.

## Cobertura comprobada

- Preparaciones y redondeos, progresión, técnicas, descarga, calendario chileno y cambios de hora, peso y alimentación: cubiertos por pruebas unitarias existentes.
- Migración IndexedDB v1→v2: copia original, índices y conservación; fallo de migración con rollback y reintento. Importación inválida y fallo transaccional; exportación/importación de ida y vuelta con datos ficticios.
- PWA: actualización real automática y manual, espera de descarga antes de ofrecer actualizar, conservación de series y borradores, recarga y registro sin conexión.
- Navegación, estados vacíos, persistencia, registro compacto por pestañas, notas y extensiones; gimnasio, cardio por fase, efectos y movimiento reducido. Incluye comprobaciones de teclado y anchuras 320–1440 px en los escenarios correspondientes.

Playwright usa **Chromium local, un trabajador y vista inicial de 390×844 px**; algunas pruebas cambian dimensiones y simulan sensores, vibración y Wake Lock. No equivale a verificar instalación ni rendimiento en un Android o iPhone físico, ni valida Safari/WebKit. Los artefactos y capturas generados quedan en `test-results/`, ignorado por Git.

## Comprobación adicional: exportar durante el debounce

La revisión de backend identificó que `SessionEditor` escribe borradores mediante un debounce de 250 ms (`src/drafts.jsx`) y que `BackupButton` llama a `exportBackup()` sin vaciarlos previamente. En Historial coexisten editor y exportador. Esto justifica revisar la ventana entre la edición y su persistencia en IndexedDB; la suite aprobada no demuestra esa intercalación concreta.

Se hizo **un intento adicional**, separado de los 106 escenarios: script Node ESM por stdin de PowerShell (`@'…'@ | node --input-type=module`), servidor estático local de `dist/`, contexto Chromium aislado, sesión ficticia y reloj controlado. Su objetivo era editar notas sin guardar, detener el reloj, exportar inmediatamente y comparar `trainingDrafts` del JSON con la copia local; luego avanzar 500 ms y comparar otra exportación.

**No se llegó a probar la exportación.** La transmisión por stdin convirtió el texto acentuado del selector en `Posponer configuraci?n`; el manejador de configuración inicial no encontró el botón y terminó con `locator.click: Target page, context or browser has been closed`, salida 1. El contexto y servidor se cerraron. Es un fallo de instrumentación y no prueba un defecto funcional de exportación. No se alteraron fuentes ni se usaron registros personales; no se repitió el intento.

## Tres prioridades de seguimiento

1. **B-01, pendiente:** cubrir la exportación inmediata de borradores mediante un escenario determinista que detenga los 250 ms y use selectores Unicode seguros. El riesgo está respaldado por lectura, todavía sin reproducción funcional en esta revisión.
2. **Carga inicial:** medir el paquete en un móvil real antes de decidir una separación por pantallas. El tamaño superior al umbral es una advertencia comprobada; no se afirma una caída de FPS.
3. **Dispositivos reales:** validar Safari/iOS y Chrome/Android instalados, actualización, teclado numérico, vibración y pantalla encendida. El resultado local no cubre las diferencias de sus APIs y políticas de almacenamiento.

Uso de IA: Codex coordinó y ejecutó esta verificación automatizada y redactó el informe. No se declara revisión humana ni auditoría de seguridad absoluta. No se cambiaron datos, cálculos, dependencias o esquema de almacenamiento.
