# SaaS-O-Matic — Alcance de la prueba

**Referencia:** reto técnico facilitado por Roams (documento original conservado fuera del repositorio).  
**Estado:** resumen de alcance; no sustituye al enunciado oficial.

## Objetivo

Desarrollar una herramienta interna para registrar clientes corporativos y simular el coste mensual de suscripciones SaaS, con consulta del historial y visualización en varias divisas.

## Requisitos obligatorios

### Backend y persistencia
- API REST conectada a SQLite.
- `POST /customers`: nombre de empresa, identificador fiscal, correo, país y plan elegido.
- Para clientes de España, validar algorítmicamente el identificador DNI/NIF/CIF.
- `POST /simulations`: registrar cliente, usuarios activos, almacenamiento contratado, llamadas a la API estimadas y cálculo mensual persistido.
- Facturación **acumulativa por tramos**: primeros 10 usuarios a 10 €/usuario; usuarios 11–50 a 8 €/usuario; restantes a 5 €/usuario.
- Añadir el impuesto correspondiente al país.

### Frontend
- Buscador de clientes por empresa o identificador fiscal.
- Detalle responsive del cliente e historial de simulaciones.
- Formulario con ajuste interactivo del número de usuarios y proyección del coste mensual.
- Conversión visual EUR/USD/GBP mediante una API pública de tipos de cambio, con gestión de fallos y estados de carga.

### Entrega
- Código en un repositorio GitHub accesible para evaluación.
- Carpeta `ai-workspace/` con especificaciones previas al desarrollo, decisiones de arquitectura, prompts/interacciones reales con IA y revisiones de calidad.
- `README.md` con instrucciones verificadas para ejecutar frontend y backend en local.

## Criterios de evaluación

| Criterio | Peso |
| --- | ---: |
| Planificación y especificaciones | 35 % |
| Criterio técnico y control de calidad | 25 % |
| Calidad del software | 30 % |
| README y facilidad de ejecución | 10 % |

## Cuestiones no definidas por el enunciado

El documento no concreta tarifas para almacenamiento, llamadas API ni planes; tampoco define países admitidos, tasas fiscales, política de redondeo o contratos de lectura del dashboard. Estas cuestiones se documentan como decisiones pendientes en `01-requirements.md`; no deben presentarse como requisitos originales.
