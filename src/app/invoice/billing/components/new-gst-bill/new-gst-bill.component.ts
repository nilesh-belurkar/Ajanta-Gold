import { CommonModule } from '@angular/common';
import { Component, ComponentRef, EventEmitter, inject, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective, FormControlDirective, InputGroupComponent, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../../common/services/common.service';
import { take } from 'rxjs';
import { AddProductComponent } from './add-product/add-product.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BILL_LIST_COLLECTION_NAME, CUSTOMER_LIST_COLLECTION_NAME } from '../../../../invoice/common/constants/constant';
import { convertToDDMMYYYY } from '../../../common/utility';
import { BillingService } from '../../services/billing.service';
import { Customer, Product } from '../../models/billing.model';


@Component({
  selector: 'app-new-gst-bill',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    ModalModule,
    CommonModule,
    BsDatepickerModule
  ],
  templateUrl: './new-gst-bill.component.html',
  styleUrl: './new-gst-bill.component.scss',
})
export class NewGstBillComponent implements OnInit {
  gstBillForm!: FormGroup;
  isFormSubmitted: boolean = false;
  modalTitle: string = 'New Billing';
  private modalRef?: ComponentRef<any>;
  showModal: boolean = false;
  productList: Product[] = [];
  @Input() existingBill?: any;
  customerList: Customer[] = [];
  filteredCustomerList: Customer[] = [];
  selectedCustomer!: Customer;
  showSuggestions: boolean = false;
  lastGeneratedBill: any[] = [];
  bsConfig = {
    dateInputFormat: 'DD-MM-YYYY',
    containerClass: 'theme-dark-blue',
    showWeekNumbers: false,
  };

  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;
  private _toastrService = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _formBuilder = inject(FormBuilder);
  private _spinner = inject(NgxSpinnerService);
  private _billingService = inject(BillingService);
  @Output() saved = new EventEmitter<Product>();
  @Output() closed = new EventEmitter<void>();

  save() {
    this.isFormSubmitted = true;
    if (this.gstBillForm.valid) {
      this.gstBillForm.value['createdAt'] = new Date();
      this.gstBillForm.value['products'] = this.productList;
      this.gstBillForm.value['customerInfo'] = this.selectedCustomer;
      const bill = this._billingService.prepareInvoice(this.gstBillForm.value);
      if (bill.$key) {
        this.editBill(bill);
      } else {
        this.addBill(bill);
      }
    }
  }

  addBill(bill: any) {
    this._spinner.show();
    this._commonService.addDoc(BILL_LIST_COLLECTION_NAME, bill)
      .then(() => {
        this._spinner.hide();
        this._toastrService.success('GST Bill saved successfully');
        this.saved.emit(bill);
      })
      .catch((err: any) => {
        this._spinner.hide();
        console.error(err);
        this._toastrService.error('Failed to add Product');
      });
  }

  editBill(bill: any) {
    console.log("🚀 ~ bill:", bill)
    this._spinner.show();
    if (!bill.$key) return;

    this._commonService.editDoc(BILL_LIST_COLLECTION_NAME, bill.$key, bill);
    this._spinner.hide();
    this._toastrService.success('Bill updated successfully');
    this.closed.emit();
  }


  clear() {
    this.gstBillForm.reset();
    this.isFormSubmitted = false;
    this.productList = [];
  }

  ngOnInit(): void {
    this.initGstBillForm();
    this.loadCustomers();
    console.log("🚀 ~ this.existingBill:", this.existingBill)
    if (this.existingBill) {
      this.existingBill.billDate = convertToDDMMYYYY(this.existingBill?.billDate);
      this.gstBillForm.patchValue({
        $key: this.existingBill.$key,
        customerName: this.existingBill.customerInfo.name,
        billNumber: this.existingBill.billNumber,
        billDate: this.existingBill.billDate,
        vehicleNumber: this.existingBill.vehicleNumber,
        discount: this.existingBill.discount,
      });

      this.selectedCustomer = this.existingBill.customerInfo;
      this.productList = this.existingBill.products || [];
    } else {
      this.getLastGeneratedBill();
    }

  }

  loadCustomers(): void {
    this._spinner.show();
    this._commonService.getDocuments(CUSTOMER_LIST_COLLECTION_NAME).subscribe((res: Customer[]) => {
      this._spinner.hide();
      this.customerList = res || [];
      this.filteredCustomerList = [...this.customerList];
    });
  }

  getLastGeneratedBill(): void {
    this._spinner.show();
    this._commonService.getBillsOfCurrentYear(BILL_LIST_COLLECTION_NAME)
      .subscribe((bills: any[]) => {
        this._spinner.hide();

        const currentYear = new Date().getFullYear();
        const nextSeq = bills.length + 1;
        const seqStr = nextSeq.toString().padStart(3, '0');

        this.gstBillForm.patchValue({
          billNumber: `${currentYear}-${seqStr}`
        });
      });
  }




  initGstBillForm(): void {
    this.gstBillForm = this._formBuilder.group({
      $key: [null],
      customerName: ['', Validators.required],
      billNumber: ['', Validators.required],
      billDate: [new Date(), Validators.required],
      vehicleNumber: ['MH-26 BE 7136'],
      discount: [''],
    });
  }

  addProduct() {
    this.showModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHost.createComponent(AddProductComponent);


    this.modalRef.instance.saved?.pipe(take(1)).subscribe((product: Product) => {
      this.productList.push(product);
      this.markAllAsDuplicate();
      this.closeModal();
    });

    this.modalRef.instance.closed?.pipe(take(1)).subscribe(() => this.closeModal());
  }

  markAllAsDuplicate(): void {
    const countMap: Record<string, number> = {};

    // Count only valid productName
    this.productList.forEach((p: any) => {
      const name = p.productName;

      if (name && name.trim() !== '') {
        countMap[name] = (countMap[name] || 0) + 1;
      }
    });

    // Mark duplicates ONLY if productName exists + duplicate count > 1
    this.productList = this.productList.map((p: any) => {
      const name = p.productName;

      // If no productName => never duplicate
      if (!name || name.trim() === '') {
        return { ...p, isDuplicate: false };
      }

      return { ...p, isDuplicate: countMap[name] > 1 };
    });
  }

  get hasDuplicate(): boolean {
    return this.productList.some(p => p.isDuplicate);
  }

  closeModal() {
    this.showModal = false;
    this.modalHost.clear();
    this.modalRef = undefined;
  }

  deleteProduct(index: number) {
    this.productList.splice(index, 1);
    this.markAllAsDuplicate();
    this._toastrService.error('Product deleted successfully');
  }

  onCustomerInput(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredCustomerList = this.customerList.filter(c =>
      c.name.toLowerCase().includes(value)
    );
    this.showSuggestions = this.filteredCustomerList.length > 0 && value !== '';
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.gstBillForm.get('customerName')?.setValue(customer.name);
    this.showSuggestions = false;
  }
}
