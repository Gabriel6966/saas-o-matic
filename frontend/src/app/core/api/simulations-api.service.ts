import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from './api-base-url';
import { withApiErrors } from './api-error';
import { Page, Simulation } from './models';

@Injectable({ providedIn: 'root' })
export class SimulationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  history(customerId: number, offset = 0, limit = 20) {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<Page<Simulation>>(`${this.baseUrl}/customers/${customerId}/simulations`, { params })
      .pipe(withApiErrors());
  }
}
