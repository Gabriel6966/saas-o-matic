# Prompt #30 (v2) — Alta de clientes y simulador Angular con diseño Editorial B2B premium

> **Proyecto:** SaaS-O-Matic · Prueba técnica Roams  
> **Rama requerida:** `feature/angular-simulator` (desde `main` actualizado tras fusionar PR #6)  
> **Modo Codex:** ejecución/edición; no Plan  
> **Estado inicial:** PR #1–#6 fusionados; backend con seis rutas y frontend Angular con dashboard, ficha e historial funcionales y rediseño Editorial B2B premium aprobado.

## 0. Comprobaciones y límites antes de editar

1. Confirma `git branch --show-current` = `feature/angular-simulator` y `git status --short` limpio o explica cambios existentes; no descartes trabajo ajeno.
2. Lee `AGENTS.md`, `README.md`, `ai-workspace/01-requirements.md`, `02-architecture.md`, `03-api-contracts.md`, `04-frontend-design.md`, `05-ai-development-log.md` y `decision-log.md`.
3. Inspecciona los **archivos reales** de `frontend/` (arquitectura, servicios HTTP, modelos, rutas, estilos/tokens, pruebas) antes de tocar componentes. Respeta Angular/TypeScript y las dependencias ya fijadas; no regeneres el proyecto ni actualices paquetes por iniciativa propia.
4. **Lee y aplica la skill instalada `frontend-design`**. Si no está disponible, indícalo antes de actuar; nunca afirmes que la has empleado sin leerla.
5. La dirección visual **YA ESTÁ ELEGIDA por el responsable técnico**: **Editorial B2B premium**, tipografía Georgia/Segoe UI, petróleo y verde bosque, superficies y tokens aprobados en el PR #6. **No propongas ni hagas otro rediseño**, ni reabras la elección estética. Extiende los componentes existentes de manera consistente.
6. No modifiques backend, motor económico, bases, contratos REST o decisiones aprobadas. No inventes endpoints ni datos de negocio.

## 1. Resultado esperado

Completar dos recorridos **reales, utilizables y responsive** en Angular:

- **Alta de clientes** desde el listado y navegación a su ficha tras una respuesta HTTP 201.
- **Simulador en la ficha:** usuarios activos con slider y entrada numérica sincronizados, GB y llamadas API, previsualización en tiempo real en EUR mediante FastAPI y guardado explícito de la simulación; refrescar el historial existente.

Debe funcionar con el backend real, no con mocks en ejecución. Los mocks/fixtures se permiten únicamente en tests claramente identificados. Priorizar robustez y entrega funcional sobre ornamentación.

## 2. Alta de clientes

- Proporciona una acción «Nuevo cliente» visible y accesible desde `/customers`, con formulario Reactive Forms integrado en el sistema visual actual.
- Campos exactos del contrato: `company_name`, `tax_identifier`, `email`, `country_code`, `plan`; ninguno extra. Plan es texto obligatorio sin catálogo o tarifa inventada.
- Países iniciales a elegir: ES, FR y DE, indicando que las tasas son una **simplificación comercial de la prueba**, no una estimación fiscal oficial. No dar a entender que el plan afecta al precio.
- Validación en Angular para UX (requeridos, correo, longitudes, formato básico); el backend siempre decide la validez definitiva del identificador fiscal. No duplicar ni falsear el algoritmo DNI/NIE/NIF en la interfaz.
- Estados: formulario inválido, envío pendiente, éxito, conflicto `409`, errores `422` de campo/identificador, error de red y error inesperado. Emplear los `error.code` y `details` del contrato, pero mostrar mensajes entendibles y no exponer información sensible.
- Deshabilitar dobles envíos; éxito solo tras respuesta `201`. Ofrecer acceso directo a `/customers/{id}`, conservando una navegación de vuelta razonable. Evitar perder información del formulario por un fallo temporal.
- Campos etiquetados, errores asociados, foco visible, accesibilidad de teclado y diseño a 320 px.

## 3. Simulador interactivo conectado a FastAPI

### Entradas y experiencia

- Añade un panel destacado pero proporcionado en `/customers/:customer_id`, reutilizando tokens, tipografía, espaciado, superficies y controles existentes. No eliminar ni romper ficha, historial, búsqueda o paginación.
- Formulario Reactive Forms con `active_users`, `storage_gb`, `api_calls`: **enteros estrictos de 0 a 1.000.000 inclusive**, sin fracciones, truncamientos, redondeos ni coerciones engañosas. Cero válido. La validación del backend sigue siendo autoritativa.
- Slider visible, etiquetado y accesible para `active_users`, sincronizado bidireccionalmente con entrada numérica. Diseña un rango de uso cómodo para valores habituales; permite llegar al máximo de 1.000.000 escribiéndolo, sin que el slider deba ser impracticable. Define claramente qué hace el slider si el número excede su rango visual; no lo sobrescribas silenciosamente.
- `storage_gb`, `api_calls` y `plan` **no modifican el precio**: se guardan como contexto según el contrato. No añadir tarifas, descuentos ni gráficos monetarios inventados.

### Preview reactiva

- Llama exclusivamente a `POST /simulations/preview`, enviando **solo** `{customer_id, active_users, storage_gb, api_calls}`. El `customer_id` procede de la ficha cargada.
- Usa RxJS `valueChanges`, `debounceTime(300)` para reducir llamadas, comparación relevante y `switchMap` para sustituir/cancelar consultas obsoletas. **Crítico:** marcar el resultado anterior como desactualizado de inmediato al cambiar cualquier campo, ANTES del debounce; con formulario inválido, cancelar de inmediato la consulta vigente. No permitir que respuestas antiguas reaparezcan durante el debounce o después de un error.
- Estados claros: esperando edición, cargando, precio actualizado, inválido, fallo/reintento, y país sin política fiscal (`tax_policy_not_configured`). `catchError` debe recuperar por petición sin matar la escucha de futuros cambios. Manejar destrucción del componente y evitar suscripciones duplicadas.
- **No calcular tarifas ni impuestos en Angular**. Mostrar exactamente `base_amount`, `tax_rate`, `tax_amount`, `total_amount`, `currency` devueltos por el servidor. El backend usa cadenas monetarias exactas; **no introducir floats ni conversiones aritméticas con `Number`** para precios. Si se muestran separadores visuales, que no alteren la cantidad ni la precisión almacenada.
- No confundir el total de la última preview con el resultado de un guardado posterior; el backend vuelve a calcular al guardar.

### Guardado e historial

- Botón explícito «Guardar simulación»; habilitar solo con entrada válida y sin petición de guardado en curso. Si la preview está obsoleta o no válida, evitar presentar un importe viejo como precio actual (puedes exigir una preview vigente antes de permitir el guardado si encaja con la UX).
- `POST /simulations` recibe **solo los cuatro campos de entrada**, jamás importes, tasas, moneda, país ni plan. Evitar dobles clics/guardados concurrentes y reintentos automáticos de un POST cuya respuesta sea incierta.
- Mostrar éxito únicamente tras `201` con el resultado **persistido** devuelto. Indicar si el importe guardado difiere de la preview (si el contexto cambió), sin esconderlo.
- Tras guardar, refrescar el historial del cliente, sin mezclar snapshots históricos con datos actuales y sin romper orden/paginación; considerar volver a la primera página si es preciso para hacer visible el registro nuevo, con comportamiento explícito.
- Presentar errores del backend conforme a la estructura común, sin filtrar trazas ni mostrar información privada innecesariamente.

## 4. Pruebas y verificaciones

Amplía la suite Angular existente. Como mínimo, casos para:

1. Alta correcta y navegación; `409`, `422`, errores de red, validación local y prevención de doble envío.
2. Payloads exactos de los tres POST (sin campos adicionales); serialización sin fracciones.
3. Slider y valor numérico sincronizados, límites 0 y 1.000.000, cambios fuera del rango cómodo del slider.
4. Preview con debounce, cambios rápidos, cancelación de respuesta tardía **antes del debounce**, estados inválidos, error y recuperación tras otro cambio.
5. Guardado devuelve `201`, evita doble envío, utiliza el resultado guardado y actualiza el historial.
6. Regresiones de dashboard, búsqueda, estado de retorno, historial y estilos responsive.

Ejecuta realmente desde la raíz:

```powershell
npm --prefix frontend run build
npm --prefix frontend test
```

Si puedes, verifica el flujo end-to-end contra FastAPI real con **datos ficticios y una base aislada**, sin borrar ni modificar la base personal/de desarrollo. Comprueba escritorio y móvil (incluido 320/375 px), teclado, etiquetas, foco, loading/error y ausencia de desbordamiento horizontal. Distingue exactamente qué has probado de lo no comprobado. Si arrancas procesos, detén los tuyos al acabar.

## 5. Restricciones y evidencia

- **No implementar todavía las divisas EUR/USD/GBP** ni acceso a ExchangeRate-API; lo haremos en el Prompt #31.
- No alterar backend, código Python, contratos, decisiones, estructura SQLite o tarifas.
- No introducir React, Tailwind, nuevos paquetes importantes, dependencias CDN necesarias o librerías de estado sin pedir permiso.
- No inventar capturas, resultados de tests, evidencias de interacción humana ni datos reales.
- Documenta en `README.md` solo los nuevos pasos de uso realmente probados. Actualiza `ai-workspace/05-ai-development-log.md` con el trabajo y los resultados reales; añade al documento `04-frontend-design.md` una nota mínima solo si procede, sin rediseñar lo aprobado.
- No hagas `git add`, commit, push, merge ni PR. No elimines archivos ni datos existentes fuera del alcance.

## 6. Informe final requerido

Al terminar, explica brevemente:

- Qué experiencia y componentes has construido, con rutas y servicios usados.
- Cómo comprobar desde navegador alta → ficha → preview → guardado → historial.
- Resultados exactos de build y test, avisos y fallos; comprobación manual real si la has hecho.
- Decisiones UX significativas, especialmente slider y gestión de previews obsoletas.
- `git status --short`, `git diff --check` y tratamiento de archivos nuevos/excluidos.
- Límites pendientes y cualquier bloqueo real, **sin ampliar artificialmente el alcance**.

Espera mi revisión humana antes de cualquier commit. Prioriza que el recorrido funcional completo quede terminado y probado.
