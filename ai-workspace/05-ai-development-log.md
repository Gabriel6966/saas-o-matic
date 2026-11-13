# Bitácora de desarrollo asistido por IA

Registra interacciones importantes **después de que ocurran**. No inventes evidencias.

## Base de evidencia

Registro redactado el 2026-11-13 y revisado mediante el Prompt #15. Se constata uso de Codex en el contexto aportado al agente; no se acredita que fuera la única herramienta de IA utilizada.

Fuentes diferenciadas: archivos y diffs del repositorio para resultados documentales; decision-log.md para estados y fechas de aprobación registrados; mensajes del responsable y salidas de herramientas visibles en este chat para interacciones. Estas últimas no son una transcripción versionada ni prueban acceso a otra conversación.

Las entradas siguen el orden del trabajo, sin asignar fechas no verificadas a los intercambios anteriores. Se han aportado al agente mensajes de instrucciones/revisión y los archivos locales prompt-12-cierre-a06-a07.md, prompt-13-auditoria-pre-pr.md, prompt-14-correcciones-pre-pr.md, prompt-15-verificacion-evidencias-pre-pr.md y Texto pegado.txt de arquitectura/contratos. Su lectura consta en las salidas de herramientas de este chat y su existencia local se ha comprobado; no están versionados. Para verificar de forma independiente las interacciones, el responsable deberá aportar las transcripciones originales, sus referencias y fechas.

## Entradas contrastadas

### 1. Requisitos y separación de fuentes
- **Objetivo:** contrastar cobertura, ambigüedades y criterios del reto.
- **Uso de IA:** el historial contiene solicitudes de auditoría y revisión de requisitos a Codex; no se conserva aquí el informe inicial íntegro.
- **Revisión/decisión humana:** el responsable corrigió la obligatoriedad de las tarjetas responsive, las divisas iniciales y los entregables, y exigió separar requisitos, propuestas y decisiones pendientes.
- **Evidencia:** archivos: [01-requirements.md](01-requirements.md) y [00-project-scope.md](00-project-scope.md); decisiones: [decision-log.md](decision-log.md); interacción: solicitudes aportadas en el contexto, sin informe inicial íntegro ni transcripción versionada.
- **Resultado:** especificación v0.2 con trazabilidad y criterios futuros; las aprobaciones funcionales constan en [decision-log.md](decision-log.md).
- **Limitación:** informe original y fechas de los intercambios sin archivar; requieren aportación o confirmación del responsable.

### 2. Corrección de la referencia fiscal en AGENTS.md
- **Objetivo:** resolver la indicación de que la política fiscal seguía pendiente pese a D-01.
- **Uso de IA:** los mensajes del responsable aportados al agente refieren la contradicción y autorizan su corrección; no se dispone aquí del informe original íntegro de detección.
- **Revisión/decisión humana:** el responsable autorizó modificar exclusivamente AGENTS.md y conservar las reglas fiscales aprobadas.
- **Evidencia:** archivo/diff: [AGENTS.md](../AGENTS.md) respecto de HEAD; decisión: D-01 en [decision-log.md](decision-log.md); interacción: solicitud de corrección aportada en este chat, pendiente de transcripción versionada.
- **Resultado:** referencia a ES 21 %, FR 20 % y DE 19 %, rechazo de países sin política y registro de decisiones como fuente de estado.
- **Limitación:** fecha original no verificada; los algoritmos y la política documentada no acreditan código o pruebas ejecutados.

### 3. Revisión de arquitectura y contratos REST
- **Objetivo:** definir responsabilidades, persistencia e interfaz Angular/FastAPI antes de implementar.
- **Uso de IA:** el contexto aportado contiene encargos y revisiones a Codex; los archivos y diffs permiten contrastar el resultado documental, sin reconstruir cada intercambio previo como transcripción.
- **Revisión/decisión humana:** el responsable aprobó A-01 a A-05 y pidió mantener A-06/A-07 pendientes durante la revisión de los borradores.
- **Evidencia:** archivos: [02-architecture.md](02-architecture.md) y [03-api-contracts.md](03-api-contracts.md); decisiones: A-01 a A-05 en [decision-log.md](decision-log.md); interacción: mensajes y Texto pegado.txt aportados al agente, no versionados.
- **Resultado:** separación de capas, históricos exactos, preview sin escritura y propuestas explícitas sobre campos extra y búsqueda Unicode, posteriormente resueltas en el cierre.
- **Limitación:** fechas de los intercambios iniciales sin verificar; los documentos describen diseño, no implementación.

### 4. Cierre aprobado de A-06 y A-07
- **Objetivo:** registrar condiciones aprobadas y sincronizar arquitectura/contratos.
- **Uso de IA:** Codex detectó que el Prompt #12 exigía aprobación expresa y señaló el cambio del máximo de api_calls; esperó confirmación antes de editar.
- **Revisión/decisión humana:** el mensaje aportado al agente autoriza el cierre. A-06/A-07 constan aprobadas con fecha 2026-11-13 en [decision-log.md](decision-log.md); la fecha se toma del registro y la interacción requiere transcripción original versionada para su comprobación independiente.
- **Evidencia:** archivos/diffs de arquitectura y contratos; decisión: A-06/A-07 en decision-log.md; interacción: mensaje de autorización visible en el contexto y prompt-12-cierre-a06-a07.md leído como archivo local, ambos sin transcripción/adjunto versionados.
- **Resultado:** arquitectura v0.4 y contratos v0.3; api_calls máximo 1000000, unicode_casefold por conexión sin columna adicional e inicialización SQLite explícita. Se conservaron las decisiones anteriores.
- **Limitación:** adjunto no versionado; versiones, arranque, pruebas, CORS real del proveedor y redondeo visual siguen por verificar o concretar.

### 5. Auditoría documental previa al PR
- **Objetivo:** revisar coherencia, cobertura y estado de Git sin editar.
- **Uso de IA:** Codex revisó ocho documentos, las 18 decisiones, seis rutas y diez ejemplos JSON; comprobó la coherencia aritmética de tres ejemplos, sin ejecutar la aplicación.
- **Revisión/decisión humana:** el responsable encargó la auditoría mediante el Prompt #13 y después autorizó las correcciones documentales mediante el Prompt #14.
- **Evidencia:** archivos/diffs del repositorio; decisiones registradas; interacciones: prompts locales #13/#14 y salidas originales de herramientas de la auditoría #13 visibles en este chat, no versionados.
- **Resultado:** en la auditoría #13 se informó listo con observaciones: pendientes obsoletos, stack aún denominado propuesta y bitácora vacía. Sus salidas originales visibles muestran los seis comandos Git con código 0 y solo avisos LF/CRLF, y la comparación de hashes de ocho documentos e índice sin cambios. Son resultados de aquella auditoría, no nuevas ejecuciones del Prompt #15.
- **Limitación:** fueron comprobaciones documentales y de Git, no pruebas de software, seguridad o CORS; los adjuntos y salidas originales requieren archivo o referencia accesible.

### 6. Correcciones documentales del Prompt #14
- **Objetivo:** resolver las tres observaciones sin alterar decisiones ni contratos.
- **Uso de IA:** Codex actualiza referencias de requisitos, instrucciones de stack y este registro con sucesos contrastables.
- **Revisión/decisión humana:** el mensaje aportado al agente encarga ejecutar el Prompt #14; su transcripción no está versionada y la revisión final sigue pendiente.
- **Evidencia:** archivos/diffs: [AGENTS.md](../AGENTS.md), [01-requirements.md](01-requirements.md) y esta bitácora; decisiones: registro sin cambios; interacción: Prompt #14 y mensaje aportado, con salidas de verificación visibles en este chat.
- **Resultado:** referencias a A-02/A-04/A-06/A-07 sincronizadas, stack aprobado y SQLite obligatorio aclarados; se conservan reglas, criterios, numeración y documentos de decisiones/arquitectura/contratos.
- **Limitación:** las salidas del Prompt #14 muestran git diff --check y git diff --cached --check con código 0 y status con seis archivos no preparados. En la revisión #15 se ejecutaron git status --short, git diff HEAD --check y git diff HEAD --stat, todos con código 0; solo hubo avisos LF/CRLF. No son pruebas de aplicación.

Comprobación adicional del Prompt #15: no existe main local ni origin/main; la consulta inicial a origin falló por conexión y la repetición autorizada de git ls-remote terminó con código 0 sin anunciar refs/heads/main. No se completó la comparación contra main; master local se usó solo como referencia informativa y coincide con HEAD. Se revisaron las líneas añadidas del diff disponible para patrones de credenciales y datos personales: sin coincidencias de secretos en los patrones revisados; correos example.com e identificadores declarados sintéticos en los contratos. No se comprobó titularidad fiscal ni se realizó una auditoría de seguridad. No se creó código, pruebas, despliegue, commit, rama ni PR.

### 7. Motor puro de facturación — Prompt #19
- **Objetivo:** implementar solo el cálculo acumulativo y la política fiscal simplificada, con pruebas de dominio.
- **Uso de IA:** Codex creó módulos de precio, impuestos, dinero y cotización en backend/app/domain, resultado inmutable y pruebas parametrizadas. No implementó HTTP, persistencia, frontend ni validadores fiscales.
- **Revisión/decisión humana:** el Prompt #19 autoriza este alcance en feature/billing-engine. El responsable indicó que no conoce un intérprete válido y prohibió instalar Python o modificar la configuración del sistema; la implementación final y el commit siguen pendientes de revisión.
- **Evidencia:** [dominio](../backend/app/domain/quotation.py), [pruebas](../backend/tests/unit/test_quotation.py), [configuración](../backend/pyproject.toml), [dependencia de pruebas](../backend/requirements-dev.txt) y salidas de herramientas de este chat. El adjunto local prompt-19-motor-facturacion-python.md no se ha versionado.
- **Resultado:** se verificó rama correcta y árbol limpio al comenzar. Aunque py no detectaba runtimes, se encontró un Python 3.9.13 ya instalado en AppData/Local/Programs/Python/Python39. Se creó backend/.venv y se instaló allí pytest 8.4.2, sin instalar Python ni paquetes globales. El primer intento de descarga falló por restricciones de red; la descarga autorizada posterior terminó correctamente.
- **Verificación realizada:** desde la raíz, `.\backend\.venv\Scripts\python.exe -m pytest -c backend/pyproject.toml backend/tests` terminó con código 0: `63 passed in 0.22s`. Incluye tramos y máximos, tipos estrictos, países soportados/no configurados, precisión y HALF_UP, resultado inmutable y ejecución aislada sin imports de red, DB o frameworks. `python -m pip check` del entorno local informó `No broken requirements found`.
- **Limitación de aquella ejecución:** solo se había probado este núcleo en Python 3.9.13/pytest 8.4.2 y quedaba pendiente repetir la suite en una versión soportada. La validación posterior con el entorno actual se recoge en la entrada 8. La política fiscal sigue siendo comercial y simplificada. No se crearon API, tablas, migraciones, commit ni PR.

### 8. Validación con Python 3.13 y ajuste documental — Prompts #21–#23
- **Entorno actual:** el Prompt #21 autorizó crear únicamente backend/venv con `py -3.13 -m venv backend/venv` e instalar las dependencias declaradas. Sus salidas verifican Python 3.13.17 y pytest 8.4.2 en ese entorno. backend/.venv, con Python 3.9, se conservó como entorno anterior.
- **Pruebas registradas:** en el Prompt #21 pasaron 63 pruebas antes del nuevo caso y 64 después. El caso añadido usa calculate_quote con una tasa sintética para comprobar medio céntimo, ROUND_HALF_UP y total exacto, sin cambiar las tasas aprobadas. Comando: `.\backend\venv\Scripts\python.exe -B -m pytest -p no:cacheprovider -c backend/pyproject.toml backend/tests`.
- **Revisión posterior:** las salidas del Prompt #22 muestran otra ejecución de 64 pruebas superadas con Python 3.13.17/pytest 8.4.2. La auditoría de Codex informó sin hallazgos P0/P1/P2 y con dos mejoras P3 documentales; no acredita revisión del responsable técnico.
- **Cambios documentados:** el Prompt #21 amplió .gitignore a `.venv*/`, conservando `venv/`. El Prompt #23 actualiza los comandos de pyproject.toml al entorno actual y este registro; mantiene intactos código, pruebas y dependencias.
- **Evidencia y límites:** los resultados anteriores constan en salidas de herramientas de este chat, no archivadas como transcripción en el repositorio. En este ajuste documental no se ha repetido pytest ni se ha verificado de forma independiente el entorno. La revisión humana, el commit y el PR siguen pendientes; API, persistencia y frontend no forman parte del motor entregado.

## Plantilla de entrada

### [Fecha] — [Tarea / rama / PR]
- **Objetivo y contexto:**
- **Herramienta:** Codex / ChatGPT / otra (indicar cuál se usó realmente).
- **Prompt o referencia a prompt:**
- **Propuesta del agente:**
- **Revisión y decisión humana:**
- **Cambios aceptados / rechazados y motivo:**
- **Verificación realizada (comandos y resultados):**
- **Limitaciones / acciones pendientes:**
