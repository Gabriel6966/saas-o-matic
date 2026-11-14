import { Component, input, output } from '@angular/core';
import { ApiErrorDetail } from '../core/api/models';

@Component({
  selector: 'app-status-panel',
  template: `
    <div class="status-panel" [class.status-panel--error]="kind() === 'error'"
      [attr.role]="kind() === 'error' ? 'alert' : 'status'">
      <span class="status-symbol" aria-hidden="true">{{ kind() === 'loading' ? '…' : kind() === 'error' ? '!' : '—' }}</span>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      @if (details().length) {
        <ul>@for (detail of details(); track $index) { <li>{{ detail.message }}</li> }</ul>
      }
      @if (actionLabel()) {
        <button class="button button--secondary" type="button" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
})
export class StatusPanelComponent {
  readonly kind = input<'loading' | 'empty' | 'error'>('empty');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly details = input<readonly ApiErrorDetail[]>([]);
  readonly actionLabel = input('');
  readonly action = output<void>();
}
