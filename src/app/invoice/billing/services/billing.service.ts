import { Injectable } from '@angular/core';
import { Bill } from '../models/billing.model';

@Injectable({
  providedIn: 'root',
})
export class BillingService {

  private readonly GST_PERCENT = 18; // 18% GST

  constructor() { }

  prepareInvoice(billDetails: Bill) {
    let subTotal = 0;
    let totalDiscountAmount = billDetails.discount || 0;
    let totalTax = 0;

    const products = billDetails.productDetails.map(p => {
      const qty = p.productQty || 0;
      const rate = p.productPrice || 0;
      const freeQty = p.freeGoods || 0;

      const amount = qty * rate;
      subTotal += amount;

      // Taxable amount is after invoice-level discount proportionally
      const proportionDiscount = totalDiscountAmount > 0 ? (amount / subTotal) * totalDiscountAmount : 0;
      const taxable = amount - proportionDiscount;

      const gst = +(taxable * (this.GST_PERCENT / 100)).toFixed(2);
      totalTax += gst;

      return {
        $key: p.$key || null,
        productName: p.productName,
        batchNumber: p.batchNumber,
        expiryDate: p.expiryDate,
        productQty: qty,
        freeGoods: freeQty,
        productPrice: rate,
        amount: amount
      };
    });

    const grandTotal = +(subTotal - totalDiscountAmount + totalTax).toFixed(0); // round to whole number

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
      updatedAt: new Date() // current timestamp
    };
  }
}
