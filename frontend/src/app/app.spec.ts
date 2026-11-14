import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '<h1 id="page-title" tabindex="-1">Ficha de prueba</h1>' })
class TestPage {}

describe('Navegación accesible de la aplicación', () => {
  it('saltar al contenido enfoca main y conserva la ficha y su búsqueda', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([
      { path: 'customers/:customer_id', component: TestPage },
    ])] });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/customers/1?q=prueba&offset=20');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    root.querySelector<HTMLAnchorElement>('.skip-link')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('main-content');
    expect(router.url).toBe('/customers/1?q=prueba&offset=20');
  });
});
