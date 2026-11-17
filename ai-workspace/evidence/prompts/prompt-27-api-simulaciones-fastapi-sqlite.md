# Prompt #27 — API de simulaciones con FastAPI y SQLite

**Proyecto:** SaaS-O-Matic — prueba técnica de Roams  
**Rama de trabajo:** `feature/simulations-api` (debe partir de `main` actualizado tras el PR #3)  
**Objetivo:** completar los tres endpoints REST pendientes, reutilizando el motor de facturación ya integrado.  
**Modo de Codex:** ejecución/edición (no Plan).  
**Estado esperado:** implementación y pruebas; **sin commits, push ni PR**.

## 1. Antes de modificar archivos

1. Verifica la rama activa y el estado de Git. Si no estás en `feature/simulations-api`, si hay cambios inesperados o si la base no contiene el PR #3, **detente y explica el problema**; no cambies ramas automáticamente.
2. Lee y respeta los documentos existentes como fuente de verdad:
   - `AGENTS.md`
   - `ai-workspace/01-requirements.md`
   - `ai-workspace/02-architecture.md` (v0.4)
   - `ai-workspace/03-api-contracts.md` (v0.3)
   - `ai-workspace/decision-log.md` (D-01 a D-11 y A-01 a A-07)
   - `ai-workspace/05-ai-development-log.md`
3. Inspecciona el código **real** del repositorio antes de decidir qué módulos editar. En particular:
   - `backend/app/domain/quotation.py`, `pricing.py`, `money.py`, `taxes.py`
   - `backend/app/main.py`, y la distinción `api_app` (FastAPI) / `app` (wrapper ASGI CORS)
   - `backend/app/api/dependencies.py`, `errors.py`, `schemas.py` y routers
   - `backend/app/application/customers.py`
   - `backend/app/persistence/database.py`, `models.py`, `customers.py`
   - `backend/init_db.py`, configuración, dependencias y pruebas de integración.
4. Si encuentras una contradicción material entre contratos y código fusionado, **detente para exponerla**. No cambies silenciosamente decisiones aprobadas.

## 2. Alcance funcional exacto

Implementa únicamente estas tres rutas nuevas, respetando los métodos, campos, códigos de error y estructuras JSON de `03-api-contracts.md`:

### `POST /simulations/preview`
- Entrada obligatoria: `customer_id`, `active_users`, `storage_gb`, `api_calls`.
- Todos son enteros JSON estrictos: no aceptar `bool`, cadenas numéricas ni números fraccionarios.
- `customer_id` positivo. Los tres consumos entre **0 y 1.000.000**, inclusive, conforme a A-06. **0 usuarios es válido**.
- Rechazar campos JSON adicionales (`extra="forbid"`, HTTP 422), especialmente importes, tasas, país, plan o moneda enviados por clientes externos.
- Consultar el cliente almacenado para obtener país y plan; comprobar que existe (404) y que el país tiene política fiscal (422 `tax_policy_not_configured`).
- Reutilizar la función de dominio **existente** `calculate_quote`, sin volver a implementar el algoritmo por tramos ni los impuestos.
- Devolver base, tasa, impuesto y total en EUR, con los nombres y formatos **exactos** del contrato: importes como cadenas decimales con dos posiciones; tasa como cadena decimal exacta.
- **No** crear ni actualizar filas. No incluir `id` ni `created_at` de simulación en la respuesta.

### `POST /simulations`
- Aceptar exactamente el mismo cuerpo y las mismas validaciones que preview; no confiar en un resultado calculado por Angular.
- Cargar de nuevo el contexto actual del cliente y **recalcular** con el mismo motor de dominio, incluso si existe una previsualización anterior.
- Insertar de forma atómica y confirmar antes de devolver `201 Created`.
- Persistir snapshot de `customer_id`, consumos, `country_code`, `plan`, tasa fiscal aplicada, base/impuesto/total en **céntimos enteros**, moneda `EUR` y fecha UTC.
- La tasa fiscal histórica debe almacenarse con representación decimal exacta (no `float` / SQLite REAL).
- La respuesta debe coincidir con el contrato e incluir `id` y `created_at`. No inventar un endpoint `GET /simulations/{id}` ni un `Location` hacia él.
- Ante error de validación o dominio no insertar filas; ante fallo de persistencia efectuar rollback.
- No asumir idempotencia: dos POST válidos consecutivos pueden crear dos simulaciones. No reintentar automáticamente una operación de guardado cuyo resultado sea incierto.

### `GET /customers/{customer_id}/simulations`
- Cliente inexistente: `404 customer_not_found`; cliente existente sin simulaciones: `200` con lista vacía.
- Parámetros `limit` (por defecto 20, intervalo 1..100) y `offset` (por defecto 0 y no negativo), validados conforme a A-06.
- Devolver `{ "items": [...], "limit": ..., "offset": ..., "total_count": ... }` con los campos de respuesta y tipos del contrato.
- Filtrar por el cliente solicitado; ordenar por `created_at` descendente y después `id` descendente; paginar **después** de filtrar y contar.
- Leer los valores históricos tal como fueron guardados. **Nunca recalcular** precios, impuestos, país o plan del historial; no llamar a la API de divisas.

## 3. Persistencia y arquitectura

- Mantén la arquitectura modular actual: capa HTTP, aplicación, dominio y repositorio/persistencia. Evita abstracciones y ficheros innecesarios.
- Integra el modelo SQLAlchemy `Simulation` con la tabla `customers`, FK habilitada realmente en cada conexión SQLite, índices/constraints útiles y tipos coherentes con las decisiones A-02/D-06/D-10.
- `storage_gb` y demás consumos: enteros no negativos. Importes monetarios: **INTEGER cents**. Tasa fiscal: texto decimal exacto. Marca temporal: UTC con representación de salida ISO 8601 `Z` (segundos), sin perder la coherencia de lectura/escritura.
- Decide en el código la codificación física de la fecha/tasa de manera simple y documenta cómo cumple el contrato; no rediseñes el esquema aprobado ni introduzcas `float`.
- Mantén el mecanismo actual de sesiones por petición, transacciones, rollback y configuración por conexión; no habilites borrado en cascada.
- Ajusta la **inicialización explícita** `backend/init_db.py` para que cree las tablas que falten sin borrar registros existentes. No introduzcas Alembic ni migraciones complejas en este PR. Si detectas una incompatibilidad real con una base ya creada, informa y propone una salida sin destruir datos.
- Conserva el wrapper CORS exterior corregido en el PR #3; garantiza que los nuevos endpoints se registren en la instancia FastAPI correcta y que `dependency_overrides` de pruebas siga funcionando.
- Mantén el formato común de errores de A-06: sin trazas, SQL ni valores fiscales/correos sensibles en respuestas. Respeta el mapeo de errores preexistente.
- No añadas tarifas por `storage_gb`, `api_calls` o `plan`: son datos informativos porque el enunciado no establece precios adicionales.

## 4. Pruebas que debes implementar y ejecutar

Amplía las pruebas unitarias/integración existentes sin eliminar ni debilitar ningún test previo. Como mínimo:

1. Precio acumulativo en fronteras: 0, 1, 10, 11, 15, 50 y 51 usuarios; ES/FR/DE; redondeo coherente con el motor.
2. Preview devuelve la respuesta acordada y **no aumenta** el número de simulaciones, tampoco con peticiones repetidas.
3. Guardado devuelve 201, persiste una sola fila por solicitud válida y puede recuperarse tras abrir una sesión nueva.
4. Preview y guardado producen el mismo desglose bajo igual cliente/configuración, aunque el guardado recalcula y no acepta importes enviados por el cliente.
5. Límites estrictos para los cuatro campos; campos desconocidos, GB fraccionarios, `bool`, `null`, negativos y valores >1.000.000 devuelven errores coherentes.
6. Cliente inexistente (404), país sin tasa (422), error de validación (422) y rollback ante error de base de datos.
7. Snapshot histórico: simular, modificar en una prueba controlada país/plan o política aplicable y comprobar que el historial sigue mostrando lo registrado originalmente.
8. Historial ordenado, paginado y aislado por cliente; `total_count` correcto; cliente sin registros; paginación fuera de rango.
9. Persistencia tras reconectar SQLite, restricciones de FK y sin cascada destructiva.
10. Regresión de CORS en errores 500 y de los tres endpoints de clientes existentes.

Usa bases SQLite **temporales/aisladas** para tests y no modifiques la base de desarrollo o producción. No dependas de la API de divisas ni de conexión a Internet.

**Ejecuta** con Python 3.13 de `backend/venv` desde la raíz:

```powershell
.\backend\venv\Scripts\python.exe -B -m pytest -p no:cacheprovider -c backend/pyproject.toml backend/tests
.\backend\venv\Scripts\python.exe -m pip check
```

Si el entorno no existe, comunica el bloqueo; no instales ni alteres Python global. Usa las dependencias ya declaradas y evita actualizarlas salvo incompatibilidad justificada.

## 5. Documentación y alcance de escritura

Puedes modificar solo los archivos **necesarios** dentro de:

- `backend/app/api/` (routers y schemas)
- `backend/app/application/`
- `backend/app/persistence/`
- `backend/app/main.py` (registro de rutas, sin romper CORS)
- `backend/init_db.py`
- `backend/tests/`
- `README.md` (ejemplos reales de preview, guardado e historial)
- `ai-workspace/05-ai-development-log.md` (interacciones reales, decisiones técnicas y pruebas verificadas).

No modifiques el motor puro en `backend/app/domain/`, las decisiones aprobadas, requisitos, arquitectura ni contratos REST sin **detenerte y pedir autorización**. No generes Angular, divisas, endpoints nuevos, autenticación ni infraestructura adicional. No cambies dependencias salvo necesidad técnica demostrable y autorización. No crees commits, push ni PR.

## 6. Informe final obligatorio

Entrega un resumen conciso y verificable:

1. Arquitectura resultante y **archivos exactos** añadidos/modificados.
2. Ejemplos de request/response reales de los tres endpoints, con datos sintéticos.
3. Pruebas ejecutadas, cantidad de casos y salida textual; advierte sobre warnings sin ocultarlos.
4. Cómo repetir la suite, cómo iniciar SQLite y el servidor, y cómo probar los endpoints manualmente desde PowerShell o `/docs`.
5. Limitaciones y posibles hallazgos P0/P1/P2/P3; distingue verificaciones realizadas de pendientes.
6. `git status --short`, `git diff --check` y revisión de archivos nuevos, exclusión de `venv`, SQLite y secretos.
7. Confirma que **no** has realizado commit, push o PR.

**Detente después de entregar el informe para revisión humana.**
