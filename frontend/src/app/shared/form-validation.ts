import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export function textValidator(max: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const raw = control.value;
    if (!raw.trim()) return { required: true };
    if (/\p{Cc}/u.test(raw)) return { format: true };
    return Array.from(raw.trim()).length > max ? { length: { max } } : null;
  };
}

export const emailValidator: ValidatorFn = (control: AbstractControl<string>) =>
  Validators.email({ value: control.value.trim() } as AbstractControl);

// Solo caracteres básicos. El control fiscal completo pertenece al backend.
export const basicTaxValidator: ValidatorFn = (control: AbstractControl<string>) =>
  /^[A-Za-z0-9 ./-]+$/.test(control.value.trim()) ? null : { format: true };

/** Mantiene texto hasta validar; nunca usa parseFloat, truncado o redondeo. */
export function integerValue(raw: string): number | null {
  if (!/^[0-9]+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000 ? value : null;
}

export const integerValidator: ValidatorFn = (control: AbstractControl<string>) =>
  integerValue(control.value) === null ? { integer: true } : null;

export function localFieldError(control: AbstractControl, submitted: boolean): string | null {
  if (!control.invalid || (!control.touched && !submitted)) return null;
  if (control.hasError('required')) return 'Completa este campo.';
  if (control.hasError('email')) return 'Escribe un correo electrónico válido.';
  if (control.hasError('length')) return `Usa como máximo ${control.getError('length').max} caracteres.`;
  if (control.hasError('integer')) return 'Escribe un entero de 0 a 1000000, sin decimales ni separadores.';
  return 'Revisa el formato; no se admiten caracteres de control.';
}
