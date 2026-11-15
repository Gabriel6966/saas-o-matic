import { ValidatorFn } from '@angular/forms';

export function parseOffset(raw: string | null): number {
  if (!raw || !/^[0-9]+$/.test(raw)) return 0;
  const offset = Number(raw);
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
}

export function parseCustomerId(raw: string | null): number | null {
  if (!raw || !/^[0-9]+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function searchError(raw: string): string | null {
  if (/\p{Cc}/u.test(raw)) return 'Elimina los caracteres de control de la búsqueda.';
  if (Array.from(raw.trim()).length > 200) return 'Usa un máximo de 200 caracteres para buscar.';
  return null;
}

export const searchValidator: ValidatorFn = (control) => {
  const value: unknown = control.value;
  const message = typeof value === 'string' ? searchError(value) : 'Introduce un texto para buscar.';
  return message ? { search: message } : null;
};
