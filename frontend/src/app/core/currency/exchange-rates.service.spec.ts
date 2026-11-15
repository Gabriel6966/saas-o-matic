import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { exchangeFixture } from '../../../testing/exchange-fixture';
import { EXCHANGE_URL, ExchangeRatesService, validateRates } from './exchange-rates.service';

describe('Tasas externas y caché en memoria', () => {
  let http: HttpTestingController;
  let service: ExchangeRatesService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(ExchangeRatesService);
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('comparte la petición en curso, conserva tasas decimales y reutiliza la caché', () => {
    const first = vi.fn(); const second = vi.fn(); const cached = vi.fn();
    service.getRates().subscribe(first); service.getRates().subscribe(second);
    const req = http.expectOne(EXCHANGE_URL);
    expect(req.request.method).toBe('GET'); expect(req.request.body).toBeNull();
    expect(req.request.withCredentials).toBe(false);
    req.flush(exchangeFixture());
    service.getRates().subscribe(cached);
    expect(first).toHaveBeenCalledWith(expect.objectContaining({ rates: { EUR: '1', USD: '1.2345', GBP: '0.85' } }));
    expect(second).toHaveBeenCalledWith(first.mock.calls[0]![0]);
    expect(cached).toHaveBeenCalledWith(first.mock.calls[0]![0]);
    http.expectNone(EXCHANGE_URL);
  });

  it('no cancela y duplica HTTP al abandonar una vista mientras la consulta está en curso', () => {
    const initial = service.getRates().subscribe(); const req = http.expectOne(EXCHANGE_URL);
    initial.unsubscribe();
    expect(req.cancelled).toBe(false);
    service.getRates().subscribe(); http.expectNone(EXCHANGE_URL);
    req.flush(exchangeFixture());
  });

  it('renueva al llegar a time_next_update_unix y nunca devuelve la caché vencida', () => {
    const now = Date.now(); const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    service.getRates().subscribe(); http.expectOne(EXCHANGE_URL).flush(exchangeFixture(now));
    clock.mockReturnValue(now + 3601000);
    const received = vi.fn(); service.getRates().subscribe(received);
    expect(received).not.toHaveBeenCalled();
    http.expectOne(EXCHANGE_URL).flush(exchangeFixture(now + 3601000));
    expect(received).toHaveBeenCalledOnce();
  });

  it.each(['missing', 'dates', 'error', 'base', 'nonfinite', 'negative', 'future', 'far_future'] as const)('rechaza %s y no cachea una respuesta corrupta', (kind) => {
    const now = Date.now(); const body = exchangeFixture(now);
    const corrupted: Record<string, unknown> = { ...body };
    if (kind === 'missing') corrupted['rates'] = { EUR: 1, USD: 1 };
    if (kind === 'dates') corrupted['time_next_update_unix'] = Math.floor(now / 1000) - 1;
    if (kind === 'error') corrupted['result'] = 'error';
    if (kind === 'base') corrupted['rates'] = { EUR: 2, USD: 1, GBP: 1 };
    if (kind === 'nonfinite') corrupted['rates'] = { EUR: 1, USD: Infinity, GBP: 1 };
    if (kind === 'negative') corrupted['rates'] = { EUR: 1, USD: 1, GBP: -1 };
    if (kind === 'future') corrupted['time_last_update_unix'] = Math.floor(now / 1000) + 60;
    if (kind === 'far_future') corrupted['time_next_update_unix'] = Math.floor(now / 1000) + 999999;
    expect(() => validateRates(corrupted, now)).toThrow();
    const failed = vi.fn(); service.getRates().subscribe({ error: failed });
    http.expectOne(EXCHANGE_URL).flush(corrupted);
    expect(failed).toHaveBeenCalledOnce();
    service.getRates().subscribe(); http.expectOne(EXCHANGE_URL).flush(body);
  });

  it.each(['network', '429', 'payload'] as const)('maneja %s sin reintentos automáticos', (kind) => {
    const failed = vi.fn(); service.getRates().subscribe({ error: failed });
    const req = http.expectOne(EXCHANGE_URL);
    if (kind === 'network') req.error(new ProgressEvent('error'));
    else if (kind === '429') req.flush({}, { status: 429, statusText: 'Too Many Requests' });
    else req.flush('<html>invalid</html>');
    expect(failed).toHaveBeenCalledOnce(); http.expectNone(EXCHANGE_URL);
  });

  it('acota la espera a diez segundos', () => {
    vi.useFakeTimers(); const failed = vi.fn(); service.getRates().subscribe({ error: failed });
    const req = http.expectOne(EXCHANGE_URL);
    vi.advanceTimersByTime(10001);
    expect(req.cancelled).toBe(true); expect(failed).toHaveBeenCalledOnce();
    http.expectNone(EXCHANGE_URL);
  });
});
