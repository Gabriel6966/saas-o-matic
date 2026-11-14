import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, concat, distinctUntilChanged, map, merge, Observable, of, startWith, Subject, switchMap, tap, timer } from 'rxjs';
import { toApiError } from '../../core/api/api-error';
import { CustomersApiService } from '../../core/api/customers-api.service';
import { CustomerSummary, LoadState, Page } from '../../core/api/models';
import { parseOffset, searchError, searchValidator } from '../../core/query';
import { CountryNamePipe } from '../../shared/display.pipes';
import { PaginationComponent } from '../../shared/pagination.component';
import { StatusPanelComponent } from '../../shared/status-panel.component';

interface SearchCriteria {
  readonly q: string;
  readonly offset: number;
  readonly validation: string | null;
  readonly debounce: boolean;
}

type SearchView = { readonly q: string } & (
  LoadState<Page<CustomerSummary>> | { readonly status: 'invalid'; readonly message: string }
);

@Component({
  selector: 'app-customer-search',
  imports: [ReactiveFormsModule, RouterLink, CountryNamePipe, PaginationComponent, StatusPanelComponent],
  templateUrl: './customer-search.component.html',
  styleUrl: './customer-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerSearchComponent {
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly retryRequest = new Subject<void>();
  readonly search = new FormControl('', { nonNullable: true, validators: [searchValidator] });

  private readonly criteria = merge(
    this.route.queryParamMap.pipe(
      tap((params) => this.search.setValue(params.get('q') ?? '', { emitEvent: false })),
      map((params): SearchCriteria => {
        const raw = params.get('q') ?? '';
        return { q: raw.trim(), offset: parseOffset(params.get('offset')), validation: searchError(raw), debounce: false };
      }),
    ),
    this.search.valueChanges.pipe(
      tap((raw) => {
        // La URL conserva también entradas inválidas; el flujo jamás las envía a la API.
        void this.router.navigate([], {
          relativeTo: this.route, queryParams: { q: raw || null, offset: null }, replaceUrl: true,
        });
      }),
      map((raw): SearchCriteria => ({ q: raw.trim(), offset: 0, validation: searchError(raw), debounce: true })),
    ),
  ).pipe(distinctUntilChanged((a, b) => a.q === b.q && a.offset === b.offset && a.validation === b.validation));

  readonly state = toSignal<SearchView, SearchView>(combineLatest([
    this.criteria, this.retryRequest.pipe(startWith(undefined)),
  ]).pipe(switchMap(([criteria]) => this.load(criteria))), {
    initialValue: { status: 'loading', q: '' },
  });

  private load(criteria: SearchCriteria): Observable<SearchView> {
    if (criteria.validation) return of({ status: 'invalid', q: criteria.q, message: criteria.validation });
    // El switchMap exterior cancela al teclear, incluso durante estos 300 ms.
    return concat(
      of<SearchView>({ status: 'loading', q: criteria.q }),
      timer(criteria.debounce ? 300 : 0).pipe(
        switchMap(() => this.api.search(criteria.q, criteria.offset)),
        map((data): SearchView => ({ status: 'success', data, q: criteria.q })),
        catchError((cause: unknown) => of<SearchView>({ status: 'error', error: toApiError(cause), q: criteria.q })),
      ),
    );
  }

  clearSearch(): void {
    this.search.setValue('');
    this.document.getElementById('customer-search')?.focus();
  }

  retry(): void {
    this.document.getElementById('results-title')?.focus();
    this.retryRequest.next();
  }

  goToOffset(offset: number): void {
    this.document.getElementById('results-title')?.focus();
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: { q: this.search.value || null, offset: offset || null },
    });
  }

}
