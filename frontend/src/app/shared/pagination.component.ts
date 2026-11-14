import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <nav class="pagination" [attr.aria-label]="label()">
      <p>
        @if (itemCount()) {
          {{ offset() + 1 }}–{{ offset() + itemCount() }} de {{ total() }}
        } @else { 0 resultados en esta página }
      </p>
      <div class="pagination-actions">
        @if (!itemCount() && offset() > 0) {
          <button class="button button--secondary" type="button" (click)="pageChange.emit(0)">Volver al inicio</button>
        }
        <button class="button button--secondary" type="button" [disabled]="offset() === 0"
          (click)="pageChange.emit(previous())">Anterior</button>
        <button class="button button--secondary" type="button" [disabled]="offset() + limit() >= total()"
          (click)="pageChange.emit(offset() + limit())">Siguiente</button>
      </div>
    </nav>
  `,
})
export class PaginationComponent {
  readonly label = input('Paginación');
  readonly offset = input.required<number>();
  readonly limit = input.required<number>();
  readonly total = input.required<number>();
  readonly itemCount = input.required<number>();
  readonly pageChange = output<number>();
  protected readonly previous = computed(() => Math.max(0, this.offset() - this.limit()));
}
