import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, deleteDoc, updateDoc, orderBy, query, limit } from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { serverTimestamp } from 'firebase/firestore';


@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(private _firestore: Firestore) { }

  /** -------------------------
   * READ (REAL-TIME STREAM)
   * ------------------------*/
  getDocuments(collectionName: string): Observable<any[]> {
    const ref = collection(this._firestore, collectionName);
    return collectionData(ref, { idField: '$key' }) as Observable<any[]>;
  }


  getLastGeneratedBill(collectionName: string) {
    const ref = collection(this._firestore, collectionName);
    const q = query(ref, orderBy('createdAt', 'desc'), limit(1));
    return collectionData(q, { idField: '$key' }) as Observable<any[]>;
  }


  // getDocuments(collectionName: string): Observable<any[]> {
  //   const ref = collection(this._firestore, collectionName);
  //   const q = query(ref, orderBy('createdAt', 'desc'));
  //   return collectionData(q, { idField: 'firestoreId' }) as Observable<any[]>;
  // }

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
}
