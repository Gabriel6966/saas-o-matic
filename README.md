# SaaS-O-Matic

Prueba técnica Full-Stack AI-Augmented — herramienta interna de simulación de suscripciones SaaS.

> **Estado actual:** motor de facturación y API de clientes, previsualización, guardado e historial de simulaciones con SQLite implementados. Angular y la integración de divisas todavía no están implementados.

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

### Comprobación manual

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
