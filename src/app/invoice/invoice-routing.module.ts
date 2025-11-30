import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ViewSampleBillComponent } from './view-sample-bill/view-sample-bill.component';
import { ViewBillComponent } from './view-bill/view-bill.component';
import { CustomersComponent } from './customers/components/customers.component';
import { ProductsComponent } from './products/products.component';
import { BillingComponent } from './billing/billing.component';
import { ReportsComponent } from './reports/reports.component';
import { OrdersComponent } from './orders/orders.component';
import { DefaultLayoutComponent } from '../layout/default-layout';
import { LoginComponent } from '../views/pages/login/login.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'view-bill/:id', component: ViewBillComponent },
      { path: 'view-sample-bill/:id', component: ViewSampleBillComponent },
      { path: '', redirectTo: '/invoice/dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceRoutingModule { }
