# Prompt #21 — Validación del motor de facturación con Python 3.13

## Contexto

Proyecto **SaaS-O-Matic**. Rama activa esperada: `feature/billing-engine`.

La implementación del motor de dominio ya existe en `backend/app/domain/` y **63 pruebas han pasado con Python 3.9.13**. Una auditoría posterior no detectó defectos P0/P1. El equipo tiene **Python 3.13.17** disponible a través de `py -3.13`; el entorno anterior `backend/.venv` continúa usando Python 3.9.13.

Actúa como desarrollador Python y revisor de calidad. Lee `AGENTS.md`, `ai-workspace/01-requirements.md`, `ai-workspace/02-architecture.md`, `ai-workspace/03-api-contracts.md`, `ai-workspace/decision-log.md`, `.gitignore`, `backend/pyproject.toml`, `backend/requirements-dev.txt` y los archivos de dominio y pruebas pertinentes.

## Objetivo

**Validar la implementación con Python 3.13** antes de autorizar el commit del PR #2, atendiendo a dos observaciones menores de la auditoría. **No implementar API REST, SQLite ni Angular.**

## Paso 1 — Verificación de seguridad

1. Comprueba que la rama activa es `feature/billing-engine` y muestra `git status --short`. Si estás en otra rama, **detente**; no cambies de rama automáticamente.
2. Confirma con `py -3.13 --version` que existe un intérprete Python 3.13.
3. Comprueba que `backend/venv` **no existe**. Si existe, **no lo sobrescribas ni elimines**: informa y detente para que el responsable decida.
4. Comprueba con `git check-ignore -v` o con la lectura de `.gitignore` que `backend/venv/` está excluido de Git antes de crearlo.
5. No borres ni modifiques `backend/.venv` (el entorno antiguo de Python 3.9).

## Paso 2 — Entorno local y pruebas

Tienes autorización para crear **únicamente** el entorno virtual local `backend/venv` con Python 3.13, instalar en él las dependencias ya declaradas en `backend/requirements-dev.txt` y ejecutar las pruebas. No instales Python globalmente, no alteres el PATH y no instales paquetes fuera de ese entorno.

Ejecuta desde la raíz del repositorio, con PowerShell:

```powershell
py -3.13 -m venv backend/venv
.\backend\venv\Scripts\python.exe --version
.\backend\venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\backend\venv\Scripts\python.exe -B -m pytest -p no:cacheprovider -c backend/pyproject.toml backend/tests
```

Registra los comandos reales, las versiones y el resultado exacto. Si la instalación o las pruebas fallan, **no declares éxito ni cambies silenciosamente al entorno 3.9**. Presenta el diagnóstico; solo corrige problemas de alcance estrictamente autorizados.

## Paso 3 — Dos mejoras acotadas (solo si el paso 2 funciona)

**A. `.gitignore`:** ajusta los patrones para que también se excluyan directorios de entorno como `.venv313/`, `.venv-py313/` y `.venv-new/`, además de `.venv/` y `venv/`, sin dejar de excluir los existentes. Una opción es `.venv*/`. Comprueba con `git check-ignore -v` varios ejemplos. No añadas archivos del entorno a Git.

**B. Prueba de integración de la lógica pura:** añade **una prueba unitaria** usando la API pública real `calculate_quote`, una tasa fiscal sintética configurable y un importe que produzca exactamente medio céntimo de impuesto; verifica `ROUND_HALF_UP`, los céntimos enteros y el total. No cambies ES/FR/DE ni los cálculos aprobados. Adapta el caso de prueba a la API real; no inventes argumentos que no acepte.

Vuelve a ejecutar **toda** la suite con Python 3.13 y comunica el número exacto de pruebas (puede aumentar de 63 a 64).

## Paso 4 — Auditoría final

- Comprueba `git status --short`, `git diff --check` y los nuevos archivos no seguidos.
- Verifica que **ningún** archivo de `backend/venv`, `backend/.venv`, cachés, secretos o binarios aparece como candidato a commit.
- Resume los archivos modificados y las pruebas ejecutadas. Menciona las limitaciones que subsistan.
- **No hagas** `git add`, commit, push, PR ni merge.
- No edites `README.md`, especificaciones, decisiones ni bitácora en esta tarea: solo `.gitignore`, y como máximo el archivo de prueba del motor que requiera el caso añadido. La creación de `backend/venv` está autorizada como artefacto local ignorado.
- No ejecutes comandos de borrado o limpieza del sistema.

## Entrega esperada

1. Python y Pytest utilizados, con rutas verificadas.
2. Resultado textual exacto de la suite antes y después de la prueba añadida.
3. Diff resumido de `.gitignore` y del test añadido.
4. Confirmación del estado de Git y exclusión de ambos entornos.
5. Recomendación técnica sobre si el motor está listo para revisión humana previa al commit, **sin afirmar que el código fue revisado por el responsable**.
