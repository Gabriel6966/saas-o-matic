import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { customer, simulation } from '../../../testing/fixtures';
import { API_BASE_URL } from './api-base-url';
import { CustomersApiService } from './customers-api.service';
import { SimulationsApiService } from './simulations-api.service';

describe('Escrituras A-06', () => {
  let http: HttpTestingController;
  let customers: CustomersApiService;
  let simulations: SimulationsApiService;
  const input = { customer_id: 1, active_users: 15, storage_gb: 100, api_calls: 1000 };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' },
    ] });
    http = TestBed.inject(HttpTestingController);
    customers = TestBed.inject(CustomersApiService);
    simulations = TestBed.inject(SimulationsApiService);
  });
  afterEach(() => http.verify());

  it('POST de alta envía solo los cinco campos y confirma 201', () => {
    const received = vi.fn();
    customers.create(customer).subscribe(received);
    const req = http.expectOne('/api/customers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ company_name: customer.company_name, tax_identifier: customer.tax_identifier,
      email: customer.email, country_code: customer.country_code, plan: customer.plan });
    req.flush(customer, { status: 201, statusText: 'Created' });
    expect(received).toHaveBeenCalledWith(customer);
  });

  it.each(['preview', 'save'] as const)('%s excluye todo dato calculado, incluso si el objeto recibido contiene extras', (operation) => {
    const received = vi.fn();
    simulations[operation](simulation).subscribe(received);
    const req = http.expectOne(`/api/simulations${operation === 'preview' ? '/preview' : ''}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    const result = { ...simulation, base_amount: '140.00', tax_rate: '0.2000', total_amount: '168.00' };
    req.flush(result, { status: operation === 'preview' ? 200 : 201, statusText: 'OK' });
    expect(received).toHaveBeenCalledWith(result);
  });

  it.each(['create', 'save'] as const)('%s no presenta éxito si llega 200 en lugar de 201', (operation) => {
    const next = vi.fn();
    const error = vi.fn();
    const source: Observable<unknown> = operation === 'create' ? customers.create(customer) : simulations.save(input);
    source.subscribe({ next, error });
    http.expectOne(() => true).flush(operation === 'create' ? customer : simulation);
    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: 'unexpected_response', status: 200 }));
    http.expectNone(() => true);
  });

  it('no confirma un 201 sin recurso identificado', () => {
    const error = vi.fn();
    simulations.save(input).subscribe({ error });
    http.expectOne('/api/simulations').flush(null, { status: 201, statusText: 'Created' });
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: 'unexpected_response' }));
  });
});
