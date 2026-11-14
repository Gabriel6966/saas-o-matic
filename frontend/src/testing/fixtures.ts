import { Customer, Page, Simulation } from '../app/core/api/models';

// Datos sintéticos exclusivos de pruebas. Nunca se cargan en la aplicación.
export const customer: Customer = {
  id: 1, company_name: 'Empresa Ficticia Ábaco', tax_identifier: '00000023T',
  country_code: 'ES', email: 'pruebas@example.com', plan: 'Plan actual de prueba',
};

export const simulation: Simulation = {
  id: 101, customer_id: 1, active_users: 15, storage_gb: 100, api_calls: 1000,
  country_code: 'FR', plan: 'Plan histórico de prueba', base_amount: '140.00',
  tax_rate: '0.2000', tax_amount: '28.00', total_amount: '168.00',
  currency: 'EUR', created_at: '2026-11-12T23:59:59Z',
};

export function page<T>(items: readonly T[], total = items.length, offset = 0, limit = 20): Page<T> {
  return { items, total_count: total, offset, limit };
}

export const serviceError = {
  error: { code: 'internal_error', message: 'Se ha producido un error interno.', details: [] },
};
