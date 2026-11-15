// Respuesta sintética exclusiva de pruebas; nunca se importa desde el producto.
export function exchangeFixture(now = Date.now(), next = Math.floor(now / 1000) + 3600) {
  return { result: 'success', base_code: 'EUR', time_last_update_unix: Math.floor(now / 1000) - 60,
    time_next_update_unix: next, rates: { EUR: 1, USD: 1.2345, GBP: 0.85 } };
}
