import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'customers' },
  {
    path: 'customers', title: 'Clientes | SaaS-O-Matic',
    loadComponent: () => import('./features/customers/customer-search.component').then((m) => m.CustomerSearchComponent),
  },
  {
    path: 'customers/:customer_id', title: 'Detalle de cliente | SaaS-O-Matic',
    loadComponent: () => import('./features/customers/customer-detail.component').then((m) => m.CustomerDetailComponent),
  },
  { path: '**', redirectTo: 'customers' },
];
