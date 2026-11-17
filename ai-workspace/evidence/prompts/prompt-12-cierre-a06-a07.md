# Prompt 12 — Cierre controlado de A-06 y A-07

> **Uso:** enviar a Codex en VS Code **solo después de que el responsable técnico haya aprobado expresamente** las propuestas A-06 y A-07 descritas abajo. Este archivo es una instrucción de trabajo, no prueba de que esa aprobación ya se haya producido.
>
> **Modo de Codex:** edición normal (no modo Plan). **Rama prevista:** `docs/specs-and-architecture`.

## Contexto

Estamos desarrollando **SaaS-O-Matic** como prueba técnica para Roams. Aplicamos Spec-Driven Development y revisión humana obligatoria.

Antes de modificar nada, lee:

- `AGENTS.md`
- `ai-workspace/00-project-scope.md`
- `ai-workspace/01-requirements.md`
- `ai-workspace/02-architecture.md`
- `ai-workspace/03-api-contracts.md`
- `ai-workspace/decision-log.md`

Comprueba la rama actual y que D-01 a D-11 y A-01 a A-05 figuran como aprobadas. Si hay contradicciones importantes, detente y repórtalas. **Si no existe aprobación explícita del responsable técnico para las propuestas siguientes, no modifiques archivos.**

## A-06 — Contratos HTTP y validaciones (propuesta para aprobar)

Si el responsable técnico la ha aprobado, registra A-06 con estas condiciones:

1. Mantener los **seis endpoints** y las convenciones `snake_case` de `03-api-contracts.md` v0.2.
2. Entradas estrictas con Pydantic: rechazar campos adicionales mediante `extra="forbid"`; no permitir coerciones de booleanos, cadenas o números fraccionarios a enteros. Los importes enviados por el frontend no entran en el contrato y se rechazan con 422.
3. Límites iniciales de demostración: `active_users` entre 0 y 1.000.000, `storage_gb` como entero entre 0 y 1.000.000, `api_calls` entre 0 y 1.000.000. Mantener las longitudes y validaciones de campos propuestas en el borrador, explicando que no son límites comerciales.
4. Paginación de clientes e historial con `limit=20` por defecto, máximo 100, y `offset=0` por defecto. Resultados vacíos con HTTP 200 y `items: []`; orden determinista según los contratos.
5. Búsqueda por empresa: parcial y sin distinguir mayúsculas/minúsculas Unicode, **sin eliminar acentos**. Para el alcance reducido inicial, elegir función SQLite `unicode_casefold` registrada **en cada conexión** desde Python y búsqueda con `instr` sobre cadenas normalizadas. Conservar `company_name` original. Parámetros SQL enlazados; `%` y `_` deben ser literales. Documentar que esta solución puede escanear filas y deberá revisarse si el volumen crece; **no añadir** por ahora una columna de búsqueda.
6. Identificador fiscal: búsqueda exacta normalizada. No validar el dígito de control del término de búsqueda.
7. Errores: un sobre JSON común `error.code`, `error.message` y `error.details`; adaptar los errores de validación de FastAPI/Pydantic mediante manejadores sencillos. Usar los códigos HTTP 400, 415, 422, 404, 409 y 500 donde correspondan, con mensajes seguros y sin trazas ni datos fiscales en la respuesta.
8. Importes EUR como cadenas decimales exactas de dos decimales; tasas como cadenas decimales exactas; `created_at` UTC ISO 8601 con sufijo `Z`. No alterar D-05, D-06 ni D-10.
9. Mantener las pruebas de contrato como **criterios futuros**, no como pruebas ejecutadas.

## A-07 — Ejecución local y evolución del esquema (propuesta para aprobar)

Si el responsable técnico la ha aprobado, registra A-07 con estas condiciones:

1. Priorizar **ejecución local reproducible** en Windows/VS Code y documentar también comandos multiplataforma cuando sea sencillo.
2. Registrar las versiones concretas de Python, Angular y dependencias **una vez verificadas en el entorno**; no inventar versiones ni afirmar compatibilidades no comprobadas. Fijar dependencias en los archivos adecuados al implementar.
3. Configuración local por variables de entorno y ejemplo sin secretos (`.env.example` cuando se implemente).
4. SQLite con ruta de archivo estable y **comando explícito para inicializar el esquema** con SQLAlchemy; no crear tablas de forma implícita en cada petición. Por ahora, no añadir Alembic obligatoriamente al MVP; documentar que los cambios futuros de esquema requerirán una estrategia de migración.
5. Claves foráneas SQLite habilitadas por conexión y verificadas en pruebas de integración.
6. Una sesión SQLAlchemy síncrona por petición, cierre garantizado y transacciones de escritura controladas.
7. CORS del backend restringido a los orígenes locales concretos del frontend (configurables); no usar `*` en una configuración con credenciales.
8. README con pasos completos de instalación, arranque y pruebas de backend/frontend, que deberán verificarse realmente antes de la entrega.
9. La comprobación **real** de CORS de ExchangeRate-API desde Angular queda para la integración del frontend; no afirmar que ya funciona. Mantener anotado también el redondeo visual de divisas como detalle pendiente antes de implementarlo.

## Cambios autorizados (solo después de aprobación)

- Actualizar `ai-workspace/decision-log.md` para registrar A-06 y A-07 con su estado, justificación y consecuencias; conservar todas las decisiones anteriores.
- Actualizar `ai-workspace/03-api-contracts.md` a v0.3 y reflejar A-06 como aprobada, sin alterar la semántica de las seis rutas.
- Actualizar `ai-workspace/02-architecture.md` a v0.4 para sincronizar la búsqueda Unicode, el esquema, la sesión, la inicialización y el entorno local. Señalar todo lo que sigue pendiente de validación real.
- No modificar otros archivos ni crear archivos de aplicación.

## Restricciones

- **No escribir código** ni crear modelos ORM, tablas o migraciones.
- **No instalar dependencias** ni ejecutar un servidor.
- **No modificar `AGENTS.md`**, `01-requirements.md` ni `00-project-scope.md`.
- **No hacer commits, push ni PR**.
- No dar por realizadas pruebas, comprobaciones CORS o ejecuciones locales que todavía no se hayan realizado.
- Si las condiciones aprobadas contradicen los documentos actuales, explicar la discrepancia antes de hacer cambios.

## Resultado esperado

1. Resumen de decisiones y archivos modificados.
2. `git diff --check` y `git status --short`.
3. Riesgos y verificaciones pendientes (incluido CORS de proveedor y redondeo de divisas).
4. Confirmación explícita de que no se ha creado código, commit ni PR.
5. Detenerte y esperar revisión humana antes de continuar con el primer PR.
