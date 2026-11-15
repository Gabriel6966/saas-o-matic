import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { simulation } from '../../../testing/fixtures';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { SimulationEditorComponent } from './simulation-editor.component';
import { By } from '@angular/platform-browser';
import { CurrencyDisplayComponent } from '../../shared/currency-display.component';
import { EXCHANGE_URL } from '../../core/currency/exchange-rates.service';
import { exchangeFixture } from '../../../testing/exchange-fixture';

describe('Simulador reactivo', () => {
  let fixture: ComponentFixture<SimulationEditorComponent>;
  let http: HttpTestingController;
  let component: SimulationEditorComponent;
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const refresh = (): void => fixture.detectChanges();
  const input = { customer_id: 1, active_users: 15, storage_gb: 100, api_calls: 1000 };
  const quote = { ...simulation };
  async function preview(): Promise<TestRequest> {
    return vi.waitFor(() => http.expectOne('/api/simulations/preview'), { timeout: 2000 });
  }
  function fill(users = '15', storage = '100', calls = '1000'): void {
    component.form.setValue({ active_users: users, storage_gb: storage, api_calls: calls }); refresh();
  }
  async function ready(): Promise<void> {
    fill(); (await preview()).flush(quote); refresh();
  }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' },
    ] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SimulationEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customerId', 1); refresh();
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  it('empieza sin petición y permite calcular cero con payload de enteros', async () => {
    expect(root().textContent).toContain('Prepara tu simulación');
    http.expectNone(() => true);
    component.calculate();
    const req = await preview();
    expect(req.request.body).toEqual({ customer_id: 1, active_users: 0, storage_gb: 0, api_calls: 0 });
    req.flush({ ...quote, active_users: 0, storage_gb: 0, api_calls: 0, base_amount: '0.00', tax_amount: '0.00', total_amount: '0.00' });
    refresh();
    expect(root().textContent).toContain('0.00 EUR');
    expect(component.canSave()).toBe(true);
  });

  it('guardar mientras se visualiza USD envía cuatro entradas y conserva EUR original e histórico', async () => {
    await ready();
    const display = fixture.debugElement.query(By.directive(CurrencyDisplayComponent)).componentInstance as CurrencyDisplayComponent;
    display.currency.setValue('USD'); http.expectOne(EXCHANGE_URL).flush(exchangeFixture()); refresh();
    expect(root().textContent).toContain('207.40 USD');
    expect(root().querySelector('.quote-total')?.textContent).toContain('168.00 EUR');
    component.save();
    const req = http.expectOne('/api/simulations'); expect(req.request.body).toEqual(input);
    req.flush({ ...simulation, id: 103, country_code: 'ES', tax_rate: '0.21', tax_amount: '29.40', total_amount: '169.40' }, { status: 201, statusText: 'Created' }); refresh();
    expect(root().querySelector('.quote-total')?.textContent).toContain('169.40 EUR');
    expect(root().textContent).toContain('209.12 USD');
    expect(root().textContent).toContain('36.29 USD');
    expect(component.receipt()?.data.currency).toBe('EUR');
    http.expectNone(() => true);
  });

  it('debounce de 300 ms agrupa cambios rápidos sin llamadas tempranas', async () => {
    fill('11'); fill('14'); fill('15');
    expect(component.state().status).toBe('pending');
    http.expectNone(() => true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    http.expectNone(() => true);
    const req = await preview();
    expect(req.request.body).toEqual(input);
    req.flush(quote); refresh();
    expect(root().textContent).toContain('168.00 EUR');
    expect(root().textContent).toContain('0.2000');
  });

  it('no vuelve a consultar si los tres textos relevantes no cambian', async () => {
    await ready();
    fill();
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectNone(() => true);
    expect(component.state().status).toBe('ready');
  });

  it('una edición retira inmediatamente un precio y cancela el HTTP anterior antes del debounce', async () => {
    await ready();
    fill('16');
    expect(root().textContent).not.toContain('168.00 EUR');
    const old = await preview();
    fill('17');
    expect(old.cancelled).toBe(true);
    expect(component.canSave()).toBe(false);
    http.expectNone(() => true); // No espera 300 ms para cancelar.
    expect(() => old.flush(quote)).toThrow();
    const current = await preview();
    expect(current.request.body.active_users).toBe(17);
    current.flush({ ...quote, active_users: 17, total_amount: '180.00' }); refresh();
    expect(root().textContent).toContain('180.00 EUR');
    expect(root().textContent).not.toContain('168.00 EUR');
  });

  it('una entrada inválida cancela inmediatamente y no deja reaparecer la respuesta', async () => {
    fill(); const old = await preview();
    fill('15', '1.5');
    expect(old.cancelled).toBe(true);
    expect(component.state().status).toBe('invalid');
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectNone(() => true);
    expect(component.canSave()).toBe(false);
    expect(root().textContent).not.toContain('168.00 EUR');
  });

  it.each(['1.5', '1.0', '1e3', '-1', '+1', '1,5', ' 1 ', '', '1000001'])('rechaza %s en cualquiera de los tres campos sin truncar ni enviar POST', async (raw) => {
    for (const field of ['active_users', 'storage_gb', 'api_calls'] as const) {
      component.form.setValue({ active_users: '0', storage_gb: '0', api_calls: '0', [field]: raw });
      expect(component.form.controls[field].invalid).toBe(true);
      component.calculate(); component.save();
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectNone(() => true);
  });

  it('sincroniza deslizador y texto, conserva un millón y no envía fracciones', async () => {
    const slider = root().querySelector<HTMLInputElement>('#users-slider')!;
    slider.value = '300'; slider.dispatchEvent(new Event('input')); refresh();
    expect(component.form.controls.active_users.value).toBe('300');
    expect(root().querySelector<HTMLInputElement>('#simulation-active_users')?.value).toBe('300');
    fill('1000000', '1000000', '1000000');
    expect(slider.value).toBe('1000');
    expect(root().querySelector<HTMLInputElement>('#simulation-active_users')?.value).toBe('1000000');
    expect(root().textContent).toContain('Se conserva ese valor');
    const req = await preview();
    expect(req.request.body).toEqual({ customer_id: 1, active_users: 1000000, storage_gb: 1000000, api_calls: 1000000 });
    req.flush({ ...quote, active_users: 1000000 });
    slider.value = '0'; slider.dispatchEvent(new Event('input')); refresh();
    expect(component.form.controls.active_users.value).toBe('0');
    (await preview()).flush({ ...quote, active_users: 0 });
  });

  it('se recupera de un error por petición al volver a editar', async () => {
    fill(); (await preview()).error(new ProgressEvent('error')); refresh();
    expect(root().textContent).toContain('No se pudo calcular');
    fill('16');
    (await preview()).flush({ ...quote, active_users: 16 }); refresh();
    expect(component.state().status).toBe('ready');
    expect(root().textContent).not.toContain('No se pudo calcular');
  });

  it('distingue país sin política fiscal y permite un reintento explícito', async () => {
    fill(); (await preview()).flush({ error: { code: 'tax_policy_not_configured', message: 'Sin política.', details: [] } },
      { status: 422, statusText: 'Unprocessable Entity' }); refresh();
    expect(root().textContent).toContain('País sin política fiscal');
    expect(component.canSave()).toBe(false);
    component.calculate(); (await preview()).flush(quote); refresh();
    expect(component.state().status).toBe('ready');
  });

  it('confirma solo 201, bloquea dobles envíos y muestra el resultado persistido aunque difiera', async () => {
    await ready();
    const saved = vi.fn(); component.saved.subscribe(saved);
    component.save(); component.save(); refresh();
    const req = http.expectOne('/api/simulations');
    expect(req.request.body).toEqual(input);
    expect(root().querySelector('fieldset')?.disabled).toBe(true);
    expect(root().textContent).not.toContain('Simulación #102 guardada');
    const persisted = { ...simulation, id: 102, total_amount: '169.40', tax_amount: '29.40', tax_rate: '0.21', country_code: 'ES' };
    req.flush(persisted, { status: 201, statusText: 'Created' }); refresh();
    expect(saved).toHaveBeenCalledExactlyOnceWith(persisted);
    expect(root().textContent).toContain('Simulación #102 guardada');
    expect(root().textContent).toContain('difiere de la preview');
    expect(root().querySelector('.quote-total')?.textContent).toContain('169.40 EUR');
    expect(root().textContent).toContain('0.21');
    expect(document.activeElement?.id).toBe('simulation-feedback');
    expect(component.canSave()).toBe(false);
    component.save(); http.expectNone(() => true);
  });

  it('un 422 de guardado no confirma éxito y permite corregir y recalcular', async () => {
    await ready(); const saved = vi.fn(); component.saved.subscribe(saved);
    component.save();
    http.expectOne('/api/simulations').flush({ error: { code: 'validation_error', message: 'Revisa las entradas.',
      details: [{ field: 'storage_gb', code: 'out_of_range', message: 'Almacenamiento no válido.' }] } },
      { status: 422, statusText: 'Unprocessable Entity' }); refresh();
    expect(saved).not.toHaveBeenCalled();
    expect(root().textContent).toContain('Almacenamiento no válido');
    expect(component.canSave()).toBe(false);
    expect(component.uncertain()).toBe(false);
    fill('15', '200'); (await preview()).flush({ ...quote, storage_gb: 200 }); refresh();
    expect(component.canSave()).toBe(true);
    expect(root().textContent).not.toContain('Almacenamiento no válido');
  });

  it.each(['network', '200'] as const)('guardado %s es incierto y nunca se repite automáticamente', async (kind) => {
    await ready(); const saved = vi.fn(); component.saved.subscribe(saved);
    component.save();
    const req = http.expectOne('/api/simulations');
    if (kind === 'network') req.error(new ProgressEvent('error')); else req.flush(simulation);
    refresh();
    expect(saved).not.toHaveBeenCalled();
    expect(component.uncertain()).toBe(true);
    expect(root().textContent).toContain('Puede haberse registrado');
    component.save(); http.expectNone(() => true);
    // Editar permite preview, pero no desbloquea una repetición incierta.
    fill('16'); (await preview()).flush({ ...quote, active_users: 16 });
    expect(component.canSave()).toBe(false);
    component.calculate(); (await preview()).flush({ ...quote, active_users: 16 });
    expect(component.canSave()).toBe(true);
  });

  it('cancela preview y reinicia al cambiar cliente; libera HTTP al destruir', async () => {
    fill(); const old = await preview();
    fixture.componentRef.setInput('customerId', 2); refresh();
    expect(old.cancelled).toBe(true);
    expect(component.values().active_users).toBe('0');
    expect(component.state().status).toBe('idle');
    component.calculate(); const next = await preview();
    expect(next.request.body.customer_id).toBe(2);
    fixture.destroy();
    expect(next.cancelled).toBe(true);
  });
});
