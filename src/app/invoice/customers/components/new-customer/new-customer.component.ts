import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective, FormControlDirective, InputGroupComponent, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { Customer } from '../../models/customer.model';

import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonService } from '../../../common/services/common.service';
import { CUSTOMER_LIST_COLLECTION_NAME } from '../../../common/constants/constant';

@Component({
  selector: 'app-new-customer',

  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent, InputGroupTextDirective, FormControlDirective,
    ModalModule,
    CommonModule
  ],
  templateUrl: './new-customer.component.html',
  styleUrl: './new-customer.component.scss',
})
export class NewCustomerComponent implements OnInit {
  customerForm!: FormGroup;
  isFormSubmitted: boolean = false;
  @Input() customer?: Customer;
  @Output() saved = new EventEmitter<Customer>();
  @Output() closed = new EventEmitter<void>();

  private _toastrService = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _formBuilder = inject(FormBuilder);
  private _spinner = inject(NgxSpinnerService);



  initCustomerForm(): void {
    this.customerForm = this._formBuilder.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10)]],
      gst: [''],
      $key: [''],
    });
  }
  ngOnInit(): void {
    this.initCustomerForm();
    if (this.customer) {
      this.customerForm.patchValue({
        name: this.customer.name,
        address: this.customer.address,
        mobile: this.customer.mobile,
        gst: this.customer.GST,
        $key: this.customer.$key,
      });
    }
  }

  save() {
    this.isFormSubmitted = true;
    if (this.customerForm.invalid) {
      this._toastrService.error('Please fix errors before saving.');
      return;
    }

    this._spinner.show();
    const customerDetails: Customer = this.customerForm.value;
    if (customerDetails.$key) {
      this.editCustomer(customerDetails);
    } else {
      this.addCustomer(customerDetails);
    }
  }

  clear() {
    this.customerForm.reset();
  }

  close() {
    this.closed.emit();
  }


  addCustomer(customerDetails: Customer) {
    this._commonService.addDoc(CUSTOMER_LIST_COLLECTION_NAME, customerDetails)
      .then(() => {
        this._spinner.hide();
        this.saved.emit(customerDetails);
        this._toastrService.success('Customer added successfully');
      })
      .catch((err: any) => {
        this._spinner.hide();
        console.error(err);
        this._toastrService.error('Failed to add customer');
      });
  }

  editCustomer(customerDetails: Customer) {
    if (!customerDetails.$key) return;

    this._commonService.editDoc(CUSTOMER_LIST_COLLECTION_NAME, customerDetails.$key, {
      name: customerDetails.name,
      address: customerDetails.address,
      mobile: customerDetails.mobile,
      gst: customerDetails.GST
    });
    this._spinner.hide();
    this.saved.emit(customerDetails);
    this._toastrService.success('Customer updated successfully');
  }

}
