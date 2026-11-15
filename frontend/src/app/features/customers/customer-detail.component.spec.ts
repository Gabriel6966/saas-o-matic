import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { customer, page, serviceError, simulation } from '../../../testing/fixtures';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { CustomerDetailComponent } from './customer-detail.component';
import { SimulationEditorComponent } from '../simulations/simulation-editor.component';
import { SimulationHistoryComponent } from '../simulations/simulation-history.component';

@Component({ template: '<h1>Directorio</h1>' })
class SearchDestination {}

describe('Ficha de cliente y navegación', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  const root = (): HTMLElement => harness.routeNativeElement!;
  const refresh = (): void => harness.detectChanges();
  async function request(path: string): Promise<TestRequest> {
    return vi.waitFor(() => http.expectOne((r) => r.url === `/api${path}`));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' },
      provideRouter([
        { path: 'customers', component: SearchDestination },
        { path: 'customers/:customer_id', component: CustomerDetailComponent },
      ]),
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { harness?.fixture.destroy(); http.verify(); });

  it('carga la ficha completa, el historial vacío y el enlace de regreso con contexto', async () => {
    harness = await RouterTestingHarness.create('/customers/1?q=Ábaco&offset=20');
    expect(root().textContent).toContain('Cargando la ficha');
    (await request('/customers/1')).flush(customer);
    refresh();
    (await request('/customers/1/simulations')).flush(page([]));
    refresh();
    for (const value of [customer.company_name, customer.tax_identifier, customer.email, customer.plan, 'España']) {
      expect(root().textContent).toContain(value);
    }
    expect(root().querySelector('.identity-card h2')?.textContent).toBe(customer.company_name);
    expect(root().textContent).toContain('Todavía no hay simulaciones');
    const back = new URL(root().querySelector<HTMLAnchorElement>('.back-link')!.href);
    expect(back.pathname).toBe('/customers');
    expect(back.searchParams.get('q')).toBe('Ábaco');
    expect(back.searchParams.get('offset')).toBe('20');
    expect(root().querySelector<HTMLAnchorElement>('a[href^="mailto:"]')?.getAttribute('href')).toBe('mailto:pruebas@example.com');
    expect(root().textContent).not.toContain('Nueva simulación');
  });

  it.each(['abc', '0', '9007199254740992'])('rechaza la ruta inválida %s sin llamar a FastAPI', async (id) => {
    harness = await RouterTestingHarness.create(`/customers/${id}`);
    expect(root().textContent).toContain('Identificador de cliente no válido');
    http.expectNone(() => true);
  });

  it('distingue un cliente inexistente sin intentar cargar su historial', async () => {
    harness = await RouterTestingHarness.create('/customers/99');
    (await request('/customers/99')).flush({ error: {
      code: 'customer_not_found', message: 'El cliente no existe.', details: [],
    } }, { status: 404, statusText: 'Not Found' });
    refresh();
    expect(root().textContent).toContain('Este cliente no existe');
    http.expectNone((r) => r.url.endsWith('/simulations'));
  });

  it('permite reintentar la ficha tras un fallo HTTP', async () => {
    harness = await RouterTestingHarness.create('/customers/1');
    (await request('/customers/1')).flush(serviceError, { status: 500, statusText: 'Internal Server Error' });
    refresh();
    root().querySelector<HTMLButtonElement>('button')!.click();
    (await request('/customers/1')).flush(customer);
    refresh();
    (await request('/customers/1/simulations')).flush(page([]));
    refresh();
    expect(root().querySelector('h1')?.textContent).toBe('Ficha de cliente');
    expect(root().querySelector('.identity-card h2')?.textContent).toBe(customer.company_name);
    expect(document.activeElement?.id).toBe('page-title');
  });

  it('un fallo de historial mantiene la ficha y su reintento es independiente', async () => {
    harness = await RouterTestingHarness.create('/customers/1');
    (await request('/customers/1')).flush(customer);
    refresh();
    (await request('/customers/1/simulations')).error(new ProgressEvent('error'));
    refresh();
    expect(root().textContent).toContain(customer.email);
    expect(root().textContent).toContain('No se pudo cargar el historial');
    root().querySelector<HTMLButtonElement>('.history button')!.click();
    (await request('/customers/1/simulations')).flush(page([]));
    refresh();
    http.expectNone((r) => r.url === '/api/customers/1');
    expect(root().textContent).toContain('Todavía no hay simulaciones');
    expect(document.activeElement?.id).toBe('history-title');
  });

  it('cancela un detalle pendiente al cambiar el parámetro de cliente', async () => {
    harness = await RouterTestingHarness.create('/customers/1');
    const old = await request('/customers/1');
    await harness.navigateByUrl('/customers/2');
    expect(old.cancelled).toBe(true);
    (await request('/customers/2')).flush({ ...customer, id: 2, company_name: 'Segunda empresa ficticia' });
    refresh();
    (await request('/customers/2/simulations')).flush(page([]));
    refresh();
    expect(root().querySelector('.identity-card h2')?.textContent).toBe('Segunda empresa ficticia');
  });

  it('cancela el historial pendiente cuando se abandona la ficha anterior', async () => {
    harness = await RouterTestingHarness.create('/customers/1');
    (await request('/customers/1')).flush(customer);
    refresh();
    const oldHistory = await request('/customers/1/simulations');
    await harness.navigateByUrl('/customers/2');
    expect(oldHistory.cancelled).toBe(true);
    (await request('/customers/2')).flush({ ...customer, id: 2 });
    refresh();
    (await request('/customers/2/simulations')).flush(page([]));
    refresh();
  });

  it('un 201 refresca el historial desde la primera página y conserva la ficha y snapshots', async () => {
    harness = await RouterTestingHarness.create('/customers/1?q=Ábaco&offset=20');
    (await request('/customers/1')).flush(customer); refresh();
    (await request('/customers/1/simulations')).flush(page([simulation], 21)); refresh();
    const history = harness.routeDebugElement!.query(By.directive(SimulationHistoryComponent)).componentInstance as SimulationHistoryComponent;
    history.goToOffset(20);
    const oldPage = await request('/customers/1/simulations');
    expect(oldPage.request.params.get('offset')).toBe('20');
    oldPage.flush(page([simulation], 21, 20)); refresh();
    const editor = harness.routeDebugElement!.query(By.directive(SimulationEditorComponent)).componentInstance as SimulationEditorComponent;
    editor.form.setValue({ active_users: '15', storage_gb: '100', api_calls: '1000' });
    (await request('/simulations/preview')).flush(simulation); refresh();
    editor.save();
    const persisted = { ...simulation, id: 102, country_code: 'ES', tax_rate: '0.21', tax_amount: '29.40', total_amount: '169.40' };
    (await request('/simulations')).flush(persisted, { status: 201, statusText: 'Created' }); refresh();
    const refreshed = await request('/customers/1/simulations');
    expect(refreshed.request.params.get('offset')).toBe('0');
    refreshed.flush(page([persisted, simulation], 22)); refresh();
    expect(root().querySelector('.identity-card')?.textContent).toContain(customer.company_name);
    expect(root().querySelector('.history')?.textContent).toContain('Simulación #102');
    expect(root().querySelector('.history')?.textContent).toContain('0.2000');
    expect(root().querySelector('.back-link')?.getAttribute('href')).toContain('offset=20');
    http.expectNone((r) => r.url === '/api/customers/1');
  });
});
