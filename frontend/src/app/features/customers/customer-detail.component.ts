import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, concat, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { toApiError } from '../../core/api/api-error';
import { CustomersApiService } from '../../core/api/customers-api.service';
import { Customer, LoadState } from '../../core/api/models';
import { parseCustomerId, parseOffset } from '../../core/query';
import { CountryNamePipe } from '../../shared/display.pipes';
import { StatusPanelComponent } from '../../shared/status-panel.component';
import { SimulationHistoryComponent } from '../simulations/simulation-history.component';

type DetailView = LoadState<Customer> | { readonly status: 'invalid' };

@Component({
  selector: 'app-customer-detail',
  imports: [RouterLink, CountryNamePipe, StatusPanelComponent, SimulationHistoryComponent],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CustomersApiService);
  private readonly document = inject(DOCUMENT);
  private readonly retryRequest = new Subject<void>();

  readonly backQuery = toSignal(this.route.queryParamMap.pipe(map((params) => ({
    q: params.get('q'), offset: parseOffset(params.get('offset')) || null,
  }))), { initialValue: { q: null, offset: null } });

  readonly state = toSignal<DetailView, DetailView>(combineLatest([
    this.route.paramMap.pipe(map((params) => parseCustomerId(params.get('customer_id'))), distinctUntilChanged()),
    this.retryRequest.pipe(startWith(undefined)),
  ]).pipe(switchMap(([id]) => id === null ? of<DetailView>({ status: 'invalid' }) : concat(
    of<DetailView>({ status: 'loading' }),
    this.api.get(id).pipe(
      map((data): DetailView => ({ status: 'success', data })),
      catchError((cause: unknown) => of<DetailView>({ status: 'error', error: toApiError(cause) })),
    ),
  ))), { initialValue: { status: 'loading' } });

  retry(): void {
    this.document.getElementById('page-title')?.focus();
    this.retryRequest.next();
  }
}
