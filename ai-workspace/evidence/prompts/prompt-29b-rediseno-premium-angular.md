# Prompt #29B — Rediseño premium del dashboard SaaS-O-Matic

## Contexto y objetivo

Estás trabajando en **SaaS-O-Matic**, prueba técnica de Roams, en la rama `feature/premium-dashboard-redesign`, creada desde `main` después de fusionar el PR #5.

El dashboard Angular ya funciona y está conectado al backend FastAPI real. Este encargo es **mejorar radicalmente la calidad visual y la experiencia de uso**, sin degradar las funcionalidades existentes y sin ampliar el alcance funcional.

**Activa y sigue explícitamente la skill instalada `frontend-design` antes de proponer o modificar la interfaz.** Si no está disponible, informa y detente: no finjas haberla utilizado. No cambies Angular por React, ni introduzcas un framework diferente.

### Fuentes de referencia obligatorias

Lee el código y los estilos existentes de `frontend/`, además de:
- `AGENTS.md`
- `ai-workspace/01-requirements.md`
- `ai-workspace/02-architecture.md`
- `ai-workspace/03-api-contracts.md`
- `ai-workspace/04-frontend-design.md`
- `ai-workspace/decision-log.md`
- `README.md`

Comprueba la rama y el estado de Git. Respeta todos los contratos y decisiones aprobados. No presupongas que las capturas adjuntas en otra conversación son accesibles: inspecciona los componentes reales y, si es posible, ejecuta el frontend para revisar su aspecto actual.

## Fase 1 — Dirección de diseño: parada obligatoria para decisión humana

**Antes de modificar archivos**, presenta **dos direcciones visuales realmente distintas**, con una propuesta concreta por dirección (no solo paletas de colores):

1. **Editorial B2B premium**: tipografía refinada, ritmo espacial decidido, petróleo/verde bosque, superficies claras cálidas, tratamiento editorial de títulos e importes, navegación deliberada.
2. **Consola SaaS contemporánea**: mayor contraste y estructura, navegación de producto elaborada, paneles y bloques de información con jerarquía fuerte, sin recurrir a una plantilla de administración genérica.

Para cada alternativa, explica brevemente: tipografía, colores, composición del dashboard, composición de ficha e historial, comportamiento en móvil, accesibilidad y un riesgo de implementación. Recomienda una con argumentos. **Detente y pregunta cuál aprueba el responsable humano**. No generes código ni cambios de ficheros antes de recibir esa respuesta. Una vez elegido el concepto, continúa con el resto de este encargo en la misma conversación de Codex.

## Fase 2 — Implementación del concepto aprobado

Rediseña a nivel de producto, no solo cambiando colores o bordes:

### Dashboard de clientes
- Cabecera, identidad visual y navegación consistentes.
- Búsqueda por empresa / identificador fiscal claramente protagonista, con estados de carga, vacío y error visualmente cuidados.
- Listado o filas de clientes elegantes, legibles y usables; destacar información importante sin sobrecarga.
- Paginación y accesibilidad visibles y coherentes.
- Si presentas métricas, utiliza **solo datos reales** proporcionados por la API: por ejemplo, `total_count` de la respuesta consultada; no inventes ingresos, MRR, crecimiento, planes comerciales, tendencias ni cifras globales.

### Ficha de cliente e historial
- Composición de tarjetas con diseño distintivo, más refinada que la versión actual.
- Manejar nombres de empresas y planes largos, identificadores fiscales y correos sin desbordamientos.
- Historial visualmente jerarquizado: total EUR, fecha UTC correctamente identificada, usuarios, almacenamiento, llamadas y desglose fiscal.
- Conservar el contexto de búsqueda/página al volver al listado.
- Mostrar de manera fiel el snapshot histórico; no recalcularlo ni mezclarlo con datos actuales.
- Estados vacíos, errores y loading diseñados, no decorativos.

### Sistema visual y experiencia
- Define tokens reutilizables (colores semánticos, espaciado, radios, sombras, tipografía y estados interactivos) sin sobreingeniería.
- Mantén consistencia de controles entre componentes. Evita look genérico de plantilla, degradados decorativos aleatorios y tarjetas innecesarias.
- Accesibilidad: navegación por teclado, focus visible, contraste suficiente, labels y estados anunciables; soporta `prefers-reduced-motion`.
- Responsive real: verifica ~320/375 px, tablet y escritorio; sin scroll horizontal ni elementos inaccesibles.
- Microinteracciones discretas solo donde aporten comprensión y feedback.
- Si añades fuentes o recursos externos, explica la necesidad, la licencia y un fallback; evita dependencias CDN necesarias para arrancar.

### Proteger funcionamiento existente

Preserva íntegramente las funciones ya operativas:
- `GET /customers` con búsqueda y paginación.
- `GET /customers/{customer_id}` y `GET /customers/{customer_id}/simulations`.
- Cancelación de solicitudes obsoletas, manejo de errores, navegación y retorno con estado.
- Contratos de importes como cadenas exactas, EUR e historial inmutable.
- Tipado de Angular, TypeScript y arquitectura de servicios actual.

**No implementar todavía** alta de clientes, preview, slider, guardado, divisas, nuevos endpoints, autenticación o gráficas sin soporte real. El siguiente PR funcional debe poder reutilizar este sistema visual.

## Archivos y límites

- Cambios autorizados: componentes, plantillas, estilos y tests necesarios dentro de `frontend/`.
- Se permite actualizar `ai-workspace/04-frontend-design.md` con el concepto **realmente elegido** y `ai-workspace/05-ai-development-log.md` con solicitudes, decisiones y verificaciones **auténticas**. Se permite ajustar `README.md` solo si cambia alguna instrucción comprobada.
- No modificar `backend/`, `AGENTS.md`, los contratos REST, el registro de decisiones ni las reglas de negocio.
- Evitar nuevas dependencias. Si una es imprescindible, justificarla y pedir autorización antes de añadirla.
- No borrar funcionalidades ni tests para hacer que pase el build.
- No crear commits, push ni PR.

## Verificaciones obligatorias

Al finalizar, ejecuta desde la raíz:

```powershell
npm --prefix frontend run build
npm --prefix frontend test
```

Verifica manualmente con el backend real **si el entorno lo permite**, al menos: buscar, paginar, abrir ficha, retroceder conservando estado, consultar historial, estados vacío/error y viewport móvil. Si no puedes verificar alguna acción, dilo expresamente y no la presentes como comprobada. No utilices métricas ficticias en las pantallas finales; los datos de demostración solo se admiten si están claramente identificados como ficticios y proceden del backend local de pruebas.

Comprueba:

```powershell
git status --short
git diff --check
git diff --stat
```

Ten en cuenta que los archivos sin seguimiento no aparecen en `git diff` normal. Comprueba también los archivos nuevos. No incluyas builds, caches ni `node_modules`.

## Informe final esperado

1. Concepto seleccionado y justificación de la aprobación humana.
2. Qué cambió visual y funcionalmente en dashboard, ficha e historial.
3. Resumen del sistema visual creado y cómo reutilizarlo en el simulador futuro.
4. Resultado real del build y de las pruebas; diferencias de conteo de tests si las hubiera.
5. Qué comprobaste de verdad en móvil y escritorio, y qué quedó sin verificar.
6. Riesgos restantes, sin inventar problemas para crear nuevas tareas.
7. Archivos modificados/nuevos y `git status`.

**Espera revisión humana antes de commit o PR.**
