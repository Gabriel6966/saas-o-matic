# SaaS-O-Matic — Dirección visual del primer flujo Angular

> **Dirección vigente:** Editorial B2B premium, aprobada por el usuario en el Prompt #29B. El diseño del Prompt #29 se conserva debajo como registro histórico; la sección final describe el rediseño autorizado.

**Fecha:** 2026-11-14. **Alcance:** Prompt #29, en `feature/angular-dashboard`. Diseño e implementación local de búsqueda, detalle e historial de solo lectura; pendientes de revisión humana. El usuario ha encargado ejecutar el Markdown adjunto en este chat. No autoriza commit, publicación ni PR.

## Usuario, tarea y fuentes

Una persona de operaciones necesita encontrar una empresa, comprobar su identificación y plan, y consultar los cálculos mensuales que ya se guardaron. Esta entrega prepara el contexto para una futura simulación; no muestra una acción que todavía no funciona.

Se han revisado `AGENTS.md`, README, alcance, requisitos, arquitectura, contratos, registro de decisiones, bitácora y los esquemas/rutas reales del backend. RF-04 y CA-05 guían este flujo; D-04, D-06, D-10 y A-06 fijan búsqueda, paginación, snapshots y decimales. Las cabeceras históricas de las especificaciones describen su fase documental; el encargo actual autoriza únicamente el alcance del Prompt #29. No se cambia ninguna decisión aprobada.

## Concepto: un directorio de operaciones

La búsqueda ocupa el lugar principal. La identidad se concentra en una cabecera de color petróleo, una marca geométrica propia y títulos de anchura compacta. El listado se lee por filas, como un registro de empresas; el detalle abre una ficha y una secuencia de simulaciones con importes alineados. El color verde identifica navegación y acciones, sin implicar que un cliente esté activo o verificado.

No hay indicadores comerciales sin fuente, avatares personales inventados, gráficos de adorno ni datos de demostración insertados en la aplicación. Los conteos proceden de `total_count`. Los datos ficticios que se utilicen para pruebas permanecerán en una base temporal independiente.

### Tokens

| Token semántico | Valor | Uso |
| --- | --- | --- |
| Tinta petróleo | `#233D4D` | Texto principal y cabecera |
| Acción bosque | `#236451` | Enlaces, botones, selección y foco |
| Niebla | `#F0F4F5` | Fondo y áreas secundarias |
| Papel | `#FFFFFF` | Listado y fichas |
| Texto secundario | `#536773` | Ayuda y etiquetas |
| Error granate | `#A43040` | Fallos y validación |

Separadores y fondos suaves derivan de estos colores mediante mezclas; no se añaden gradientes. Texto normal con contraste mínimo 4.5:1, foco de 3 px con separación y objetivos de interacción de al menos 44 px. La revisión visual debe comprobarlo en los estados implementados.

Tipografía: Bahnschrift para títulos y marca, con Aptos Display y Segoe UI como alternativas locales; Segoe UI para lectura y controles. No depende de descargar fuentes. Escala de 13, 14, 16, 20, 28 y 48 px; títulos principales adaptables hasta 36 px en móvil. Importes con cifras tabulares, conservados como las cadenas recibidas, sin `Number`, `CurrencyPipe` ni recálculo. La tasa también se muestra como fracción exacta, con su significado explicado.

Espaciado base de 4 px: 8/12/16 para relaciones cercanas y 24/32/48 para secciones. Contenedor de hasta 1200 px, texto alineado a la izquierda, importes destacados a la derecha en escritorio. Superficies de distinta jerarquía: listado continuo, ficha con borde y encabezado de identidad, registros históricos con banda de total. Radios de 8 px en controles y 16–24 px en superficies; sin sombra repetida.

## Jerarquía y adaptación

Dashboard en escritorio:

```text
+------------------------------------------------------------+
| marca SaaS-O-Matic                   Clientes (seleccionado) |
+------------------------------------------------------------+
| Clientes                         Consulta de suscripciones  |
| Encuentra una empresa y consulta sus simulaciones.          |
|                                                            |
| [ Buscar por empresa o identificador fiscal... ] [Limpiar]  |
| Ayuda de búsqueda                       Conteo de la API    |
|------------------------------------------------------------|
| Empresa                  Identificador        País   Ficha |
| Nombre de la empresa     Cadena original      ES     Abrir |
| ...                                                        |
| Rango real                         [Anterior] [Siguiente]  |
+------------------------------------------------------------+
```

Detalle en escritorio:

```text
| Volver a clientes (conserva búsqueda y página)              |
| Ficha de cliente                                          |
|-----------------------------------------------------------|
| Nombre de la empresa       | Plan                         |
| Identificador, país, email | Texto actual de la API        |
|-----------------------------------------------------------|
| Historial de simulaciones             Conteo de la API     |
| Fecha UTC, ID                         Total original EUR   |
| Usuarios / GB / llamadas / base / impuesto / tasa          |
| [Contexto guardado: país y plan originales]                |
| ...                                 Anterior / Siguiente  |
```

En móvil desaparece la cabecera de columnas; cada empresa conserva nombre, identificador y país en una fila de altura flexible. Los campos de ficha y los consumos pasan a una columna o dos según espacio. El total histórico ocupa su propia banda. Búsqueda y paginación se envuelven sin desplazamiento horizontal. Se verificará con nombres y planes largos.

## Estados e interacción accesible

- **Carga:** texto anunciado con `role="status"` y `aria-busy`; se retiran los resultados de una consulta anterior al cambiar entradas. Sin animaciones imprescindibles.
- **Directorio vacío:** explicar que aún no hay clientes registrados; no ofrecer un alta inexistente.
- **Sin coincidencias:** repetir el término consultado como texto seguro y ofrecer limpiar la búsqueda.
- **Error de red o espera agotada:** explicar que no se pudo conectar/cargar, conservar la búsqueda y ofrecer reintentar. Los errores HTTP respetan `error.code/message/details`, con alternativa segura para cuerpos no conformes.
- **Detalle:** distinguir identificador inválido, cliente inexistente y fallo de consulta. Un fallo del historial no elimina la ficha; su reintento es independiente.
- **Historial vacío:** indicar que aún no hay simulaciones guardadas. Un offset sin elementos ofrece volver a la primera página.
- **Teclado:** enlaces reales para navegación, botones reales para acciones, etiquetas asociadas, ayuda vinculada al buscador, errores anunciados y enlace para saltar al contenido. Foco visible y retorno predecible al título tras navegar. Al paginar se mantiene un lugar de foco estable.
- **Búsqueda:** Reactive Forms y RxJS; esperar 300 ms y cancelar inmediatamente solicitudes obsoletas al cambiar el término. Validar longitud de 200 puntos de código y caracteres de control; no validar algoritmos fiscales en el buscador. El backend sigue siendo la autoridad.
- **URL:** conservar término y offset en query params para volver desde el detalle y usar atrás/adelante del navegador; no almacenar clientes en localStorage.

## Autocrítica previa a implementar

La primera idea de un dashboard con tarjetas de métricas y una columna de navegación resultaba intercambiable con cualquier panel SaaS, y aquí solo existe un flujo. Se sustituye por un directorio continuo con búsqueda protagonista y una única navegación útil. Las tarjetas se reservan para la ficha responsive exigida y para los cálculos guardados. Se descartan gradientes, etiquetas en mayúsculas y animaciones de entrada: no ayudan a encontrar una empresa ni a explicar el coste.

## Enfoque, archivos, alternativas y verificación

Se creará la aplicación standalone estricta en `frontend/`, con rutas, modelos y servicios HTTP en `core/api`, componentes por búsqueda/detalle/historial y pequeños elementos compartidos de estado y paginación. URL API configurable en `public/config.js`, por defecto `http://127.0.0.1:8000`. Solo se actualizarán README y bitácora para ejecución y evidencia; `.gitignore` ya excluye dependencias y compilados.

Se elige estado local con RxJS y señales Angular, sin almacén global ni biblioteca visual. Frente a una tabla rígida se usan filas responsive y fichas que conservan los campos en móvil. Frente a transformar los importes con punto flotante se muestra el texto decimal original junto a EUR. Las fechas se presentan en español indicando UTC, sin alterar `created_at`.

Riesgos: respuestas fuera de orden durante el debounce, errores que cierren el flujo de búsqueda, rutas que reutilicen el componente con otro cliente, textos largos, paginación sobre colecciones que cambian y CORS por usar un origen distinto de `http://localhost:4200`. Se cubrirán cancelación, recuperación y cambios de ruta con pruebas; no se tocará el backend para resolver configuración local.

Verificación prevista: build de producción, unit tests del runner oficial Angular/Vitest con `HttpTestingController`, estados principales, precisión textual, navegación y paginación; arranque contra FastAPI real con SQLite temporal y datos declarados ficticios; revisión visual en escritorio/móvil si las herramientas lo permiten. La suite Python de 428 casos es evidencia previa: no se declarará reejecutada si no se ejecuta. Revisar diff, archivos nuevos, exclusiones y ausencia de cambios en backend/especificaciones/índice antes de entregar.

## Revisión de la implementación — 2026-11-14

Se aplicó la skill instalada `frontend-design`, leída desde `C:/Users/usuario/.agents/skills/frontend-design/SKILL.md`, sin reinstalarla. La implementación conserva los tokens y el directorio continuo del plan. En la autocrítica visual se retiró una frase secundaria que no ayudaba a buscar. El nombre se sitúa dentro de la tarjeta de empresa, junto a identificador, país y correo; el título de página es «Ficha de cliente». El plan actual tiene su propia tarjeta responsive.

Se corrigieron el foco forzado en la primera carga, el salto al contenido bajo `<base href="/">` y el foco tras reintentar. La primera carga deja que el usuario elija dónde comenzar; navegar enfoca el título, paginar enfoca el encabezado de resultados/historial y reintentar conserva un destino de foco estable. El enlace de salto enfoca `main` sin cambiar ficha ni query params. El contexto histórico utiliza `details/summary` operable con Enter.

Se revisaron en navegador real escritorio a 1440 × 1000, móvil a 390 × 844 y ancho de 320 × 700, incluyendo el nombre largo de una empresa ficticia y un registro con 1000000 usuarios. El ancho de documento coincidió con su ancho disponible en las comprobaciones: 1425, 375 y 305 px respectivamente, descontada la barra de desplazamiento. No se observó desbordamiento horizontal. Se comprobó teclado, paginación de ambas colecciones, recuperación de búsqueda al regresar, carga/vacíos, cliente inexistente y caída/recuperación real de FastAPI.

Los contrastes calculados para los cinco pares de texto base fueron: tinta/papel 11.38:1, secundario/papel 5.91:1, secundario/niebla 5.33:1, acción/papel 6.97:1 y error/papel 6.83:1. Este cálculo y la revisión manual no constituyen una auditoría completa de accesibilidad.

Entorno final: Angular 22.2.6, CLI/build 22.2.7, Node 26.13.0, npm 11.20.0, TypeScript 6.0.2, RxJS 7.8.2, Vitest 5.0.3 y jsdom 30.0.0. Compatibilidad contrastada con la [tabla oficial](https://angular.dev/reference/versions) y el [soporte de Angular](https://angular.dev/reference/releases); versiones concretas contrastadas con npm. Pasaron instalación limpia desde el lockfile, build de producción y 36 pruebas en 6 archivos. Resultados e incidencias en la entrada 12 de la bitácora.

Se conservaron cuatro capturas locales reales en `frontend/__screenshots__/`, excluidas de Git: `prompt29-dashboard-desktop.jpg`, `prompt29-detail-desktop.jpg`, `prompt29-detail-mobile.jpg` y `prompt29-history-mobile.jpg`. Solo contienen fixtures ficticias procedentes de una base de verificación independiente. La base se eliminó y los servidores se detuvieron al terminar; no se añadieron semillas a la aplicación. Las capturas no forman parte de la evidencia versionada y su referencia no implica que se hayan subido al repositorio.

Queda la revisión humana del resultado visual y funcional. Alta, simulador interactivo, guardado desde Angular y divisas siguen fuera de esta entrega. No se preparó PR ni se hizo commit o push.

## Prompt #29B — Editorial B2B premium

**Decisión humana:** tras presentar Editorial B2B premium y Consola SaaS contemporánea sin editar archivos, el usuario respondió: «Apruebo la opcion 1, Editorial B2B premium». La rama comprobada es `feature/premium-dashboard-redesign`, limpia al comenzar, sobre el merge del PR #5 (`9d9404c`). Se conserva la aprobación del concepto; la revisión de su implementación sigue pendiente.

### Composición autorizada

La búsqueda se separa del listado para que sea el punto de entrada de la tarea. Cabecera clara, marca refinada y una sola navegación operativa. Se eliminan las iniciales decorativas de las filas; nombre, identificación y país comparten una retícula legible, de unos 72 px de altura mínima. El conteo procede exclusivamente de la respuesta consultada, también cuando hay filtro.

La ficha mantiene tarjetas responsive: identidad principal y plan secundario con proporciones y superficies diferentes. Se reduce el texto y espacio previos a los datos. El historial se organiza como un registro continuo: fecha e ID a la izquierda, total original EUR destacado a la derecha, consumos y desglose en grupos alineados y contexto histórico desplegable. No se deriva ningún precio ni indicador nuevo.

```text
Marca                                      Clientes
Clientes
Buscar clientes [empresa o identificador completo] [Limpiar]
Directorio / resultados                    Conteo real
Empresa                    Identificador   País     Ficha
Filas continuas, sin tarjetas por empresa
Rango consultado                           Anterior / Siguiente

Volver a clientes (búsqueda y página conservadas)
Ficha de cliente
[ Identidad de empresa, dominante ] [ Plan actual, secundario ]
Historial original                         Conteo real
Fecha / ID                                 Total EUR
Usuarios / GB / llamadas                   Base / impuesto
Contexto guardado desplegable
```

### Sistema visual

- Petróleo `#173F43`: marca, títulos y texto principal.
- Bosque `#2E604F`: acciones, selección y foco.
- Fondo cálido `#F4F2ED` y papel `#FFFEFA`: lienzo y superficies.
- Texto secundario `#5F6A63` y error `#A43040`: ayuda y validación. Separadores y fondos suaves se derivan mediante mezclas.
- Georgia para títulos de página e identidad; Segoe UI para lectura, controles e importes tabulares. Ambas están instaladas en este equipo. Se usan fuentes del sistema, sin redistribuir archivos, descargas, CDN ni dependencia nueva; alternativas serif y system-ui.
- Escala de espacio de 4 px; botones y campos de 44 px como mínimo; radios de 8 px en controles y 16 px en superficies principales. Sombra discreta reservada al buscador. Transiciones de color/borde, sin desplazamientos decorativos, desactivadas con `prefers-reduced-motion`.

En móvil, búsqueda y resultados aprovechan el ancho; los datos conservan etiquetas y saltos de línea. Identidad y plan se apilan y el registro económico distribuye sus grupos sin scroll horizontal. Se comprobarán 320/375 px, tablet y escritorio, incluidos nombres, planes, correo e identificadores largos.

### Autocrítica, límites y verificación prevista

Un fondo cálido y una serif por sí solos repetirían una fórmula visual. La diferencia debe estar en la composición: separar búsqueda y resultados, retirar las iniciales que no identifican por sí solas a la empresa, diferenciar las tarjetas por su contenido y reducir la altura de cada registro histórico. No se añade navegación lateral ni destinos futuros, al existir un recorrido principal.

Cambios previstos: plantillas y SCSS de cabecera, búsqueda, ficha e historial; estilos globales y componentes de estado/paginación. Solo se retira del componente de búsqueda el método de iniciales que deja de usarse. Se preservan servicios, modelos, RxJS, rutas, importes exactos, semántica de estados y pruebas existentes. Riesgos: anchura de la serif con nombres largos, reorganización de los grupos en móvil y visibilidad del foco al cambiar la cabecera a fondo claro.

Se ejecutarán desde la raíz build y tests Angular; después se revisará el flujo con FastAPI real sobre una base aislada y datos explícitamente ficticios. La evidencia final se añadirá tras esas comprobaciones. No se modificará backend, contratos, decisiones ni dependencias; no se hará commit, push o PR.

### Resultado verificado — cierre 2026-11-15

Se aplicó el concepto aprobado. Cabecera clara y marca serif, búsqueda fuera del panel de resultados, filas de 76 px mínimos en escritorio, identidad con nombre destacado y plan sobre una superficie secundaria. El historial comparte una superficie continua y agrupa consumos y desglose en una retícula; conserva todas las interpolaciones del resultado original, incluyendo tasa y contexto desplegable.

La revisión en tablet detectó que las filas perdían su señal visible de navegación: se mantuvo la flecha aunque se oculte su texto a ese ancho. También se dio ajuste de palabra a los mensajes para soportar una búsqueda válida de 200 caracteres sin espacios. Se verificaron nombres de 200 caracteres, planes de 100, identificadores de 32, correo de 122 y consumos de 1000000, sin desbordamiento horizontal en las comprobaciones realizadas.

Verificación real en navegador integrado: escritorio 1440×1000, tablet 768×1024 y móvil 375×812 / 320×700. Se probaron búsqueda Unicode y fiscal, carga, directorio e historial vacíos, ausencia de coincidencias, paginación de ambas colecciones, vuelta conservando término/offset, cliente inexistente, teclado y contexto desplegable. Detener/reiniciar FastAPI permitió comprobar el error real de red y su recuperación con foco en el encabezado de resultados.

Los pares base calculados tienen estos contrastes: tinta/papel 11.38:1, secundario/papel 5.58:1, secundario/fondo 5.03:1, acción/papel 7.17:1 y error/papel 6.77:1. Se conservan etiquetas, regiones y anuncios de estado; no se hizo una auditoría completa de accesibilidad ni se forzó la preferencia del sistema de movimiento reducido. El CSS contiene la excepción correspondiente. No se comprobó el aspecto en otros sistemas operativos o navegadores.

Build de producción correcto, sin avisos del compilador: 277.43 kB iniciales y transferencia estimada 75.44 kB. Suite Angular: 36 pruebas en 6 archivos, todas superadas, sin eliminar, modificar o añadir tests para este cambio de presentación. Evidencia detallada en la entrada 13 de la bitácora.

Las cuatro capturas reales del rediseño están en `frontend/__screenshots__/prompt29b-*.jpg`, excluidas de Git; se conservaron las capturas anteriores. La base temporal de 23 clientes y 21 simulaciones ficticios se eliminó y ambos servidores se detuvieron tras la revisión. No se incorporaron fixtures al producto.

Para el simulador futuro quedan disponibles los tokens de tipografía, color, espacio, radios y foco, las utilidades `.surface`, `.button` y `.section-heading`, y los componentes compartidos de estado/paginación. Los futuros controles podrán usar esos mismos tokens sin añadir una biblioteca visual. Esta entrega no implementa el simulador ni cambia sus reglas. La revisión humana de la implementación, el commit y el PR siguen pendientes.

## Extensión del Prompt #30 — 2026-11-15

El alta y el simulador extienden Editorial B2B premium sin cambiar su dirección. Reutilizan los tokens aprobados y comparten etiquetas, ayudas, campos, errores y acciones. El alta separa datos y explicación fiscal; el simulador coloca consumo y resultado en dos columnas, apiladas en móvil. La confirmación de guardado muestra el resultado persistido y lleva el foco a un contenedor estable; el historial mantiene su presentación y snapshots.

Las entradas de consumo conservan texto hasta validar enteros estrictos. El deslizador cubre 0–1000; el campo permite 1000000 y explica que moverlo volverá a su rango visual. Al editar desaparece el precio previo antes del debounce. Se verificaron escritorio, anchura de tablet, 375/320 px, teclado y textos largos contra FastAPI aislado; evidencia y límites en la entrada 14 de la bitácora. No se añaden fuentes, paquetes, tarifas ni divisas.

## Prompt #34 — Mesa financiera SaaS — 2026-11-15

### Elección humana y alcance

La Fase A se realizó sin editar fuentes, en `style/final-visual-polish`, limpia sobre `3c15155`. Se inspeccionaron componentes, contratos, estilos y pruebas, y se capturó el estado anterior con datos ficticios aislados. Se presentaron A, evolución editorial refinada, y B, Mesa financiera SaaS. El usuario respondió expresamente: «Apruebo la opción B — Mesa financiera SaaS», manteniendo fondo cálido, tipografía elegante y paleta petróleo/verde bosque. Esta elección sustituye la recomendación A del agente; no supone aprobación final de la implementación.

Se aplicó la skill instalada `frontend-design`. La implementación cambia únicamente ocho SCSS. No hizo falta modificar HTML: se mantienen íntegros textos, interpolaciones, bindings, eventos, orden del DOM, controles y atributos de accesibilidad. La documentación de diseño y la bitácora registran el resultado al terminar la verificación. No cambian TypeScript, servicios, RxJS, rutas, backend, persistencia, contratos, dependencias, configuración o pruebas.

### Dirección implementada

Se conserva la paleta base: petróleo `#173F43`, bosque `#2E604F`, fondo `#F4F2ED`, papel `#FFFEFA`, secundario `#5F6A63` y error `#A43040`. Se añaden tokens derivados para contornos de controles y para texto/separadores sobre petróleo. Georgia sigue en títulos y nombre de empresa; Segoe UI y sus alternativas del sistema, en lectura, controles e importes tabulares. Sin fuentes, iconos, paquetes, degradados ni animaciones nuevos.

La composición concentra el contraste en el resultado del simulador. Consumo y resultado comparten dos columnas en escritorio, apiladas hasta 800 px. La cifra de usuarios ocupa el extremo derecho de su grupo en escritorio/tablet y vuelve debajo de su etiqueta en móvil, conservando el orden de teclado. El panel petróleo muestra el total claro, filas alineadas y separadores; Guardar utiliza papel sobre petróleo, con foco claro y un estado deshabilitado legible. Los errores conservan una superficie clara de validación dentro del panel.

| Elemento | Antes | Después |
| --- | --- | --- |
| Resultado EUR | Fondo claro, total de 28–36 px. | Panel petróleo y total de 32–56 px según ancho; misma cadena del servidor. |
| Desglose | Filas flex con huecos, menor diferencia entre etiqueta e importe. | Dos columnas de ancho controlado, importes alineados a la derecha, peso 600 y separadores. |
| Ayudas y divisas | Texto secundario de 12–13 px. | Ayudas, tasa, fechas y atribución de 14 px; total convertido de 28 px y una columna para ese total en móvil. |
| Directorio | Nombre de empresa de 16 px y filas mínimas de 76 px en escritorio. | Nombre de 18 px, filas de 84 px, cabecera de columnas de 14 px y búsqueda delimitada; Limpiar pasa debajo en móvil para liberar ancho. |
| Formularios | Campos de 48 px y contornos suaves. | Campos de 52 px, etiquetas de 15 px y contornos con contraste calculado de 3.38:1 sobre papel. |
| Ficha | Identidad con dos columnas y correo debajo; relleno de 32 px en escritorio. | Tres columnas de datos en escritorio amplio, relleno de 24 px y plan secundario más compacto. |
| Historial | Título de 28 px, consumos de 16 px y metadatos de 12–13 px. | Título de 34 px en escritorio, consumos de 20 px, metadatos de 14 px y contexto desplegable con objetivo de 48 px. |

### Verificación, correcciones y límites

Se revisó el directorio antes/después a 1440×1000, 768×1024, 375×812 y 320×700, además de ficha y panel en esos cuatro anchos. Se observaron guardado e historial en escritorio/tablet, historial desplegado a 375, divisas en escritorio/tablet/móvil y alta a 1440/320. Se usaron capturas por secciones cuando el capturador rechazó páginas largas. La revisión móvil detectó que la especificidad de la regla de filas impedía la columna única del total convertido; se corrigió mediante `dl > .converted-total` y se volvió a comprobar GBP a 375 y USD a 320. La pista del range recibió contraste explícito, conservando el control nativo y su manejo con Home/End/Tab. Se mantiene la regla existente de `prefers-reduced-motion`.

Contrastes sRGB calculados sobre los tokens: papel/petróleo **11.38:1**, secundario claro/petróleo **7.61:1**, secundario/papel **5.58:1**, secundario/fondo **5.03:1**, secundario/fondo de divisas **5.11:1**, bosque/papel **7.17:1** y error/papel **6.77:1**. El contorno de campos y pista alcanza **3.38:1** sobre papel y **3.05:1** sobre el fondo cálido. Se observaron focos de teclado claros en el panel y verdes en superficies claras. Estos cálculos y comprobaciones no constituyen una auditoría completa de accesibilidad.

Build final correcto, sin avisos: **282.58 kB** iniciales y transferencia estimada **76.60 kB**. Suite Angular final: **118 pruebas en 12 archivos**, todas superadas en **17.90 s**, sin modificar tests. El primer build dentro del sandbox falló por acceso denegado a directorios; la ejecución autorizada fuera del sandbox compiló correctamente. La bitácora contiene el recorrido real contra FastAPI y el inventario exacto.

Las capturas locales están excluidas de Git en `frontend/__screenshots__/`. `prompt34-before-*` conserva las 21 vistas de la Fase A; `prompt34-after-*` recoge estados e iteraciones. Las vistas finales del simulador son `prompt34-final-simulator-1440.jpg`, `prompt34-final-simulator-768.jpg`, `prompt34-final-simulator-375.jpg` y `prompt34-after-12-total-320.jpg`. La conversión móvil corregida está en `prompt34-after-22-gbp-375.jpg` y `prompt34-after-24-max-usd-320.jpg`. Las capturas completas `after-04/05` pertenecen a la primera pasada, anterior al ajuste de contraste de la pista; las vistas `final-simulator-*` muestran los estilos finales. No se presentan capturas fallidas como evidencia.

La mayor legibilidad implica menos filas visibles y más recorrido vertical en móvil; ningún control se oculta para compensarlo. En las mediciones realizadas no hubo desbordamiento horizontal, tampoco con empresa de 200 caracteres, plan de 100, identificador de 32, correo de 126 o consumos de 1000000. IDs, fechas y conteos de las capturas difieren entre ejecuciones ficticias; no son métricas del producto. No se comprobaron otros navegadores/SO, lector de pantalla ni movimiento reducido a nivel del sistema. La vista local de revisión permanece en `http://localhost:4201`, con FastAPI en 8001 y SQLite temporal propia, sin utilizar la base personal. Revisión humana pendiente, sin commit, push ni PR.
