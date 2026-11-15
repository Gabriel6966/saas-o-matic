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
