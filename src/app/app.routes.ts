import { Routes } from '@angular/router';
import { GuestComponent } from './guest/guest.component';
import { LoginComponent } from './views/pages/login/login.component';

export const routes: Routes = [
  { path: 'guest', component: GuestComponent },
  { path: '', redirectTo: '/guest', pathMatch: 'full' },
   { path: 'login', component: LoginComponent },
  {
    path: 'invoice',
    loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule),
    // canActivate: [AuthGuard]
  },
];