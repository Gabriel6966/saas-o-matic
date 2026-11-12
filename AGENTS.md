# SaaS-O-Matic — Instrucciones de ingeniería para Codex

## Contexto
SaaS-O-Matic es una prueba técnica para un puesto Full-Stack AI-Augmented. Se evaluarán la planificación basada en especificaciones (Spec-Driven Development), el criterio técnico, el control de calidad y la aplicación funcional.

## Tecnologías propuestas
- Backend: Python + FastAPI + SQLAlchemy + SQLite.
- Frontend: Angular + TypeScript.
- Pruebas: pytest y herramientas de pruebas de Angular.
- Documentación: Markdown en `ai-workspace/`.

Estas son decisiones técnicas propuestas, no requisitos obligatorios de la empresa. No añadas AWS, Terraform, autenticación ni infraestructura extra salvo aprobación explícita.

## Fuentes y prioridades
1. `ai-workspace/00-project-scope.md` resume el alcance obligatorio del reto (no es una transcripción literal).
2. `ai-workspace/01-requirements.md` contiene la especificación funcional y las decisiones pendientes.
3. Las especificaciones y contratos posteriores describen decisiones aprobadas.

El documento original facilitado por Roams se conserva como referencia externa al repositorio. Si hay dudas o contradicciones, señalarlas antes de implementar. No convertir propuestas o supuestos en requisitos del enunciado.

## Flujo Spec-Driven
- Antes de implementar una funcionalidad, revisa su especificación y criterios de aceptación.
- Propón el enfoque, los archivos afectados, riesgos, alternativas y plan de verificación.
- Espera autorización humana antes de implementar código de nuevas funcionalidades.
- Implementa cambios pequeños y limitados al alcance aprobado.
- Ejecuta las pruebas disponibles y reporta resultados reales, sin inventarlos.
- Revisa el diff en busca de cambios ajenos al alcance.
- Registra decisiones y correcciones relevantes en `ai-workspace/05-ai-development-log.md`.

## Principios técnicos
- Separa reglas de negocio de HTTP, acceso a datos e interfaz.
- Calcula el precio por tramos de forma **acumulativa**, no como una tarifa única del tramo.
- Usa `Decimal` para importes monetarios del backend y define explícitamente reglas de redondeo.
- Valida entrada no confiable en el backend; valida identificadores fiscales españoles mediante algoritmos de control, no únicamente con regex.
- No inventes tarifas de almacenamiento, llamadas API ni planes. El enunciado no las define.
- La política de impuestos para distintos países está pendiente de decisión; no presupongas impuestos universales.
- Trata fallos, estados de carga y ausencia de conexión a la API externa de cambio.
- No introduzcas credenciales en código ni en Git.
- Mantén módulos pequeños, con nombres claros y responsabilidades únicas.

## Git: ramas, PR y control humano
- Rama principal: `main`; debe mantenerse estable.
- No desarrolles funcionalidades directamente en `main` (salvo el commit inicial de arranque aprobado por el usuario).
- Usa una rama por unidad coherente de trabajo: `feature/...`, `fix/...`, `docs/...` o `refactor/...`.
- Cada integración en `main` debe hacerse mediante Pull Request cuando exista repositorio remoto.
- Incluye en cada PR: resumen, especificación relacionada, decisiones, pruebas ejecutadas y riesgos pendientes.
- No crees ramas, commits, pushes, PR ni merges sin autorización explícita del usuario.
- Nunca hagas `force-push`, borres ramas o reescribas historial compartido sin autorización.
- La aprobación final del merge corresponde al usuario.

## Desarrollo realmente paralelo
- Permite tareas paralelas solo si son suficientemente independientes.
- Usa un `git worktree` distinto por cada agente que edite código simultáneamente.
- No permitas que dos agentes editen al mismo tiempo los mismos archivos compartidos.
- Integra cambios dependientes en orden, comprueba conflictos y vuelve a ejecutar las pruebas tras fusionarlos.
- No inicies agentes paralelos automáticamente: justifica primero el beneficio y solicita aprobación.

## Entrega y evidencia
- `ai-workspace/` debe reflejar el proceso **real**: prompts importantes, propuestas de Codex, decisiones humanas, errores encontrados y correcciones.
- No inventes capturas, conversaciones, pruebas ni revisiones.
- Mantén `README.md` actualizado con instrucciones verificadas para ejecutar frontend y backend desde cero.
- En la fase de análisis inicial, lee y reporta: **no modifiques archivos ni generes código hasta recibir permiso**.
