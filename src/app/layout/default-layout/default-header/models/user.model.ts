import { Timestamp } from '@angular/fire/firestore';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  active: boolean;
  profilePhoto?: string;
  createdAt: Timestamp;
}
