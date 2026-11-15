import { HttpResponse } from '@angular/common/http';
import { ApiError } from './api-error';

/** Un 2xx distinto de 201 no confirma la creación del contrato. Sin reintentos. */
export function createdResponse<T extends { readonly id: number }>(response: HttpResponse<T>): T {
  const body = response.body;
  if (response.status !== 201 || !body || !Number.isSafeInteger(body.id) || body.id <= 0) {
    throw new ApiError(response.status, 'unexpected_response', 'El servicio no confirmó la creación.');
  }
  return body;
}
