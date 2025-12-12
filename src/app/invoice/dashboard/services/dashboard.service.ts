import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, getCountFromServer } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private firestore: Firestore) {}

  async getSummary() {
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Customer queries
    const customersTodaySnap = await getDocs(
      query(collection(this.firestore, 'customers'),
        where('createdAt', '>=', todayStart),
        where('createdAt', '<=', todayEnd))
    );

    const customersThisMonthSnap = await getDocs(
      query(collection(this.firestore, 'customers'),
        where('createdAt', '>=', mStart),
        where('createdAt', '<=', mEnd))
    );

    const totalCustomersSnap = await getCountFromServer(collection(this.firestore, 'customers'));

    // Invoice queries
    const invoicesTodaySnap = await getDocs(
      query(collection(this.firestore, 'invoices'),
        where('createdAt', '>=', todayStart),
        where('createdAt', '<=', todayEnd))
    );

    const invoicesThisMonthSnap = await getDocs(
      query(collection(this.firestore, 'invoices'),
        where('createdAt', '>=', mStart),
        where('createdAt', '<=', mEnd))
    );

    let monthlyRevenue = 0;
    invoicesThisMonthSnap.forEach(inv => {
      monthlyRevenue += inv.data()['totalAmount'] || 0;
    });

    // Low stock
    const lowStockSnap = await getDocs(
      query(collection(this.firestore, 'products'),
        where('stock', '<=', 5))
    );

    return {
      customersToday: customersTodaySnap.size,
      customersThisMonth: customersThisMonthSnap.size,
      totalCustomers: totalCustomersSnap.data().count,
      invoicesToday: invoicesTodaySnap.size,
      invoicesThisMonth: invoicesThisMonthSnap.size,
      monthlyRevenue,
      lowStockProducts: lowStockSnap.size
    };
  }
}
