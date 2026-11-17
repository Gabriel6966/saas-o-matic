# Prompt #34 — Rediseño visual de alto nivel sin regresiones

## Rol y objetivo

Actúa como **Senior Product Designer + Senior Angular Frontend Engineer**, aplicando la skill instalada `frontend-design` de forma explícita. Trabajas en **SaaS-O-Matic**, prueba técnica de Roams.

**Objetivo:** conseguir un salto visual sustancial: una interfaz **SaaS B2B premium, cuidada, distintiva y consistente**, sin perder **ninguna** funcionalidad ni alterar datos, cálculos o integraciones que ya han sido probados manualmente de extremo a extremo.

**Antecedentes:** el proyecto ya utiliza una dirección **Editorial B2B premium**; queremos elevarla, no sustituirla por un diseño genérico. La app funciona de principio a fin (alta → búsqueda → detalle → preview → guardado → historial → EUR/USD/GBP). El usuario ha verificado este recorrido manualmente. La aplicación cuenta con pruebas automatizadas de backend y frontend. El criterio de éxito incluye *más calidad visual con cero regresiones funcionales*.

## Instrucciones de seguridad y flujo

- **Primero lee la skill `frontend-design` instalada** y sigue sus indicaciones relevantes. No afirmes que la has usado si no puedes acceder a ella.
- Lee `AGENTS.md`, `README.md`, `ai-workspace/04-frontend-design.md`, `ai-workspace/03-api-contracts.md`, los estilos/tokens actuales de Angular y las pruebas existentes.
- Trabaja exclusivamente en la rama `style/final-visual-polish`, creada por el usuario a partir de `main` actualizado. **Comprueba la rama activa y un árbol limpio antes de empezar.** Si no coinciden, detente.
- **Sin commits, pushes, PR ni merges.** No hagas `reset --hard`, `clean -fd`, `push --force` ni sobrescribas trabajo del usuario.
- No actualices dependencias, Angular, Node o backend. No instales librerías de UI, iconos, animación o fuentes salvo aprobación expresa.
- **No modifiques** Python/FastAPI, SQLite, los contratos REST, API clients, servicios Angular de lógica, routing, formularios/reactividad, TypeScript de cálculo o divisas, modelos, fixtures, pruebas existentes o configuración funcional, salvo autorización expresa tras explicar por qué sería imprescindible.
- Nada de métricas, planes, funcionalidades, testimonios o datos inventados. No alteres el texto explicativo de precios/fiscalidad ni la atribución de tipos de cambio.
- No escondas elementos funcionales para conseguir una mejor captura. Responsive, accesibilidad y uso real son prioritarios.

## FASE A — Diagnóstico y propuesta **SIN EDITAR ARCHIVOS**

1. Inspecciona los componentes, HTML y SCSS existentes: dashboard/listado, búsqueda/paginación, alta de clientes, ficha, simulador/slider/estados de preview, botón de guardado, cambio de divisas, historial y estados vacíos/errores.
2. Si tienes capacidad de navegador, captura el **estado anterior** en desktop (1440 px), tablet (768 px), móvil (375 px) y móvil estrecho (320 px). Usa solo datos ficticios y no modifiques la base de desarrollo del usuario; si no puedes capturarlo, dilo y trabaja a partir del código y las referencias disponibles.
3. Identifica **cinco mejoras visuales de mayor impacto** que no toquen la lógica. Considera especialmente:
   - Tipografía y escala: títulos, etiquetas, datos, números y legibilidad; evita texto demasiado pequeño.
   - Composición: contenedor, ritmo vertical, distribución de columnas, densidad y espacios vacíos.
   - Navegación, búsqueda y CTA: intención, prioridad visual, estados hover/focus/disabled.
   - Simulador como protagonista: jerarquía de formulario, slider y panel de total, visualización clara de la tasa y desglose.
   - Historial y tarjetas: lectura rápida, agrupación, separación de contenido, affordances.
   - Paleta ya aprobada (petróleo/verde bosque/neutros cálidos), contraste y consistencia de tokens.
   - Detalles profesionales: iconografía sobria si ya existe, bordes, sombras, transiciones discretas, microinteracciones accesibles y `prefers-reduced-motion`.
4. Presenta **DOS DIRECCIONES DE MEJORA** sobre el mismo producto, ambas viables en el plazo y sin cambiar funcionalidad. Para cada una indica estilo, cambios en dashboard, simulador y ficha, riesgos y archivos probables. Una debe ser evolución editorial refinada y la otra una variante más atrevida de producto financiero/SaaS sin cambiar el stack.
5. Recomienda una dirección con argumentos basados en capturas y código real, sin afirmaciones inventadas.
6. **DETENTE y solicita al responsable técnico que elija A o B. NO edites archivos aún.** Esta aprobación visual es obligatoria.

## FASE B — Implementación visual **SOLO TRAS APROBACIÓN EXPRESA**

Aplica la dirección elegida de forma coherente y artesanal. Prioriza un gran resultado visual sin reescrituras.

**Archivos permitidos:** estilos globales y SCSS/CSS de componentes de `frontend/src/app/`; plantillas HTML de componentes existentes **solo cuando sea imprescindible** para cambiar composición, clases o estructura presentacional; `ai-workspace/04-frontend-design.md` y `ai-workspace/05-ai-development-log.md` para registrar decisiones y evidencia verdadera al terminar.

**Invariantes funcionales obligatorios:**

- Se conservan rutas, componentes, botones funcionales, bindings Angular, `formControlName`, eventos, atributos de accesibilidad, validaciones, navegación, búsqueda, paginación y estados de carga/error/vacío.
- Se conservan `debounceTime(300)`, `switchMap`, invalidación inmediata de previews anteriores, guardado explícito sin duplicados, actualización del historial y comportamiento ante errores.
- El backend sigue calculando el precio. No alteres valores ni formatos de importes originales en EUR, conversiones BigInt, caché, fecha ni atribución del proveedor.
- No modifiques los contratos de la API ni los textos de advertencias fiscales.
- Mantén una experiencia impecable a 320, 375, 768 y 1440 px, sin scroll horizontal, texto cortado ni controles diminutos. Estados de foco visibles, navegación por teclado y contraste legible. Animaciones respetando `prefers-reduced-motion`.
- No uses diseños prefabricados, gradientes decorativos gratuitos, widgets sin datos reales o sombras excesivas. El resultado debe parecer un producto cuidado, no una plantilla.
- Evita cambios masivos de HTML si un ajuste de SCSS basta. Si necesitas tocar una plantilla, **explica y revisa explícitamente todos los bindings y eventos afectados**.

## FASE C — Verificaciones obligatorias

1. Ejecuta y reporta resultados textuales de:
   ```powershell
   npm --prefix frontend run build
   npm --prefix frontend test
   git diff --check
   git status --short
   git diff --stat
   ```
2. Verifica visualmente el *antes/después* en 1440, 768, 375 y 320 px. Aporta capturas reales si puedes, e indica cuáles no pudiste obtener.
3. Haz una prueba manual con API real y base temporal/ficticia, **solo si es viable de forma segura**: alta → búsqueda → detalle → preview al cambiar rápido usuarios → guardar → historial → EUR/USD/GBP; comprueba carga, vacío y error. No limpies ni reescribas la base real de desarrollo.
4. Comprueba que el diff no incluye modificaciones de backend, lógica Angular, dependencias, lockfile, fixtures o contratos. Si aparece alguna, **detente y explícalo antes de continuar**.
5. Anota hechos reales en la documentación autorizada; no declares que una prueba pasó si no se ejecutó.
6. Entrega una tabla **Antes → Después** con 5–8 mejoras concretas, capturas si las hay, resultados de build/test, número y lista exacta de archivos cambiados, posibles riesgos y aspectos pendientes.
7. No prepares el índice Git ni hagas commit: espera la revisión humana y la decisión sobre el PR visual.

## Prioridades

1. **Cero regresiones** y conservación del flujo validado personalmente por el responsable.
2. Diferencia visual notable y profesional.
3. Accesibilidad y responsive.
4. Código CSS mantenible y reutilizable.
5. Evidencia verificable del proceso de IA y la decisión humana.

**Empieza únicamente por la FASE A y espera mi elección.**
