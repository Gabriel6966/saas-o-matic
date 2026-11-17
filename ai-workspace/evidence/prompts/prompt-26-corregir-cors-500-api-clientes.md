# Prompt #26 — Corregir CORS en respuestas 500 y añadir prueba de regresión

**Proyecto:** SaaS-O-Matic  
**Rama obligatoria:** `feature/customer-api`  
**Modalidad:** implementación acotada; no usar modo Plan.  
**Motivo:** la auditoría del Prompt #25 reprodujo una respuesta `500 internal_error` sin `Access-Control-Allow-Origin` para `Origin: http://localhost:4200`, aunque las respuestas 200 y 422 sí tenían esa cabecera.

## 1. Contexto obligatorio

Lee antes de editar:

- `AGENTS.md`
- `ai-workspace/decision-log.md`
- `ai-workspace/02-architecture.md`
- `ai-workspace/03-api-contracts.md`
- `backend/app/main.py`
- `backend/app/api/errors.py`
- `backend/app/api/dependencies.py`
- `backend/tests/integration/conftest.py`
- `backend/tests/integration/test_customers.py`
- `backend/app/config.py`

Conserva las decisiones D-01 a D-11 y A-01 a A-07 y todos los endpoints actuales. No reabras arquitectura ni contratos por esta corrección.

Consulta como referencia primaria **CORSMiddleware Global Enforcement** en la documentación de Starlette: <https://www.starlette.io/middleware/#corsmiddleware-global-enforcement>.

## 2. Tarea autorizada

### Paso A — Confirmar la reproducción

Reproduce con una prueba aislada el fallo informado: una petición desde `Origin: http://localhost:4200` que provoca un error inesperado de persistencia devuelve `500` y un cuerpo JSON `internal_error`, pero no incluye la cabecera CORS esperada.

Usa `TestClient(..., raise_server_exceptions=False)` o un mecanismo equivalente para inspeccionar la respuesta 500. Inyecta el fallo en una dependencia de sesión o servicio mediante las herramientas de pruebas existentes; **no** alteres permanentemente la base de datos real ni el código de dominio para forzar el error. Conserva la reproducción como prueba de regresión; demuestra que falla con el código previo, si es viable sin cambios adicionales.

### Paso B — Aplicar la corrección mínima

Haz que CORS envuelva **todo el ASGI** para que también cubra las respuestas producidas por el manejador exterior de errores (`ServerErrorMiddleware`), siguiendo la recomendación oficial de Starlette.

Requisitos:

1. Conservar exclusivamente los orígenes permitidos por la configuración actual; no usar `allow_origins=["*"]`, ni habilitar credenciales ni relajar métodos/cabeceras sin necesidad.
2. Conservar la respuesta `500` con el formato JSON común y `error.code == "internal_error"`. No exponer SQL, excepciones internas, trazas, identificadores fiscales ni correos.
3. Mantener el contrato de los tres endpoints de clientes y la documentación `/docs` y `/openapi.json`.
4. **Prestar atención a la distinción entre la instancia FastAPI y su wrapper ASGI**. Si necesitas exponer ambas, usa nombres claros, preserva la importación/arranque documentados con Uvicorn y permite que las pruebas sigan usando `dependency_overrides`. No introduzcas adaptadores innecesarios ni rompas el ciclo de vida de la aplicación.
5. Mantener la inicialización explícita de SQLite y las sesiones independientes por petición.

La solución debe limitarse al problema real, sin refactorizaciones oportunistas.

### Paso C — Verificar los casos de CORS

Añade pruebas automatizadas que comprueben al menos:

- `500` inesperado + origen permitido `http://localhost:4200` → cabecera `Access-Control-Allow-Origin` con ese origen **y** cuerpo `internal_error`.
- `500` inesperado + origen **no permitido** → no exponer `Access-Control-Allow-Origin` para el origen rechazado.
- Un error de validación `422` + origen permitido → CORS y contrato de error siguen funcionando.
- Una respuesta normal `200` o `201` + origen permitido → CORS sigue funcionando.
- Un preflight `OPTIONS` válido desde el origen permitido conserva el comportamiento anterior.

Usa pruebas deterministas, base de datos aislada y configuración de orígenes explícita. Si una prueba existente depende de importar una instancia concreta para `dependency_overrides`, ajusta **solo** la infraestructura necesaria, sin debilitar su cobertura.

### Paso D — Ejecutar verificaciones reales

Desde la raíz del repositorio usa el entorno existente de Python 3.13:

```powershell
.\backend\venv\Scripts\python.exe -B -m pytest -p no:cacheprovider -c backend/pyproject.toml backend/tests
.\backend\venv\Scripts\python.exe -m pip check
git diff --check
git status --short
```

En el informe indica el número **real** de pruebas ejecutadas y aprobadas y los avisos exactos. No inventes un número esperado; la suite tenía 208 pruebas antes de este cambio.

## 3. Alcance estricto

Puedes modificar solo lo necesario dentro de:

- `backend/app/main.py`
- un archivo de prueba de integración de CORS nuevo o existente en `backend/tests/integration/`
- `backend/tests/integration/conftest.py`, **únicamente** si las dependencias de test deben ajustarse para mantener `dependency_overrides`
- `ai-workspace/05-ai-development-log.md`, **solo** para registrar de forma objetiva la corrección y los resultados realmente ejecutados

Si ves una necesidad imprescindible de modificar otro archivo, **detente y solicítame autorización indicando archivo y razón**.

**No autorizado:** instalar/actualizar dependencias, cambiar `httpx` por `httpx2`, modificar fiscalidad, motor de precios, modelos ORM o contratos, cambiar versiones, alterar configuración global, crear commits, hacer `git add`, `push`, PR o `merge`.

El aviso P3 sobre el transporte de `TestClient` se deja documentado para más adelante; **no** debe convertirse en parte de esta corrección.

## 4. Entregable y revisión humana

Al terminar, entrega:

1. Causa raíz resumida y mecanismo de la corrección.
2. Archivos modificados y diff relevante.
3. Evidencia de la regresión del 500, indicando si se observó el fallo previo.
4. Resultados reales de Pytest, `pip check`, `git diff --check` y `git status --short`.
5. Confirmación de que los orígenes no permitidos siguen bloqueados y no se han relajado las restricciones CORS.
6. Riesgos o advertencias residuales, distinguiendo fallos bloqueantes y avisos P3.

**No hagas commit ni publiques la rama. Detente para mi revisión humana.**
