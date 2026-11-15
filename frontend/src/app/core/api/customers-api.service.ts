import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { withApiErrors } from './api-error';
import { createdResponse } from './created-response';
import { Customer, CustomerCreate, CustomerSummary, Page } from './models';

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(input: CustomerCreate) {
    const { company_name, tax_identifier, email, country_code, plan } = input;
    return this.http.post<Customer>(`${this.baseUrl}/customers`, {
      company_name, tax_identifier, email, country_code, plan,
    }, { observe: 'response' }).pipe(map(createdResponse<Customer>), withApiErrors());
  }

  search(q: string, offset = 0, limit = 20) {
    const params = new HttpParams().set('q', q).set('limit', limit).set('offset', offset);
    return this.http.get<Page<CustomerSummary>>(`${this.baseUrl}/customers`, { params })
      .pipe(withApiErrors());
  }

  get(customerId: number) {
    return this.http.get<Customer>(`${this.baseUrl}/customers/${customerId}`)
      .pipe(withApiErrors());
  }
}
