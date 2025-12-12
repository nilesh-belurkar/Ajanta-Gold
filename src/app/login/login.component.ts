import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgStyle } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardGroupComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  FormModule,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent
} from '@coreui/angular';
import { LoginService } from './services/login.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [ContainerComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, NgStyle, FormModule, ReactiveFormsModule, CommonModule]
})
export class LoginComponent implements OnInit {
  _loginService = inject(LoginService);
  private _router = inject(Router);
  private _toastrService = inject(ToastrService);
  showPassword: boolean = false;

  constructor(private _spinner: NgxSpinnerService) { }


  async ngOnInit() {
    const user = await this._loginService.getUser();
    if (user) {
      this._router.navigate(['/invoice']);
    }
  }

  login() {
    this._spinner.show();
    if (this._loginService.loginForm.valid) {
      const email = this._loginService.loginForm.value.email ?? '';
      const password = this._loginService.loginForm.value.password ?? '';
      this._loginService.login(email, password)
        .then(() => {
          this._spinner.hide();
          this._toastrService.success('Login successfully', 'Success');
          this._router.navigate(['invoice']);
        })
        .catch(err => {
          this._spinner.hide();
          this._toastrService.error('Invalid email and password', 'Error');
          console.error(err)
        });
    }
  }
}


