import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { Firestore, collection, query, where, orderBy, limit, collectionData } from '@angular/fire/firestore';
import {
  CardBodyComponent,
  CardComponent,
  ColComponent,
  RowComponent,
  TableDirective,
  TemplateIdDirective,
  WidgetStatAComponent
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';
import { map } from 'rxjs';
import { BILL_LIST_COLLECTION_NAME, CUSTOMER_LIST_COLLECTION_NAME, PRODUCT_LIST_COLLECTION_NAME } from '../common/constants/constant';
import { convertTimestamps } from '../common/utility';
import { ChartDataModel, ChartOptionsModel } from './models/dashboard.model';


@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  imports: [DecimalPipe, DatePipe, CardComponent, CardBodyComponent, RowComponent, ColComponent, IconDirective, ReactiveFormsModule, ChartjsComponent, TableDirective, CurrencyPipe, RowComponent, ColComponent, WidgetStatAComponent, TemplateIdDirective, IconDirective, ChartjsComponent]
})
export class DashboardComponent implements OnInit {
  invoicesBarData!: ChartDataModel;
  invoicesBarOptions!: ChartOptionsModel;

  topCustomersPieData!: ChartDataModel;
  topCustomersPieOptions!: ChartOptionsModel;

  newCustomersCount: number = 0;
  newProductsCount: number = 0;
  invoicesThisMonthCount: number = 0;
  revenueThisMonth: number = 0;
  recentInvoices: any[] = [];

  constructor(private _firestore: Firestore) { }

  ngOnInit() {
    this.loadKPIs();
    this.loadRecentInvoice();
    this.loadCharts();
  }

  loadKPIs() {
    const now = new Date();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // New Customers (7 days)
    this.queryCount(CUSTOMER_LIST_COLLECTION_NAME, 'createdAt', sevenDaysAgo)
      .subscribe(c => this.newCustomersCount = c);

    // New Products (7 days)
    this.queryCount(PRODUCT_LIST_COLLECTION_NAME, 'createdAt', sevenDaysAgo)
      .subscribe(c => this.newProductsCount = c);

    // Invoices this month
    this.queryCount(BILL_LIST_COLLECTION_NAME, 'createdAt', monthStart)
      .subscribe(c => this.invoicesThisMonthCount = c);

    // Revenue this month
    this.queryCollection(BILL_LIST_COLLECTION_NAME, 'createdAt', monthStart)
      .pipe(map(list => list.reduce((a: number, b: any) => a + b.grandTotal, 0)))
      .subscribe(sum => this.revenueThisMonth = sum);
  }

  queryCount(collectionName: string, field: string, start: Date) {
    return this.queryCollection(collectionName, field, start)
      .pipe(map(list => list.length));
  }

  queryCollection(collectionName: string, field: string, start: Date) {
    const ref = collection(this._firestore, collectionName);
    const q = query(ref, where(field, '>=', start));
    return collectionData(q, { idField: '$key' });
  }

  loadRecentInvoice() {
    this.getRecent(BILL_LIST_COLLECTION_NAME).subscribe(invoice => this.recentInvoices = invoice.map(invoice => convertTimestamps(invoice)));
  }

  getRecent(col: string) {
    const ref = collection(this._firestore, col);
    const q = query(ref, orderBy('createdAt', 'desc'), limit(10));
    return collectionData(q, { idField: '$key' });
  }

  loadCharts() {
    this.loadInvoicesPerMonthChart();
    this.loadTopCustomersPieChart();
  }

  loadInvoicesPerMonthChart() {
    const ref = collection(this._firestore, BILL_LIST_COLLECTION_NAME);

    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);

    const q = query(ref, where('createdAt', '>=', start));

    collectionData(q, { idField: '$key' })
      .subscribe((invoices: any[]) => {
        const monthly = Array(12).fill(0);

        invoices.forEach(inv => {
          const dt = inv.createdAt.toDate();
          const m = dt.getMonth();
          monthly[m] += 1;
        });

        this.invoicesBarData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Invoices',
              data: monthly,
              backgroundColor: 'rgba(54,162,235,0.7)',
              borderWidth: 0
            }
          ]
        };

        this.invoicesBarOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        };
      });
  }

  loadTopCustomersPieChart() {
    const ref = collection(this._firestore, BILL_LIST_COLLECTION_NAME);

    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);

    const q = query(ref, where('createdAt', '>=', start));

    collectionData(q, { idField: '$key' })
      .subscribe((invoices: any[]) => {
        const totals: any = {};

        invoices.forEach(inv => {
          totals[inv.customerInfo.name] =
            (totals[inv.customerInfo.name] || 0) + (inv.grandTotal || 0);
        });

        const sorted = Object.entries(totals)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5);

        this.topCustomersPieData = {
          labels: sorted.map(s => s[0]),
          datasets: [
            {
              data: sorted.map(s => s[1] as number),
              backgroundColor: [
                '#4dc9f6',
                '#f67019',
                '#f53794',
                '#537bc4',
                '#acc236'
              ]
            }
          ]
        };


        this.topCustomersPieOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            }
          }
        };
      });
  }

}
