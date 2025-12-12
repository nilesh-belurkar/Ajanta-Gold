import { Timestamp } from '@angular/fire/firestore';

export interface Order {
    $key: string;
    name: string;
    mobile: string;
    orderDetails: string;
    status: 'Pending' | 'Done';
    createdAt: Timestamp;
}
