/** Contratos de lectura A-06. Los decimales son texto exacto del servidor. */
export interface CustomerSummary {
  readonly id: number;
  readonly company_name: string;
  readonly tax_identifier: string;
  readonly country_code: string;
}

export interface Customer extends CustomerSummary {
  readonly email: string;
  readonly plan: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly limit: number;
  readonly offset: number;
  readonly total_count: number;
}

export interface Simulation {
  readonly id: number;
  readonly customer_id: number;
  readonly active_users: number;
  readonly storage_gb: number;
  readonly api_calls: number;
  readonly country_code: string;
  readonly plan: string;
  readonly base_amount: string;
  readonly tax_rate: string;
  readonly tax_amount: string;
  readonly total_amount: string;
  readonly currency: 'EUR';
  readonly created_at: string;
}

export interface ApiErrorDetail {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export interface ErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details: readonly ApiErrorDetail[];
  };
}

export type LoadState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: import('./api-error').ApiError };
