# SaaS-O-Matic — Especificación funcional inicial

**Estado:** borrador v0.1. **Fuente:** alcance del reto y decisiones técnicas propuestas. **No aprobado para implementar.**

## 1. Objetivo
Herramienta comercial para registrar clientes corporativos, simular costes mensuales de suscripción y mostrar resultados en diversas divisas. Frontend Angular, backend Python/FastAPI y base de datos SQLite (tecnologías elegidas para la solución; SQLite es un requisito de la prueba).

## 2. Requisitos obligatorios del enunciado

### RF-01 — Registro de clientes
`POST /customers` guarda nombre de empresa, identificador fiscal (DNI/NIF/CIF), email, país y plan elegido. Si el país es España, la validación algorítmica del identificador fiscal es obligatoria. El alcance de tipos concretos y el tratamiento de formatos adicionales se revisará antes de codificar.

### RF-02 — Registro de simulaciones
`POST /simulations` guarda ID de cliente, usuarios activos, almacenamiento contratado, llamadas estimadas a la API y el cálculo mensual persistido.

### RF-03 — Precio por usuarios
Cálculo **acumulativo** sobre el número de usuarios:
- Usuarios 1 a 10: 10 € / usuario.
- Usuarios 11 a 50: 8 € / usuario.
- Usuarios 51 en adelante: 5 € / usuario.

Fórmula para `n >= 0`:
`min(n,10)*10 + min(max(n-10,0),40)*8 + max(n-50,0)*5`

Ejemplos de coste base: 0→0 €, 10→100 €, 11→108 €, 15→140 €, 50→420 €, 51→425 €.
Al coste base se suma el impuesto correspondiente al país del cliente (política fiscal pendiente de especificar).

### RF-04 — Dashboard y búsqueda
Búsqueda por empresa o identificador fiscal; detalle del cliente en tarjetas responsive; historial de simulaciones persistidas.

### RF-05 — Simulación interactiva
Slider o controles para modificar usuarios y observar la proyección mensual sin guardar cada ajuste automáticamente.

### RF-06 — Divisas
Interfaz conectada con una API pública de tipos de cambio para visualizar EUR, USD, GBP u otras divisas, con actualización dinámica. Gestionar carga, fallo y ausencia de respuesta de la API.

## 3. Requisitos de calidad propuestos (no textuales)
- Validación del servidor para datos requeridos, tipos y rangos.
- Separación de dominio, API, acceso a datos e interfaz.
- Uso de `Decimal` en cálculos monetarios y pruebas unitarias de límites.
- Contratos HTTP coherentes y errores claros.
- Proyecto ejecutable localmente con documentación reproducible.

## 4. Ambigüedades y decisiones que debemos aprobar
- **D-01 Impuestos:** el enunciado no indica países admitidos, tipos impositivos ni reglas especiales B2B. Definir una política demostrable, documentada y extensible; no inventar que 21% se aplica a todos los países.
- **D-02 Almacenamiento/API:** se exigen métricas de consumo, pero no se facilitan tarifas adicionales. Propuesta: persistirlas sin sumar cargos inventados.
- **D-03 Plan elegido:** no se facilita catálogo ni precios de planes. Propuesta: persistir el plan sin alterar los tramos.
- **D-04 Contratos de lectura:** para el dashboard serán necesarios endpoints adicionales a los dos POST expresamente requeridos; proponer GET de clientes, detalle e historial.
- **D-05 Previsualización:** decidir si usar un endpoint de presupuesto no persistente para que Angular no duplique el motor de facturación.
- **D-06 Histórico:** decidir si se guarda la base, tipo fiscal, importe del impuesto, total y fecha para preservar cálculos históricos.
- **D-07 Identificación fiscal:** revisar alcance preciso de DNI/NIF/CIF y casos límite del algoritmo, sin prometer existencia real del documento a partir de un dígito de control.
- **D-08 Divisas:** decidir frecuencia de actualización, cache, manejo de errores y si la conversión afecta solo a la visualización.

## 5. Criterios de aceptación preliminares
- Rechazar un identificador fiscal español con control incorrecto.
- Rechazar usuarios negativos; definir el resto de rangos y campos obligatorios.
- Facturación base correcta para 0, 10, 11, 15, 50 y 51 usuarios.
- Persistir simulaciones y recuperar el historial.
- Cambiar divisa sin alterar el total original almacenado.
- En errores de conversión, comunicar el problema sin bloquear el dashboard.

## 6. Siguiente paso
Auditoría documental con Codex, revisión humana de las decisiones abiertas, arquitectura, modelos de datos y contratos API antes de implementar.
