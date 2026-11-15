import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, filter, finalize, map, of, shareReplay, startWith, Subject, Subscription, switchMap, takeUntil, tap } from 'rxjs';
import { ApiError, toApiError } from '../../core/api/api-error';
import { Simulation, SimulationInput, SimulationPreview } from '../../core/api/models';
import { SimulationsApiService } from '../../core/api/simulations-api.service';
import { CountryNamePipe, UtcDatePipe } from '../../shared/display.pipes';
import { integerValidator, integerValue, localFieldError } from '../../shared/form-validation';
import { CurrencyDisplayComponent } from '../../shared/currency-display.component';

type Field = 'active_users' | 'storage_gb' | 'api_calls';
type Values = Record<Field, string>;
interface Edit {
  readonly kind: 'reset' | 'edit' | 'manual';
  readonly customerId: number;
  readonly values: Values;
  readonly nonce: number;
}
type PreviewState = { readonly revision: number } & (
  | { readonly status: 'idle' | 'invalid' | 'pending' | 'loading' }
  | { readonly status: 'ready'; readonly data: SimulationPreview; readonly input: SimulationInput }
  | { readonly status: 'saved'; readonly data: Simulation }
  | { readonly status: 'error'; readonly error: ApiError }
);

const initialValues = (): Values => ({ active_users: '0', storage_gb: '0', api_calls: '0' });

@Component({
  selector: 'app-simulation-editor',
  imports: [ReactiveFormsModule, CountryNamePipe, UtcDatePipe, CurrencyDisplayComponent],
  templateUrl: './simulation-editor.component.html',
  styleUrl: './simulation-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationEditorComponent {
  readonly customerId = input.required<number>();
  readonly saved = output<Simulation>();
  readonly historyRequested = output<void>();
  private readonly api = inject(SimulationsApiService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly edits = new Subject<Edit>();
  private revision = 0;
  private nonce = 0;
  private currentCustomerId = 0;
  private writeSubscription?: Subscription;

  readonly form = new FormGroup({
    active_users: new FormControl('0', { nonNullable: true, validators: integerValidator }),
    storage_gb: new FormControl('0', { nonNullable: true, validators: integerValidator }),
    api_calls: new FormControl('0', { nonNullable: true, validators: integerValidator }),
  });
  readonly values = signal(initialValues());
  readonly state = signal<PreviewState>({ status: 'idle', revision: 0 });
  readonly saving = signal(false);
  readonly saveError = signal<ApiError | null>(null);
  readonly uncertain = signal(false);
  readonly receipt = signal<{ data: Simulation; preview: SimulationPreview; priceChanged: boolean; contextChanged: boolean } | null>(null);
  readonly sliderMax = 1000;
  readonly users = computed(() => integerValue(this.values().active_users));
  readonly sliderValue = computed(() => Math.min(this.users() ?? 0, this.sliderMax));
  readonly outsideSlider = computed(() => (this.users() ?? 0) > this.sliderMax);
  readonly canSave = computed(() => this.state().status === 'ready' && !this.saving() && !this.uncertain());

  constructor() {
    // Comparar contenido evita solicitudes repetidas sin ignorar una acción de reintento.
    const changes = this.edits.pipe(
      distinctUntilChanged((a, b) => a.customerId === b.customerId && a.kind === b.kind && a.nonce === b.nonce
        && a.values.active_users === b.values.active_users && a.values.storage_gb === b.values.storage_gb
        && a.values.api_calls === b.values.api_calls),
      map((edit) => ({ ...edit, revision: ++this.revision, input: this.parseInput(edit) })),
      tap((edit) => {
        // Síncrono: retirar cualquier precio antes de esperar los 300 ms.
        this.state.set({ revision: edit.revision, status: edit.kind === 'reset' ? 'idle' : edit.input ? 'pending' : 'invalid' });
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    changes.pipe(
      debounceTime(300),
      switchMap((edit) => !edit.input || edit.kind === 'reset' ? EMPTY : this.api.preview(edit.input).pipe(
        map((data): PreviewState => ({ status: 'ready', data, input: edit.input!, revision: edit.revision })),
        startWith<PreviewState>({ status: 'loading', revision: edit.revision }),
        // Un cambio, incluso inválido, aborta el HTTP antes del debounce siguiente.
        takeUntil(changes.pipe(filter((next) => next.revision !== edit.revision))),
        catchError((cause: unknown) => of<PreviewState>({ status: 'error', error: toApiError(cause), revision: edit.revision })),
      )),
      takeUntilDestroyed(),
    ).subscribe((result) => {
      if (result.revision === this.revision) this.state.set(result);
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.values.set(this.form.getRawValue());
      this.receipt.set(null);
      // Una respuesta incierta debe seguir visible hasta una decisión explícita.
      if (!this.uncertain()) this.saveError.set(null);
      this.emit('edit');
    });

    effect(() => {
      const id = this.customerId();
      untracked(() => {
        this.writeSubscription?.unsubscribe();
        this.currentCustomerId = id;
        this.form.reset(initialValues(), { emitEvent: false });
        this.values.set(initialValues());
        this.saveError.set(null);
        this.uncertain.set(false);
        this.receipt.set(null);
        this.emit('reset');
      });
    });
  }

  fieldError(field: Field): string | null {
    return localFieldError(this.form.controls[field], this.state().status === 'invalid');
  }

  moveSlider(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = integerValue(raw);
    if (this.saving() || value === null || value > this.sliderMax) return;
    this.form.controls.active_users.markAsTouched();
    this.form.controls.active_users.setValue(raw);
  }

  calculate(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.emit('manual');
      const field = (Object.keys(this.form.controls) as Field[]).find((key) => this.form.controls[key].invalid);
      if (field) this.document.getElementById(`simulation-${field}`)?.focus();
      return;
    }
    this.uncertain.set(false);
    this.saveError.set(null);
    this.receipt.set(null);
    this.nonce++;
    this.emit('manual');
  }

  save(): void {
    const quote = this.state();
    if (!this.canSave() || this.form.invalid || quote.status !== 'ready' || quote.revision !== this.revision) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.writeSubscription = this.api.save(quote.input).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (data) => {
        if (data.customer_id !== this.currentCustomerId) return;
        const preview = quote.data;
        this.receipt.set({ data, preview,
          priceChanged: data.base_amount !== preview.base_amount || data.tax_amount !== preview.tax_amount
            || data.total_amount !== preview.total_amount || data.currency !== preview.currency,
          contextChanged: data.country_code !== preview.country_code || data.plan !== preview.plan || data.tax_rate !== preview.tax_rate,
        });
        if (quote.revision === this.revision) this.state.set({ status: 'saved', data, revision: quote.revision });
        this.saved.emit(data);
        this.document.getElementById('simulation-feedback')?.focus();
      },
      error: (cause: unknown) => {
        const error = toApiError(cause);
        this.saveError.set(error);
        this.uncertain.set(error.status === 0 || error.status >= 500 || error.code === 'unexpected_response');
        this.state.set({ status: 'error', error, revision: this.revision });
        this.document.getElementById('simulation-feedback')?.focus();
      },
    });
  }

  private emit(kind: Edit['kind']): void {
    this.edits.next({ kind, customerId: this.currentCustomerId, values: this.form.getRawValue(), nonce: this.nonce });
  }

  private parseInput(edit: Edit): SimulationInput | null {
    const active_users = integerValue(edit.values.active_users);
    const storage_gb = integerValue(edit.values.storage_gb);
    const api_calls = integerValue(edit.values.api_calls);
    if (!edit.customerId || active_users === null || storage_gb === null || api_calls === null) return null;
    return { customer_id: edit.customerId, active_users, storage_gb, api_calls };
  }
}
