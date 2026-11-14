# SaaS-O-Matic — Dirección visual del primer flujo Angular

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
