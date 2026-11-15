import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { customer } from '../../../testing/fixtures';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { CustomerCreateComponent } from './customer-create.component';

@Component({ template: '<h1>Ficha de prueba</h1>' })
class DetailDestination {}

describe('Alta de clientes', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let component: CustomerCreateComponent;
  const root = (): HTMLElement => harness.routeNativeElement!;
  function complete(): void {
    component.form.setValue({ company_name: ` ${customer.company_name} `, tax_identifier: customer.tax_identifier,
      email: customer.email, country_code: 'ES', plan: customer.plan });
    harness.detectChanges();
  }
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' },
      provideRouter([{ path: 'customers/new', component: CustomerCreateComponent },
        { path: 'customers/:customer_id', component: DetailDestination }]),
    ] });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create('/customers/new?q=Ficticia&offset=20');
    component = harness.routeDebugElement!.componentInstance as CustomerCreateComponent;
  });
  afterEach(() => { harness.fixture.destroy(); http.verify(); });

  it('valida localmente y enfoca el primer campo sin POST', () => {
    component.submit();
    harness.detectChanges();
    expect(root().textContent).toContain('Completa este campo');
    expect(document.activeElement?.id).toBe('create-company_name');
    http.expectNone(() => true);
    complete();
    component.form.controls.email.setValue('sin-correo');
    component.submit();
    expect(component.fieldError('email')).toContain('correo');
    http.expectNone(() => true);
  });

  it('crea con cinco campos, bloquea doble envío y navega solo tras 201 conservando el regreso', async () => {
    complete();
    component.submit();
    component.submit();
    const req = http.expectOne('/api/customers');
    expect(req.request.body).toEqual({ company_name: customer.company_name, tax_identifier: customer.tax_identifier,
      email: customer.email, country_code: 'ES', plan: customer.plan });
    harness.detectChanges();
    expect(root().querySelector('fieldset')?.disabled).toBe(true);
    expect(TestBed.inject(Router).url).toContain('/customers/new');
    req.flush(customer, { status: 201, statusText: 'Created' });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/customers/1?q=Ficticia&offset=20'));
    expect(component.created()).toEqual(customer);
    http.expectNone(() => true);
  });

  it('409 conserva los datos y señala el identificador', () => {
    complete(); component.submit();
    http.expectOne('/api/customers').flush({ error: { code: 'customer_already_exists', message: 'Duplicado.', details: [] } },
      { status: 409, statusText: 'Conflict' });
    harness.detectChanges();
    expect(component.fieldError('tax_identifier')).toContain('Ya existe');
    expect(component.form.controls.company_name.value).toBe(` ${customer.company_name} `);
    expect(component.created()).toBeNull();
    expect(document.activeElement?.id).toBe('create-feedback');
  });

  it('422 fiscal es autoritativo y sus detalles se asocian al campo', () => {
    complete();
    component.form.controls.tax_identifier.setValue('00000023A');
    component.submit(); // El frontend no implementa el checksum.
    http.expectOne('/api/customers').flush({ error: { code: 'invalid_tax_identifier_checksum', message: 'Control incorrecto.',
      details: [{ field: 'tax_identifier', code: 'invalid_tax_identifier_checksum', message: 'Revisa la letra de control.' }] } },
      { status: 422, statusText: 'Unprocessable Entity' });
    harness.detectChanges();
    expect(root().querySelector('#tax-error')?.textContent).toBe('Revisa la letra de control.');
    expect(root().querySelector('#create-tax_identifier')?.getAttribute('aria-invalid')).toBe('true');
    component.form.controls.tax_identifier.setValue(customer.tax_identifier);
    expect(component.fieldError('tax_identifier')).toBeNull();
  });

  it('422 de validación asocia otros campos sin perder sus valores', () => {
    complete(); component.submit();
    http.expectOne('/api/customers').flush({ error: { code: 'validation_error', message: 'Solicitud no válida.',
      details: [{ field: 'email', code: 'invalid_format', message: 'Correo no válido.' }] } },
      { status: 422, statusText: 'Unprocessable Entity' });
    expect(component.fieldError('email')).toBe('Correo no válido.');
    expect(component.form.controls.email.value).toBe(customer.email);
  });

  it.each(['network', 'unexpected'] as const)('%s no navega, no reintenta y conserva el formulario', (kind) => {
    complete(); component.submit();
    const req = http.expectOne('/api/customers');
    if (kind === 'network') req.error(new ProgressEvent('error'));
    else req.flush('<html>private failure</html>', { status: 500, statusText: 'Server error' });
    expect(component.submitting()).toBe(false);
    expect(component.created()).toBeNull();
    expect(component.error()).toContain('No pudimos confirmar');
    expect(component.error()).not.toContain('private failure');
    expect(component.form.controls.email.value).toBe(customer.email);
    expect(TestBed.inject(Router).url).toContain('/customers/new');
    http.expectNone(() => true);
  });

  it('no presenta éxito con un 200 inesperado', () => {
    complete(); component.submit();
    http.expectOne('/api/customers').flush(customer);
    expect(component.created()).toBeNull();
    expect(TestBed.inject(Router).url).toContain('/customers/new');
  });
});
