# SaaS-O-Matic — Angular

Primer flujo de solo lectura: búsqueda de clientes, ficha responsive e historial original EUR. Consulta el [README de la raíz](../README.md#frontend-angular) para requisitos, arranque conjunto con FastAPI y comprobaciones reales.

Desde la raíz del repositorio, en PowerShell:

```powershell
npm --prefix frontend ci --no-fund
npm --prefix frontend start
npm --prefix frontend run build
npm --prefix frontend test
```

Detén `start` con Ctrl+C para ejecutar los siguientes comandos en esa consola, o usa otra consola. Angular está en `http://localhost:4200`; la API se configura en `public/config.js`, por defecto `http://127.0.0.1:8000`.

```text
src/app/
  core/api/              Modelos, URL configurable, errores y servicios HTTP
  core/query.ts          Validación de búsqueda e identificadores de ruta
  features/customers/    Buscador y ficha
  features/simulations/  Historial de solo lectura
  shared/               Estados, paginación y presentación de país/fecha UTC
  app.routes.ts         Rutas standalone cargadas bajo demanda
src/testing/            Datos sintéticos exclusivos de las pruebas
public/                 Configuración pública e icono propio
```

Las pruebas `*.spec.ts` viven junto al código. Angular no incluye semillas, cálculo de precios, escrituras, conversión monetaria ni dependencias visuales externas. `node_modules`, `dist`, cachés, capturas locales y bases temporales están excluidos de Git.
