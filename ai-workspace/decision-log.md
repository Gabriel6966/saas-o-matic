# SaaS-O-Matic — Registro de decisiones del proyecto

**Aprobaciones previas:** 2026-11-12. **Cierre A-06/A-07:** 2026-11-13. **Responsable:** responsable técnico del proyecto. **Estado:** D-01 a D-11 y A-01 a A-07 aprobadas, con los ajustes de A-02/A-04.

Las decisiones D se reflejan en [01-requirements.md](01-requirements.md) y las arquitectónicas en [02-architecture.md](02-architecture.md). Son decisiones del proyecto; no se atribuyen a Roams, salvo SQLite como requisito del alcance. Las alternativas se exponen como contraste técnico de esta revisión documental; no acreditan una evaluación previa ni pruebas comparativas ejecutadas.

Las aprobaciones A-02 y A-04 concretan la granularidad de GB y el proveedor inicial que D-09 y D-08 dejaban abiertos. Se conservan íntegros los registros D-01 a D-11 y A-01 a A-05. Sus referencias anteriores a contratos o ejecución pendientes se concretan ahora en A-06/A-07; los detalles no fijados y las verificaciones reales siguen abiertos.

## D-11 — Stack y separación de responsabilidades

- **Decisión:** backend con Python, FastAPI, SQLAlchemy y SQLite; frontend con Angular y TypeScript; pytest para backend y herramientas de testing de Angular. Separar lógica de negocio, HTTP, persistencia y presentación.
- **Justificación:** confirmar el stack previsto evita cambios de alcance y permite mantener las reglas económicas independientes de la interfaz y del acceso a datos.
- **Alternativas consideradas:** otro stack compatible con SQLite, o concentrar responsabilidades para simplificar el arranque. No se realizó una comparativa de frameworks; mezclar responsabilidades dificultaría mantener y probar el cálculo.
- **Consecuencias técnicas:** organizar los módulos según esas responsabilidades y verificar cada capa con las herramientas acordadas. Las versiones y los contratos detallados se documentarán antes de implementar las partes correspondientes.

## D-05 — Motor de cálculo y previsualización

- **Decisión:** FastAPI será la única fuente de verdad del cálculo económico. `POST /simulations/preview` calculará sin persistir y `POST /simulations` será el guardado explícito; ambos compartirán el mismo servicio de dominio.
- **Interacción aprobada:** Reactive Forms con `valueChanges`, `debounceTime(300)`, comparación de cambios relevantes y `switchMap` para reducir peticiones y cancelar suscripciones a previsualizaciones obsoletas. Gestionar carga y error, sin mostrar respuestas antiguas como cálculos actuales. Los 300 ms iniciales podrán ajustarse tras pruebas de experiencia de usuario.
- **Justificación:** compartir el servicio evita divergencias entre previsualización y guardado; regular las peticiones y descartar resultados obsoletos mantiene la proyección asociada a las entradas vigentes.
- **Alternativas consideradas:** duplicar el cálculo en Angular, o consultar en cada cambio sin espera ni sustitución de suscripciones. La primera duplica reglas; la segunda genera peticiones innecesarias y exige controlar resultados fuera de orden.
- **Consecuencias técnicas:** el cliente enviará entradas y el servidor determinará los importes. Previsualizar no escribirá en la base de datos; guardar volverá a calcular con el servicio compartido. Cancelar una suscripción no garantiza detener el trabajo ya iniciado en el servidor. Los esquemas y errores HTTP se documentarán en los contratos.

## D-06 — Conservación del histórico

- **Decisión:** persistir cliente, usuarios, almacenamiento, llamadas API, país, plan, base, impuesto aplicado, importe del impuesto, total, moneda EUR y fecha de creación. Conservar las entradas de consumo y la copia del resultado original; no recalcular automáticamente los históricos al consultarlos.
- **Justificación:** preservar el resultado original evita que una consulta cambie sus importes por modificaciones posteriores de reglas o datos del cliente.
- **Alternativas consideradas:** guardar solo entradas y recalcular al leer, o guardar únicamente el total. La primera altera el resultado histórico; la segunda pierde el contexto necesario para explicar el cálculo.
- **Consecuencias técnicas:** guardar entradas y resultado asociados a la misma simulación y devolver los valores conservados al consultar. La moneda EUR del histórico queda fijada; el proveedor y las políticas de tipos de cambio siguen pendientes en D-08.

## D-10 — Precisión monetaria

- **Decisión:** calcular con Python `Decimal` y redondear importes monetarios a dos decimales con `ROUND_HALF_UP`. Calcular el impuesto y redondearlo a céntimos; el total será base más impuesto redondeado. Guardar dinero como enteros en céntimos en SQLite y exponer importes exactos como cadenas decimales en JSON, documentando el contrato. No utilizar `float` ni SQLite `REAL` para almacenar dinero.
- **Justificación:** conservar precisión decimal en cálculo, persistencia e intercambio y aplicar el mismo redondeo en todos los resultados.
- **Alternativas consideradas:** almacenar decimales exactos como texto en SQLite, o usar punto flotante. Los céntimos enteros representan exactamente los importes acordados; el punto flotante puede introducir diferencias de representación y redondeo.
- **Consecuencias técnicas:** convertir explícitamente entre `Decimal`, céntimos enteros y cadenas decimales, sin pasos por `float`. El contrato JSON especificará el formato monetario de dos decimales. Esta decisión no fija países ni tasas fiscales; la política correspondiente se recoge en D-01.

## D-02 — Consumos sin cargos adicionales

- **Decisión:** registrar el almacenamiento contratado y las llamadas API estimadas sin añadir cargos económicos. No describir estos conceptos como servicios gratuitos.
- **Justificación:** el enunciado exige registrar ambos datos, pero no define tarifas.

## D-03 — Plan seleccionado

- **Decisión:** representar el plan como texto obligatorio y validado, sin inventar un catálogo comercial. No modifica los tramos de facturación.
- **Detalles abiertos:** longitudes y validación concreta en la especificación de contratos.

## D-04 — Consultas del dashboard

- **Decisión:** aprobar `GET /customers?q=...`, `GET /customers/{customer_id}` y `GET /customers/{customer_id}/simulations`.
- **Búsqueda:** parcial por empresa y exacta por identificador fiscal normalizado. La normalización queda sujeta a D-07.
- **Detalles abiertos:** paginación, esquemas HTTP y demás detalles de consulta en la especificación de contratos.

## D-08 — Divisas

- **Decisión:** EUR será la moneda base de cálculo y persistencia; EUR, USD y GBP serán las divisas iniciales de visualización. Usar una API pública de tipos de cambio, mostrar la fecha de la tasa consultada y mantener EUR disponible si falla el servicio externo.
- **Detalles abiertos:** proveedor, ubicación de la consulta, actualización, caché y caducidad antes de implementar la integración.

## D-09 — Validaciones y unicidad

- **Decisión:** admitir cero usuarios como simulación válida. Usuarios y llamadas API serán enteros no negativos; almacenamiento en GB sin cantidades negativas.
- **Unicidad:** clientes únicos por la combinación país + identificador fiscal normalizado. Los formatos y la normalización se concretan en D-07.
- **Detalles abiertos:** longitudes, precisión del almacenamiento y validación detallada de campos en los contratos.

## D-01 — Política fiscal simplificada

- **Decisión:** política configurable para presupuestos comerciales: ES (España), 21 %; FR (Francia), 20 %; DE (Alemania), 19 %. Los países sin política definida no podrán utilizarse para calcular simulaciones; no asignarles automáticamente un 0 %.
- **Justificación:** ofrecer una regla comercial acotada y verificable, usando tasas generales de referencia sin presentar el modelo como fiscalidad B2B completa.
- **Consecuencias técnicas:** separar la política fiscal del motor de tarificación por usuarios y guardar la tasa aplicada en cada simulación histórica. La configuración y la representación de la tasa se documentarán en sus contratos.
- **Limitaciones:** no cubre toda la normativa B2B, la inversión del sujeto pasivo ni particularidades territoriales.
- **Referencia:** [Your Europe: normas y tipos de IVA](https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/index_es.htm). La adopción de esta política simplificada es una decisión del proyecto.

## D-07 — Identificadores fiscales

- **Cobertura aprobada:** validación algorítmica de DNI (ocho dígitos y letra), NIE (X/Y/Z, siete dígitos y letra) y NIF de entidades españolas (CIF), con estructura y carácter de control según la familia de entidad.
- **Normalización y errores:** letras a mayúsculas, eliminar espacios exteriores y conservar ceros iniciales. Distinguir estructura inválida y carácter de control incorrecto.
- **Justificación:** detectar errores de entrada mediante controles locales con una cobertura inicial explícita.
- **Limitaciones:** K/L/M y formatos históricos fuera del alcance inicial; para clientes de otros países, validaciones básicas sin afirmar validación fiscal oficial. El algoritmo no acredita existencia, titularidad ni vigencia censal.
- **Antes de implementar:** documentar y contrastar algoritmos y casos de prueba, especialmente el control numérico/alfabético de entidades. Separadores internos, prefijo `ES` y detalles de validación básica se concretarán en los contratos.
- **Fuentes:** [Interior: cálculo del control del DNI/NIE](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/) y [AEAT: composición del NIF de entidades](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html). La fuente de la AEAT describe la estructura y las familias, pero no el algoritmo completo del control; esta aprobación no da por realizado su contraste ni las pruebas.

## A-01 — Arquitectura modular

**Estado:** Aprobada.

- **Decisión:** monolito modular FastAPI, SQLAlchemy síncrono, sesión independiente por petición y transacciones controladas; separar API, aplicación, dominio y persistencia. Angular será una aplicación independiente. Evitar capas y abstracciones innecesarias.
- **Justificación:** mantener responsabilidades claras con una ejecución y pruebas adecuadas al alcance del reto.
- **Consecuencias:** el dominio no dependerá de HTTP ni de SQLite; aplicación coordinará casos de uso y escrituras. Versiones y preparación del entorno siguen pendientes en A-07.

## A-02 — Modelo de datos

**Estado:** Aprobada con ajuste.

- **Decisión:** customers y simulations con INTEGER PRIMARY KEY, clave foránea, unicidad por país e identificador fiscal normalizado e integridad referencial. storage_gb será INTEGER no negativo: no se admiten fracciones de GB. Dinero en céntimos enteros, tasas decimales exactas y fechas UTC. No eliminar históricos en cascada.
- **Justificación:** la granularidad de GB enteros simplifica el modelo inicial y evita conversiones de unidades; la precisión monetaria y las copias históricas preservan el cálculo original.
- **Consecuencias:** actualizar modelo y contratos a GB enteros. Máximos y esquemas HTTP se proponen en A-06; codificación física de tasas/fechas, índices y detalles de esquema siguen pendientes de implementación en A-07.

## A-03 — Estado y simulaciones Angular

**Estado:** Aprobada.

- **Decisión:** Reactive Forms y estado local, debounceTime(300), comparación de cambios relevantes y switchMap para sustituir solicitudes obsoletas; gestionar carga, error y resultados desactualizados. Guardado explícito y bloqueo de dobles envíos mientras se guarda.
- **Justificación:** asociar la proyección a las entradas vigentes y reducir peticiones sin duplicar el motor económico.
- **Consecuencias:** invalidar resultados antiguos y mantener estados por solicitud. El guardado usa el cálculo del backend; no implica un mecanismo de idempotencia todavía no definido.

## A-04 — Conversión de divisas

**Estado:** Aprobada con ajustes.

- **Decisión:** proveedor inicial https://open.er-api.com/v6/latest/EUR mediante servicio Angular aislado, con acceso directo condicionado a comprobar CORS y sin claves privadas en frontend. Caché con información de actualización del proveedor, fecha de los tipos y atribución visibles; EUR, USD y GBP iniciales.
- **Justificación:** aislar la conversión de presentación y mantener EUR utilizable ante fallos externos.
- **Consecuencias:** toda conversión parte del EUR original y nunca modifica la simulación persistida. Si el acceso no es compatible, documentar la necesidad de adaptador backend antes de cambiar la arquitectura.
- **Pendiente:** mecanismo exacto de redondeo visual e implementación decimal; detalles de caché y comprobación CORS antes de integrar. No se registra CORS como probado.

## A-05 — Configuración fiscal

**Estado:** Aprobada.

- **Decisión:** política configurable separada de la tarificación por usuarios; ES 21 %, FR 20 % y DE 19 % con representación decimal exacta. Error explícito sin configuración, tasa aplicada conservada por simulación y limitaciones B2B documentadas.
- **Justificación:** mantener el precio por tramos independiente de una política fiscal comercial acotada.
- **Consecuencias:** inyectar la política en el motor común y conservar su resultado histórico. El formato y la carga concretos de configuración siguen siendo detalles de implementación pendientes.

## A-06 — Contratos y validaciones

**Estado:** Aprobada. **Fecha:** 2026-11-13.

- **Decisión:** aprobar los seis endpoints, nombres snake_case, esquemas, longitudes y normalización de [03-api-contracts.md v0.3](03-api-contracts.md). Pydantic con tipos estrictos y `extra="forbid"`: sin coerción de booleanos, cadenas o fracciones a enteros; campos adicionales, incluidos importes del frontend, rechazados con 422.
- **Límites de demostración:** usuarios, storage_gb y api_calls enteros entre 0 y 1000000. Los GB no admiten fracciones. Son límites técnicos iniciales, no cuotas comerciales; api_calls se ajusta de 1000000000 a 1000000 respecto del borrador v0.2.
- **Consultas:** limit=20 y offset=0 por defecto, máximo 100 por página; orden determinista y colecciones vacías con 200 e items vacíos. Empresa: búsqueda parcial Unicode sin eliminar acentos mediante `unicode_casefold` de Python registrada en cada conexión SQLite e `instr`; conservar el nombre original, enlazar parámetros y tratar `%`/`_` literalmente. Sin columna de búsqueda inicial. Identificador: coincidencia exacta normalizada sin validar el control del término buscado.
- **Errores y precisión:** sobre común error.code/message/details y manejadores HTTP sencillos para FastAPI/Pydantic; códigos 400, 415, 422, 404, 409 y 500 según contrato, sin trazas ni datos sensibles. Dinero EUR como cadenas exactas con dos decimales, tasas como cadenas exactas y created_at UTC ISO 8601 terminado en Z.
- **Justificación:** fijar una interfaz consistente y explícita entre Angular y FastAPI, preservando precisión e históricos y evitando ampliar el esquema para la búsqueda inicial.
- **Consecuencias:** mantener D-05, D-06 y D-10; preview no escribe y guardar recalcula con el motor común. Registrar la función por conexión y aplicar filtros antes del conteo y la paginación. La búsqueda puede escanear filas y deberá revisarse si aumenta el volumen. Los criterios de contrato siguen siendo verificaciones futuras, no pruebas ejecutadas.

## A-07 — Ejecución y persistencia

**Estado:** Aprobada. **Fecha:** 2026-11-13.

- **Decisión:** ejecución local reproducible en Windows/VS Code, con comandos multiplataforma cuando sea sencillo. Verificar y registrar versiones concretas de Python, Angular y dependencias antes de fijarlas en los archivos de implementación; no presumir compatibilidades.
- **Configuración:** variables de entorno y `.env.example` sin secretos cuando se implemente. SQLite con ruta estable y comando explícito de inicialización mediante SQLAlchemy; nunca crear tablas implícitamente por petición. Alembic no es obligatorio en el MVP; todo cambio posterior del esquema requiere definir una estrategia de migración.
- **Conexiones y transacciones:** habilitar claves foráneas en cada conexión y verificarlas en pruebas de integración. SQLAlchemy síncrono, sesión independiente por petición, cierre garantizado y escrituras con transacciones controladas, conforme a A-01.
- **CORS y entrega:** backend restringido a orígenes locales concretos y configurables del frontend, sin `*` con credenciales. El README deberá contener pasos completos y realmente verificados de instalación, arranque y pruebas de ambos componentes.
- **Justificación:** hacer reproducible la ejecución local y explícita la creación del esquema sin añadir infraestructura o herramientas de migración obligatorias al alcance inicial.
- **Consecuencias y verificaciones pendientes:** implementar y verificar versiones, configuración, inicialización, arranque y pruebas antes de la entrega. CORS real de ExchangeRate-API desde Angular se comprobará durante la integración; el mecanismo decimal y redondeo visual de divisas siguen pendientes antes de implementarlos. Las codificaciones físicas y otros detalles no fijados expresamente continúan abiertos. Esta aprobación no acredita ninguna ejecución, compatibilidad o prueba realizada.

## Límites y trabajo pendiente

Todas las decisiones D-01 a D-11 y A-01 a A-07 están aprobadas. Quedan por contrastar algoritmos y casos fiscales de D-07, concretar los detalles físicos no definidos y verificar versiones, comandos, configuración, integridad SQLite y ejecución local. CORS real del proveedor, detalles de caché y mecanismo decimal/redondeo visual de divisas siguen pendientes. No se registran pruebas de aplicación, instalaciones, comparativas ni comprobaciones de entorno como realizadas. Este cierre autoriza solo la sincronización documental; el siguiente paso es la revisión humana antes de continuar con el primer PR.
