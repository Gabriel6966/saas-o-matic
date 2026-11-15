import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, inject, Injector } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private hasActivated = false;

  protected focusPage(): void {
    if (!this.hasActivated) {
      this.hasActivated = true;
      return;
    }
    afterNextRender(() => this.document.getElementById('page-title')?.focus(), { injector: this.injector });
  }

  protected skipToContent(event: Event): void {
    // Con base href="/", un fragmento nativo cambiaría la ruta de una ficha.
    event.preventDefault();
    this.document.getElementById('main-content')?.focus();
  }
}
