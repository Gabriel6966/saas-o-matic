import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { withApiErrors } from './api-error';
import { createdResponse } from './created-response';
import { Page, Simulation, SimulationInput, SimulationPreview } from './models';

function payload(input: SimulationInput): SimulationInput {
  const { customer_id, active_users, storage_gb, api_calls } = input;
  return { customer_id, active_users, storage_gb, api_calls };
}

@Injectable({ providedIn: 'root' })
export class SimulationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  preview(input: SimulationInput) {
    return this.http.post<SimulationPreview>(`${this.baseUrl}/simulations/preview`, payload(input))
      .pipe(withApiErrors());
  }

  save(input: SimulationInput) {
    return this.http.post<Simulation>(`${this.baseUrl}/simulations`, payload(input), { observe: 'response' })
      .pipe(map(createdResponse<Simulation>), withApiErrors());
  }

  history(customerId: number, offset = 0, limit = 20) {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<Page<Simulation>>(`${this.baseUrl}/customers/${customerId}/simulations`, { params })
      .pipe(withApiErrors());
  }
}
