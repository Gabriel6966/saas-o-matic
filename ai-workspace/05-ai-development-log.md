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
