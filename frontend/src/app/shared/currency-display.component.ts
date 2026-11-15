import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, concat, fromEvent, map, merge, of, startWith, Subject, switchMap } from 'rxjs';
import { SimulationPreview } from '../core/api/models';
import { convertEur } from '../core/currency/decimal-money';
import { Currency, exchangeError, ExchangeRates, ExchangeRatesService } from '../core/currency/exchange-rates.service';
import { UtcDatePipe } from './display.pipes';

type CurrencyView = { readonly status: 'eur' | 'loading' }
  | { readonly status: 'ready'; readonly currency: 'USD' | 'GBP'; readonly data: ExchangeRates }
  | { readonly status: 'error'; readonly message: string };

@Component({
  selector: 'app-currency-display',
  imports: [ReactiveFormsModule, UtcDatePipe],
  templateUrl: './currency-display.component.html',
  styleUrl: './currency-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyDisplayComponent {
  readonly quote = input<SimulationPreview | null>(null);
  readonly currency = new FormControl<Currency>('EUR', { nonNullable: true });
  private readonly api = inject(ExchangeRatesService);
  private readonly document = inject(DOCUMENT);
  private readonly refresh = new Subject<void>();

  readonly state = toSignal<CurrencyView, CurrencyView>(merge(
    this.currency.valueChanges, this.refresh.pipe(map(() => this.currency.value)),
  ).pipe(
    startWith<Currency>('EUR'),
    switchMap((currency) => currency !== 'USD' && currency !== 'GBP' ? of<CurrencyView>({ status: 'eur' }) : concat(
      of<CurrencyView>({ status: 'loading' }),
      this.api.getRates().pipe(
        map((data): CurrencyView => ({ status: 'ready', data, currency })),
        catchError((error: unknown) => of<CurrencyView>({ status: 'error', message: exchangeError(error) })),
      ),
    )),
  ), { initialValue: { status: 'eur' } });

  readonly converted = computed(() => {
    const view = this.state();
    const quote = this.quote();
    if (view.status !== 'ready' || !quote) return null;
    try {
      const rate = view.data.rates[view.currency];
      return { total: convertEur(quote.total_amount, rate), base: convertEur(quote.base_amount, rate), tax: convertEur(quote.tax_amount, rate) };
    } catch { return null; }
  });

  constructor() {
    effect((onCleanup) => {
      const view = this.state();
      if (view.status !== 'ready') return;
      const handle = setTimeout(() => this.refresh.next(), Math.max(0, view.data.nextUpdate * 1000 - Date.now()));
      onCleanup(() => clearTimeout(handle));
    });
    // Recuperar vigencia al volver a una pestaña cuyos temporizadores se suspendieron.
    fromEvent(this.document, 'visibilitychange').pipe(takeUntilDestroyed()).subscribe(() => {
      const view = this.state();
      if (!this.document.hidden && view.status === 'ready' && Date.now() >= view.data.nextUpdate * 1000) this.refresh.next();
    });
  }

  retry(): void { this.refresh.next(); }
  date(seconds: number): string { return new Date(seconds * 1000).toISOString(); }
}
