import { Injectable } from '@angular/core';
import { Bill } from '../models/billing.model';

@Injectable({
  providedIn: 'root',
})
export class BillingService {

  constructor() { }

  prepareInvoice(billDetails: Bill) {
    let subTotal = 0;
    let totalDiscountAmount = 0;
    let totalTax = 0;

    const products = billDetails.products.map(p => {
      const qty = p.productQty || 0;
      const rate = p.productPrice || 0;
      const freeQty = p.freeGoods || 0;

      const amount = qty * rate;
      subTotal += amount;


      return {
        $key: p.$key || null,
        productName: p.productName,
        batchNumber: p.batchNumber,
        expiryDate: p.expiryDate,
        productQty: qty,
        freeGoods: freeQty,
        productPrice: rate,
        amount: amount,
        HSNCode: p.HSNCode
      };
    });

    totalDiscountAmount = subTotal / 100 * billDetails.discount;
    totalTax = (subTotal - totalDiscountAmount) / 100 * 18;
    const grandTotal = +(subTotal - totalDiscountAmount + totalTax).toFixed(0);

    return {
      $key: billDetails.$key || null,
      billNumber: billDetails.billNumber,
      billDate: new Date(billDetails.billDate),
      customerInfo: {
        name: billDetails.customerInfo.name,
        address: billDetails.customerInfo.address || '',
        mobile: billDetails.customerInfo.mobile || '',
        GST: billDetails.customerInfo.GST || ''
      },
      vehicleNumber: billDetails.vehicleNumber,
      discount: billDetails.discount,
      products,
      subTotal,
      totalDiscountAmount,
      totalTax: +totalTax.toFixed(2),
      grandTotal,
      createdAt: new Date(billDetails.createdAt),
      updatedAt: new Date()
    };
  }
}
