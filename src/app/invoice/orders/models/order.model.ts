import { Timestamp } from '@angular/fire/firestore';

export interface Order {
    firestoreId: string;
    name: string;
    mobile: string;
    orderDetails: string;
    status: 'Pending' | 'Done';
    createdAt: Timestamp;
}
