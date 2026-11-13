# SaaS-O-Matic — Contratos de API REST

**Versión:** 0.3. **Estado:** contratos aprobados en A-06; sincronización documental para revisión humana. Sin implementación ni autorización para generar código en esta tarea.

## 1. Alcance y estado

Define la comunicación entre Angular y FastAPI para los seis endpoints existentes. A-06 aprueba nombres, esquemas, códigos HTTP, límites, normalización y paginación, con api_calls limitado a 1000000 y búsqueda mediante unicode_casefold sin nueva columna. D-01 a D-11 y A-01 a A-05 se conservan. A-07 aprueba el enfoque de ejecución local, con versiones y verificaciones reales aún por realizar. No se han implementado los contratos.

Referencias: [alcance](00-project-scope.md), [requisitos](01-requirements.md), [arquitectura v0.4](02-architecture.md) y [registro de decisiones](decision-log.md). No se añaden endpoints de planes, actualización/borrado, autenticación o divisas. La integración externa de A-04 es independiente de estos contratos y no cambia el EUR original.

Todos los JSON siguientes son ejemplos sintéticos de contrato, no respuestas obtenidas ni pruebas ejecutadas. Empresas, identificadores, IDs y fechas son ilustrativos; ningún control algorítmico acredita una identidad real. Los correos usan un [dominio de documentación de IANA](https://www.iana.org/help/example-domains). Los casos fiscales definitivos deben contrastarse antes de implementar D-07.

## 2. Convenciones y validación transversal — A-06 aprobada

### 2.1 Transporte y tipos

- Rutas relativas a una URL base que se fijará y verificará al preparar el entorno local de A-07; no se añade un prefijo de versión. Peticiones POST y respuestas con `Content-Type: application/json`. GET sin cuerpo.
- Campos `snake_case`. Identificadores de recursos como enteros positivos, entre 1 y 9007199254740991 para conservar exactitud con Number en Angular. En rutas y query, usar dígitos decimales; en JSON, números enteros.
- Validación JSON estricta de enteros: no convertir `true`, `"1"`, `1.0` o `1.5` en un entero admitido. Rechazar null en campos requeridos. Las cadenas no aceptan valores numéricos por coerción.
- Esquemas Pydantic de entrada con `extra="forbid"`: cualquier campo JSON no definido devuelve 422 `validation_error`, con detalle `unknown_field`. En simulaciones solo se admiten `customer_id`, `active_users`, `storage_gb` y `api_calls`; importes, tasa, moneda, país o plan enviados por Angular provocan rechazo. Nunca se utilizan esos importes para calcular. Esta decisión A-06 concreta la validación HTTP, sin modificar el motor aprobado ni D-05 como fuente de verdad del backend. Un JSON sintácticamente inválido sigue siendo un error. [Referencia Pydantic](https://docs.pydantic.dev/latest/api/config/#pydantic.config.ConfigDict.extra).
- Rechazar parámetros query no definidos con 422. A-06 aprueba esta política y los tipos estrictos; deberán configurarse expresamente, sin presuponer los valores predeterminados de FastAPI. [Referencia sobre validación estricta](https://docs.pydantic.dev/latest/concepts/strict_mode/).

### 2.2 Campos de entrada y límites de demostración

| Campo | Base aprobada | Contrato A-06 |
| --- | --- | --- |
| `company_name` | Empresa requerida. | Cadena de 1 a 200 caracteres tras quitar espacios exteriores; conservar mayúsculas y acentos para presentación. |
| `tax_identifier` | D-07: cadena normalizada, conservando ceros. | De 1 a 32 caracteres tras trim y mayúsculas; para ES, estructura y control de las familias admitidas. |
| `email` | Correo requerido. | De 3 a 254 caracteres, sintaxis de correo sin nombre de presentación; trim, dominio en minúsculas y parte local conservada. Sin consulta DNS ni envío de correo. |
| `country_code` | País requerido; D-01 define cobertura fiscal. | Dos letras ASCII en mayúsculas tras trim. Es validación sintáctica, sin añadir un catálogo comercial o una validación oficial de residencia. |
| `plan` | D-03: texto obligatorio, sin catálogo ni efecto económico. | Cadena de 1 a 100 caracteres tras trim, no vacía. |
| `customer_id` | Cliente existente. | Entero positivo dentro del rango de identificadores definido. |
| `active_users` | D-09: entero no negativo; cero válido. | Máximo 1000000. |
| `storage_gb` | A-02: GB enteros no negativos, sin fracciones. | Máximo 1000000; no redondear ni truncar fracciones. |
| `api_calls` | D-09: entero no negativo. | Máximo 1000000. |

Las longitudes mantienen formularios y respuestas manejables; se miden en puntos de código Unicode tras normalización; no se admiten caracteres de control en campos de texto. Los máximos aprobados son límites iniciales de demostración, no cuotas comerciales ni límites exigidos por Roams; no proceden de ensayos de carga. api_calls pasa de 1000000000 en v0.2 a 1000000 por el cierre de A-06. Los importes derivados de esos máximos caben en céntimos enteros de SQLite.

Para ES no eliminar separadores internos ni el prefijo `ES`: si alteran las estructuras admitidas, devolver error de formato. K/L/M y formatos históricos se comunican como no soportados. Para otros países, aplicar controles básicos de longitud y caracteres: letras ASCII, dígitos, espacios internos y `-./`, sin afirmar validez fiscal oficial. Esta normalización está aprobada en A-06; el contraste de algoritmos y casos fiscales de D-07 sigue pendiente antes de implementar.

Orden de validación: validar estructura/tipos, normalizar y aplicar reglas de dominio; después comprobar existencia del cliente y política fiscal cuando corresponda. La unicidad se exige también en la base de datos. Una petición puede fallar primero por estructura aunque además referencie un cliente inexistente.

### 2.3 Colecciones, búsqueda y paginación

`limit=20` por defecto, entero de 1 a 100; `offset=0`, entero no negativo dentro del rango seguro anterior. Veinte elementos iniciales y un máximo de cien acotan cada respuesta sin añadir cursores. Aplicar filtros antes de paginar. Respuesta uniforme: `items`, `limit`, `offset`, `total_count`; este último cuenta coincidencias, no importes. Un offset posterior al final devuelve `items: []`, conservando `total_count`.

Para clientes, orden `id` ascendente. `q` es opcional, de hasta 200 caracteres tras trim; ausente o vacío lista clientes paginados. Buscar mediante OR entre coincidencia parcial del nombre y coincidencia exacta del identificador normalizado, devolviendo cada cliente una sola vez. No hacer búsqueda parcial de identificadores ni exigir un control fiscal válido a `q`, pues también puede ser un nombre.

SQLite `NOCASE` solo pliega letras ASCII; no proporciona casefold Unicode completo. No basta para la búsqueda Unicode aprobada. [Referencia SQLite](https://www.sqlite.org/datatype3.html).

Usar la función escalar SQLite `unicode_casefold`, basada en `str.casefold` de Python y registrada en cada conexión, y búsqueda de subcadena con `instr` sobre el nombre y `q` normalizados. Conservar `company_name` original para presentación, sin eliminar acentos. Aplicar el mismo filtro antes de contar y paginar. La estrategia aprobada en A-06/A-07 evita ampliar el esquema, pero puede escanear filas; deberá revisarse si aumenta el volumen. No se ha medido su rendimiento. [Python: casefold](https://docs.python.org/3/library/stdtypes.html#str.casefold), [funciones SQLite desde Python](https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.create_function) y [SQLite: instr](https://www.sqlite.org/lang_corefunc.html#instr).

Con `instr`, `%` y `_` son caracteres literales. Pasar `q` como parámetro enlazado, sin interpolarlo ni convertirlo en un patrón LIKE o regex.

No añadir una columna de búsqueda en el alcance inicial. Una columna normalizada evitaría repetir casefold, pero duplicaría datos y requeriría sincronización y evolución del esquema; un índice ordinario no garantiza acelerar subcadenas. Solo se reconsiderará mediante una decisión posterior si el volumen lo justifica. Esta documentación no crea consultas ni cambia el esquema.

Usar la normalización de D-07 para la rama de identificador. Un mismo identificador en países diferentes puede producir varios clientes.

Para el historial, orden `created_at` descendente y después `id` descendente. La paginación por offset es sencilla para este alcance, pero no garantiza páginas estables entre peticiones si aparecen nuevos registros. No se añaden cursores en este contrato.

## 3. Representaciones y precisión

| Campo de respuesta | Representación |
| --- | --- |
| `id`, `customer_id` | Enteros JSON; `id` identifica el recurso devuelto y `customer_id` referencia al cliente de una simulación. |
| `tax_identifier` | Cadena canónica; corresponde a `tax_identifier_normalized` en el modelo lógico. |
| `country_code`, `plan` | Valores actuales en cliente; copia original utilizada para el cálculo en una simulación histórica. |
| `active_users`, `storage_gb`, `api_calls` | Enteros JSON, mismos nombres y unidades que en la entrada. |
| `base_amount`, `tax_amount`, `total_amount` | Cadenas decimales exactas no negativas, con punto y dos decimales, sin separadores de miles: `140.00`. |
| `tax_rate` | Cadena decimal exacta expresada como fracción: `0.21` significa 21 %. Corresponde a `tax_rate_applied` del modelo lógico; no es un importe ni se le impone el formato monetario de dos decimales. |
| `currency` | EUR; no admite selección de divisa en estos endpoints. La conversión visual pertenece a A-04. |
| `created_at` | Fecha UTC ISO 8601 con precisión de segundos y sufijo Z, por ejemplo `2026-11-12T12:00:00Z`. Codificación física por concretar al implementar A-07. |

D-10 fija Decimal y ROUND_HALF_UP: calcular impuesto, redondearlo a céntimos y sumar base más impuesto redondeado. `base_amount`, `tax_amount` y `total_amount` se conservan como céntimos enteros en SQLite y se serializan como cadenas; no pasan por float. La tasa aplicada se guarda con precisión decimal exacta. No se recalculan históricos al leerlos.

La respuesta de preview contiene el desglose y el contexto validado; la simulación guardada añade `id` y `created_at`. No se asigna a una previsualización un ID o una fecha de persistencia ficticios. País y plan se obtienen del cliente en backend, no de campos extra enviados por Angular.

## 4. Esquema común de errores — A-06 aprobada

```json
{
  "error": {
    "code": "validation_error",
    "message": "La solicitud contiene valores no válidos.",
    "details": [
      {
        "field": "active_users",
        "code": "out_of_range",
        "message": "Debe ser un entero entre 0 y 1000000."
      }
    ]
  }
}
```

`error.code` es estable para el cliente; `message` es texto legible, no una clave que Angular deba interpretar. `details` siempre es un array, vacío si no corresponde un campo; cada detalle incluye `field`, `code` y `message`. Los campos indican entrada o contexto afectado; no se devuelven valores fiscales/correos recibidos, trazas, SQL ni mensajes internos del driver.

| HTTP | `error.code` | Situación |
| --- | --- | --- |
| 400 | `invalid_json` | Cuerpo que no puede interpretarse como JSON. |
| 415 | `unsupported_media_type` | POST con formato de contenido no admitido. |
| 422 | `validation_error` | JSON válido con campos ausentes o adicionales, tipos, longitudes o rangos inválidos; parámetros de ruta/query inválidos. Detalles como `required`, `invalid_type`, `invalid_format`, `out_of_range`, `too_long`, `unknown_field` o `unknown_parameter`. |
| 422 | `invalid_tax_identifier_format` | Estructura española inválida tras normalizar. |
| 422 | `invalid_tax_identifier_checksum` | Estructura reconocida pero control incorrecto. |
| 422 | `unsupported_tax_identifier` | Familia excluida, incluidos K/L/M e históricos. |
| 422 | `tax_policy_not_configured` | Cliente sin política fiscal de cálculo; nunca aplicar 0 % automáticamente. |
| 404 | `customer_not_found` | Identificador válido de cliente que no existe. |
| 409 | `customer_already_exists` | Conflicto país + identificador fiscal normalizado. |
| 500 | `internal_error` | Fallo técnico inesperado, con mensaje genérico y rollback cuando corresponda. |

Para cumplir este esquema, implementar manejadores sencillos en la frontera HTTP: transformar `RequestValidationError` de FastAPI y las respuestas de errores HTTP al sobre `error`, sin jerarquías adicionales de excepciones. Mapear `extra_forbidden` de Pydantic a `validation_error` con detalle `unknown_field`; conservar los códigos HTTP de la tabla. No reenviar los errores originales, `input`, `ctx`, cuerpos ni mensajes internos: construir códigos y mensajes controlados y campos seguros (usar `body` para nombres adicionales no confiables). Un fallo inesperado devuelve 500 genérico, sin trazas ni datos sensibles. [Referencia FastAPI](https://fastapi.tiangolo.com/tutorial/handling-errors/#override-request-validation-exceptions).

El esquema unificado y los códigos están aprobados en A-06; no describen respuestas ya implementadas ni valores predeterminados del framework. Referencia de semántica HTTP: [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html). Los errores externos de divisas no forman parte de este esquema REST mientras A-04 sea acceso directo.

## 5. POST /customers

**Objetivo y relación:** registrar el cliente requerido por RF-01; D-03, D-07, D-09 y A-01/A-02. Sin parámetros de ruta o query. Los cinco campos del cuerpo son obligatorios y siguen la sección 2.

**Petición ilustrativa:**

```json
{
  "company_name": "Empresa Ficticia Alfa",
  "tax_identifier": " 00000023t ",
  "email": "contacto@example.com",
  "country_code": "es",
  "plan": "Texto de plan de prueba"
}
```

**Respuesta: 201 Created**, con `Location: /customers/1` y detalle del cliente:

```json
{
  "id": 1,
  "company_name": "Empresa Ficticia Alfa",
  "tax_identifier": "00000023T",
  "email": "contacto@example.com",
  "country_code": "ES",
  "plan": "Texto de plan de prueba"
}
```

**Validaciones:** tipos, campos, longitudes y normalización; rechazar campos adicionales con 422. Para ES, algoritmo de la familia admitida; para otros países, controles básicos. La ausencia de una política fiscal no impide por sí sola registrar el cliente: solo impide calcular. El plan no añade cargos.

**Errores esperados:** 400/415 por transporte; 422 por campos o identificación fiscal; 409 si ya existe la combinación país/identificador normalizado; 500 ante fallo técnico. El correo no es una clave adicional de unicidad.

**Criterios de aceptación futuros:** crear y recuperar los datos normalizados, conservando ceros; repetir país e identificador normalizado devuelve 409 incluso cambiando el correo; el mismo identificador en otro país no entra en conflicto por esa regla. Diferenciar formato, control incorrecto y familia no soportada. Un campo adicional devuelve 422 y no crea el cliente. Un fallo no deja un alta parcial.

## 6. GET /customers?q=...

**Objetivo y relación:** búsqueda del dashboard de RF-04 y D-04. Parámetros query opcionales `q`, `limit`, `offset`, con semántica de la sección 2. Sin cuerpo JSON. Ejemplo: `/customers?q=Ficticia&limit=20&offset=0`.

**Respuesta: 200 OK**, con resumen de clientes; el correo y el plan se obtienen mediante el detalle:

```json
{
  "items": [
    {
      "id": 1,
      "company_name": "Empresa Ficticia Alfa",
      "tax_identifier": "00000023T",
      "country_code": "ES"
    }
  ],
  "limit": 20,
  "offset": 0,
  "total_count": 1
}
```

**Validaciones y errores:** q sin caracteres de control y dentro del máximo definido; limit/offset válidos y ningún parámetro desconocido. 422 `validation_error` por query inválida; 500 `internal_error` por fallo técnico.

**Criterios de aceptación futuros:** búsqueda parcial por nombre, exacta por identificador normalizado y sin duplicar coincidencias; un fragmento fiscal no basta por sí solo. Sin resultados: 200 con `items: []` y `total_count: 0`, no 404. Query vacío lista resultados acotados; offset fuera del resultado devuelve lista vacía. Comprobar orden y límites; búsquedas `ÁBACO`/`ábaco` y `STRASSE`/`Straße`, conservación del nombre original y coincidencias literales de `%` y `_`, con conteo y paginación coherentes.

## 7. GET /customers/{customer_id}

**Objetivo y relación:** detalle para las tarjetas responsive de RF-04 y D-04. `customer_id` de ruta es entero positivo; sin query ni cuerpo JSON. Ejemplo: `/customers/1`.

**Respuesta: 200 OK:**

```json
{
  "id": 1,
  "company_name": "Empresa Ficticia Alfa",
  "tax_identifier": "00000023T",
  "email": "contacto@example.com",
  "country_code": "ES",
  "plan": "Texto de plan de prueba"
}
```

**Validaciones y errores:** 422 por ID mal formado o fuera del rango definido; 404 `customer_not_found` si no existe; 500 ante fallo técnico. La consulta no calcula precios ni consulta divisas.

**Criterios de aceptación futuros:** devolver los campos necesarios para la tarjeta; conservar el identificador como cadena; diferenciar ID inexistente de ID inválido. No alterar el cliente al consultarlo.

## 8. GET /customers/{customer_id}/simulations

**Objetivo y relación:** historial persistido de RF-02/RF-04, D-04, D-06, D-10 y A-02. `customer_id` en ruta; query opcional `limit` y `offset`. Sin cuerpo JSON. Ejemplo: `/customers/1/simulations?limit=20&offset=0`.

**Respuesta: 200 OK:**

```json
{
  "items": [
    {
      "id": 101,
      "customer_id": 1,
      "active_users": 15,
      "storage_gb": 100,
      "api_calls": 1000,
      "country_code": "ES",
      "plan": "Texto de plan de prueba",
      "base_amount": "140.00",
      "tax_rate": "0.21",
      "tax_amount": "29.40",
      "total_amount": "169.40",
      "currency": "EUR",
      "created_at": "2026-11-12T12:00:00Z"
    }
  ],
  "limit": 20,
  "offset": 0,
  "total_count": 1
}
```

País, plan, consumos, tasa, importes, moneda y fecha son los guardados originalmente. El total del sobre cuenta simulaciones de ese cliente; no suma dinero. El orden es fecha descendente e ID descendente, según la paginación aprobada.

**Validaciones y errores:** 422 por ruta/query inválidos; 404 si el cliente no existe, aunque no haya simulaciones; 500 ante fallo técnico. Cliente existente sin historial: 200 con `items: []` y `total_count: 0`.

**Criterios de aceptación futuros:** no devolver registros de otros clientes; conservar orden y paginación; recuperar tras reiniciar; una política fiscal actual distinta no cambia tasas ni importes del registro original. No invocar el motor ni la API de divisas al consultar.

## 9. POST /simulations/preview

**Objetivo y relación:** proyección interactiva de RF-03/RF-05, D-01/D-02/D-03/D-05/D-09/D-10 y A-01/A-02/A-03/A-05. Sin ruta/query adicionales; cuatro campos de entrada obligatorios.

**Petición ilustrativa:**

```json
{
  "customer_id": 1,
  "active_users": 15,
  "storage_gb": 100,
  "api_calls": 1000
}
```

**Respuesta: 200 OK:**

```json
{
  "customer_id": 1,
  "active_users": 15,
  "storage_gb": 100,
  "api_calls": 1000,
  "country_code": "ES",
  "plan": "Texto de plan de prueba",
  "base_amount": "140.00",
  "tax_rate": "0.21",
  "tax_amount": "29.40",
  "total_amount": "169.40",
  "currency": "EUR"
}
```

**Validaciones:** enteros, no negativos y máximos definidos; cliente existente y política fiscal configurada. storage_gb fraccionario se rechaza sin redondear. Rechazar campos extra, incluidos importes, con 422 antes de llamar al motor. El backend lee país y plan del cliente e invoca el servicio de dominio común. No se añaden cargos por GB, llamadas o plan.

**Errores esperados:** 400/415 por transporte; 422 por entrada inválida o `tax_policy_not_configured`; 404 si el cliente no existe; 500 ante fallo técnico. Elegir USD/GBP en la interfaz no cambia el país fiscal ni la respuesta EUR.

**Criterios de aceptación futuros:** obtener base 140.00, impuesto 29.40 y total 169.40 para el ejemplo ES; cero usuarios devuelve base e importes cero para la política definida. Verificar que el número de registros no aumenta y no hay ID/fecha de persistencia; un cuerpo con campos adicionales, incluidos importes, devuelve 422 sin ejecutar el cálculo. Comprobar la acumulación y las fronteras de 0, 1, 10, 11, 50 y 51 usuarios conforme a RF-03. Un país sin política falla explícitamente.

## 10. POST /simulations

**Objetivo y relación:** guardado explícito de RF-02, D-05/D-06/D-10 y A-01/A-02/A-03/A-05, con las mismas reglas de consumo y fiscalidad que preview. Sin ruta/query adicionales; mismo cuerpo de entrada.

**Petición ilustrativa:**

```json
{
  "customer_id": 1,
  "active_users": 15,
  "storage_gb": 100,
  "api_calls": 1000
}
```

**Respuesta: 201 Created:**

```json
{
  "id": 101,
  "customer_id": 1,
  "active_users": 15,
  "storage_gb": 100,
  "api_calls": 1000,
  "country_code": "ES",
  "plan": "Texto de plan de prueba",
  "base_amount": "140.00",
  "tax_rate": "0.21",
  "tax_amount": "29.40",
  "total_amount": "169.40",
  "currency": "EUR",
  "created_at": "2026-11-12T12:00:00Z"
}
```

No se incluye Location hacia un recurso individual no definido: esta versión no añade `GET /simulations/{id}`. El ID devuelto permite identificar el registro dentro del historial.

**Validaciones y proceso:** aplicar las mismas validaciones de preview; rechazar con 422 campos adicionales, incluidos importes, antes de calcular o escribir. Volver a cargar el contexto y calcular en backend con el mismo servicio de dominio. Guardar consumos y copia del resultado original, incluyendo tasa, EUR y fecha UTC, dentro de una transacción controlada; devolver éxito solo tras confirmar.

**Errores esperados:** 400/415 por transporte; 422 por validaciones o país sin política; 404 por cliente inexistente; 500 ante fallo técnico. No se deduplica por consumos ni se emite 409 por repetir una simulación válida.

**Criterios de aceptación futuros:** mismo desglose que preview con iguales entradas y reglas; cualquier campo adicional, incluidos importes, devuelve 422 y no crea registros. Una fracción de GB o país sin política no crea registros. Guardar y recuperar el mismo resultado y tasa; un fallo revierte la escritura. Si cambia la política entre preview y guardado, prevalece el resultado recalculado que se guarda.

POST no ofrece idempotencia en este contrato: repetir la solicitud puede crear otro registro. A-03 previene dobles envíos mientras se guarda; ante una respuesta incierta, no asumir que falló ni reintentar automáticamente, sino consultar el historial.

## 11. Decisiones aprobadas y verificaciones pendientes

**A-06 está aprobada.** Se conservan las seis rutas y sus criterios futuros, con entradas estrictas, rechazo de campos extra, límites de demostración, paginación, códigos y sobre común de errores. La búsqueda inicial usa unicode_casefold por conexión e instr, sin columna adicional.

**A-07 está aprobada como enfoque de ejecución local.** Queda por verificar y registrar las versiones concretas de Python, Angular y dependencias y fijarlas al implementar. Configurar variables de entorno y ejemplo sin secretos; ruta SQLite estable, comando explícito de inicialización SQLAlchemy, claves foráneas y función Unicode por conexión, sesión síncrona por petición y transacciones controladas. No crear tablas por petición. Alembic no es obligatorio inicialmente; los cambios de esquema exigirán estrategia de migración.

Preparar CORS del backend para orígenes locales concretos y configurables, sin `*` con credenciales. Documentar y verificar realmente instalación, arranque y pruebas de ambos componentes en README, priorizando Windows/VS Code y comandos multiplataforma sencillos. URL base, comandos exactos y codificaciones físicas no fijadas se concretarán durante la implementación; este documento no acredita esas ejecuciones.

Antes de implementar identificadores, contrastar algoritmos y casos de D-07. Preparar pruebas de contrato, dominio e integración para los criterios descritos, incluidas fronteras, claves foráneas por conexión y ausencia de escrituras en preview. No se han implementado endpoints ni ejecutado esas pruebas; los JSON no son respuestas reales.

CORS real de ExchangeRate-API desde Angular se comprobará en la integración del frontend; no está verificado. Mecanismo decimal y redondeo visual, incluidos posibles descuadres entre partidas convertidas, siguen pendientes antes de implementar divisas. EUR original permanece intacto.

Usar datos ficticios, evitar identificadores fiscales/correos/cuerpos completos y `q` en logs innecesarios. El alcance sigue siendo local sin autenticación/autorización; un despliegue público requiere resolverlas fuera de este alcance. Este cierre no crea código, dependencias, tablas, scripts ni migraciones; la sincronización documental queda para revisión humana antes de continuar con el primer PR.
