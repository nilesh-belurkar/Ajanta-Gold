export interface Product {
  $key: string | null;
  name: string;
  productQty: number;
  productPrice: number;
  HSNCode?: number;
  batchNumber?: number | string;
  freeGoods?: number;
  expiryDate?: string;
  isDuplicate?: boolean;
  amount?:number;
}

export interface Customer {
  $key: string;
  createdAt?: any;
  name: string;
  GST?: string;
  address: string;
  mobile: string;
}


export interface Bill {
  $key: string | null;
  customerName: string;
  billNumber: number;
  billDate: string | Date;
  vehicleNumber: string;
  discount: number;
  createdAt: string | Date;
  products: Product[];
  customerInfo: Customer;
  subTotal:number;
  totalDiscountAmount:number;
  totalTax:number;
  grandTotal:number;
}