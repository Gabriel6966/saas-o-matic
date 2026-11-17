# Evidencias del desarrollo asistido por IA

Selección documental para Roams, preparada el **2026-11-17** con Codex. Ocho hitos permiten seguir el encargo, las decisiones registradas y el resultado técnico sin reconstruir conversaciones ausentes. El [resumen de revisión humana](human-review.md) es un borrador pendiente de confirmación del responsable.

## Procedencia y límites

- **Originales archivados:** diez archivos aportados como prompts del proyecto y localizados en Downloads del responsable. Se copiaron íntegros, con su nombre, número, codificación y saltos de línea originales. La tabla de integridad permite contrastarlos. No se han redactado datos ni reescrito su contenido.
- **Registro retrospectivo:** la [bitácora](../05-ai-development-log.md), el [diseño](../04-frontend-design.md) y el [registro de decisiones](../decision-log.md) documentan resultados y decisiones humanas. Sus relatos y citas no se convierten aquí en transcripciones originales. Las aportaciones de IA y decisiones humanas de la tabla se atribuyen a esos registros, salvo las instrucciones que pueden leerse en los prompts copiados.
- **Resultado contrastable:** el código, los tests y los commits existen en el repositorio. Su inspección acredita el contenido conservado, no una nueva ejecución ni quién realizó cada acción. Los recuentos de pruebas siguientes son **resultados históricos informados en la bitácora**, sin logs originales archivados en esta selección.
- **Respuestas originales:** no se han localizado archivos de transcripciones o respuestas de Codex aportados por el usuario. No se crea `responses/` ni se copia la bitácora bajo esa etiqueta.
- **Instrucciones históricas:** los prompts de `prompts/` son documentos de evidencia. Sus permisos, ramas y órdenes corresponden a sus encargos originales; no se ejecutan de nuevo al preparar esta selección. Un prompt acredita una instrucción escrita, no por sí solo su ejecución o una aprobación posterior.

Las cabeceras de las especificaciones y los cierres que indican revisión pendiente se conservan como registros de su etapa. Para la implementación integrada se consultan el código y la trazabilidad Git; esta selección no cambia decisiones ni declara resueltas las verificaciones que siguen sin evidencia.

## Ocho hitos seleccionados

| Hito | Problema u objetivo | Aportación de IA | Criterio o decisión humana | Resultado verificable | Fuente concreta | Limitación |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Especificación antes del código | Separar requisitos de Roams, propuestas y decisiones; cerrar A-06/A-07. | Sincronización de requisitos, arquitectura y seis contratos; contradicción fiscal registrada. | D-01–D-11 y A-01–A-07 consignadas como aprobadas; corrección acotada de AGENTS. | Documentos en `dda6461`, anteriores al motor; ES/FR/DE sin tasas inventadas para otros países. | [Prompt #12](prompts/prompt-12-cierre-a06-a07.md); [decisiones](../decision-log.md), D-01/A-06/A-07; [bitácora](../05-ai-development-log.md), entradas 1–6; [AGENTS](../../AGENTS.md). | Informe inicial, detección fiscal y aprobaciones: original pendiente de archivar. El prompt exige aprobación, no la acredita. |
| 2. Motor económico y entorno | Calcular tramos acumulativos y medio céntimo con precisión. | Dominio puro con Decimal y prueba de tasa sintética. | Alcance limitado al motor; validación en Python 3.13 mediante entorno local, conservando el anterior. | `f9fa569` contiene el motor y `test_quote_rounds_half_cent_tax_up_and_adds_integer_cents`; la entrada 8 informa **64 tests** con Python 3.13.17. | [Prompt #19](prompts/prompt-19-motor-facturacion-python.md); [Prompt #21](prompts/prompt-21-validacion-python313-motor.md); [test](../../backend/tests/unit/test_quotation.py); [bitácora](../05-ai-development-log.md), entradas 7–8. | La primera ejecución registrada usó Python 3.9.13. Salidas originales de ambas etapas pendientes de archivar; no se ejecutó pytest ahora. |
| 3. Regresión CORS en HTTP 500 | Un error inesperado no era legible desde el origen Angular permitido. | Reproducción y wrapper CORS exterior a FastAPI; tests de orígenes permitidos y rechazados. | Encargo de corrección mínima, sin relajar CORS ni cambiar dependencias. | `19f422f` conserva el wrapper y la regresión. La entrada 10 registra fallo previo y después **219 tests**, con un aviso de TestClient/httpx. | [Prompt #26](prompts/prompt-26-corregir-cors-500-api-clientes.md); [main.py](../../backend/app/main.py); [test_cors.py](../../backend/tests/integration/test_cors.py), `test_unexpected_error_keeps_json_and_cors_policy`; [bitácora](../05-ai-development-log.md), entrada 10. | Informe original de auditoría #25 y terminal del fallo previo pendientes. Git conserva la solución agrupada con la API, no un commit del estado fallido. |
| 4. Simulaciones e historial | Separar preview sin escritura, guardado atómico e histórico inmutable. | Servicio compartido, transacción, snapshots y pruebas con SQLite aislado. | Exigir recálculo al guardar, EUR persistido y ausencia de reintentos automáticos de POST inciertos. | `f8e6ee8` contiene preview, guardado e historial; la entrada 11 informa **428 tests**. | [Prompt #27](prompts/prompt-27-api-simulaciones-fastapi-sqlite.md); [servicio](../../backend/app/application/simulations.py); [tests de API](../../backend/tests/integration/test_simulations.py), preview/rollback/snapshot; [tests SQLite](../../backend/tests/integration/test_simulation_database.py); [bitácora](../05-ai-development-log.md), entrada 11. | Recuento y respuestas HTTP son históricos. No se repitieron suite ni arranque; el aviso de TestClient permanece documentado. |
| 5. Dirección visual decidida por el responsable | Mejorar jerarquía y legibilidad conservando el producto funcional. | Alternativas y sistema visual con `frontend-design`, según el registro; implementación SCSS posterior. | Editorial B2B premium y después B, Mesa financiera SaaS; B difiere de la recomendación A del agente. | Diseño en `632737f`; el polish incluido en `8365b6e` cambia ocho SCSS y documentos 04/05, sin HTML/TS. La entrada 16 informa **118 tests**. | [Prompt #29B](prompts/prompt-29b-rediseno-premium-angular.md); [Prompt #34](prompts/prompt-34-visual-polish-sin-regresiones.md); [diseño](../04-frontend-design.md), secciones #29B/#34; [bitácora](../05-ai-development-log.md), entradas 13/16. | Elecciones consignadas en documentos; mensajes originales pendientes de archivar. Capturas locales no incluidas. El commit final agrupa #34–#36. |
| 6. Preview reactiva y guardado explícito | Evitar precios obsoletos durante el debounce y dobles envíos. | Invalidación síncrona, debounceTime(300), switchMap, cancelación con takeUntil y revisión de respuestas. | Backend como autoridad del precio; cuatro campos por POST, 201 para confirmar y consulta del historial ante incertidumbre. | `c966a0a` contiene el editor y sus regresiones; la entrada 14 informa **73 tests**. | [Prompt #30 v2](prompts/prompt-30-v2-alta-clientes-simulador-premium.md); [editor](../../frontend/src/app/features/simulations/simulation-editor.component.ts); [tests](../../frontend/src/app/features/simulations/simulation-editor.component.spec.ts), cancelación antes del debounce y guardado incierto; [bitácora](../05-ai-development-log.md), entrada 14. | Pruebas presentes e inspeccionadas, sin nueva ejecución. El guardado no ofrece idempotencia en el contrato. |
| 7. Divisas sin alterar EUR | Presentar USD/GBP con caché, vigencia y precisión decimal. | Servicio aislado y BigInt; validación de tasas/fechas; corrección de esperados de tests contrastados con Decimal. | Endpoint público sin claves, atribución visible y conversión exclusivamente de presentación. | `fbe3df1` contiene caché y conversión; la entrada 15 informa **118 tests** y CORS real observado entonces. | [Prompt #31](prompts/prompt-31-divisas-angular-exchangerate-api.md); [servicio](../../frontend/src/app/core/currency/exchange-rates.service.ts); [BigInt](../../frontend/src/app/core/currency/decimal-money.ts); [tests](../../frontend/src/app/core/currency/decimal-money.spec.ts); [bitácora](../05-ai-development-log.md), entrada 15. | La precisión de la tasa depende del JSON recibido. Fallos externos/caducidad se probaron con fixtures; no se consulta el proveedor ahora. |
| 8. Revisar una conclusión con evidencia humana | El responsable no percibía las microinteracciones anunciadas. | Diagnóstico de CSS servido, selectores y preferencia; conservación del CSS accesible. | Solicitar diagnóstico real y aportar desde Opera GX movimiento reducido activo y duración 0s. | La entrada 18 conserva el resultado facilitado; las reglas de movimiento reducido existen en `8365b6e`. Informa build y **118 tests** el 2026-11-16. | [Prompt #36](prompts/prompt-36-diagnosticar-y-corregir-microinteracciones.md); [CSS global](../../frontend/src/styles.scss); [historial SCSS](../../frontend/src/app/features/simulations/simulation-history.component.scss); [bitácora](../05-ai-development-log.md), entradas 17–18. | La revisión humana recoge el reporte retrospectivo del responsable en la conversación: probó las microinteracciones en otro navegador y funcionaron correctamente. Codex no las inspeccionó visualmente allí. No hay vídeo, captura ni transcripción original archivados de esa comprobación; el fundido concreto no queda acreditado visualmente. |

## Trazabilidad Git contrastada

Base de la selección: `eefd66885ebf57d32d77ef3d0110171179929860`, en `docs/ai-evidence-final`, con árbol limpio al comenzar. La consulta de `refs/heads/main` a GitHub confirmó ese mismo hash el 2026-11-17. No se actualizaron referencias locales ni se cambió de rama.

| Resultado conservado | Commit | Integración que consta en el historial |
| --- | --- | --- |
| Especificaciones iniciales | `dda6461` | `8753144`, mensaje de merge PR #1 |
| Motor y test de medio céntimo | `f9fa569` | `f7fae43`, mensaje de merge PR #2 |
| API de clientes y corrección CORS | `19f422f` | `f051697`, mensaje de merge PR #3 |
| Simulaciones e historial | `f8e6ee8` | `9ac1cba`, mensaje de merge PR #4 |
| Editorial B2B premium | `632737f` | `2bb6757`, mensaje de merge PR #6 |
| Alta y simulador Angular | `c966a0a` | PR #7 en `4516814`; integración de ese historial en main mediante `1334669`, mensaje de merge PR #8 desde master |
| Divisas | `fbe3df1` | `3c15155`, mensaje de merge PR #9 |
| Polish, microinteracciones y diagnóstico documentado | `8365b6e` | `eefd668`, mensaje de merge PR #10 |

Son referencias a objetos y mensajes de Git comprobados localmente, no una auditoría de revisiones en GitHub. Un merge no acredita por sí solo quién revisó el código. Las fechas de commit no se atribuyen a cada conversación. Para contrastar el contenido, desde la raíz:

```powershell
git show --stat dda6461
git show f9fa569:backend/tests/unit/test_quotation.py
git show 19f422f:backend/app/main.py
git show --stat 8365b6e
git show --no-patch --format='%h %p %s' 4516814 1334669
```

## Originales copiados e integridad

Todos son **prompts completos**, no respuestas ni extractos de conversaciones. SHA-256 del archivo local original y de su copia, comparados al archivar:

| Archivo archivado | SHA-256 |
| --- | --- |
| [prompt-12-cierre-a06-a07.md](prompts/prompt-12-cierre-a06-a07.md) | `F4D93BC4841DA3CDD94D8D9904F346631412FA699F7DAA8A1DADF3D687404AE3` |
| [prompt-19-motor-facturacion-python.md](prompts/prompt-19-motor-facturacion-python.md) | `125BAF7D57085550D5A5D0A5B7698CB88662950948849832694E4D115B39D563` |
| [prompt-21-validacion-python313-motor.md](prompts/prompt-21-validacion-python313-motor.md) | `47DD76D50CCF706A32CEF0CA9A4A3BD84B73AAA478EB426868AE43E443E16D0A` |
| [prompt-26-corregir-cors-500-api-clientes.md](prompts/prompt-26-corregir-cors-500-api-clientes.md) | `976B27B29F098C6CF3E42D14D83DC845EB0DABA9281F38EA1C0F8716EAF1D292` |
| [prompt-27-api-simulaciones-fastapi-sqlite.md](prompts/prompt-27-api-simulaciones-fastapi-sqlite.md) | `0C93A4059F8B8A1328F960AA473D0A34093DC8380046D5ED4127F69AA0BB4E9C` |
| [prompt-29b-rediseno-premium-angular.md](prompts/prompt-29b-rediseno-premium-angular.md) | `939444CD9BA2DE83781942C15AD2D6C6A216AEA9769AF7064F65585EE6CDDCB6` |
| [prompt-30-v2-alta-clientes-simulador-premium.md](prompts/prompt-30-v2-alta-clientes-simulador-premium.md) | `975AACFFA90EBC60237A8832DE21B2F089FD5B7937B2166AA35D54FF518559FF` |
| [prompt-31-divisas-angular-exchangerate-api.md](prompts/prompt-31-divisas-angular-exchangerate-api.md) | `E3CB725AABE64F507A978B4BDED34E87DFCD7EF6F3AE037DDAEFD11D9E8DEA56` |
| [prompt-34-visual-polish-sin-regresiones.md](prompts/prompt-34-visual-polish-sin-regresiones.md) | `73F66AACC8F2BAAD4DF2E4A92A491595A0E304BDCCF0EAC785020FE1DB287991` |
| [prompt-36-diagnosticar-y-corregir-microinteracciones.md](prompts/prompt-36-diagnosticar-y-corregir-microinteracciones.md) | `87A78907CA559B8E6441483B7AECA383DF41E812B747DC7B93814336B64ACE91` |

Para calcular una huella de la copia:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath ai-workspace/evidence/prompts/prompt-12-cierre-a06-a07.md
```

Las huellas identifican los bytes archivados en este entorno. Una conversión posterior de saltos de línea por Git puede cambiarlas; no deben normalizarse los originales durante esta entrega sin documentarlo.

## Inventario complementario y ausencias

Se comprobaron los doce nombres exactos de prompts citados en la bitácora: #12, #13, #14, #15, #19, #29, #29B, #30 v2, #31, #34, #35 y #36. **Todos estaban accesibles**. Siete forman parte de las copias anteriores; los otros cinco se dejan fuera para mantener una selección breve.

También se localizaron, por los números de encargos de este proyecto ya identificados, #21–#27 y #32/#33/#37. Se revisaron íntegros los diez seleccionados; para los restantes se comprobó existencia, sin presentarlos como revisados en su totalidad. Inventario de originales localizados pero **no copiados**:

- `prompt-13-auditoria-pre-pr.md`
- `prompt-14-correcciones-pre-pr.md`
- `prompt-15-verificacion-evidencias-pre-pr.md`
- `prompt-22-revision-final-pr-motor.md`
- `prompt-23-ajuste-final-documentacion-motor.md`
- `prompt-24-api-clientes-sqlite-fastapi.md`
- `prompt-25-auditoria-api-clientes-pr3.md`
- `prompt-29-angular-dashboard-frontend-design.md`
- `prompt-32-cierre-divisas-pr8.md`
- `prompt-33-validacion-final-entrega-saas-o-matic.md`
- `prompt-35-microinteracciones-seguras.md`
- `prompt-37-evidencias-ia-entrega-roams.md` — leído como encargo de esta selección, sin incorporarlo al archivo histórico.

`Texto pegado.txt`, identificado en la bitácora como fuente externa de arquitectura/contratos, **no se localizó en Downloads ni entre los documentos del repositorio**. No se ha reconstruido. El enunciado original de Roams no está archivado aquí: [00-project-scope.md](../00-project-scope.md) sigue siendo un resumen. No se inspeccionaron otros directorios privados, historiales internos de Codex ni conversaciones ajenas al proyecto.

### Material que requiere exportación del responsable

- Informe inicial de requisitos, revisión de la contradicción fiscal y aprobaciones D/A: **original pendiente de archivar**.
- Respuestas de Codex con las alternativas visuales y mensajes humanos de elección de Editorial B2B premium y Mesa financiera SaaS: **original pendiente de archivar**.
- Auditoría CORS #25, respuesta de corrección #26 y salidas de terminal de las suites históricas: **original pendiente de archivar**. Los archivos de tests no sustituyen los logs de ejecución.
- Resultado original del JavaScript de Opera GX y originales de la comprobación posterior. El responsable informó retrospectivamente en la conversación de que probó las microinteracciones en otro navegador y funcionaron correctamente. Es un reporte humano, no una inspección visual de Codex. No hay vídeo, captura ni transcripción original archivados de esa comprobación; esos materiales siguen pendientes de archivo.
- `Texto pegado.txt` y el enunciado externo, si procede incorporarlos con su procedencia y condiciones de difusión.

Hasta recibir esos archivos no se archivará ninguna respuesta como literal. Cada futura transcripción deberá identificar fuente, alcance completo o extracto y cualquier redacción aplicada. La falta de originales limita la atribución independiente de acciones; no se suple con un relato generado.

## Revisión de publicación y alcance

La selección no incorpora bases SQLite, capturas, compilados, logs de entorno, credenciales, correos personales ni metadatos de autores Git. La búsqueda de patrones obvios se limita a los documentos nuevos y no constituye una auditoría de seguridad. No se ejecutan build ni pruebas de aplicación en este encargo: los resultados citados conservan su condición histórica.

El responsable debe confirmar el borrador en primera persona y revisar las ausencias antes de la entrega. Se recomienda un PR exclusivamente documental, por ejemplo `docs: archivar evidencias auténticas del desarrollo con IA`, después de su revisión. Este encargo no crea commit, push, merge ni PR.

## Comprobaciones de esta preparación

- **Enlaces:** 81 referencias Markdown locales añadidas resuelven a archivos existentes, incluyendo las de los prompts copiados y los dos enlaces en documentos previos.
- **Integridad y alcance:** las diez copias coinciden por SHA-256 con sus originales y con las huellas de este índice. De los 116 archivos ya versionados al comenzar, 114 permanecen idénticos; solo README y la aclaración puntual de la bitácora cambian. Hay doce documentos Markdown nuevos, sin ejecutables ni temporales. El índice Git sigue vacío.
- **Datos sensibles:** sin coincidencias en los patrones revisados de credenciales comunes, claves privadas, asignaciones de secretos, correos personales y rutas de usuario dentro de los archivos nuevos. No se aplicó ninguna redacción. Es una búsqueda limitada, no una garantía exhaustiva.
- **Diff:** `git diff --check` pasa para los archivos ya versionados. La comprobación adicional de los doce nuevos no encuentra problemas de espacios en los dos documentos redactados; detecta **13 finales de línea con dos espacios Markdown**, heredados de los originales #26/#27/#30/#31. Se conservan para mantener copias exactas. También aparecen avisos LF/CRLF en los doce nuevos; no se normalizan archivos ni se cambia la configuración de Git.
- **Aplicación y publicación:** no se ejecutaron build, pytest o tests Angular, no se instalaron dependencias y no se modificó código. HEAD permanece en la base indicada; no se hizo stage, commit, push, merge ni PR.
