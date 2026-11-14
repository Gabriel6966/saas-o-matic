import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { customer, page, serviceError } from '../../../testing/fixtures';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { CustomerSearchComponent } from './customer-search.component';

@Component({ template: '<h1>Ficha</h1>' })
class DetailDestination {}

describe('Directorio de clientes', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' },
      provideRouter([
        { path: 'customers', component: CustomerSearchComponent },
        { path: 'customers/:customer_id', component: DetailDestination },
      ]),
    ] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { harness?.fixture.destroy(); http.verify(); });

  const root = (): HTMLElement => harness.routeNativeElement!;
  const refresh = (): void => harness.detectChanges();
  async function request(q = '', offset = 0): Promise<TestRequest> {
    return vi.waitFor(() => http.expectOne((r) => r.url === '/api/customers'
      && r.params.get('q') === q && r.params.get('offset') === String(offset)));
  }
  function type(value: string): void {
    const input = root().querySelector<HTMLInputElement>('#customer-search')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    refresh();
  }
  function button(text: string): HTMLButtonElement {
    return Array.from(root().querySelectorAll('button')).find((el) => el.textContent?.trim() === text)!;
  }

  it('anuncia carga y distingue un directorio sin clientes', async () => {
    harness = await RouterTestingHarness.create('/customers');
    expect(root().textContent).toContain('Buscando clientes');
    (await request()).flush(page([]));
    refresh();
    expect(root().textContent).toContain('Todavía no hay clientes');
    expect(root().querySelector('[role="status"]')).not.toBeNull();
  });

  it('distingue sin coincidencias y permite limpiar la búsqueda', async () => {
    harness = await RouterTestingHarness.create('/customers?q=desconocida');
    (await request('desconocida')).flush(page([]));
    refresh();
    expect(root().textContent).toContain('No hay coincidencias');
    button('Limpiar búsqueda').click();
    (await request()).flush(page([customer]));
    refresh();
    expect(root().textContent).toContain(customer.company_name);
    expect(root().querySelector<HTMLInputElement>('input')?.value).toBe('');
  });

  it('cancela la consulta anterior inmediatamente y espera el debounce de la nueva', async () => {
    harness = await RouterTestingHarness.create('/customers');
    const old = await request();
    type('Ábaco');
    expect(old.cancelled).toBe(true);
    http.expectNone((r) => r.params.get('q') === 'Ábaco');
    const current = await request('Ábaco');
    type('Segunda');
    expect(current.cancelled).toBe(true);
    expect(root().textContent).toContain('Buscando clientes');
    const latest = await request('Segunda');
    latest.flush(page([{ ...customer, company_name: 'Segunda empresa ficticia' }]));
    refresh();
    expect(root().textContent).toContain('Segunda empresa ficticia');
    expect(root().textContent).not.toContain(customer.company_name);
  });

  it('un término inválido cancela la consulta sin emitir otra y permite corregirlo', async () => {
    harness = await RouterTestingHarness.create('/customers');
    const old = await request();
    type('x'.repeat(201));
    expect(old.cancelled).toBe(true);
    expect(root().querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    expect(root().textContent).toContain('máximo de 200');
    http.expectNone(() => true);
    type('Ábaco');
    (await request('Ábaco')).flush(page([customer]));
    refresh();
    expect(root().textContent).toContain(customer.tax_identifier);
  });

  it('muestra un fallo de conexión y reintenta sin cerrar el flujo', async () => {
    harness = await RouterTestingHarness.create('/customers');
    (await request()).error(new ProgressEvent('error'));
    refresh();
    expect(root().querySelector('[role="alert"]')?.textContent).toContain('No se pudo conectar');
    button('Reintentar').click();
    (await request()).flush(page([customer]));
    refresh();
    expect(root().textContent).toContain(customer.company_name);
    expect(document.activeElement?.id).toBe('results-title');
  });

  it('una búsqueda posterior se recupera de un error HTTP', async () => {
    harness = await RouterTestingHarness.create('/customers');
    (await request()).flush(serviceError, { status: 500, statusText: 'Internal Server Error' });
    refresh();
    expect(root().textContent).toContain('No se pudo cargar el directorio');
    type('nueva');
    (await request('nueva')).flush(page([]));
    refresh();
    expect(root().textContent).toContain('No hay coincidencias');
    expect(root().querySelector('[role="alert"]')).toBeNull();
  });

  it('restaura búsqueda y página desde la URL y las incluye en el enlace de ficha', async () => {
    harness = await RouterTestingHarness.create('/customers?q=Ábaco&offset=20');
    (await request('Ábaco', 20)).flush(page([customer], 41, 20));
    refresh();
    expect(root().querySelector<HTMLInputElement>('input')?.value).toBe('Ábaco');
    const href = root().querySelector<HTMLAnchorElement>('.customer-row')!.getAttribute('href')!;
    expect(href).toContain('/customers/1?');
    expect(href).toContain('offset=20');
    button('Siguiente').click();
    (await request('Ábaco', 40)).flush(page([customer], 41, 40));
    refresh();
    expect(root().textContent).toContain('41–41 de 41');
    expect(button('Siguiente').disabled).toBe(true);
    expect(document.activeElement?.id).toBe('results-title');
  });

  it('ofrece volver al inicio cuando el offset ya no contiene elementos', async () => {
    harness = await RouterTestingHarness.create('/customers?offset=40');
    (await request('', 40)).flush(page([], 1, 40));
    refresh();
    expect(root().textContent).toContain('Esta página está vacía');
    button('Volver al inicio').click();
    (await request()).flush(page([customer]));
    refresh();
    expect(root().textContent).toContain('1–1 de 1');
  });
});
