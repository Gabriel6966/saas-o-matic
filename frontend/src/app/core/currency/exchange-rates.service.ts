import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, finalize, map, Observable, of, shareReplay, tap, timeout } from 'rxjs';

export type Currency = 'EUR' | 'USD' | 'GBP';
export const EXCHANGE_URL = 'https://open.er-api.com/v6/latest/EUR';
export interface ExchangeRates {
  readonly lastUpdate: number;
  readonly nextUpdate: number;
  readonly rates: Readonly<Record<Currency, string>>;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateRates(body: unknown, now = Date.now()): ExchangeRates {
  if (!record(body) || body['result'] !== 'success' || body['base_code'] !== 'EUR' || !record(body['rates'])) {
    throw new Error('Respuesta de divisas no válida');
  }
  const last = body['time_last_update_unix'];
  const next = body['time_next_update_unix'];
  const nowSeconds = now / 1000;
  // Ventana acotada para un proveedor diario; no aceptar meses de vigencia accidental.
  if (typeof last !== 'number' || typeof next !== 'number' || !Number.isSafeInteger(last) || !Number.isSafeInteger(next)
    || last <= 0 || last > nowSeconds || next <= nowSeconds || next <= last || next - last > 172800 || nowSeconds - last > 172800) {
    throw new Error('Fechas de divisas no válidas o vencidas');
  }
  const rates = body['rates'];
  for (const key of ['EUR', 'USD', 'GBP'] as const) {
    const value = rates[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Falta una tasa válida');
  }
  if (rates['EUR'] !== 1) throw new Error('La base no es EUR');
  // Las tasas JSON son números del proveedor. Se fija su representación decimal
  // antes de operar; ningún importe EUR se convierte a number.
  return Object.freeze({ lastUpdate: last, nextUpdate: next, rates: Object.freeze({
    EUR: '1', USD: String(rates['USD']), GBP: String(rates['GBP']),
  }) });
}

export function exchangeError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 429) {
    return 'El proveedor ha limitado las consultas. Espera antes de reintentar. Se mantienen los importes EUR.';
  }
  return 'No hay un tipo de cambio vigente disponible. Se mantienen los importes EUR. Puedes reintentar la consulta.';
}

@Injectable({ providedIn: 'root' })
export class ExchangeRatesService {
  private readonly http = inject(HttpClient);
  private cache: ExchangeRates | null = null;
  private inFlight: Observable<ExchangeRates> | null = null;

  getRates(): Observable<ExchangeRates> {
    return defer(() => {
      const now = Date.now();
      if (this.cache && now >= this.cache.lastUpdate * 1000 && now < this.cache.nextUpdate * 1000) return of(this.cache);
      this.cache = null;
      if (!this.inFlight) {
        this.inFlight = this.http.get<unknown>(EXCHANGE_URL, { withCredentials: false }).pipe(
          timeout({ first: 10000 }),
          map((body) => validateRates(body)),
          tap((data) => this.cache = data),
          finalize(() => this.inFlight = null),
          // Una petición compartida y acotada puede terminar aunque se vuelva a EUR.
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }
      return this.inFlight;
    });
  }
}
