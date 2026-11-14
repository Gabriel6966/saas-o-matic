import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

declare global {
  interface Window {
    __SAAS_CONFIG__?: { readonly apiBaseUrl?: string };
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const configured = inject(DOCUMENT).defaultView?.__SAAS_CONFIG__?.apiBaseUrl;
    return (configured ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
  },
});
