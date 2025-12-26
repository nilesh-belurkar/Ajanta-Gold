import { inject, Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, deleteDoc, updateDoc, orderBy, query, limit } from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { map, Observable, switchMap, of } from 'rxjs';
import { serverTimestamp, where, writeBatch } from 'firebase/firestore';

import { Auth, authState } from '@angular/fire/auth';
import { User } from '../../../layout/default-layout/default-header/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class CommonService {

  private auth = inject(Auth);
  private _firestore = inject(Firestore);

  /** -------------------------
   * READ (REAL-TIME STREAM)
   * ------------------------*/

  getLastGeneratedBill(collectionName: string) {
    const ref = collection(this._firestore, collectionName);

    const q = query(
      ref,
      where("billYear", "==", new Date().getFullYear().toString())
    );

    return collectionData(q, { idField: "$key" }).pipe(
      map((bills: any[]) => {
        if (!bills.length) return null;
        // sort manually (no index needed)
        return bills.sort((a, b) => b.billSequence - a.billSequence)[0];
      })
    );
  }



  getDocuments(collectionName: string, year?: number): Observable<any[]> {
    const ref = collection(this._firestore, collectionName);

    let q;

    if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      q = query(
        ref,
        where("createdAt", ">=", start),
        where("createdAt", "<", end),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        ref,
        orderBy("createdAt", "desc")
      );
    }

    return collectionData(q, { idField: "$key" }) as Observable<any[]>;
  }

  getDocumentById(collectionName: string, docId: string): Observable<any> {
    const ref = doc(this._firestore, `${collectionName}/${docId}`);
    return docData(ref, { idField: '$key' }) as Observable<any>;
  }

  /** -------------------------
   * CREATE
   * Returns full object including ID
   * ------------------------*/
  addDoc(collectionName: string, data: any): Promise<any> {
    const ref = collection(this._firestore, collectionName);

    const payload = {
      ...data,
      createdAt: serverTimestamp()
    };

    return addDoc(ref, payload).then(async docRef => {
      // second write to update the $key
      await updateDoc(docRef, { $key: docRef.id });

      return {
        ...data,
        $key: docRef.id,
        createdAt: new Date()
      };
    });
  }



  /** -------------------------
   * UPDATE
   * Returns updated object
   * ------------------------*/
  editDoc(collectionName: string, id: string, data: any): Promise<any> {
    const docRef = doc(this._firestore, collectionName, id);

    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    };

    return updateDoc(docRef, payload).then(() => {
      return {
        $key: id,
        ...data,
        updatedAt: new Date()
      };
    });
  }

  /** -------------------------
   * DELETE
   * ------------------------*/
  deleteDoc(collectionName: string, id: string): Promise<void> {
    const docRef = doc(this._firestore, collectionName, id);
    return deleteDoc(docRef);
  }

  /** -------------------------
   * BULK CREATE
   * returns array of created records
   * ------------------------*/
  addBulkCustomers(collectionName: string, customers: any[]): Promise<any[]> {
    return Promise.all(customers.map(c => this.addDoc(collectionName, c)));
  }

  getBillsOfCurrentYear(collectionName: string) {
    const now = new Date();
    const currentYear = now.getFullYear();

    const startOfYear = new Date(currentYear, 0, 1);
    const startOfNextYear = new Date(currentYear + 1, 0, 1);

    const ref = collection(this._firestore, collectionName);

    const q = query(
      ref,
      where('createdAt', '>=', startOfYear),
      where('createdAt', '<', startOfNextYear)
    );

    return collectionData(q, { idField: '$key' });
  }

  async importCustomers(customers: any[]): Promise<number> {
    if (!Array.isArray(customers)) {
      throw new Error('Invalid data: customers must be an array');
    }

    const batch = writeBatch(this._firestore);
    const colRef = collection(this._firestore, 'customer_list');

    customers.forEach(customer => {
      const docRef = doc(colRef); // auto document ID

      batch.set(docRef, {
        ...customer,
        $key: docRef.id,          // same as document ID
        createdAt: serverTimestamp()   // server timestamp
      });
    });

    await batch.commit();
    return customers.length;
  }


  async importProducts(products: any[]): Promise<number> {
    if (!Array.isArray(products)) {
      throw new Error('Invalid data: products must be an array');
    }

    const batch = writeBatch(this._firestore);
    const colRef = collection(this._firestore, 'product_list');

    products.forEach(product => {
      const docRef = doc(colRef); // auto ID

      batch.set(docRef, {
        ...product,
        $key: docRef.id,           // same as document ID
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();
    return products.length;
  }


  getCurrentUserProfile(collectionName: string): Observable<User | null> {
    return authState(this.auth).pipe(
      switchMap(authUser => {
        if (!authUser) {
          return of(null);
        }

        const ref = doc(this._firestore, collectionName, authUser.uid);

        return docData(ref).pipe(
          map(data => {
            if (!data) return null;

            // 🔑 explicit, safe mapping
            return {
              uid: authUser.uid,
              ...(data as Omit<User, 'uid'>)
            } as User;
          })
        );
      })
    );
  }

}
