import { Routes } from '@angular/router';
import { GuestComponent } from './guest/guest.component';
import { LoginComponent } from './login/login.component';
import { Page404Component } from './login/components/page404/page404.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'guest', component: GuestComponent },
  { path: '', redirectTo: '/guest', pathMatch: 'full' },
   { path: 'login', component: LoginComponent },
  {
    path: 'invoice',
    loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule),
    canActivate: [AuthGuard]
  },
  { path: '**', component: Page404Component }
];