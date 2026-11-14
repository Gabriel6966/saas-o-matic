import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, concat, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { toApiError } from '../../core/api/api-error';
import { LoadState, Page, Simulation } from '../../core/api/models';
import { SimulationsApiService } from '../../core/api/simulations-api.service';
import { CountryNamePipe, UtcDatePipe } from '../../shared/display.pipes';
import { PaginationComponent } from '../../shared/pagination.component';
import { StatusPanelComponent } from '../../shared/status-panel.component';

@Component({
  selector: 'app-simulation-history',
  imports: [CountryNamePipe, UtcDatePipe, PaginationComponent, StatusPanelComponent],
  templateUrl: './simulation-history.component.html',
  styleUrl: './simulation-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationHistoryComponent {
  readonly customerId = input.required<number>();
  private readonly api = inject(SimulationsApiService);
  private readonly document = inject(DOCUMENT);
  private readonly pageRequest = new Subject<number>();
  private readonly retryRequest = new Subject<void>();

  readonly state = toSignal<LoadState<Page<Simulation>>, LoadState<Page<Simulation>>>(toObservable(this.customerId).pipe(
    distinctUntilChanged(),
    // Al cambiar de cliente se cancela el historial anterior y se vuelve a offset 0.
    switchMap((id) => combineLatest([
      this.pageRequest.pipe(startWith(0)), this.retryRequest.pipe(startWith(undefined)),
    ]).pipe(switchMap(([offset]) => concat(
      of<LoadState<Page<Simulation>>>({ status: 'loading' }),
      this.api.history(id, offset).pipe(
        map((data): LoadState<Page<Simulation>> => ({ status: 'success', data })),
        catchError((cause: unknown) => of<LoadState<Page<Simulation>>>({ status: 'error', error: toApiError(cause) })),
      ),
    )))),
  ), { initialValue: { status: 'loading' } });

  retry(): void {
    this.document.getElementById('history-title')?.focus();
    this.retryRequest.next();
  }

  goToOffset(offset: number): void {
    this.document.getElementById('history-title')?.focus();
    this.pageRequest.next(offset);
  }
}
