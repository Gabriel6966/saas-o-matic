import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { exchangeFixture } from '../../testing/exchange-fixture';
import { simulation } from '../../testing/fixtures';
import { EXCHANGE_URL } from '../core/currency/exchange-rates.service';
import { CurrencyDisplayComponent } from './currency-display.component';

describe('Selector de divisas', () => {
  let fixture: ComponentFixture<CurrencyDisplayComponent>;
  let http: HttpTestingController;
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const refresh = (): void => fixture.detectChanges();
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CurrencyDisplayComponent);
    fixture.componentRef.setInput('quote', simulation); refresh();
  });
  afterEach(() => { fixture.destroy(); http.verify(); vi.useRealTimers(); });

  it('EUR no necesita red y el selector tiene etiqueta y las tres opciones', () => {
    const select = root().querySelector<HTMLSelectElement>('select')!;
    expect(select.value).toBe('EUR'); expect(select.labels?.[0]?.textContent).toBe('Moneda de visualización');
    expect(Array.from(select.options).map((item) => item.value)).toEqual(['EUR', 'USD', 'GBP']);
    expect(root().textContent).toContain('Importes originales en EUR'); http.expectNone(() => true);
  });

  it('muestra carga, tasas y atribución, cambia USD/GBP sin otra petición ni escritura', () => {
    fixture.componentInstance.currency.setValue('USD'); refresh();
    expect(root().textContent).toContain('Consultando el cambio a USD');
    expect(root().textContent).not.toContain('207.40');
    const response = exchangeFixture(); http.expectOne(EXCHANGE_URL).flush(response); refresh();
    expect(root().textContent).toContain('207.40 USD');
    expect(root().querySelector('time')?.getAttribute('datetime')).toBe(new Date(response.time_last_update_unix * 1000).toISOString());
    expect(root().querySelector<HTMLAnchorElement>('.attribution')?.href).toBe('https://www.exchangerate-api.com/');
    fixture.componentInstance.currency.setValue('GBP'); refresh();
    expect(root().textContent).toContain('142.80 GBP');
    expect(simulation.total_amount).toBe('168.00'); http.expectNone(() => true);
  });

  it('editar consumo retira la conversión sin consultar otra vez y usa el nuevo resultado persistido', () => {
    fixture.componentInstance.currency.setValue('GBP'); http.expectOne(EXCHANGE_URL).flush(exchangeFixture()); refresh();
    fixture.componentRef.setInput('quote', null); refresh();
    expect(root().textContent).not.toContain('142.80 GBP');
    fixture.componentRef.setInput('quote', { ...simulation, total_amount: '169.40' }); refresh();
    expect(root().textContent).toContain('143.99 GBP');
    expect(fixture.componentInstance.currency.value).toBe('GBP'); http.expectNone(() => true);
  });

  it('navegar conserva la caché del servicio sin almacenar nada localmente', () => {
    fixture.componentInstance.currency.setValue('USD'); http.expectOne(EXCHANGE_URL).flush(exchangeFixture()); refresh();
    fixture.destroy(); fixture = TestBed.createComponent(CurrencyDisplayComponent); refresh();
    fixture.componentInstance.currency.setValue('GBP'); refresh(); http.expectNone(() => true);
    expect(fixture.componentInstance.state().status).toBe('ready');
  });

  it('retira USD al vencer la tasa y renueva; un fallo mantiene solo EUR', () => {
    vi.useFakeTimers(); const now = Date.now();
    fixture.componentInstance.currency.setValue('USD');
    http.expectOne(EXCHANGE_URL).flush(exchangeFixture(now, Math.floor(now / 1000) + 2)); refresh();
    expect(root().textContent).toContain('207.40 USD');
    vi.advanceTimersByTime(2100); refresh();
    expect(root().textContent).not.toContain('207.40 USD');
    http.expectOne(EXCHANGE_URL).error(new ProgressEvent('error')); refresh();
    expect(root().textContent).toContain('Se mantienen los importes EUR');
  });

  it('429 permite EUR siempre y el reintento es explícito', () => {
    fixture.componentInstance.currency.setValue('USD');
    http.expectOne(EXCHANGE_URL).flush({}, { status: 429, statusText: 'Too Many Requests' }); refresh();
    expect(root().textContent).toContain('limitado las consultas');
    http.expectNone(() => true);
    fixture.componentInstance.retry(); http.expectOne(EXCHANGE_URL).flush(exchangeFixture()); refresh();
    expect(root().textContent).toContain('207.40 USD');
    fixture.componentInstance.currency.setValue('EUR'); refresh();
    expect(root().textContent).not.toContain('207.40 USD'); http.expectNone(() => true);
  });
});
