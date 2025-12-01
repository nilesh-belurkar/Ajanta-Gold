import { Component, OnInit, ViewChild, ComponentRef, ViewContainerRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CUSTOMER_LIST_COLLECTION_NAME } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
import { NewCustomerComponent } from './new-customer/new-customer.component';

import {
  ButtonDirective,
  FormControlDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  ModalModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { NgxSpinnerService } from 'ngx-spinner';
import { Customer } from '../models/customer.model';
import { debounceTime, take } from 'rxjs/operators';
import { ConfirmationComponent } from '../../common/components/confirmation/confirmation.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    ModalModule,
    ConfirmationComponent
  ]
})
export class CustomersComponent implements OnInit {
  customerList: Customer[] = [];
  filteredCustomerList: Customer[] = [];
  paginatedCustomerList: Customer[] = [];
  customerForm!: FormGroup;
  isFormSubmitted: boolean = false;
  searchTerm = new FormControl('');
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  showModal: boolean = false;
  modalTitle: string = 'New Customer';
  private modalRef?: ComponentRef<any>;
  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;

  @ViewChild(ConfirmationComponent) confirmModal!: ConfirmationComponent;

  constructor(
    private _commonService: CommonService,
    private _formBuilder: FormBuilder,
    private _spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.initCustomerForm();
    this.loadCustomers();
    this.searchCustomers();
  }

  searchCustomers() {
    this.searchTerm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.currentPage = 1;
        this.filterCustomers(value);
      });
  }


  resetSearch() {
    this.searchTerm.setValue('');
  }

  initCustomerForm(): void {
    this.customerForm = this._formBuilder.group({
      firestoreId: [null],
      customerName: ['', Validators.required],
      address: ['', Validators.required],
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10)]],
      gstNumber: ['']
    });
  }

  filterCustomers(searchTerm: string | null) {
    const term = (searchTerm ?? '').toLowerCase(); // safe null handling
    this.filteredCustomerList = this.customerList.filter(c => c.name.toLowerCase().includes(term));
    this.totalItems = this.filteredCustomerList.length;
    this.updatePagination();
  }

  loadCustomers(): void {
    this._spinner.show();
    this._commonService.getDocuments(CUSTOMER_LIST_COLLECTION_NAME).subscribe((res: Customer[]) => {
      this._spinner.hide();
      this.customerList = res || [];
      console.log("🚀 ~ this.customerList:", this.customerList);
      this.filteredCustomerList = [...this.customerList];
      this.totalItems = this.filteredCustomerList.length;
      this.updatePagination();
    });
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedCustomerList = this.filteredCustomerList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openNewCustomerModal(customer?: Customer) {
    this.showModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHost.createComponent(NewCustomerComponent);

    if (customer) {
      this.modalRef.instance.customer = customer;
      this.modalTitle = 'Edit Customer';
    } else {
      this.modalTitle = 'New Customer';
    }
     this.modalRef.instance.saved?.pipe(take(1)).subscribe(() => {
      this.closeModal();
    });

    this.modalRef.instance.closed?.pipe(take(1)).subscribe(() => this.closeModal());
  }

  closeModal() {
    this.showModal = false;
    this.modalHost.clear();
    this.modalRef = undefined;
  }

  editCustomer(customer: Customer) {
    this.openNewCustomerModal(customer);
  }

  async deleteCustomer(customer: Customer) {
    this.confirmModal.open(`Are you sure you want delete "${customer.name}"?`, 'Delete Confirmation');

    const sub = this.confirmModal.confirmed.subscribe((result) => {
      if (result) {
        this._commonService.deleteDoc(CUSTOMER_LIST_COLLECTION_NAME, customer.firestoreId);
        this.loadCustomers(); // refresh list
      }

      sub.unsubscribe(); // avoid leak
    });
  }
}
