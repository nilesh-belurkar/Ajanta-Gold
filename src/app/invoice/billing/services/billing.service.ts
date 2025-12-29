import { Injectable } from '@angular/core';
import { Bill } from '../models/billing.model';
import { ddMMyyyyToFirestoreTimestamp } from '../../common/utility';

@Injectable({
  providedIn: 'root',
})
export class BillingService {

  constructor() { }

  prepareInvoice(billDetails: Bill) {
    let subTotal = 0;               // total of amountIncludingtax (as requested)
    let totalDiscountAmount = 0;
    let totalTax = 0;

    // 1️⃣ Base subtotal (before discount & tax)
    let baseSubTotal = 0;
    billDetails.products.forEach(p => {
      const qty = p.productQty ?? 0;
      const rate = p.productPrice ?? 0;
      baseSubTotal += qty * rate;
    });

    const discountPercent = billDetails.discount ?? 0;
    totalDiscountAmount = baseSubTotal * discountPercent / 100;

    // 2️⃣ Per-product calculation
    const products = billDetails.products.map(p => {
      const qty = p.productQty ?? 0;
      const rate = p.productPrice ?? 0;
      const freeQty = p.freeGoods ?? 0;

      const baseAmount = qty * rate;

      // proportional discount
      const discountShare =
        baseSubTotal > 0
          ? (baseAmount / baseSubTotal) * totalDiscountAmount
          : 0;

      const taxableAmount = baseAmount - discountShare;

      const cgst = p.CGST ?? 0;
      const sgst = p.SGST ?? 0;
      const gstRate = cgst + sgst;

      const gstAmount = taxableAmount * gstRate / 100;
      const amountIncludingtax = taxableAmount + gstAmount;

      // aggregate totals
      totalTax += gstAmount;
      subTotal += amountIncludingtax;

      return {
        $key: p.$key ?? '',
        name: p.name ?? '',
        batchNumber: p.batchNumber ?? '',     // ✅ undefined → ''
        expiryDate: p.expiryDate ?? '',       // ✅ undefined → ''
        freeGoods: freeQty,                   // number safe
        productQty: qty,
        productPrice: rate,
        amount: +baseAmount.toFixed(2),       // Excl. GST
        CGST: cgst,
        SGST: sgst,
        HSNCode: p.HSNCode ?? '',              // ✅ undefined → ''
        amountIncludingtax: +amountIncludingtax.toFixed(2)
      };
    });

    return {
      $key: billDetails.$key ?? '',
      billNumber: billDetails.billNumber ?? '',
      billDate: ddMMyyyyToFirestoreTimestamp(billDetails.billDate),
      customerInfo: {
        name: billDetails.customerInfo?.name ?? '',
        address: billDetails.customerInfo?.address ?? '',
        mobile: billDetails.customerInfo?.mobile ?? '',
        GST: billDetails.customerInfo?.GST ?? ''
      },
      vehicleNumber: billDetails.vehicleNumber ?? '',   // ✅ undefined → ''
      discount: discountPercent,
      products,
      subTotal: +subTotal.toFixed(2),           // Incl. GST
      totalDiscountAmount: +totalDiscountAmount.toFixed(2),
      totalTax: +totalTax.toFixed(2),
      grandTotal: +subTotal.toFixed(2),
      createdAt: billDetails.createdAt
        ? new Date(billDetails.createdAt)
        : new Date(),
      updatedAt: new Date()
    };
  }

}
