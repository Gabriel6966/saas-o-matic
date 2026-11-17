# Prompt #36 — Diagnóstico y corrección verificable de microinteracciones

## Contexto

Proyecto: SaaS-O-Matic, Angular con diseño «Mesa financiera SaaS» y backend FastAPI ya funcional.

Rama prevista: `style/final-visual-polish`.

Tras el Prompt #35, se informaron animaciones CSS en el desplegable «Contexto del cálculo», una rotación de indicador y feedback visual en botones, pero **el responsable ha comprobado manualmente que no percibe ninguno de esos efectos**. Esta observación humana tiene prioridad sobre un build verde o un resumen de pruebas. No dar la animación por validada hasta reproducir visualmente una mejora perceptible.

## Objetivo

Encontrar por qué las microinteracciones no son visibles y resolverlo con el cambio mínimo y más compatible posible, conservando intactos todos los flujos funcionales y el diseño premium.

## Fase 1 — Diagnóstico real, antes de editar

1. Confirmar rama, estado Git y cambios no preparados. **No sobrescribir cambios anteriores**.
2. Inspeccionar la estructura HTML real del desplegable en `simulation-history.component.html` y sus selectores SCSS, además de `frontend/src/styles.scss` y los botones relevantes. No suponer clases ni marcadores que no existan.
3. Identificar la URL y puerto exactos del servidor Angular que realmente se está sirviendo; diferenciar `localhost:4200`, `localhost:4201` y páginas compiladas/antiguas. Verificar que el navegador está mostrando la compilación de esta rama, no una pestaña vieja ni otro proceso.
4. Revisar si hay `prefers-reduced-motion: reduce` activo, si la hoja de estilos se carga y si los selectores alcanzan el elemento visible. Comprobar duración CSS calculada y comportamiento del marcador de `<details>/<summary>`.
5. Comprobar compatibilidad de `::details-content` y transiciones discretas en el navegador utilizado. Un selector sintácticamente aceptado no demuestra una transición visual. Registrar causa raíz o, si no hay acceso al navegador, explicar con precisión qué no se pudo verificar.

## Fase 2 — Corrección mínima autorizada

Si la causa es un servidor o vista obsoletos, **no editar código innecesariamente**: indicar los pasos para ver la versión correcta.

Si el CSS actual no produce efectos perceptibles:

- Corregir los selectores de los elementos **reales**, sin crear clases inexistentes.
- Indicador de expansión: rotación visible y breve de ~200–250 ms entre abierto y cerrado, cuando el navegador y la preferencia de movimiento lo permitan.
- Contenido: entrada perceptible pero discreta, manteniendo el desplegable nativo accesible. Preferir CSS progresivo y compatible. Si el cierre no puede animarse de manera fiable sin añadir lógica, permitir cierre inmediato y declararlo expresamente; no simular que hay un fundido de cierre.
- Botones: feedback evidente pero sobrio de hover, foco de teclado y pulsación, evitando movimientos agresivos y sin modificar el estado disabled ni las acciones.
- Respetar `@media (prefers-reduced-motion: reduce)` para desactivar efectos no esenciales.
- **No modificar TypeScript, servicios, API, backend, contratos, estado RxJS, dependencias ni rutas.** Priorizar SCSS. Solo admitir un ajuste HTML puramente presentacional si es absolutamente necesario y se justifica en el informe; preservar la semántica de `<details>/<summary>` y su operabilidad por teclado.
- No añadir librerías de animación ni animar alturas con técnicas frágiles.

## Fase 3 — Verificación honesta

1. Ejecutar `npm --prefix frontend run build` y `npm --prefix frontend test`.
2. Si existe navegador utilizable, verificar **visualmente** la versión actualizada (y registrar puerto, navegador y estado de movimiento reducido):
   - Abrir/cerrar «Contexto del cálculo» con ratón y con Enter/Espacio.
   - Comprobar un giro perceptible del indicador.
   - Comprobar la aparición visual del contenido, si está soportada.
   - Verificar feedback de botones en hover y foco.
   - Verificar que con movimiento reducido no se producen efectos innecesarios.
   - Revisar 1440, 375 y 320 px sin desbordamientos ni texto cortado.
   - Recorrer al menos una simulación guardada y el historial sin pérdida funcional.
3. Si el navegador falla o no se puede ver el efecto, **no declarar «verificación visual superada»**. Informar la limitación y dar instrucciones manuales concretas al responsable.
4. Mostrar `git diff --check`, `git status --short` y un resumen exacto de archivos modificados, separando los cambios previos de los cambios de esta tarea.

## Restricciones finales

- No hacer `git add`, commits, push, merges ni PR.
- No descartar, restaurar ni sobrescribir los cambios previos de `style/final-visual-polish`.
- No modificar especificaciones funcionales aprobadas.
- No inventar capturas, validaciones ni afirmaciones de compatibilidad.
- Mantener la corrección acotada: si el efecto no puede hacerse visible de forma robusta, **revertir solo los cambios de microinteracciones del Prompt #35 bajo una propuesta explícita**, sin tocar los demás estilos premium ni ejecutar un reset global.

## Respuesta solicitada

- Causa de la falta de efectos observada o hipótesis verificadas.
- Qué cambió exactamente para resolverla.
- Qué efecto se pudo comprobar visualmente y cuál no.
- Resultado de build, tests y Git.
- URL exacta y pasos manuales breves para la revisión humana antes del PR.
