import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { customer, page, simulation } from '../../../testing/fixtures';
import { API_BASE_URL } from './api-base-url';
import { ApiError, toApiError } from './api-error';
import { CustomersApiService } from './customers-api.service';
import { SimulationsApiService } from './simulations-api.service';

describe('Servicios de lectura A-06', () => {
  let http: HttpTestingController;
  let customers: CustomersApiService;
  let simulations: SimulationsApiService;
  const base = 'http://api.test';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: base },
    ] });
    http = TestBed.inject(HttpTestingController);
    customers = TestBed.inject(CustomersApiService);
    simulations = TestBed.inject(SimulationsApiService);
  });

  afterEach(() => { http.verify(); vi.useRealTimers(); });

  it('envía la búsqueda literal con límite y offset y conserva el identificador', () => {
    const received = vi.fn();
    customers.search('Ábaco %_ & 000', 40).subscribe(received);
    const request = http.expectOne((r) => r.url === `${base}/customers`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('Ábaco %_ & 000');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('offset')).toBe('40');
    expect(request.request.urlWithParams).toContain('%26');
    request.flush(page([customer], 41, 40));
    expect(received).toHaveBeenCalledWith(page([customer], 41, 40));
  });

  it('consulta el directorio con q vacío y paginación inicial explícita', () => {
    customers.search('').subscribe();
    const request = http.expectOne(`${base}/customers?q=&limit=20&offset=0`);
    request.flush(page([]));
  });

  it('consulta el detalle por ID sin introducir parámetros ni cuerpo', () => {
    const received = vi.fn();
    customers.get(1).subscribe(received);
    const request = http.expectOne(`${base}/customers/1`);
    expect(request.request.method).toBe('GET');
    expect(request.request.body).toBeNull();
    request.flush(customer);
    expect(received).toHaveBeenCalledWith(customer);
  });

  it('pagina el historial y conserva todos los textos decimales y el snapshot', () => {
    const received = vi.fn();
    simulations.history(1, 20).subscribe(received);
    const request = http.expectOne(`${base}/customers/1/simulations?limit=20&offset=20`);
    expect(request.request.method).toBe('GET');
    request.flush(page([simulation], 21, 20));
    expect(received).toHaveBeenCalledWith(page([simulation], 21, 20));
    expect(received.mock.calls[0]?.[0].items[0].tax_rate).toBe('0.2000');
  });

  it.each(['búsqueda', 'detalle', 'historial'] as const)('mapea el sobre HTTP de %s sin perder los detalles', (operation) => {
    let source: Observable<unknown>;
    if (operation === 'búsqueda') source = customers.search('x');
    else if (operation === 'detalle') source = customers.get(1);
    else source = simulations.history(1);
    const failed = vi.fn();
    source.subscribe({ error: failed });
    const request = http.expectOne(() => true);
    const body = { error: { code: 'validation_error', message: 'Solicitud no válida.', details: [
      { field: 'q', code: 'too_long', message: 'Longitud superior al máximo admitido.' },
    ] } };
    request.flush(body, { status: 422, statusText: 'Unprocessable Entity' });
    expect(failed.mock.calls[0]?.[0]).toBeInstanceOf(ApiError);
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ status: 422, ...body.error }));
  });

  it('distingue un fallo de conexión de un error HTTP', () => {
    const failed = vi.fn();
    customers.search('').subscribe({ error: failed });
    http.expectOne(() => true).error(new ProgressEvent('error'));
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ status: 0, code: 'network_error' }));
  });

  it('no expone HTML o mensajes internos de una respuesta de error no conforme', () => {
    const failed = vi.fn();
    customers.get(1).subscribe({ error: failed });
    http.expectOne(() => true).flush('<html>información interna</html>', { status: 502, statusText: 'Bad Gateway' });
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ status: 502, code: 'unexpected_response' }));
    expect((failed.mock.calls[0]?.[0] as ApiError).message).not.toContain('información interna');
    expect(toApiError(new Error('secreto')).message).not.toContain('secreto');
  });

  it('limita una consulta sin respuesta a diez segundos y cancela la petición', () => {
    vi.useFakeTimers();
    const failed = vi.fn();
    simulations.history(1).subscribe({ error: failed });
    const request = http.expectOne(() => true);
    vi.advanceTimersByTime(10_001);
    expect(request.cancelled).toBe(true);
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ code: 'request_timeout' }));
  });
});
