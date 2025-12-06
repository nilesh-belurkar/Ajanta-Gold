import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ViewSampleBillComponent } from './view-sample-bill/view-sample-bill.component';
import { ViewBillComponent } from './view-bill/view-bill.component';
import { CustomersComponent } from './customers/components/customers.component';
import { BillingComponent } from '../invoice/billing/components/billing.component';
import { ReportsComponent } from './reports/reports.component';
import { OrdersComponent } from './orders/components/orders.component';
import { DefaultLayoutComponent } from '../layout/default-layout';
import { ProductsComponent } from './products/components/products.component';
import { BillPreviewComponent } from './billing/components/bill-preview/bill-preview.component';

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
      { path: 'view-bill/:id', component: BillPreviewComponent },
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
