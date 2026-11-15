import { HttpErrorResponse } from '@angular/common/http';
import { catchError, MonoTypeOperatorFunction, throwError, timeout, TimeoutError } from 'rxjs';
import { ApiErrorDetail, ErrorEnvelope } from './models';

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: readonly ApiErrorDetail[] = [],
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEnvelope(value: unknown): value is ErrorEnvelope {
  if (!isRecord(value) || !isRecord(value['error'])) return false;
  const error = value['error'];
  return typeof error['code'] === 'string'
    && typeof error['message'] === 'string'
    && Array.isArray(error['details'])
    && error['details'].every((detail: unknown) => isRecord(detail)
      && typeof detail['field'] === 'string'
      && typeof detail['code'] === 'string'
      && typeof detail['message'] === 'string');
}

export function toApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) return cause;
  if (cause instanceof TimeoutError) {
    return new ApiError(0, 'request_timeout', 'La consulta está tardando demasiado. Vuelve a intentarlo.');
  }
  if (cause instanceof HttpErrorResponse) {
    if (cause.status === 0) {
      return new ApiError(0, 'network_error', 'No se pudo conectar con el servicio. Comprueba que esté disponible y vuelve a intentarlo.');
    }
    const body: unknown = cause.error;
    if (isEnvelope(body)) {
      return new ApiError(cause.status, body.error.code, body.error.message, body.error.details);
    }
    return new ApiError(cause.status, 'unexpected_response', 'El servicio no pudo completar la consulta. Vuelve a intentarlo.');
  }
  return new ApiError(0, 'unexpected_error', 'No se pudo completar la consulta. Vuelve a intentarlo.');
}

/** Acota lecturas sin respuesta y mantiene el mismo sobre de error en la UI. */
export function withApiErrors<T>(): MonoTypeOperatorFunction<T> {
  return (source) => source.pipe(
    timeout({ first: 10_000 }),
    catchError((cause: unknown) => throwError(() => toApiError(cause))),
  );
}
