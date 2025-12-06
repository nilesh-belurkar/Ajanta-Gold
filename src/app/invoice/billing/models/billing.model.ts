import { Timestamp } from '@angular/fire/firestore';

export interface AddProduct {
  productName: string;
  productQty: number;
  productPrice: string;
  HSNCode: number;
  batchNumber: number;
  freeGoods: number;
  expiryDate: string | Timestamp | null;
  isDuplicate?: boolean;
}