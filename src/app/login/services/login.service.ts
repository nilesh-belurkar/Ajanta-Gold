import { Injectable, NgZone } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { firstValueFrom, take } from 'rxjs';
import { authState } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private _auth: Auth) { }


  loginForm = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required])
  });


  login(email: string, password: string) {
    return signInWithEmailAndPassword(this._auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this._auth, email, password);
  }

  logout() {
    return signOut(this._auth);
  }

  async getUser(): Promise<any> {
    return firstValueFrom(authState(this._auth).pipe(take(1)));
  }

}
