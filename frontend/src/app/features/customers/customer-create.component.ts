import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';
import { toApiError } from '../../core/api/api-error';
import { CustomersApiService } from '../../core/api/customers-api.service';
import { Customer } from '../../core/api/models';
import { parseOffset } from '../../core/query';
import { basicTaxValidator, emailValidator, localFieldError, textValidator } from '../../shared/form-validation';

type Field = 'company_name' | 'tax_identifier' | 'email' | 'country_code' | 'plan';

@Component({
  selector: 'app-customer-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-create.component.html',
  styleUrl: './customer-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCreateComponent {
  private readonly api = inject(CustomersApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = new FormGroup({
    company_name: new FormControl('', { nonNullable: true, validators: textValidator(200) }),
    tax_identifier: new FormControl('', { nonNullable: true, validators: [textValidator(32), basicTaxValidator] }),
    email: new FormControl('', { nonNullable: true, validators: [textValidator(254), emailValidator] }),
    country_code: new FormControl('ES', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(ES|FR|DE)$/)] }),
    plan: new FormControl('', { nonNullable: true, validators: textValidator(100) }),
  });
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly created = signal<Customer | null>(null);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Partial<Record<Field, string>>>({});
  readonly backQuery = toSignal(this.route.queryParamMap.pipe(map((params) => ({
    q: params.get('q'), offset: parseOffset(params.get('offset')) || null,
  }))), { initialValue: { q: null, offset: null } });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.serverErrors.set({});
      this.error.set(null);
    });
  }

  fieldError(field: Field): string | null {
    return this.serverErrors()[field] ?? localFieldError(this.form.controls[field], this.submitted());
  }

  submit(): void {
    if (this.submitting() || this.created()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.focusFirstError();
      return;
    }
    const raw = this.form.getRawValue();
    this.error.set(null);
    this.serverErrors.set({});
    this.submitting.set(true);
    this.api.create({
      company_name: raw.company_name.trim(), tax_identifier: raw.tax_identifier.trim(),
      email: raw.email.trim(), country_code: raw.country_code, plan: raw.plan.trim(),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.submitting.set(false))).subscribe({
      next: (customer) => {
        this.created.set(customer);
        void this.router.navigate(['/customers', customer.id], {
          queryParams: this.backQuery(), replaceUrl: true, state: { createdCustomerId: customer.id },
        });
      },
      error: (cause: unknown) => {
        const error = toApiError(cause);
        if (error.status === 409 && error.code === 'customer_already_exists') {
          this.serverErrors.set({ tax_identifier: 'Ya existe un cliente con este país e identificador fiscal.' });
          this.error.set('Este cliente ya está registrado. Revisa el país y el identificador o búscalo en el directorio.');
        } else if (error.status === 422) {
          const fields: Partial<Record<Field, string>> = {};
          for (const detail of error.details) {
            if (Object.hasOwn(this.form.controls, detail.field)) fields[detail.field as Field] = detail.message;
          }
          if (error.code.startsWith('invalid_tax_identifier') || error.code === 'unsupported_tax_identifier') {
            fields.tax_identifier ??= error.message;
          }
          this.serverErrors.set(fields);
          this.error.set('No se ha creado el cliente. Revisa los campos indicados.');
        } else {
          this.error.set('No pudimos confirmar el alta. Tus datos se conservan. Comprueba el directorio antes de repetir el envío.');
        }
        // El resumen existe de forma permanente: puede recibir foco incluso antes del render.
        this.document.getElementById('create-feedback')?.focus();
      },
    });
  }

  private focusFirstError(): void {
    const field = (Object.keys(this.form.controls) as Field[]).find((key) => this.form.controls[key].invalid);
    if (field) this.document.getElementById(`create-${field}`)?.focus();
  }
}
