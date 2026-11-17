# SaaS-O-Matic

Prueba técnica Full-Stack AI-Augmented — herramienta interna de simulación de suscripciones SaaS.

> **Estado actual:** motor de facturación y seis endpoints REST con SQLite implementados. Angular permite buscar, paginar y registrar clientes, previsualizar y guardar simulaciones en EUR, consultar su historial original y visualizar equivalencias orientativas en USD/GBP mediante ExchangeRate-API.

## Stack aprobado
- Frontend: Angular + TypeScript
- Backend: Python + FastAPI + SQLAlchemy
- Base de datos: SQLite
- Desarrollo asistido por IA: Codex

## Requisitos y diseño
- Alcance resumido: [`ai-workspace/00-project-scope.md`](ai-workspace/00-project-scope.md)
- Especificación inicial: [`ai-workspace/01-requirements.md`](ai-workspace/01-requirements.md)
- Instrucciones para Codex: [`AGENTS.md`](AGENTS.md)
- Bitácora de IA: [`ai-workspace/05-ai-development-log.md`](ai-workspace/05-ai-development-log.md)
- Evidencias de desarrollo asistido por IA: [índice, prompts originales y revisión humana](ai-workspace/evidence/README.md)
- Dirección visual de Angular: [`ai-workspace/04-frontend-design.md`](ai-workspace/04-frontend-design.md)

## Ejecución local

Comandos desde la raíz del repositorio, en PowerShell. Entorno comprobado: Python **3.13.17**, FastAPI **0.162.7**, Pydantic **2.14.3**, SQLAlchemy **2.0.57**, Uvicorn **0.54.0** y pytest **8.4.2**. Las dependencias directas y transitivas están fijadas en `backend/requirements.txt` y `backend/requirements-dev.txt`.

Si todavía no existe `backend/venv`, créalo con Python 3.13; no sobrescribas un entorno existente:

```powershell
py -3.13 -m venv backend/venv
```

Instala las dependencias en ese entorno e inicializa explícitamente el esquema:

```powershell
.\backend\venv\Scripts\python.exe --version
.\backend\venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\backend\venv\Scripts\python.exe backend/init_db.py
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --no-access-log
```

Para ejecutar sin las herramientas de pruebas basta instalar `backend/requirements.txt`. No hace falta activar el entorno ni cambiar el PATH. `backend/.venv` es el entorno anterior con Python 3.9 y no es el utilizado actualmente.

Por defecto, SQLite se guarda en `backend/data/saas-o-matic.sqlite3`; la ruta no depende del directorio de trabajo. No se crean tablas al arrancar ni al recibir peticiones: ejecuta `backend/init_db.py` antes de usar la API. Si ya tienes la base de clientes del PR #3, repite ese comando para añadir la tabla de simulaciones sin borrar clientes ni registros existentes. No modifica columnas de tablas previas ni migra esquemas incompatibles. La base local, sus archivos auxiliares y ambos entornos están excluidos de Git.

`backend/.env.example` contiene valores de referencia, sin secretos. No se carga automáticamente. Para cambiarlos, define estas variables en la misma consola **antes de inicializar y arrancar**:

```powershell
$env:DATABASE_URL = 'sqlite:///data/saas-o-matic.sqlite3'
$env:CORS_ORIGINS = 'http://localhost:4200'
```

Las rutas SQLite relativas se resuelven desde `backend/`. CORS admite solo los orígenes configurados, sin comodín ni credenciales; el valor inicial permite `http://localhost:4200`. Esto no verifica el CORS de la API externa de divisas.

### Frontend Angular

Entorno comprobado en este equipo: Node **26.13.0**, npm **11.20.0**, Angular **22.2.6**, CLI/build **22.2.7**, TypeScript **6.0.2**, RxJS **7.8.2**, Vitest **5.0.3** y jsdom **30.0.0**. Dependencias directas fijadas en `frontend/package.json` y resolución transitiva en `frontend/package-lock.json`.

Se eligió Angular 22 estable porque está en soporte activo y admite Node `^22.22.3`, `^24.15.0` o `^26.0.0`, TypeScript `>=6.0 <6.1` y RxJS 7.8.2 según la [tabla oficial de compatibilidad](https://angular.dev/reference/versions) y la [política de soporte](https://angular.dev/reference/releases). No se ha instalado Node ni Angular CLI globalmente. Solo se ha probado la combinación concreta indicada arriba.

Con FastAPI arrancado en una consola, abre otra consola PowerShell en la raíz:

```powershell
node --version
npm --version
npm --prefix frontend ci --no-fund
npm --prefix frontend start
```

Abre [Angular](http://localhost:4200/) y mantén FastAPI en [http://127.0.0.1:8000](http://127.0.0.1:8000). `npm start` usa el origen `http://localhost:4200`, permitido por el CORS inicial. Si cambias el origen del navegador, configura `CORS_ORIGINS` en la consola del backend antes de arrancarlo. Detén cada servidor con Ctrl+C en su consola.

La URL del backend se configura en `frontend/public/config.js`, mediante `apiBaseUrl`, por defecto `http://127.0.0.1:8000`. Es configuración pública, sin secretos; se carga antes de Angular. No necesita recompilar: tras cambiarla, recarga el navegador. En un compilado ya generado cambia su copia `frontend/dist/saas-o-matic/browser/config.js` o vuelve a compilar.

Flujo disponible:

- `/customers`: lista real, búsqueda parcial por empresa o exacta por identificador completo, debounce de 300 ms, cancelación inmediata de consultas antiguas y paginación de 20 elementos. La URL conserva `q` y `offset` para el regreso y la navegación del navegador.
- `/customers/new`: alta con empresa, país ES/FR/DE, identificador fiscal, correo y plan de texto. La API determina la validez fiscal definitiva. Solo un 201 confirma la creación y abre la ficha; los errores conservan el formulario. Se mantiene el contexto del directorio al volver.
- `/customers/:customer_id`: tarjetas de empresa y plan actual, simulador mensual e historial paginado con consumos, base, impuesto, total EUR, tasa, país y plan originales. Las fechas indican UTC y las cadenas decimales del servidor se muestran sin pasar por `Number`.
- El simulador admite enteros de 0 a 1000000 en sus tres campos. El deslizador ajusta usuarios entre 0 y 1000; escribir más conserva el número y muestra un aviso. Mover después el deslizador elige un valor dentro de su rango. GB, llamadas y plan son contexto, sin cargos añadidos.
- Cada edición retira inmediatamente la preview anterior y cancela la consulta vigente, también si la entrada es inválida. Se espera 300 ms antes de consultar el nuevo cálculo. Guardar exige una preview vigente; el resultado de un 201 sustituye al anterior y el historial vuelve a su primera página. No hay reintentos automáticos de escrituras.
- Estados de carga, directorio vacío, búsqueda sin coincidencias, cliente inexistente, historial vacío, validación, conflicto de alta, país sin política fiscal, fallo HTTP/red y espera agotada a los 10 segundos. El fallo de historial conserva la ficha y el simulador.

No se incluyen datos de demostración en la aplicación. En una base nueva el directorio estará vacío; usa «Nuevo cliente» o los ejemplos ficticios de la API que siguen. La consulta de divisas solo se inicia al elegir USD o GBP.

Recorrido comprobado con ambos servidores locales arrancados:

1. En `/customers`, pulsa **Nuevo cliente**. Completa los cinco campos; para una prueba ficticia puedes usar «Empresa Ficticia Alfa», ES, `00000023T`, `pruebas@example.com` y «Plan de prueba». Si esa combinación país/identificador ya existe, se mostrará el conflicto 409.
2. Pulsa **Crear cliente**. Tras el 201 se abre su ficha. Introduce 15 usuarios, 100 GB y 1000 llamadas; la preview real para ES devolvió `169.40 EUR`, con base `140.00`, impuesto `29.40` y tasa `0.21`.
3. Pulsa **Guardar simulación**. La confirmación utiliza la respuesta persistida, con ID y fecha UTC, y avisa si difiere de la preview. **Ver historial** lleva al encabezado del historial; el registro nuevo aparece en la primera página. Para consultar cero usuarios sin editar, pulsa **Calcular precio**.

Si no se puede confirmar un guardado, puede haberse registrado aunque no llegue la respuesta. **Revisar historial** solo consulta; no repite el POST. Tras revisarlo, **Volver a calcular** permite preparar otra operación que requerirá de nuevo pulsar Guardar. Editar por sí solo no desbloquea un guardado incierto.

### Visualización en EUR, USD y GBP

En la franja inferior del simulador, **Moneda de visualización** permite elegir EUR, USD o GBP. EUR es el valor inicial y funciona sin consultar al proveedor. USD/GBP muestran una equivalencia del total, base e impuesto, junto con la tasa, su fecha UTC, próxima actualización y el enlace **Rates By Exchange Rate API**. El importe original EUR permanece visible; el guardado, la confirmación y el historial conservan el resultado del backend en EUR. Cambiar de moneda no guarda ni recalcula tarifas o impuestos.

Se consulta directamente `https://open.er-api.com/v6/latest/EUR`, sin claves, credenciales ni datos del cliente. Se validan resultado, base, tasas positivas finitas, EUR igual a 1 y fechas coherentes y vigentes, dentro de una ventana máxima de 48 horas para este proveedor diario. El servicio comparte una petición en curso y una caché en memoria hasta `time_next_update_unix`. Slider, cambios de moneda y navegación interna reutilizan esa caché; recargar la página la pierde. No se usa localStorage. Al vencer la tasa se retira la equivalencia mientras se consulta otra; un fallo no reutiliza tasas vencidas y ofrece **Reintentar divisas**, manteniendo EUR. La espera se limita a diez segundos; un 429 se explica sin reintentos automáticos.

Las cadenas monetarias EUR se convierten mediante aritmética decimal de enteros `BigInt`, con redondeo `ROUND_HALF_UP` a dos decimales solo para presentación. Nunca pasan por `Number`. Las tasas numéricas JSON se fijan como texto decimal antes de multiplicar; su precisión queda limitada a la que se recibe del proveedor y del parser JSON. Base, impuesto y total se convierten por separado: la suma del desglose redondeado puede diferir del total convertido. Son referencias orientativas, no tipos garantizados para transacciones. [Documentación del proveedor](https://www.exchangerate-api.com/docs/free), [condiciones y límites de exactitud](https://www.exchangerate-api.com/terms).

Consulta real comprobada desde `http://localhost:4200` el 15/11/2026: HTTP 200 y respuesta accesible por CORS. Con la tasa efectiva del 15/11/2026 a las 00:02:32 UTC, el total ficticio `169.40 EUR` se mostró como `186.98 USD` (`1.103776`) y `141.42 GBP` (`0.834849`). Son valores observados en esa ejecución, no constantes de la aplicación. Se comprobó guardar desde USD y recuperar el original EUR. Escritorio 1440×1000 y móvil 375×812 / 320×700 sin desbordamiento en las mediciones realizadas. Fallos externos, timeout, 429 y caducidad se verificaron con respuestas simuladas en tests, sin provocar esos fallos en el proveedor real.

Build de producción y pruebas Angular, también desde la raíz:

```powershell
npm --prefix frontend run build
npm --prefix frontend test
```

El compilado está en `frontend/dist/saas-o-matic/browser`. Los tests usan el runner oficial Angular/Vitest con jsdom y `HttpTestingController`; no requieren arrancar FastAPI.

En el Prompt #31 pasaron el build de producción sin avisos y **118 pruebas en 12 archivos** (incluidas las 73 anteriores). No se añadieron dependencias ni se modificó el backend. Verificaciones, capturas locales ignoradas e incidencias en la entrada 15 de la bitácora.

La instalación desde el lockfile se verificó en la entrega inicial. En el Prompt #30 se ejecutaron build de producción y 73 pruebas Angular en 9 archivos, todas correctas. Se comprobó alta → ficha → preview → guardado → historial con FastAPI real sobre SQLite aislado y datos ficticios, escritorio 1440 × 1000, móvil 375 × 812 / 320 × 700 y anchura de tablet 768 × 1024. Se revisaron teclado, foco, límites, validación fiscal, conflicto, paginación y caída/recuperación de la API. No equivale a una auditoría de accesibilidad ni a una instalación en otro equipo. Comandos, resultados e incidencias se registran en la [bitácora](ai-workspace/05-ai-development-log.md).

### Comprobación manual de la API

Con el servidor arrancado, en otra consola PowerShell:

```powershell
$base = 'http://127.0.0.1:8000'
$body = @{
    company_name = 'Empresa Ficticia Alfa'
    tax_identifier = ' 00000023t '
    email = 'Pruebas@EXAMPLE.COM'
    country_code = 'es'
    plan = 'Plan de prueba'
} | ConvertTo-Json

$response = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/customers" -ContentType 'application/json' -Body $body
$response.StatusCode
$response.Headers['Location']
$customer = $response.Content | ConvertFrom-Json
$customer

Invoke-RestMethod -Uri "$base/customers?q=Ficticia&limit=20&offset=0"
Invoke-RestMethod -Uri "$base/customers?q=00000023t"
Invoke-RestMethod -Uri "$base/customers/$($customer.id)"
```

El alta devuelve 201 y `Location`; las consultas, 200. El identificador se conserva como `00000023T`, el país como `ES` y el correo como `Pruebas@example.com`. Repetir país e identificador devuelve 409, aunque cambie el correo. Son datos construidos para pruebas; no acreditan identidad real.

Las rutas de clientes son `POST /customers`, `GET /customers` y `GET /customers/{customer_id}`. Junto con las tres operaciones de simulaciones completan los seis contratos REST. La documentación de desarrollo está en [Swagger UI](http://127.0.0.1:8000/docs). La búsqueda usa casefold Unicode e `instr`: conserva acentos y trata `%` y `_` literalmente. Los identificadores se buscan completos, sin exigir que `q` supere su control fiscal.

### Simulaciones e historial

En la misma consola, utiliza el cliente recién creado:

```powershell
$inputs = @{
    customer_id = $customer.id
    active_users = 15
    storage_gb = 100
    api_calls = 1000
} | ConvertTo-Json

$preview = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/simulations/preview" -ContentType 'application/json' -Body $inputs
$preview.StatusCode
$preview.Content | ConvertFrom-Json

$saved = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/simulations" -ContentType 'application/json' -Body $inputs
$saved.StatusCode
$saved.Content | ConvertFrom-Json

Invoke-RestMethod -Uri "$base/customers/$($customer.id)/simulations?limit=20&offset=0"
```

Ejemplos reales de una ejecución con Uvicorn y PowerShell sobre una base temporal y datos ficticios. Los identificadores y fechas variarán en cada base. Ambos POST recibieron este cuerpo:

```json
{"customer_id":1,"active_users":15,"storage_gb":100,"api_calls":1000}
```

`POST /simulations/preview` → 200. Calcula sin escribir y no devuelve identificador ni fecha de simulación:

```json
{"customer_id":1,"active_users":15,"storage_gb":100,"api_calls":1000,"country_code":"ES","plan":"Plan de prueba","base_amount":"140.00","tax_rate":"0.21","tax_amount":"29.40","total_amount":"169.40","currency":"EUR"}
```

`POST /simulations` → 201. Vuelve a consultar el cliente y a calcular antes de confirmar la escritura:

```json
{"customer_id":1,"active_users":15,"storage_gb":100,"api_calls":1000,"country_code":"ES","plan":"Plan de prueba","base_amount":"140.00","tax_rate":"0.21","tax_amount":"29.40","total_amount":"169.40","currency":"EUR","id":1,"created_at":"2026-11-14T11:56:40Z"}
```

`GET /customers/1/simulations?limit=20&offset=0` → 200:

```json
{"items":[{"customer_id":1,"active_users":15,"storage_gb":100,"api_calls":1000,"country_code":"ES","plan":"Plan de prueba","base_amount":"140.00","tax_rate":"0.21","tax_amount":"29.40","total_amount":"169.40","currency":"EUR","id":1,"created_at":"2026-11-14T11:56:40Z"}],"limit":20,"offset":0,"total_count":1}
```

Los cuatro campos de entrada son enteros JSON estrictos: `customer_id` entre 1 y 9007199254740991; los consumos entre 0 y 1000000. Cero usuarios es válido. Se rechazan campos adicionales con 422, incluidos importes, país, plan, tasa y moneda. País y plan proceden del cliente almacenado. Un cliente inexistente devuelve 404; un país sin política fiscal devuelve 422 `tax_policy_not_configured`, también con cero usuarios. Almacenamiento, llamadas API y plan se conservan sin añadir cargos no definidos en el enunciado.

Preview y guardado usan el mismo motor de dominio con `Decimal`. SQLite conserva dinero en céntimos INTEGER, la tasa como texto decimal exacto y la fecha como texto UTC ISO 8601 con segundos y `Z`. El historial devuelve las entradas y el resultado guardados, sin recalcular ni consultar divisas; ordena por fecha e identificador descendentes y filtra por cliente antes de contar y paginar. La FK impide borrar un cliente con simulaciones; no hay cascada destructiva.

Cada POST de guardado válido crea una fila, incluso si se repite el cuerpo. Ante un resultado incierto, consulta el historial; no reintentes automáticamente. No se devuelve `Location` ni existe `GET /simulations/{id}`.

### Pruebas y verificaciones

```powershell
.\backend\venv\Scripts\python.exe -B -m pytest -p no:cacheprovider -c backend/pyproject.toml backend/tests
.\backend\venv\Scripts\python.exe -m pip check
```

Las pruebas de API usan una base temporal distinta por caso. Se comprobaron instalación en `backend/venv`, inicialización explícita, reconexión y arranque real con Uvicorn en un puerto local temporal, usando otra base de verificación ignorada. No se ha verificado una instalación desde cero en otro equipo. El recuento y resultado de la suite se registran en la [bitácora](ai-workspace/05-ai-development-log.md).

Starlette 1.10.0 avisa de que su integración con `httpx` está deprecada y recomienda `httpx2`. Las pruebas usan `httpx` 0.28.1 y TestClient conforme al alcance; el aviso no se oculta.

## Validación fiscal y límites

Para ES se admiten DNI de ocho dígitos más letra, NIE X/Y/Z de siete dígitos más letra y NIF de entidad de nueve caracteres. Se aplica trim exterior y mayúsculas, conservando ceros; se rechazan separadores internos y prefijo `ES`. Formato, control incorrecto y familias excluidas producen errores distintos.

| Familia de entidad | Control aplicado |
| --- | --- |
| A B C D E F G H J U V | Dígito calculado, de 0 a 9 |
| N P Q R S W | Letra calculada de la tabla JABCDEFGHI |

Fuentes contrastadas antes de implementar:

- [Interior: cálculo DNI/NIE](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/): módulo 23 y sustitución X/Y/Z por 0/1/2.
- [AEAT: composición del NIF de entidades](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html) y [Orden EHA/451/2008, artículos 2–5](https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580): estructura y claves; no desarrollan toda la aritmética del control.
- [Nota técnica AEAT D.I.T. de 2008, copia alojada por CAIB](https://www.caib.es/sites/civitasmanualsisuport/f/41519), páginas 4–6: distinción entre control numérico y alfabético de la tabla anterior. Se sigue esa clasificación, sin aceptar indistintamente ambos controles como hacen otros validadores.
- [SEPE: modelo de datos de teleformación, 2019](https://sepe.es/dam/jcr:cac68020-93da-4153-b0dc-4864f007b696/Modelo-Datos-para-SEGUIMIENTO-acciones-formativas-en-TELEFORMACION_20191129.pdf), página 21: contraste de sumas pares, duplicación y suma de cifras impares y complemento módulo 10. La correspondencia alfabética se contrastó también con la [implementación original de python-stdnum](https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/es/cif.py), sin incorporar esa dependencia ni su política permisiva de tipos de control.

K/L/M e históricos quedan fuera del alcance. Se reconocen como no soportados K/L/M con su estructura, DNI antiguo de ocho cifras sin letra y NIE X con ocho cifras; no se convierten ni se completan documentos. No se comprueban códigos provinciales ni se intenta detectar variantes históricas indistinguibles del formato actual.

La validación es algorítmica: no acredita existencia, titularidad ni vigencia censal. Para otros países solo se comprueban longitud y caracteres ASCII permitidos, sin validación fiscal oficial. Se permite registrar países sin política fiscal; se rechazan al previsualizar o guardar simulaciones.

Esta entrega es local y no incorpora autenticación/autorización. Un despliegue público requeriría resolverlas. Usa datos ficticios; el arranque documentado desactiva el log de acceso para no registrar búsquedas ni identificadores en las URL. El motor conserva la política fiscal comercial simplificada; no representa toda la fiscalidad B2B.

## Estrategia Git
`main` estable; ramas por funcionalidad o documentación; integración mediante Pull Requests con revisión humana.
