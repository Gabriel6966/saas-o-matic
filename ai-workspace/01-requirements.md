# SaaS-O-Matic — Especificación funcional

**Versión:** 0.2. **Estado:** borrador para revisión humana; D-01 a D-11 aprobadas, con detalles técnicos por concretar. Sin autorización para implementar código.

## 1. Objetivo, fuentes y trazabilidad

Herramienta interna para registrar clientes corporativos, simular costes mensuales de suscripciones SaaS y consultar el historial en distintas divisas.

La fuente de los requisitos obligatorios es el enunciado original de Roams, conservado fuera del repositorio. [00-project-scope.md](00-project-scope.md) resume su alcance y no sustituye al documento original.

Los requisitos de la sección 2 se atribuyen al enunciado original; sus referencias de origen identifican los apartados correspondientes del resumen. Las decisiones técnicas de la sección 3 pertenecen al proyecto; su estado se recoge en la sección 4 y en [decision-log.md](decision-log.md). Las restricciones vigentes de `AGENTS.md` siguen aplicando.

Como propuesta de diseño del proyecto, se plantea permitir incorporar otras divisas posteriormente; no se exige añadirlas en esta entrega.

## 2. Requisitos obligatorios y entregables

### RF-01 — Registro de clientes

**Origen:** Enunciado original de Roams — Backend y persistencia. API REST conectada a SQLite; `POST /customers` guarda nombre de empresa, identificador fiscal, correo, país y plan elegido. Para clientes de España, validar algorítmicamente DNI/NIF/CIF, no solo mediante regex. La cobertura y normalización están aprobadas en D-07; antes de implementar deben documentarse y contrastarse algoritmos y casos de prueba.

### RF-02 — Registro de simulaciones

**Origen:** Enunciado original de Roams — Backend y persistencia. `POST /simulations` guarda ID de cliente, usuarios activos, almacenamiento contratado, llamadas estimadas a la API y cálculo mensual persistido. El contenido histórico está aprobado en D-06; las unidades y validaciones generales, en D-09. Los contratos están aprobados en A-06; su implementación y verificación siguen pendientes.

### RF-03 — Facturación acumulativa

**Origen:** Enunciado original de Roams — Backend y persistencia. El coste por usuarios es acumulativo:

- Tramo inicial de 0 a 10 usuarios: 10 € por usuario.
- Usuarios 11 a 50: 8 € por usuario de este tramo.
- Usuarios 51 en adelante: 5 € por usuario de este tramo.

Fórmula base para un número entero no negativo de usuarios `n`:
`min(n,10)*10 + min(max(n-10,0),40)*8 + max(n-50,0)*5`

Ejemplos: 1→10 €, 9→90 €, 10→100 €, 11→108 €, 15→140 €, 49→412 €, 50→420 €, 51→425 €. Para cero, la fórmula produce 0 € y su admisión en API e interfaz está aprobada en D-09.

Al coste base se añade el impuesto correspondiente al país del cliente. D-01 concreta para el proyecto una política simplificada y configurable; sus tasas y limitaciones se recogen en la sección 3.

### RF-04 — Dashboard y búsqueda

**Origen:** Enunciado original de Roams — Frontend. Buscar clientes por empresa o identificador fiscal, mostrar el detalle en tarjetas responsive y consultar el historial de simulaciones persistidas. Las rutas de consulta están aprobadas en D-04 y sus detalles HTTP en A-06, recogidos en [03-api-contracts.md](03-api-contracts.md).

### RF-05 — Simulación interactiva

**Origen:** Enunciado original de Roams — Frontend. Formulario con ajuste interactivo del número de usuarios y proyección del coste mensual. La previsualización y el guardado se separan conforme a D-05, aprobada.

### RF-06 — Divisas

**Origen:** Enunciado original de Roams — Frontend. Visualizar inicialmente EUR, USD y GBP mediante una API pública de tipos de cambio, con gestión de carga, fallo y ausencia de respuesta. La conversión es visual y no altera el importe original guardado. EUR es la moneda base de cálculo y persistencia conforme a D-08. A-04 concreta proveedor, acceso Angular condicionado a CORS y uso de caché. Antes de integrar quedan por cerrar sus detalles de caducidad y redondeo visual y comprobar CORS real.

### RF-07 — Entregables

**Origen:** Enunciado original de Roams — Entrega. Código en un repositorio GitHub accesible para evaluación; `README.md` con requisitos e instrucciones verificadas para ejecutar frontend y backend en local desde cero; carpeta `ai-workspace/` con especificaciones previas, decisiones de arquitectura, prompts e interacciones reales con IA y revisiones de calidad. Solo se documentarán aprobaciones, pruebas y resultados que hayan ocurrido.

## 3. Decisiones técnicas y propuestas del proyecto

- **Stack y estructura (D-11, aprobada):** backend con Python, FastAPI, SQLAlchemy y SQLite; frontend con Angular y TypeScript; pruebas con pytest y herramientas de testing de Angular. Mantener separación entre lógica de negocio, HTTP, persistencia y presentación. SQLite también es obligatorio según el alcance.
- **Motor de cálculo (D-05, aprobada):** FastAPI será la única fuente de verdad del cálculo económico. `POST /simulations/preview` calculará sin persistir y `POST /simulations` guardará mediante acción explícita; ambos compartirán el mismo servicio de dominio. El servidor calculará desde entradas validadas, sin confiar en totales enviados por la interfaz.
- **Interacción (D-05, aprobada):** Angular usará Reactive Forms con `valueChanges`, `debounceTime(300)`, comparación de cambios relevantes y `switchMap` para reducir peticiones y cancelar suscripciones a previsualizaciones obsoletas. Gestionar carga y error sin presentar respuestas antiguas como cálculos actuales. Los 300 ms iniciales podrán ajustarse tras pruebas de experiencia de usuario.
- **Precisión monetaria (D-10, aprobada):** usar Python `Decimal` y redondear importes a dos decimales con `ROUND_HALF_UP`. Calcular el impuesto y redondearlo a céntimos; el total será base más impuesto redondeado. Guardar dinero como enteros en céntimos en SQLite y exponerlo como cadenas decimales exactas en JSON, con contrato documentado. No usar `float` ni SQLite `REAL` para almacenar dinero.
- **Consumos (D-02, aprobada):** registrar el almacenamiento contratado y las llamadas API estimadas sin añadirles cargos económicos, porque el enunciado no define tarifas. No describirlos como servicios gratuitos.
- **Plan (D-03, aprobada):** texto obligatorio y validado, sin inventar un catálogo comercial. El plan no modifica los tramos de facturación; sus límites y validación concreta están aprobados en A-06 y documentados en [03-api-contracts.md](03-api-contracts.md); queda verificar su implementación.
- **Fiscalidad (D-01, aprobada):** política simplificada y configurable para presupuestos comerciales: ES (España), 21 %; FR (Francia), 20 %; DE (Alemania), 19 %. Rechazar el cálculo de simulaciones para países sin política, sin asignarles automáticamente un 0 %. Guardar la tasa aplicada en cada histórico y separar la política fiscal de la tarificación por usuarios. No cubre toda la normativa B2B, la inversión del sujeto pasivo ni particularidades territoriales. [Referencia de tasas generales: Your Europe](https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/index_es.htm).
- **Histórico (D-06, aprobada):** persistir cliente, usuarios, almacenamiento, llamadas API, país, plan, base, impuesto aplicado, importe del impuesto, total, moneda EUR y fecha de creación. Conservar las entradas de consumo y el resultado original; no recalcular automáticamente los históricos al consultarlos.
- **Divisas (D-08, aprobada):** EUR será la moneda base de cálculo y persistencia; EUR, USD y GBP serán las divisas iniciales de visualización. Usar una API pública y mostrar la fecha de la tasa consultada. Ante fallo externo, mantener EUR disponible. A-04 aprueba proveedor, ubicación de la consulta y uso de metadatos/caché; los detalles de caducidad, el redondeo visual y la comprobación real de CORS siguen pendientes antes de integrar.
- **Validación (D-09 y D-07, aprobadas):** admitir cero usuarios; usuarios y llamadas API serán enteros no negativos, y el almacenamiento se expresará en GB sin cantidades negativas. Los clientes serán únicos por la combinación país + identificador fiscal normalizado. A-02 fija GB enteros; A-06 concreta longitudes, límites y validación en los contratos. Quedan pendientes su implementación y las comprobaciones correspondientes. La cobertura de identificadores y su normalización se detallan en D-07; el contraste técnico de algoritmos y casos sigue pendiente antes de implementar.

### Contratos de consulta y previsualización

Las rutas de consulta están aprobadas en D-04 y la previsualización en D-05. Estos contratos adicionales son decisiones del proyecto; sus nombres no proceden del enunciado.

| Ruta | Finalidad | Decisión |
| --- | --- | --- |
| `GET /customers?q=...` | Buscar parcialmente por empresa o exactamente por identificador fiscal normalizado. | D-04, aprobada |
| `GET /customers/{customer_id}` | Consultar el detalle del cliente. | D-04, aprobada |
| `GET /customers/{customer_id}/simulations` | Consultar su historial persistido. | D-04, aprobada |
| `POST /simulations/preview` | Validar y calcular sin persistir, con la misma lógica y desglose económico que el guardado. | D-05, aprobada |

El guardado explícito recalculará en el servidor mediante el servicio compartido de D-05. A-06 fija paginación, esquemas de entrada/salida y errores HTTP en [03-api-contracts.md](03-api-contracts.md), conforme a D-04 y D-05; los importes se representan como cadenas decimales exactas según D-10. Su aprobación no acredita endpoints ni pruebas implementados.

### Matriz aprobada de identificadores españoles — D-07

| Familia | Cobertura inicial aprobada | Antes de implementar |
| --- | --- | --- |
| DNI: ocho dígitos y letra | Validación de estructura y letra de control. | Documentar y contrastar algoritmo y casos, incluidos ceros iniciales. |
| NIE: prefijo X/Y/Z, siete dígitos y letra | Validación de estructura y letra de control. | Documentar y contrastar algoritmo y casos de cada prefijo. |
| NIF de entidades españolas (CIF) | Estructura y carácter de control según la familia de entidad. | Contrastar especialmente las reglas de control numérico o alfabético y sus casos de prueba. |
| NIF especiales K/L/M y formatos históricos | Fuera del alcance inicial. | Documentar la limitación y distinguir un formato no soportado de uno inválido. |

Normalizar letras a mayúsculas y eliminar espacios exteriores, conservando ceros iniciales. Distinguir estructura inválida y carácter de control incorrecto. La validación algorítmica no acredita existencia, titularidad ni vigencia censal. Para clientes de otros países, aplicar validaciones básicas sin afirmar una validación fiscal oficial.

Antes de implementar, documentar y contrastar los algoritmos y casos de prueba. El tratamiento de separadores internos y del prefijo `ES` está aprobado en A-06 y recogido en [03-api-contracts.md](03-api-contracts.md).

Fuentes: [Interior: control del DNI/NIE](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/) y [AEAT: composición del NIF de entidades](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html). La referencia de la AEAT describe estructura y familias, pero no desarrolla el algoritmo completo del control; su contraste numérico/alfabético sigue siendo trabajo previo a la implementación.

## 4. Estado de las decisiones

El responsable técnico ha aprobado las once decisiones D-01 a D-11, registradas en [decision-log.md](decision-log.md). A-02, A-04, A-06 y A-07 concretan datos, divisas, contratos y ejecución local en [02-architecture.md](02-architecture.md) y [03-api-contracts.md](03-api-contracts.md). Siguen abiertos los detalles no fijados y las verificaciones reales; aprobación del diseño no equivale a implementación.

| ID | Decisión del proyecto | Estado |
| --- | --- | --- |
| D-01 | Política comercial simplificada y configurable: ES 21 %, FR 20 %, DE 19 %; rechazar el cálculo para países sin política, sin 0 % automático. Guardar la tasa histórica y separar fiscalidad de tarificación. Límites B2B, inversión del sujeto pasivo y territoriales documentados. | Aprobada |
| D-02 | Registrar el almacenamiento contratado y llamadas API estimadas sin añadir cargos económicos; el enunciado no define tarifas. No describirlos como servicios gratuitos. | Aprobada |
| D-03 | Plan como texto obligatorio y validado, sin inventar un catálogo comercial ni modificar los tramos de facturación. Longitudes y validación concreta definidas en A-06; comprobación de implementación pendiente. | Aprobada |
| D-04 | GET /customers?q=..., GET /customers/{customer_id} y GET /customers/{customer_id}/simulations. Búsqueda parcial por empresa y exacta por identificador fiscal normalizado; paginación y esquemas HTTP definidos en A-06; verificación pendiente. | Aprobada |
| D-05 | Motor económico único en FastAPI; previsualización y guardado explícito mediante un servicio de dominio compartido; flujo Reactive Forms y RxJS definido en la sección 3. | Aprobada |
| D-06 | Persistir entradas y copia del resultado original, con moneda EUR y fecha de creación; no recalcular históricos automáticamente al consultarlos. | Aprobada |
| D-07 | Validar DNI, NIE X/Y/Z y NIF de entidades españolas; mayúsculas, espacios exteriores y ceros iniciales según la sección 3. K/L/M e históricos fuera de alcance; otros países con validación básica. Documentar y contrastar algoritmos y casos antes de implementar. | Aprobada |
| D-08 | EUR como base de cálculo y persistencia; visualización inicial EUR/USD/GBP mediante API pública, con fecha de la tasa y EUR disponible ante fallos. Proveedor, acceso y uso de metadatos/caché aprobados en A-04; caducidad concreta, redondeo visual y CORS real pendientes. | Aprobada |
| D-09 | Cero usuarios válido; usuarios y llamadas API enteros no negativos; almacenamiento en GB no negativo; unicidad de clientes por la combinación país + identificador fiscal normalizado. Granularidad en A-02 y longitudes, límites y validación detallada en A-06; verificación pendiente. | Aprobada |
| D-10 | Decimal, dos decimales y ROUND_HALF_UP; impuesto redondeado a céntimos y total igual a base más impuesto; dinero en céntimos enteros en SQLite y cadenas decimales exactas en JSON. | Aprobada |
| D-11 | Python, FastAPI, SQLAlchemy y SQLite; Angular y TypeScript; pytest y testing de Angular; separación de negocio, HTTP, persistencia y presentación. | Aprobada |

## 5. Criterios de aceptación

Estos criterios describen verificaciones futuras, no pruebas ejecutadas. Las referencias a concreción de contratos remiten ahora a A-06 aprobada; los criterios se conservan. Siguen pendientes el contraste de algoritmos y casos fiscales y las comprobaciones de implementación.

### Alcance obligatorio

| ID | Referencia | Verificación |
| --- | --- | --- |
| CA-01 | RF-01, D-07, D-09 | Crear un cliente y comprobar su persistencia. Aceptar identificadores admitidos con control correcto y rechazar estructura inválida o control incorrecto, distinguiendo ambos errores. Verificar mayúsculas, espacios exteriores y ceros iniciales; comunicar K/L/M e históricos como no soportados y aplicar validaciones básicas para otros países. |
| CA-02 | RF-02 | Guardar cliente, consumos y cálculo mensual de una simulación; recuperarlos en el historial tras reiniciar el backend. |
| CA-03 | RF-03 | Obtener exactamente las bases de los ejemplos de RF-03, especialmente a ambos lados de 10 y 50 usuarios. |
| CA-04 | RF-03, D-01, D-10 | Para una base de 100 €, obtener impuesto/total ES 21 €/121 €, FR 20 €/120 € y DE 19 €/119 €, con el redondeo de D-10. Rechazar el cálculo para países sin política, sin aplicar 0 %; comprobar la conservación de la tasa aplicada en el histórico. |
| CA-05 | RF-04, D-04 | Encontrar clientes por empresa y por identificador; consultar detalle e historial; comprobar búsqueda sin resultados e historial vacío. Verificar tarjetas en móvil y escritorio sin perder campos ni acciones. |
| CA-06 | RF-05 | Modificar usuarios mediante los controles y observar la proyección mensual correspondiente. |
| CA-07 | RF-06 | Mostrar EUR/USD/GBP; indicar carga y comunicar fallos o ausencia de respuesta sin bloquear la consulta de clientes e historial. Cambiar divisa no altera importes persistidos. |
| CA-08 | RF-07 | Verificar acceso al repositorio, ejecutar frontend y backend desde cero siguiendo el README y comprobar que la evidencia de IA y calidad corresponde a trabajo real. |

### Criterios vinculados a decisiones del proyecto

CA-09 a CA-12 corresponden a decisiones aprobadas. Son verificaciones futuras; los detalles de contratos e integración aún abiertos deberán concretarse antes de implementar las partes correspondientes.

| ID | Decisión | Verificación prevista |
| --- | --- | --- |
| CA-09 | D-09 | Admitir cero usuarios en API e interfaz y obtener base cero. Rechazar usuarios y llamadas negativos o fraccionarios, y almacenamiento negativo en GB. Rechazar clientes duplicados por la combinación país + identificador fiscal normalizado; comprobar longitudes y precisión cuando se concreten en los contratos. |
| CA-10 | D-05 | Previsualizar no crea registros; previsualización y guardado coinciden para iguales entradas y reglas. El servidor calcula el total y la interfaz descarta respuestas de ajustes anteriores. |
| CA-11 | D-06, D-10 | Cambiar las reglas actuales no modifica los datos económicos históricos; guardar y leer los importes conserva exactamente la precisión y el redondeo acordados. |
| CA-12 | D-08 | Con tipos de prueba conocidos, convertir siempre desde EUR y mostrar su fecha. Comprobar red caída, tiempo de espera agotado, respuesta malformada, moneda ausente y tasa inválida; EUR sigue disponible. |

## 6. Siguiente paso

Revisión humana de esta sincronización. D-01 a D-11 y A-01 a A-07 están aprobadas según [decision-log.md](decision-log.md). A-02 fija GB enteros; A-04, el proveedor y enfoque de divisas; A-06, contratos, paginación, longitudes, normalización y límites; A-07, el enfoque de ejecución local. Véanse [arquitectura v0.4](02-architecture.md) y [contratos v0.3](03-api-contracts.md).

Queda contrastar algoritmos y casos de identificadores, especialmente el control de entidades; concretar codificaciones físicas no elegidas, formato/carga de configuración fiscal y detalles de caché/caducidad y mecanismo decimal/redondeo visual de divisas. También verificar versiones, configuración, inicialización y claves foráneas SQLite, instalación, arranque, pruebas, CORS local y CORS real del proveedor desde Angular. Estos trabajos pendientes no reabren decisiones aprobadas ni se dan por realizados.

Concretar cada detalle antes de implementar la funcionalidad que dependa de él. Las partes independientes podrán avanzar con especificación aprobada y autorización para implementar. Estas aprobaciones no autorizan por sí solas código de aplicación.
