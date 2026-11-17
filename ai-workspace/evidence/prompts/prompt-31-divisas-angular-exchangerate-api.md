# Prompt #31 — Divisas EUR/USD/GBP con ExchangeRate-API

**Proyecto:** SaaS-O-Matic  
**Rama esperada:** `feature/angular-currencies` (crear por el responsable desde `main` después de fusionar el PR #7)  
**Herramienta:** Codex en VS Code, modo Plan desactivado  
**Estado:** instrucción de implementación, sujeta a revisión humana; **sin commit, push ni PR**.

## 0. Antes de editar

1. Comprueba `git branch --show-current`, `git status --short` y que la rama procede de `main` actualizado que incluye PR #7. Si el repositorio está desactualizado, tiene trabajo ajeno o la rama es incorrecta, **detente y explica las opciones; no hagas `reset --hard`, rebase, merge ni limpiezas destructivas por tu cuenta**.
2. Lee `AGENTS.md`, `ai-workspace/01-requirements.md`, `ai-workspace/02-architecture.md`, `ai-workspace/03-api-contracts.md`, `ai-workspace/04-frontend-design.md`, `ai-workspace/decision-log.md` y el código Angular actual. Consulta la skill `frontend-design` **si está disponible** para preservar el lenguaje visual existente, no para rediseñar la aplicación.
3. Inspecciona cómo se muestran los importes y dónde se ubican la previsualización, la confirmación de guardado y el historial. Propón brevemente la integración antes de hacer cambios, sin pedir aprobación si no hay contradicciones materiales.

## 1. Objetivo funcional

Completa D-08 / A-04: mostrar **EUR, USD y GBP** en el simulador y, cuando resulte útil, en el resultado guardado o historial; **todos los importes persistidos y contratos FastAPI permanecen en EUR**. La conversión es exclusivamente visual y orientativa.

**Proveedor autorizado:** `https://open.er-api.com/v6/latest/EUR` (servicio abierto sin clave de ExchangeRate-API).

Documentación oficial: https://www.exchangerate-api.com/docs/free

Condiciones relevantes del proveedor: atribución obligatoria en las vistas que utilicen tipos de cambio; actualización aproximadamente diaria; caché permitida; rate limiting y posible `429`.

## 2. Implementación Angular

- Crear un **servicio de divisas aislado**, con modelos tipados y lógica de presentación reutilizable, sin modificar el motor Python ni duplicar las tarifas por usuarios o impuestos.
- Solicitar tasas partiendo de EUR y validar la respuesta externa: HTTP satisfactorio, `result === "success"`, `base_code === "EUR"`, tasas EUR/USD/GBP presentes, positivas y finitas, fechas de actualización válidas. Manejar payload inesperado, errores de red, timeouts y `429`.
- Utilizar las fechas `time_last_update_unix` y `time_next_update_unix` del proveedor para presentar la fecha efectiva y planificar una caché razonable; evitar nuevas solicitudes cada vez que cambia el slider, se cambia de divisa o se navega. Puede usarse caché en memoria y, si se justifica, almacenamiento local con validación del contenido y caducidad; **no confiar en datos corruptos ni mostrar tasas antiguas como actuales**.
- Comprobar **CORS real desde el navegador** en `http://localhost:4200`. Si falla, registrar exactamente lo observado y explicar la alternativa de adaptador backend, **sin introducir proxies públicos de terceros o cambiar silenciosamente la arquitectura**.
- El selector EUR/USD/GBP debe indicar claramente el estado de carga y la moneda seleccionada; EUR funciona siempre y no necesita la API externa. Si el proveedor falla, continuar mostrando importes EUR originales y un mensaje claro; no mostrar valores USD/GBP inventados ni un cambio de moneda aparentemente exitoso sin tasa válida. Si se decide utilizar una tasa previamente almacenada, identificarla como no actual y mostrar su fecha.
- **Precisión:** partir de los importes EUR recibidos como cadenas decimales exactas y convertir utilizando aritmética decimal apropiada (por ejemplo `decimal.js`, como dependencia de ejecución si resulta necesario) y redondeo `ROUND_HALF_UP` a 2 decimales **solo para visualización**. No usar `parseFloat`/`number` como fuente monetaria ni modificar las cadenas EUR recibidas. Verificar importes pequeños, fronteras de medio céntimo, 0 y valores grandes.
- Mostrar la fecha de la tasa y la atribución enlazada **“Rates By Exchange Rate API”** hacia https://www.exchangerate-api.com, al menos en las pantallas que muestran conversiones.
- Respetar componentes, diseño Editorial B2B premium, tokens, tipografía, accesibilidad, navegación por teclado y responsive. No añadir dashboards, métricas, gráficos ni otros adornos que no correspondan a datos reales.
- La tasa de cambio **no cambia** el país fiscal, el impuesto, los contratos REST, la petición de guardado ni los snapshots históricos en EUR. Al guardar una simulación en otra divisa visual, el backend debe continuar recibiendo únicamente las cuatro entradas aprobadas.

## 3. Pruebas y verificaciones

Añade pruebas de Angular de alcance focalizado para:

1. Conversión EUR → USD/GBP usando respuestas simuladas, con redondeo decimal correcto; EUR permanece exacto.
2. Faltan tasas, fechas erróneas, respuesta de error, HTTP `429`, fallo de red y espera de carga.
3. Caché: no se repiten peticiones por slider/navegación mientras el dato siga vigente; se renueva cuando caduca; los datos corruptos se ignoran.
4. Selector accesible y actualización visual sin alterar los importes EUR originales.
5. Simulación guardada e historial continúan mostrando importes de backend, sin cálculos económicos adicionales ni nuevas escrituras por seleccionar moneda.
6. Regresiones del simulador, alta de clientes, búsqueda, historial y navegación.

Ejecuta realmente:

```powershell
npm --prefix frontend run build
npm --prefix frontend test
```

Comprueba manualmente, si el entorno lo permite, la aplicación con FastAPI y Angular en escritorio y móvil; **prueba la consulta real al proveedor desde el navegador**, no solo desde Node o PowerShell. Registra resultado, estado de carga, fallback, atribución y responsive. Si no es viable probarlo, decláralo explícitamente. No afirmes que el navegador o el proveedor fueron comprobados sin haberlos comprobado.

## 4. Documentación y límites

- Actualiza solo los archivos frontend necesarios, `README.md` y `ai-workspace/05-ai-development-log.md`; puedes actualizar `04-frontend-design.md` únicamente si documenta decisiones visuales reales de esta integración.
- Conserva las especificaciones y decisiones aprobadas sin modificarlas.
- No modifiques el backend salvo que detectes un bloqueo genuino: si ocurre, **detente y expón el problema** antes de extender el alcance.
- No añadas otras divisas, nuevos endpoints, cuentas de usuario ni lógica de impuestos.
- No añadas API keys ni secretos; el endpoint aprobado es público y sin clave.
- No hagas commits, `git add`, push, merge ni PR.

## 5. Entrega de Codex

Devuelve en español:

1. Resumen de archivos creados/modificados y decisiones de implementación.
2. Resultados reales de `build`, tests y, si se hizo, pruebas manuales y CORS del proveedor en navegador.
3. Ejemplos visuales de EUR/USD/GBP y cómo se muestran fecha, atribución, errores y caché, distinguiendo datos reales de fixtures.
4. Riesgos restantes y límites de exactitud de la tasa externa.
5. `git status --short`, `git diff --check`, lista de archivos nuevos y confirmación de que no se han versionado compilados, cachés, secretos ni `node_modules`.
6. Espera revisión humana antes de cualquier commit.
