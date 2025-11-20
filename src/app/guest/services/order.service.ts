import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
   orderForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    mobile: new FormControl('', [Validators.required, Validators.minLength(10)]),
    orderDetails: new FormControl('', [Validators.required, Validators.minLength(5)]),
  });
}
