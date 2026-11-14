import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page, simulation } from '../../../testing/fixtures';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { SimulationHistoryComponent } from './simulation-history.component';

describe('Historial original de simulaciones', () => {
  let fixture: ComponentFixture<SimulationHistoryComponent>;
  let http: HttpTestingController;
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' },
    ] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SimulationHistoryComponent);
    fixture.componentRef.setInput('customerId', 1);
    fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  async function request(id = 1, offset = 0): Promise<TestRequest> {
    return vi.waitFor(() => http.expectOne(`/api/customers/${id}/simulations?limit=20&offset=${offset}`));
  }

  it('muestra consumos, decimales intactos, fecha UTC y contexto original', async () => {
    (await request()).flush(page([simulation]));
    fixture.detectChanges();
    const text = root().textContent!.replace(/\s+/g, ' ');
    for (const value of ['168.00 EUR', '140.00 EUR', '28.00 EUR', '0.2000', '15', '100 GB', '1000', 'Francia', simulation.plan]) {
      expect(text).toContain(value);
    }
    const time = root().querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe('2026-11-12T23:59:59Z');
    expect(time.textContent).toContain('23:59:59 UTC');
    expect(time.textContent).toMatch(/12.*nov.*2026/);
    expect(root().querySelector('details > summary')?.textContent).toBe('Contexto del cálculo');
  });

  it('mantiene el orden del servidor, sin ordenar ni recalcular registros', async () => {
    (await request()).flush(page([
      { ...simulation, id: 102, total_amount: '0.00', base_amount: '0.00', tax_amount: '0.00' }, simulation,
    ]));
    fixture.detectChanges();
    const titles = Array.from(root().querySelectorAll('h3')).map((node) => node.textContent);
    expect(titles).toEqual(['Simulación #102', 'Simulación #101']);
    expect(root().textContent).toContain('0.00');
  });

  it('pagina por cliente y vuelve a offset cero al cambiar de ficha', async () => {
    (await request()).flush(page([simulation], 21));
    fixture.detectChanges();
    Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Siguiente')!.click();
    const oldPage = await request(1, 20);
    fixture.componentRef.setInput('customerId', 2);
    fixture.detectChanges();
    const newCustomer = await request(2, 0);
    expect(oldPage.cancelled).toBe(true);
    newCustomer.flush(page([]));
    fixture.detectChanges();
    expect(root().textContent).toContain('Todavía no hay simulaciones');
    expect(root().textContent).not.toContain('Simulación #101');
  });

  it('recupera una página de historial vacía fuera de rango', async () => {
    (await request()).flush(page([simulation], 21));
    fixture.detectChanges();
    fixture.componentInstance.goToOffset(20);
    (await request(1, 20)).flush(page([], 1, 20));
    fixture.detectChanges();
    expect(root().textContent).toContain('Esta página del historial está vacía');
    Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Volver al inicio')!.click();
    (await request()).flush(page([simulation]));
    fixture.detectChanges();
    expect(root().textContent).toContain('Simulación #101');
  });
});
