import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, deleteDoc, updateDoc, orderBy, query, limit } from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { serverTimestamp, where } from 'firebase/firestore';


@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(private _firestore: Firestore) { }

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
    console.log("🚀 ~ year:", year)
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
}
