# Prompt #19 — Implementar el motor de facturación (Python + Pytest)

## Rol y objetivo
Actúa como desarrollador backend senior con criterio de pruebas y revisión de código. Trabaja en **SaaS-O-Matic**, la prueba técnica de Roams.

**Objetivo de esta tarea:** implementar el **núcleo de dominio puro** del cálculo de precios por usuarios y la política fiscal simplificada, junto con pruebas automatizadas ejecutables. **No implementar todavía la API, base de datos ni frontend.**

## Contexto obligatorio
Antes de editar, lee y respeta:

- `AGENTS.md`
- `ai-workspace/00-project-scope.md`
- `ai-workspace/01-requirements.md`
- `ai-workspace/02-architecture.md` (v0.4)
- `ai-workspace/03-api-contracts.md` (v0.3)
- `ai-workspace/decision-log.md` (D-01 a D-11 y A-01 a A-07)
- `README.md`

Trabaja **únicamente** en la rama `feature/billing-engine`. Comprueba la rama antes de editar. Si no estás en ella, **detente e informa**; no crees ni cambies ramas por tu cuenta.

## Requisitos funcionales ya aprobados

### Precio progresivo y acumulativo por usuarios

| Tramo de usuarios activos | Precio por usuario del tramo |
|---|---:|
| 1 a 10 | 10 EUR |
| 11 a 50 | 8 EUR |
| 51 en adelante | 5 EUR |

La tarifa es **progresiva/acumulativa**, no una tarifa única aplicada a todos los usuarios. Ejemplos de base mensual en EUR:

| Usuarios | Base esperada |
|---:|---:|
| 0 | 0,00 |
| 1 | 10,00 |
| 10 | 100,00 |
| 11 | 108,00 |
| 15 | 140,00 |
| 50 | 420,00 |
| 51 | 425,00 |
| 100 | 670,00 |

### Fiscalidad simplificada (D-01 y A-05)

- `ES`: 21 % (`Decimal("0.21")`).
- `FR`: 20 % (`Decimal("0.20")`).
- `DE`: 19 % (`Decimal("0.19")`).
- Cualquier otro código de país: **error explícito de política fiscal no configurada**, nunca IVA 0 % por defecto.
- Esta política es una **simplificación comercial para la prueba**, no una solución fiscal B2B completa.
- Mantén las tasas en un lugar central y claramente configurable, sin construir una infraestructura de configuración innecesaria.

### Precisión y representación (D-10)

- Nunca usar `float` ni SQLite `REAL` para importes monetarios.
- Calcular con aritmética entera/`Decimal`, redondeo `ROUND_HALF_UP` al céntimo para el impuesto.
- `total = base + impuesto_redondeado`.
- El resultado del dominio debe permitir persistir en el futuro `base_cents`, `tax_cents`, `total_cents` como enteros, junto a la tasa decimal aplicada.
- La serialización JSON decimal (`"140.00"`) se resolverá en la capa API futura, **no es necesario implementar JSON ni Pydantic ahora**.

### Validación y alcance

- `active_users`: **entero JSON estricto entre 0 y 1.000.000** según A-06. El dominio debe protegerse también contra valores negativos, `bool` (subclase de `int`), números fraccionarios y tipos impropios.
- País con política fiscal conocida, normalizado como defina el contrato; no aceptar países sin política.
- `storage_gb`, `api_calls` y `plan` **no tienen precio especificado**: no inventar tarifas, descuentos ni cuotas. Son datos de simulaciones futuras y no requieren lógica en este módulo.
- No realizar escrituras ni consultas SQL en funciones de dominio.

## Implementación solicitada

1. Examina primero la estructura real del repositorio y contrasta las rutas con la arquitectura aprobada.
2. Crea el **mínimo** proyecto Python backend necesario para ejecutar pruebas: módulos de dominio, configuración mínima de pruebas/dependencias y sus tests. Prefiere `backend/app/domain/` y `backend/tests/` si encaja con `02-architecture.md`; si existe otra estructura aprobada, respétala y explica la elección.
3. Implementa una función de cálculo puro con entrada de usuarios y país/política fiscal, y un resultado tipado e inmutable (por ejemplo, `dataclass(frozen=True)`) que exponga base, tasa, impuesto y total exactos. Separa la política fiscal de la función de precio por tramos.
4. Define excepciones de dominio simples y comprensibles para validaciones y países sin política. **No** introduzcas códigos HTTP en el dominio.
5. Añade pruebas `pytest`, preferiblemente parametrizadas, que cubran:
   - Límites de tramos: 0, 1, 10, 11, 15, 50, 51 y 100 usuarios.
   - ES, FR y DE; por ejemplo, para 15 usuarios: ES 140,00 + 29,40 = 169,40; FR 140,00 + 28,00 = 168,00; DE 140,00 + 26,60 = 166,60.
   - País sin política: error explícito.
   - Usuarios negativos, superiores a 1.000.000, `True`, cadenas y fraccionarios.
   - Igualdad `total_cents == base_cents + tax_cents`.
   - Ausencia de dependencias en red, DB o FastAPI en el cálculo.
   - Redondeo `ROUND_HALF_UP` en una unidad/herramienta interna si el diseño la necesita (caso de medio céntimo con entrada decimal controlada, sin introducir nuevas tasas comerciales).
6. Añade únicamente las dependencias y configuración mínimas necesarias para ejecutar `pytest`; evita fijar versiones incompatibles a ciegas. Documenta el comando real de instalación/pruebas en el archivo de configuración o en una nota de salida, sin convertir esta tarea en una revisión extensa del README principal.
7. Ejecuta las pruebas en el entorno disponible. Si la instalación de dependencias o Python no está disponible, informa del bloqueo real y no afirmes que las pruebas pasaron.

## Límites estrictos

- **No** endpoints FastAPI, schemas Pydantic, ORM/SQLite, migraciones, clientes Angular, servicios de divisas, validadores DNI/NIE/CIF ni UI.
- **No** modificar requisitos aprobados, decisiones, arquitectura ni contratos REST.
- **No** editar `AGENTS.md` ni reescribir el README principal.
- **No** crear commits, push, PR, merge ni cambiar de rama.
- **No** instalar dependencias globalmente o modificar el entorno del sistema sin autorización. Usa entorno virtual local si necesitas instalar `pytest` y está permitido en el contexto.
- Evita abstracciones sofisticadas, contenedores de inyección de dependencias o paquetes innecesarios.
- No afirmes que algo se ha probado si no hay salida real de ejecución.

## Entregables de la respuesta

Al finalizar, proporciona:

1. Resumen de los archivos creados/modificados y justificación breve del diseño.
2. API pública del módulo de dominio y un ejemplo mínimo de uso.
3. Comando exacto para ejecutar los tests desde la raíz del repositorio.
4. Resultado real de `pytest` (número de pruebas y resultado) o bloqueo verificable.
5. `git status --short`, `git diff --check` y lista de archivos nuevos no seguidos (ten presente que `git diff` no incluye archivos nuevos sin seguimiento).
6. Riesgos o decisiones de implementación que deban revisarse antes del commit.

**Detente y espera revisión humana.**
